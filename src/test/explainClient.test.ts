import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAIExplanation, toExplainPayload } from '../lib/explain-client';
import type { AccessibilityFinding } from '../types/accessibility';

const finding: AccessibilityFinding = {
  id: 'image-alt',
  ruleId: 'image-alt',
  impact: 'critical',
  description: 'Ensure <img> elements have alternative text.',
  help: 'Images must have alternate text',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
  tags: ['wcag2a', 'wcag111'],
  nodes: [{ html: '<img src="logo.png">', target: ['img'] }],
};

const explanation = {
  summary: 'The image has no text alternative.',
  whyItMatters: 'Screen reader users get no information about the image.',
  whoIsAffected: 'Blind and low-vision users.',
  recommendedFix: 'Add an alt attribute describing the image.',
  codeExample: '<img src="logo.png" alt="AccessLens logo">',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getAIExplanation', () => {
  it('posts only the finding fields the model needs', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: explanation }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await getAIExplanation(finding);

    expect(result).toEqual({ success: true, data: explanation });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/explain');
    expect(JSON.parse(init.body)).toEqual(toExplainPayload(finding));
  });

  it('surfaces the server message when the endpoint fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ success: false, code: 'missing_api_key', message: 'The AI service is not configured. Please contact support.' }),
      })
    );

    const result = await getAIExplanation(finding);

    expect(result).toEqual({ success: false, error: 'The AI service is not configured. Please contact support.' });
  });

  it('reports a network failure without leaking internals', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await getAIExplanation(finding);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Could not reach the AI explanation service. Please check your connection and try again.');
  });

  it('rejects an incomplete explanation payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { summary: 'only a summary' } }),
      })
    );

    const result = await getAIExplanation(finding);

    expect(result.success).toBe(false);
    expect(result.error).toBe('The AI explanation could not be read. Please try again.');
  });
});
