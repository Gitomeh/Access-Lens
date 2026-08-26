import { describe, expect, it, vi } from 'vitest';
import { explainFinding } from '../../api/_lib/gemini';
import { parseExplanation, parseFindingPayload } from '../../api/_lib/validation';
import { buildPrompt } from '../../api/_lib/prompt';

const FINDING = {
  ruleId: 'image-alt',
  impact: 'critical',
  description: 'Ensure <img> elements have alternative text or a role of none or presentation.',
  help: 'Images must have alternate text',
  html: '<img src="logo.png">',
  tags: ['wcag2a', 'wcag111'],
};

const EXPLANATION = {
  summary: 'The image has no text alternative.',
  whyItMatters: 'Screen reader users get no information about the image.',
  whoIsAffected: 'Blind and low-vision users using assistive technology.',
  recommendedFix: 'Add an alt attribute describing the image.',
  codeExample: '<img src="logo.png" alt="AccessLens logo">',
};

function geminiResponse(text: string, init: { status?: number } = {}) {
  return {
    ok: (init.status ?? 200) < 400,
    status: init.status ?? 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  } as unknown as Response;
}

describe('explainFinding', () => {
  it('returns a validated explanation on success', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse(JSON.stringify(EXPLANATION)));

    const result = await explainFinding(FINDING, { apiKey: 'test-key', fetchImpl });

    expect(result).toEqual({ ok: true, status: 200, data: EXPLANATION });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('sends the key as a header and never inside the URL', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse(JSON.stringify(EXPLANATION)));

    await explainFinding(FINDING, { apiKey: 'super-secret-key', fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).not.toContain('super-secret-key');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('super-secret-key');
  });

  it('fails with missing_api_key when the server has no key configured', async () => {
    const fetchImpl = vi.fn();

    const result = await explainFinding(FINDING, { apiKey: undefined, fetchImpl });

    expect(result).toMatchObject({ ok: false, code: 'missing_api_key', status: 503 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a request without a usable finding', async () => {
    const result = await explainFinding({ impact: 'critical' }, { apiKey: 'test-key', fetchImpl: vi.fn() });

    expect(result).toMatchObject({ ok: false, code: 'invalid_request', status: 400 });
  });

  it('maps a Gemini API error to a controlled upstream error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'API key invalid: super-secret-key' } }),
    } as unknown as Response);

    const result = await explainFinding(FINDING, { apiKey: 'super-secret-key', fetchImpl });

    expect(result).toMatchObject({ ok: false, code: 'upstream_error', status: 502 });
    expect(JSON.stringify(result)).not.toContain('super-secret-key');
  });

  it('maps rate limiting to rate_limited', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) } as unknown as Response);

    const result = await explainFinding(FINDING, { apiKey: 'test-key', fetchImpl });

    expect(result).toMatchObject({ ok: false, code: 'rate_limited', status: 429 });
  });

  it('rejects a malformed AI response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse('{"summary": "only a summary"}'));

    const result = await explainFinding(FINDING, { apiKey: 'test-key', fetchImpl });

    expect(result).toMatchObject({ ok: false, code: 'invalid_ai_response', status: 502 });
  });

  it('rejects a non-JSON AI response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse('I cannot help with that.'));

    const result = await explainFinding(FINDING, { apiKey: 'test-key', fetchImpl });

    expect(result).toMatchObject({ ok: false, code: 'invalid_ai_response', status: 502 });
  });

  it('maps a network failure to network_error', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('fetch failed'));

    const result = await explainFinding(FINDING, { apiKey: 'test-key', fetchImpl });

    expect(result).toMatchObject({ ok: false, code: 'network_error', status: 502 });
  });

  it('maps an aborted request to timeout', async () => {
    const fetchImpl = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      });
    });

    const result = await explainFinding(FINDING, { apiKey: 'test-key', fetchImpl, timeoutMs: 5 });

    expect(result).toMatchObject({ ok: false, code: 'timeout', status: 504 });
  });
});

describe('payload validation', () => {
  it('keeps only the fields needed for an explanation', () => {
    const parsed = parseFindingPayload({ ...FINDING, apiKey: 'leaked', cookies: 'nope' });

    expect(parsed).toEqual(FINDING);
    expect(parsed && 'apiKey' in parsed).toBe(false);
  });

  it('accepts a legacy { finding } wrapper', () => {
    expect(parseFindingPayload({ finding: FINDING })).toEqual(FINDING);
  });

  it('parses JSON wrapped in markdown fences', () => {
    const parsed = parseExplanation('```json\n' + JSON.stringify(EXPLANATION) + '\n```');
    expect(parsed).toEqual(EXPLANATION);
  });
});

describe('prompt', () => {
  it('states that axe-core already detected the issue and forbids invented findings', () => {
    const prompt = buildPrompt(FINDING);

    expect(prompt).toContain('axe-core has already detected the issue');
    expect(prompt).toContain('Do not claim that any issue exists beyond the supplied axe finding');
    expect(prompt).toContain('Do not invent WCAG requirements');
    expect(prompt).toContain('insufficient for a confident recommendation');
    expect(prompt).toContain('image-alt');
    expect(prompt).toContain('<img src="logo.png">');
  });
});
