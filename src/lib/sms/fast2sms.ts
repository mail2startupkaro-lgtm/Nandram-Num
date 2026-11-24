/**
 * Fast2SMS API Integration
 * Supports sending Quick SMS (route 'q') and OTP messages in India.
 * Docs: https://www.fast2sms.com/
 */

export interface Fast2SmsSendOptions {
  numbers: string | string[];
  message: string;
  route?: 'q' | 'otp';
  language?: 'english' | 'unicode';
  fetchImpl?: typeof fetch;
}

export interface Fast2SmsResult {
  ok: boolean;
  message?: string;
  requestId?: string;
  raw?: any;
}

/**
 * Normalizes Indian phone numbers to 10-digit mobile number format.
 * Strips +91, 91, 0 prefix, spaces, and punctuation.
 */
export function normalizeIndianMobile(raw: string): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    if (/^[6-9]\d{9}$/.test(last10)) {
      return last10;
    }
  }
  return null;
}

/**
 * Sends an SMS via Fast2SMS API.
 */
export async function sendFast2Sms(opts: Fast2SmsSendOptions): Promise<Fast2SmsResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const fetcher = opts.fetchImpl ?? fetch;

  const rawNumbers = Array.isArray(opts.numbers) ? opts.numbers : [opts.numbers];
  const validNumbers = rawNumbers
    .map(normalizeIndianMobile)
    .filter((n): n is string => Boolean(n));

  if (validNumbers.length === 0) {
    return { ok: false, message: 'No valid 10-digit Indian mobile numbers provided' };
  }

  const numbersStr = validNumbers.join(',');
  const route = opts.route ?? 'q';
  const language = opts.language ?? 'english';

  // In test / dev environments without key, log simulation safely
  if (!apiKey) {
    console.info(`[Fast2SMS SIMULATION] To: ${numbersStr} | Message: ${opts.message}`);
    return { ok: true, message: 'Fast2SMS simulated (no FAST2SMS_API_KEY set)' };
  }

  try {
    const params = new URLSearchParams({
      route,
      message: opts.message,
      language,
      flash: '0',
      numbers: numbersStr,
    });

    const url = `https://www.fast2sms.com/dev/bulkV2?${params.toString()}`;
    const res = await fetcher(url, {
      method: 'GET',
      headers: {
        authorization: apiKey,
      },
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.return === true) {
      return {
        ok: true,
        requestId: data.request_id,
        message: Array.isArray(data.message) ? data.message.join(', ') : data.message,
        raw: data,
      };
    }

    const errMsg = data?.message
      ? Array.isArray(data.message)
        ? data.message.join(', ')
        : String(data.message)
      : `Fast2SMS HTTP error ${res.status}`;

    return {
      ok: false,
      message: errMsg,
      raw: data,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: err?.message || 'Network error communicating with Fast2SMS',
    };
  }
}

/**
 * Helper to send Numerology Report link directly to a client's mobile via SMS.
 */
export async function sendReportSms(opts: {
  to: string;
  clientName: string;
  reportUrl: string;
  brandName?: string;
  fetchImpl?: typeof fetch;
}): Promise<Fast2SmsResult> {
  const brand = opts.brandName || 'myNumerologist.com';
  const name = opts.clientName.trim();
  const greeting = name ? `Namaste ${name}, ` : 'Namaste, ';

  // Keep SMS concise to fit in 1 standard SMS credit (under 160 characters)
  const message = `${greeting}your Numerology Report from ${brand} is ready. View and download your report here: ${opts.reportUrl}`;

  return sendFast2Sms({
    numbers: opts.to,
    message,
    fetchImpl: opts.fetchImpl,
  });
}
