import type { ScanResult, Severity } from '../types/accessibility';
import { getSeverityCount } from '../services/accessibilityScanner';

interface ResultsDashboardProps {
  scanResult: ScanResult;
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
}

const severityOrder: Severity[] = ['critical', 'serious', 'moderate', 'minor'];

const severityColors: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  serious: 'bg-orange-100 text-orange-800 border-orange-200',
  moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  minor: 'bg-blue-100 text-blue-800 border-blue-200',
};

export function ResultsDashboard({ scanResult, selectedFindingId, onSelectFinding }: ResultsDashboardProps) {
  const { violations, passes, incomplete } = scanResult;
  const totalIssues = violations.length;
  const needsReviewCount = incomplete.length;
  const severityCount = getSeverityCount(scanResult);

  const sortedViolations = [...violations].sort((a, b) => {
    return severityOrder.indexOf(a.impact) - severityOrder.indexOf(b.impact);
  });

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Accessibility Results</h2>
      
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8" role="region" aria-label="Accessibility summary">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-3xl font-bold text-gray-900" aria-label={`Total issues: ${totalIssues}`}>{totalIssues}</p>
          <p className="text-sm text-gray-600">Total Issues</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-3xl font-bold text-red-700" aria-label={`Critical issues: ${severityCount.critical}`}>{severityCount.critical}</p>
          <p className="text-sm text-red-600">Critical</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-3xl font-bold text-orange-700" aria-label={`Serious issues: ${severityCount.serious}`}>{severityCount.serious}</p>
          <p className="text-sm text-orange-600">Serious</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-3xl font-bold text-yellow-700" aria-label={`Moderate issues: ${severityCount.moderate}`}>{severityCount.moderate}</p>
          <p className="text-sm text-yellow-600">Moderate</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-3xl font-bold text-blue-700" aria-label={`Minor issues: ${severityCount.minor}`}>{severityCount.minor}</p>
          <p className="text-sm text-blue-600">Minor</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-3xl font-bold text-purple-700" aria-label={`Needs review: ${needsReviewCount}`}>{needsReviewCount}</p>
          <p className="text-sm text-purple-600">Needs Review</p>
        </div>
      </div>

      {/* WCAG Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8" role="note">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> Automated testing can identify many accessibility issues, but it cannot determine complete WCAG conformance by itself. Manual testing is still required for comprehensive evaluation.
        </p>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Issues Found ({totalIssues})
        </h3>
        
        {sortedViolations.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-green-800 font-medium">No accessibility issues found!</p>
            <p className="text-green-700 text-sm mt-1">Your HTML passes all basic accessibility checks.</p>
          </div>
        ) : (
          <ul className="space-y-3" role="list">
            {sortedViolations.map((finding) => (
              <li key={finding.id}>
                <button
                  onClick={() => onSelectFinding(finding.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedFindingId === finding.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  aria-pressed={selectedFindingId === finding.id}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded border ${severityColors[finding.impact]}`}>
                        {finding.impact.toUpperCase()}
                      </span>
                      <h4 className="mt-2 font-medium text-gray-900">{finding.ruleId}</h4>
                      <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                      {finding.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {finding.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {finding.nodes.length} affected element{finding.nodes.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Needs Review / Manual Checks */}
      {needsReviewCount > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Needs Manual Review ({needsReviewCount})
          </h3>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <p className="text-purple-800 text-sm">
              These items require manual verification. Automated tools cannot determine if these are actual issues.
            </p>
          </div>
          <ul className="space-y-3" role="list">
            {incomplete.map((finding) => (
              <li key={finding.id}>
                <button
                  onClick={() => onSelectFinding(finding.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedFindingId === finding.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  aria-pressed={selectedFindingId === finding.id}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800 border border-purple-200">
                        NEEDS REVIEW
                      </span>
                      <h4 className="mt-2 font-medium text-gray-900">{finding.ruleId}</h4>
                      <p className="text-sm text-gray-600 mt-1">{finding.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {finding.nodes.length} element{finding.nodes.length !== 1 ? 's' : ''} to review
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Passed Checks */}
      {passes.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Passed Checks ({passes.length})
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              {passes.length} accessibility checks passed successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
