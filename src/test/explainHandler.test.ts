import { afterEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/explain';

const FINDING = {
  ruleId: 'image-alt',
  impact: 'critical',
  description: 'Ensure <img> elements have alternative text.',
  help: 'Images must have alternate text',
  html: '<img src="logo.png">',
  tags: ['wcag2a'],
};

const EXPLANATION = {
  summary: 'The image has no text alternative.',
  whyItMatters: 'Screen reader users get no information about the image.',
  whoIsAffected: 'Blind and low-vision users.',
  recommendedFix: 'Add an alt attribute describing the image.',
  codeExample: '<img src="logo.png" alt="AccessLens logo">',
};

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('POST /api/explain', () => {
  it('returns the explanation when Gemini succeeds', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(EXPLANATION) }] } }] }),
      })
    );

    const res = mockRes();
    await handler({ method: 'POST', body: JSON.stringify(FINDING) }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: EXPLANATION });
  });

  it('returns a controlled error when the key is missing', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = mockRes();
    await handler({ method: 'POST', body: FINDING }, res);

    expect(res.statusCode).toBe(503);
    expect(res.body).toMatchObject({ success: false, code: 'missing_api_key' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects non-POST requests', async () => {
    const res = mockRes();
    await handler({ method: 'GET' }, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(res.body).toMatchObject({ success: false, code: 'method_not_allowed' });
  });

  it('rejects an unparsable body', async () => {
    vi.stubEnv('GEMINI_API_KEY', 'test-key');
    const res = mockRes();
    await handler({ method: 'POST', body: 'not json' }, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ success: false, code: 'invalid_request' });
  });
});
