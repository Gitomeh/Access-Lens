import type { AccessibilityFinding, AIExplanation, AIResponse } from '../types/accessibility';

const EXPLAIN_ENDPOINT = '/api/explain';
const CLIENT_TIMEOUT_MS = 25_000;
const GENERIC_ERROR = 'The AI explanation service is unavailable right now.';

/**
 * Only the fields the model needs to explain the finding leave the browser.
 * No credentials are involved: the Gemini key lives on the server.
 */
export function toExplainPayload(finding: AccessibilityFinding) {
  return {
    ruleId: finding.ruleId,
    impact: finding.impact,
    description: finding.description,
    help: finding.help,
    html: finding.nodes[0]?.html ?? '',
    tags: finding.tags,
  };
}

export async function getAIExplanation(finding: AccessibilityFinding): Promise<AIResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const response = await fetch(EXPLAIN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toExplainPayload(finding)),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { success: false, error: readMessage(body) };
    }

    const data = readExplanation(body);
    if (!data) {
      return { success: false, error: 'The AI explanation could not be read. Please try again.' };
    }

    return { success: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: 'The AI explanation timed out. Please try again.' };
    }
    return { success: false, error: 'Could not reach the AI explanation service. Please try again.' };
  } finally {
    clearTimeout(timer);
  }
}

function readMessage(body: unknown): string {
  if (body && typeof body === 'object') {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return GENERIC_ERROR;
}

function readExplanation(body: unknown): AIExplanation | null {
  if (!body || typeof body !== 'object') return null;
  const data = (body as { data?: unknown }).data;
  if (!data || typeof data !== 'object') return null;

  const candidate = data as Record<string, unknown>;
  const required = ['summary', 'whyItMatters', 'whoIsAffected', 'recommendedFix'] as const;
  if (!required.every((key) => typeof candidate[key] === 'string' && (candidate[key] as string).trim())) {
    return null;
  }

  return {
    summary: candidate.summary as string,
    whyItMatters: candidate.whyItMatters as string,
    whoIsAffected: candidate.whoIsAffected as string,
    recommendedFix: candidate.recommendedFix as string,
    codeExample: typeof candidate.codeExample === 'string' ? candidate.codeExample : undefined,
  };
}
