import type { AIExplanationPayload, ExplainRequestPayload } from './types';

const MAX_FIELD_LENGTH = 4000;
const MAX_TAGS = 30;

function readString(value: unknown, max = MAX_FIELD_LENGTH): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/**
 * Accept only the fields needed to explain a finding, so nothing else the
 * browser sends reaches the model.
 */
export function parseFindingPayload(body: unknown): ExplainRequestPayload | null {
  if (!body || typeof body !== 'object') return null;

  const source = 'finding' in body ? (body as { finding: unknown }).finding : body;
  if (!source || typeof source !== 'object') return null;

  const candidate = source as Record<string, unknown>;
  const ruleId = readString(candidate.ruleId, 200);
  const description = readString(candidate.description);
  if (!ruleId || !description) return null;

  const rawTags = Array.isArray(candidate.tags) ? candidate.tags : [];
  const tags = rawTags
    .filter((tag): tag is string => typeof tag === 'string')
    .slice(0, MAX_TAGS)
    .map((tag) => tag.slice(0, 100));

  return {
    ruleId,
    impact: readString(candidate.impact, 50) ?? 'unknown',
    description,
    help: readString(candidate.help) ?? '',
    html: readString(candidate.html) ?? '',
    tags,
  };
}

export function parseExplanation(text: string): AIExplanationPayload | null {
  const withoutFences = text.replace(/```(?:json)?/gi, '');
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(withoutFences.slice(start, end + 1));
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const candidate = parsed as Record<string, unknown>;

  const summary = readString(candidate.summary);
  const whyItMatters = readString(candidate.whyItMatters);
  const whoIsAffected = readString(candidate.whoIsAffected);
  const recommendedFix = readString(candidate.recommendedFix);
  if (!summary || !whyItMatters || !whoIsAffected || !recommendedFix) return null;

  const codeExample = readString(candidate.codeExample);

  return {
    summary,
    whyItMatters,
    whoIsAffected,
    recommendedFix,
    ...(codeExample ? { codeExample } : {}),
  };
}
