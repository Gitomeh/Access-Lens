import type { AccessibilityFinding, AIExplanation } from '../src/types/accessibility';

export default async function handler(req: Request, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'AI service unavailable',
        message: 'API key not configured'
      });
    }

    const finding: AccessibilityFinding = req.body.finding;
    
    if (!finding) {
      return res.status(400).json({ error: 'Missing finding data' });
    }

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
      console.error('Gemini API error:', response.status, response.statusText);
      return res.status(500).json({ 
        error: 'AI service unavailable',
        message: 'Failed to generate explanation'
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      console.error('Invalid Gemini response format');
      return res.status(500).json({ 
        error: 'AI service unavailable',
        message: 'Invalid response from AI service'
      });
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    const explanation = parseAIResponse(generatedText);

    return res.status(200).json({ 
      success: true,
      data: explanation
    });

  } catch (error) {
    console.error('AI explanation error:', error);
    return res.status(500).json({ 
      error: 'AI service unavailable',
      message: 'Failed to generate explanation'
    });
  }
}

function buildPrompt(finding: AccessibilityFinding): string {
  return `You are an accessibility expert. Analyze this accessibility finding and provide a helpful explanation for developers.

IMPORTANT CONSTRAINTS:
- This finding was detected by axe-core, a professional accessibility testing tool
- The issue exists and needs to be fixed
- Do NOT claim that an issue exists beyond what is supplied in this finding
- Do NOT invent WCAG requirements beyond what is mentioned in the tags
- Do NOT suggest accessibility violations that are not in the provided data
- If the supplied information is insufficient for a confident recommendation, clearly state this
- Provide practical, developer-focused guidance

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

export const config = {
  runtime: 'nodejs20.x',
};