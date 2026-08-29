import { useState } from 'react';
import { HTMLEditor } from './components/HTMLEditor';
import { ResultsDashboard } from './components/ResultsDashboard';
import { FindingDetailPanel } from './components/FindingDetailPanel';
import { analyzeHtml } from './services/accessibilityScanner';
import type { ScanResult } from './types/accessibility';

const DEFAULT_HTML = `<div class="header">
  <h1>Welcome</h1>
  <button onclick="submit()">Click here</button>
</div>

<form>
  <input type="text" placeholder="Name">
  <input type="email" placeholder="Email">
  <button>Submit</button>
</form>`;

function App() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<'idle' | 'validating' | 'fetching' | 'analyzing' | 'generating'>('idle');
  const [showLanding, setShowLanding] = useState(true);

  const handleAnalyze = async () => {
    if (!html.trim()) {
      setScanError('Please enter HTML code to analyze');
      return;
    }

    setIsScanning(true);
    setLoadingState('analyzing');
    setScanError(null);
    setScanResult(null);
    setSelectedFindingId(null);

    try {
      const result = await analyzeHtml(html);
      setScanResult(result);
      
      // Auto-select the first violation if available
      if (result.violations.length > 0) {
        setSelectedFindingId(result.violations[0].id);
      }
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Failed to analyze HTML');
    } finally {
      setIsScanning(false);
      setLoadingState('idle');
    }
  };

  const handleClear = () => {
    setHtml('');
    setScanResult(null);
    setSelectedFindingId(null);
    setScanError(null);
  };

  const handleFetchFromUrl = async (url: string) => {
    setLoadingState('validating');
    try {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      setLoadingState('fetching');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch URL');
      }

      if (!data.html) {
        throw new Error('No HTML content received');
      }

      setHtml(data.html);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch HTML from URL');
    } finally {
      setLoadingState('idle');
    }
  };

  const selectedFinding = scanResult?.violations.find(
    (f) => f.id === selectedFindingId
  ) || undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
      <header className="bg-white border-b border-gray-200 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">AccessLens</h1>
          <p className="text-gray-600 mt-1">See your website through every user's lens</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col items-center" id="main-content" tabIndex={-1}>
        {showLanding && !scanResult ? (
          <div className="max-w-4xl w-full text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                See your website through every user's lens
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Find accessibility issues, understand their impact, and get practical fixes with AI-powered guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setShowLanding(false)}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-lg"
                >
                  Analyze HTML
                </button>
                <button
                  onClick={() => {
                    setShowLanding(false);
                    setTimeout(() => {
                      const urlInput = document.getElementById('url-input') as HTMLInputElement;
                      if (urlInput) urlInput.focus();
                    }, 100);
                  }}
                  className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-medium hover:bg-blue-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-lg"
                >
                  Fetch from URL
                </button>
              </div>
            </div>

            {/* How It Works */}
            <div className="text-left bg-white rounded-xl border border-gray-200 p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h3>
              <div className="grid md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Enter URL or HTML</h4>
                  <p className="text-sm text-gray-600">Paste HTML or fetch from a website</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Run Analysis</h4>
                  <p className="text-sm text-gray-600">axe-core scans for accessibility issues</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Review Findings</h4>
                  <p className="text-sm text-gray-600">See WCAG-related issues by severity</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Get AI Explanations</h4>
                  <p className="text-sm text-gray-600">Gemini provides detailed guidance</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">5</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Fix Issues</h4>
                  <p className="text-sm text-gray-600">Apply code examples and fixes</p>
                </div>
              </div>
            </div>

            {/* Architecture Note */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-left">
              <h4 className="font-semibold text-gray-900 mb-2">Built for Accuracy</h4>
              <p className="text-sm text-gray-700">
                <strong>axe-core</strong> performs deterministic accessibility detection, while <strong>Google Gemini</strong> provides human-readable explanations and remediation guidance. This combination ensures reliable results with practical developer guidance.
              </p>
            </div>
          </div>
        ) : !scanResult ? (
          <div className="max-w-3xl w-full flex justify-center">
            <h2 className="sr-only">Analyze HTML for Accessibility Issues</h2>
            <HTMLEditor
              value={html}
              onChange={setHtml}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              isLoading={isScanning}
              loadingState={loadingState}
              error={scanError || undefined}
              onFetchFromUrl={handleFetchFromUrl}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
            <div className="flex flex-col items-center">
              <button
                onClick={() => setScanResult(null)}
                className="mb-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to editor
              </button>
              <ResultsDashboard
                scanResult={scanResult}
                selectedFindingId={selectedFindingId}
                onSelectFinding={setSelectedFindingId}
              />
            </div>
            <div className="lg:sticky lg:top-8 h-fit flex justify-center">
              {selectedFinding && (
                <FindingDetailPanel finding={selectedFinding} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-gray-600">
            AccessLens uses axe-core for accessibility detection and Google Gemini for AI-powered explanations.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
