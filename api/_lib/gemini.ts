import { buildPrompt } from './prompt';
import type { ExplainErrorCode, ExplainRequestPayload, ExplainResult } from './types';
import { parseExplanation, parseFindingPayload } from './validation';

const GEMINI_MODEL = 'gemini-3.6-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const DEFAULT_TIMEOUT_MS = 15_000;

const USER_MESSAGES: Record<ExplainErrorCode, string> = {
  method_not_allowed: 'Method not allowed.',
  invalid_request: 'The accessibility finding sent to the AI service was incomplete.',
  missing_api_key: 'The AI service is not configured on the server.',
  upstream_error: 'The AI service could not be reached. Please try again.',
  rate_limited: 'The AI service is busy right now. Please try again in a moment.',
  invalid_ai_response: 'The AI service returned an unusable response.',
  timeout: 'The AI service took too long to respond. Please try again.',
  network_error: 'The AI service could not be reached. Please try again.',
};

export function failure(code: ExplainErrorCode, status: number): ExplainResult {
  return { ok: false, status, code, message: USER_MESSAGES[code] };
}

export interface ExplainOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/**
 * Calls Gemini for a single axe finding. Never surfaces upstream error bodies or
 * the API key to the caller — only a stable error code and a safe message.
 */
export async function explainFinding(body: unknown, options: ExplainOptions = {}): Promise<ExplainResult> {
  const apiKey = options.apiKey;
  if (!apiKey) return failure('missing_api_key', 503);

  const finding: ExplainRequestPayload | null = parseFindingPayload(body);
  if (!finding) return failure('invalid_request', 400);

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(finding) }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    console.error('[explain] Gemini request failed', aborted ? 'timeout' : 'network error');
    return aborted ? failure('timeout', 504) : failure('network_error', 502);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) {
    console.error('[explain] Gemini rate limited');
    return failure('rate_limited', 429);
  }

  if (!response.ok) {
    console.error('[explain] Gemini responded with status', response.status);
    return failure('upstream_error', 502);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    console.error('[explain] Gemini response was not JSON');
    return failure('invalid_ai_response', 502);
  }

  const text = extractText(data);
  if (!text) {
    console.error('[explain] Gemini response had no text candidate');
    return failure('invalid_ai_response', 502);
  }

  const explanation = parseExplanation(text);
  if (!explanation) {
    console.error('[explain] Gemini response failed schema validation');
    return failure('invalid_ai_response', 502);
  }

  return { ok: true, status: 200, data: explanation };
}

function extractText(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const candidates = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const parts = (candidates[0] as { content?: { parts?: unknown } })?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const text = (parts[0] as { text?: unknown })?.text;
  return typeof text === 'string' && text.trim() ? text : null;
}
