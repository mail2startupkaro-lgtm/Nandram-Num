/**
 * LLM providers (configured via env). Plain fetch – no SDK lock-in.
 *   LLM_PROVIDER=anthropic|openai|template   LLM_MODEL=...   ANTHROPIC_API_KEY / OPENAI_API_KEY
 *   LLM_TEMPERATURE (default 0.5, clamped 0.4–0.6)   LLM_TIMEOUT_MS (default 45000)
 */

export interface LlmRequest {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxTokens: number;
}

export interface LlmProvider {
  readonly id: string;
  readonly model: string;
  complete(req: LlmRequest): Promise<string>;
}

export interface LlmConfig {
  provider: 'anthropic' | 'openai' | 'template';
  model: string;
  apiKey?: string;
  temperature: number;
  timeoutMs: number;
  baseUrl?: string;
}

export function configFromEnv(env: Record<string, string | undefined> = process.env): LlmConfig {
  const provider = (env.LLM_PROVIDER ?? (env.ANTHROPIC_API_KEY ? 'anthropic' : env.OPENAI_API_KEY ? 'openai' : 'template')) as LlmConfig['provider'];
  const t = Number(env.LLM_TEMPERATURE ?? 0.5);
  return {
    provider,
    model: env.LLM_MODEL ?? '',
    apiKey: provider === 'anthropic' ? env.ANTHROPIC_API_KEY : provider === 'openai' ? env.OPENAI_API_KEY : undefined,
    temperature: Math.min(0.6, Math.max(0.4, Number.isFinite(t) ? t : 0.5)),
    timeoutMs: Number(env.LLM_TIMEOUT_MS ?? 45000),
    baseUrl: env.LLM_BASE_URL,
  };
}

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs: number, fetchImpl: typeof fetch) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctrl.signal });
    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export class AnthropicProvider implements LlmProvider {
  readonly id = 'anthropic';
  constructor(private cfg: LlmConfig, private fetchImpl: typeof fetch = fetch) {
    if (!cfg.apiKey) throw new Error('ANTHROPIC_API_KEY missing');
    if (!cfg.model) throw new Error('LLM_MODEL missing');
  }
  get model() { return this.cfg.model; }
  async complete(req: LlmRequest): Promise<string> {
    const json = await postJson(`${this.cfg.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`,
      { 'x-api-key': this.cfg.apiKey!, 'anthropic-version': '2023-06-01' },
      { model: this.cfg.model, max_tokens: req.maxTokens, temperature: this.cfg.temperature, system: req.system, messages: req.messages },
      this.cfg.timeoutMs, this.fetchImpl);
    return (json.content ?? []).filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n').trim();
  }
}

export class OpenAIProvider implements LlmProvider {
  readonly id = 'openai';
  constructor(private cfg: LlmConfig, private fetchImpl: typeof fetch = fetch) {
    if (!cfg.apiKey) throw new Error('OPENAI_API_KEY missing');
    if (!cfg.model) throw new Error('LLM_MODEL missing');
  }
  get model() { return this.cfg.model; }
  async complete(req: LlmRequest): Promise<string> {
    const json = await postJson(`${this.cfg.baseUrl ?? 'https://api.openai.com'}/v1/chat/completions`,
      { authorization: `Bearer ${this.cfg.apiKey}` },
      { model: this.cfg.model, max_tokens: req.maxTokens, temperature: this.cfg.temperature, messages: [{ role: 'system', content: req.system }, ...req.messages] },
      this.cfg.timeoutMs, this.fetchImpl);
    return String(json.choices?.[0]?.message?.content ?? '').trim();
  }
}

export function providerFromConfig(cfg: LlmConfig, fetchImpl?: typeof fetch): LlmProvider | null {
  if (cfg.provider === 'anthropic') return new AnthropicProvider(cfg, fetchImpl);
  if (cfg.provider === 'openai') return new OpenAIProvider(cfg, fetchImpl);
  return null; // template writer
}
