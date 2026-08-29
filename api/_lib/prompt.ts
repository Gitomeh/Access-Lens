import type { ExplainRequestPayload } from './types';

export function buildPrompt(finding: ExplainRequestPayload): string {
  return `You are an accessibility engineer helping a developer remediate a single finding.

Context and constraints:
- axe-core has already detected the issue below. Treat it as the only confirmed problem.
- Your job is to explain and remediate the supplied finding, not to audit the snippet.
- Do not claim that any issue exists beyond the supplied axe finding.
- Do not invent WCAG requirements; only reference the supplied tags and what they cover.
- Give practical, developer-focused guidance with concrete code.
- If the supplied information is insufficient for a confident recommendation, say so plainly in the relevant fields instead of guessing.

Finding:
- Rule ID: ${finding.ruleId}
- Impact: ${finding.impact}
- Description: ${finding.description}
- Help text: ${finding.help || 'Not supplied'}
- Affected HTML: ${finding.html || 'Not supplied'}
- WCAG tags: ${finding.tags.length > 0 ? finding.tags.join(', ') : 'Not supplied'}

Respond with valid JSON only. Do NOT use markdown fences (no \`\`\`json or \`\`\`). Do NOT include any prose. Use exactly these keys:
{
  "summary": "1-2 sentences describing the finding",
  "whyItMatters": "practical impact of leaving it unfixed",
  "whoIsAffected": "which users are affected",
  "recommendedFix": "concrete steps a developer can apply to the affected HTML",
  "codeExample": "corrected markup for the affected HTML, or an empty string if code cannot be given confidently"
}`;
}
