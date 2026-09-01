import { useState } from 'react';
import type { AccessibilityFinding, AIExplanation } from '../types/accessibility';
import { getAIExplanation } from '../lib/explain-client';

interface FindingDetailPanelProps {
  finding: AccessibilityFinding;
}

export function FindingDetailPanel({ finding }: FindingDetailPanelProps) {
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleGetAIExplanation = async () => {
    if (isLoadingAI) return;
    
    setIsLoadingAI(true);
    setAiError(null);

    try {
      const result = await getAIExplanation(finding);
      
      if (result.success && result.data) {
        setAiExplanation(result.data);
      } else {
        setAiError(result.error || 'Failed to generate explanation');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Failed to generate explanation');
    } finally {
      setIsLoadingAI(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    if (isRetrying || isLoadingAI) return;
    setIsRetrying(true);
    setAiError(null);
    handleGetAIExplanation();
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
          {isRetrying ? 'Retrying...' : isLoadingAI ? 'Generating...' : aiExplanation ? 'Explained' : 'Get AI Explanation'}
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

        {/* AI Explanation Loading State */}
        {isLoadingAI && !aiExplanation && (
          <div className="pt-4 border-t border-gray-200" aria-live="polite" aria-busy="true">
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Generating AI explanation...</p>
          </div>
        )}

        {/* AI Explanation */}
        {aiError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4" role="alert">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-amber-900 text-sm font-medium">Couldn't finish that explanation</p>
                <p className="text-amber-800 text-sm mt-1">{aiError}</p>
                <p className="text-amber-700 text-sm mt-2">
                  You can still review the accessibility finding and WCAG guidance above.
                </p>
                <button
                  onClick={handleRetry}
                  disabled={isLoadingAI || isRetrying}
                  className="mt-3 px-3 py-1.5 bg-amber-700 text-white text-sm rounded-lg font-medium hover:bg-amber-800 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-busy={isLoadingAI || isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Retry explanation'}
                </button>
              </div>
            </div>
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

        {/* Deterministic axe guidance, always available when there is no AI explanation */}
        {!aiExplanation && !isLoadingAI && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Help</h4>
            <p className="text-gray-700 text-sm">{finding.help}</p>
          </div>
        )}
      </div>
    </div>
  );
}
