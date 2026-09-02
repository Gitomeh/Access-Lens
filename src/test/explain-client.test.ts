import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toExplainPayload, getAIExplanation } from '../lib/explain-client';
import type { AccessibilityFinding } from '../types/accessibility';

describe('explain-client', () => {
  beforeEach(() => {
    vi.stubGlobal('import', { meta: { env: { DEV: false } } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('toExplainPayload', () => {
    it('extracts only the necessary fields from a finding', () => {
      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa', 'wcag143'],
        nodes: [
          {
            html: '<button style="color: red;">Click</button>',
            target: ['button'],
          },
        ],
      };

      const payload = toExplainPayload(finding);

      expect(payload).toEqual({
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        html: '<button style="color: red;">Click</button>',
        tags: ['wcag2aa', 'wcag143'],
      });

      // Ensure sensitive fields are not included
      expect(payload).not.toHaveProperty('id');
      expect(payload).not.toHaveProperty('helpUrl');
      expect(payload).not.toHaveProperty('nodes');
    });

    it('handles findings with no nodes', () => {
      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'button-name',
        impact: 'serious',
        description: 'Buttons must have accessible names',
        help: 'Ensure buttons have text content',
        helpUrl: 'https://example.com/button-name',
        tags: ['wcag2a'],
        nodes: [],
      };

      const payload = toExplainPayload(finding);

      expect(payload.html).toBe('');
    });
  });

  describe('getAIExplanation', () => {
    it('calls the /api/explain endpoint with correct payload', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            summary: 'Test summary',
            whyItMatters: 'Test importance',
            whoIsAffected: 'Test users',
            recommendedFix: 'Test fix',
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa'],
        nodes: [{ html: '<button>Click</button>', target: ['button'] }],
      };

      const result = await getAIExplanation(finding);

      expect(fetchMock).toHaveBeenCalledWith('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleId: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help: 'Ensure color contrast is at least 4.5:1',
          html: '<button>Click</button>',
          tags: ['wcag2aa'],
        }),
        signal: expect.any(AbortSignal),
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        summary: 'Test summary',
        whyItMatters: 'Test importance',
        whoIsAffected: 'Test users',
        recommendedFix: 'Test fix',
      });
    });

    it('handles 429 rate limit errors', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ message: 'Rate limited' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa'],
        nodes: [{ html: '<button>Click</button>', target: ['button'] }],
      };

      const result = await getAIExplanation(finding);

      expect(result.success).toBe(false);
      expect(result.error).toBe('The AI service is temporarily busy. Please try again in a moment.');
    });

    it('handles 503 service unavailable errors', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ message: 'Service unavailable' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa'],
        nodes: [{ html: '<button>Click</button>', target: ['button'] }],
      };

      const result = await getAIExplanation(finding);

      expect(result.success).toBe(false);
      expect(result.error).toBe('The AI service is not configured. Please contact support.');
    });

    it('handles timeout errors', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      
      const fetchMock = vi.fn().mockRejectedValue(abortError);
      vi.stubGlobal('fetch', fetchMock);

      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa'],
        nodes: [{ html: '<button>Click</button>', target: ['button'] }],
      };

      const result = await getAIExplanation(finding);

      expect(result.success).toBe(false);
      expect(result.error).toBe('The AI explanation timed out. Please try again.');
    });

    it('handles network errors', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
      vi.stubGlobal('fetch', fetchMock);

      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa'],
        nodes: [{ html: '<button>Click</button>', target: ['button'] }],
      };

      const result = await getAIExplanation(finding);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Could not reach the AI explanation service. Please check your connection and try again.');
    });

    it('validates response structure', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            // Missing required fields
            summary: 'Test summary',
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa'],
        nodes: [{ html: '<button>Click</button>', target: ['button'] }],
      };

      const result = await getAIExplanation(finding);

      expect(result.success).toBe(false);
      expect(result.error).toBe('The AI explanation could not be read. Please try again.');
    });

    it('includes code example when present in response', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            summary: 'Test summary',
            whyItMatters: 'Test importance',
            whoIsAffected: 'Test users',
            recommendedFix: 'Test fix',
            codeExample: '<button style="color: #333;">Click</button>',
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const finding: AccessibilityFinding = {
        id: 'test-1',
        ruleId: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Ensure color contrast is at least 4.5:1',
        helpUrl: 'https://example.com/color-contrast',
        tags: ['wcag2aa'],
        nodes: [{ html: '<button>Click</button>', target: ['button'] }],
      };

      const result = await getAIExplanation(finding);

      expect(result.success).toBe(true);
      expect(result.data?.codeExample).toBe('<button style="color: #333;">Click</button>');
    });
  });
});
