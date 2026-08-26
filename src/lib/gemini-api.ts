import type { AccessibilityFinding, AIExplanation, AIResponse } from '../types/accessibility';

export async function getAIExplanation(
  finding: AccessibilityFinding,
  apiKey: string
): Promise<AIResponse> {
  try {
    const prompt = buildPrompt(finding);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    const explanation = parseAIResponse(generatedText);

    return {
      success: true,
      data: explanation,
    };
  } catch (error) {
    console.error('AI explanation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function buildPrompt(finding: AccessibilityFinding): string {
  return `You are an accessibility expert. Analyze this accessibility finding and provide a helpful explanation for developers.

Accessibility Finding:
- Rule ID: ${finding.ruleId}
- Description: ${finding.description}
- Impact: ${finding.impact}
- Help: ${finding.help}
- Affected HTML: ${finding.nodes[0]?.html || 'Not available'}
- WCAG Tags: ${finding.tags.join(', ')}

Please provide a JSON response with the following structure:
{
  "summary": "Brief 1-2 sentence summary of the issue",
  "whyItMatters": "Why this accessibility issue matters in practical terms",
  "whoIsAffected": "Which users are affected by this issue",
  "recommendedFix": "Step-by-step instructions for fixing the issue",
  "codeExample": "Optional: Example of corrected code if applicable"
}

Respond ONLY with valid JSON, no additional text.`;
}

function parseAIResponse(text: string): AIExplanation {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.summary || !parsed.whyItMatters || !parsed.whoIsAffected || !parsed.recommendedFix) {
      throw new Error('Missing required fields in AI response');
    }

    return {
      summary: parsed.summary,
      whyItMatters: parsed.whyItMatters,
      whoIsAffected: parsed.whoIsAffected,
      recommendedFix: parsed.recommendedFix,
      codeExample: parsed.codeExample,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid AI response format');
  }
}
