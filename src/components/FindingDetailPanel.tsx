import { useState } from 'react';
import type { AccessibilityFinding, AIExplanation } from '../types/accessibility';
import { getAIExplanation } from '../lib/gemini-api';

interface FindingDetailPanelProps {
  finding: AccessibilityFinding;
}

export function FindingDetailPanel({ finding }: FindingDetailPanelProps) {
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGetAIExplanation = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      setAiError('API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      return;
    }

    setIsLoadingAI(true);
    setAiError(null);

    try {
      const result = await getAIExplanation(finding, apiKey);
      
      if (result.success && result.data) {
        setAiExplanation(result.data);
      } else {
        setAiError(result.error || 'Failed to generate explanation');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to generate explanation');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleCopyCode = () => {
    if (aiExplanation?.codeExample) {
      navigator.clipboard.writeText(aiExplanation.codeExample);
    }
  };

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    serious: 'bg-orange-100 text-orange-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    minor: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 p-6" role="region" aria-label={`Finding details for ${finding.ruleId}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${severityColors[finding.impact]}`}>
            {finding.impact.toUpperCase()}
          </span>
          <h3 className="text-xl font-bold text-gray-900 mt-2">{finding.ruleId}</h3>
        </div>
        <button
          onClick={handleGetAIExplanation}
          disabled={isLoadingAI || !!aiExplanation}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-busy={isLoadingAI}
        >
          {isLoadingAI ? 'Generating...' : aiExplanation ? 'Explained' : 'Get AI Explanation'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Problem Description */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Problem</h4>
          <p className="text-gray-700">{finding.description}</p>
        </div>

        {/* Affected HTML */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Affected HTML</h4>
          <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
            <code>{finding.nodes[0]?.html || 'No HTML available'}</code>
          </pre>
        </div>

        {/* WCAG Reference */}
        {finding.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">WCAG Reference</h4>
            <div className="flex flex-wrap gap-2">
              {finding.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Help URL */}
        <div>
          <a
            href={finding.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View detailed documentation →
          </a>
        </div>

        {/* AI Explanation */}
        {aiError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4" role="alert">
            <p className="text-yellow-800 text-sm font-medium">AI Explanation Unavailable</p>
            <p className="text-yellow-700 text-sm mt-1">{aiError}</p>
            <p className="text-yellow-700 text-sm mt-2">
              You can still review the accessibility finding and WCAG guidance above.
            </p>
          </div>
        )}

        {aiExplanation && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
              <p className="text-gray-700">{aiExplanation.summary}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Why It Matters</h4>
              <p className="text-gray-700">{aiExplanation.whyItMatters}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Who Is Affected</h4>
              <p className="text-gray-700">{aiExplanation.whoIsAffected}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Fix</h4>
              <p className="text-gray-700 whitespace-pre-line">{aiExplanation.recommendedFix}</p>
            </div>

            {aiExplanation.codeExample && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900">Code Example</h4>
                  <button
                    onClick={handleCopyCode}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Copy
                  </button>
                </div>
                <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
                  <code>{aiExplanation.codeExample}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Fallback help text when AI is not available */}
        {!aiExplanation && !aiError && !isLoadingAI && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Help</h4>
            <p className="text-gray-700 text-sm">{finding.help}</p>
          </div>
        )}
      </div>
    </div>
  );
}
