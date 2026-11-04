import { KNOWLEDGE_SEED, type KnowledgeSeed } from './seed';

export type { KnowledgeSeed };

/** Source of the expert's interpretations. Phase 5/6 adds a Prisma-backed implementation edited from the admin panel. */
export interface KnowledgeBase {
  get(key: string, language?: string): Promise<KnowledgeSeed | undefined>;
  getMany(keys: string[], language?: string): Promise<KnowledgeSeed[]>;
}

export class StaticKnowledgeBase implements KnowledgeBase {
  private map: Map<string, KnowledgeSeed>;
  constructor(entries: KnowledgeSeed[] = KNOWLEDGE_SEED, overrides: KnowledgeSeed[] = []) {
    this.map = new Map([...entries, ...overrides].map((e) => [e.key, e]));
  }
  async get(key: string) {
    return this.map.get(key);
  }
  async getMany(keys: string[]) {
    return [...new Set(keys)].map((k) => this.map.get(k)).filter((e): e is KnowledgeSeed => !!e);
  }
  getSync(key: string) {
    return this.map.get(key);
  }
}

export const defaultKnowledgeBase = new StaticKnowledgeBase();
