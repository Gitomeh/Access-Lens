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

  const handleAnalyze = async () => {
    if (!html.trim()) {
      setScanError('Please enter HTML code to analyze');
      return;
    }

    setIsScanning(true);
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
    }
  };

  const handleClear = () => {
    setHtml('');
    setScanResult(null);
    setSelectedFindingId(null);
    setScanError(null);
  };

  const handleFetchFromUrl = async (url: string) => {
    try {
      // Use a CORS proxy to fetch HTML from external URLs
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch URL');
      }

      const data = await response.json();
      
      if (!data.contents) {
        throw new Error('No HTML content received');
      }

      setHtml(data.contents);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch HTML from URL');
    }
  };

  const selectedFinding = scanResult?.violations.find(
    (f) => f.id === selectedFindingId
  ) || undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AccessLens</h1>
          <p className="text-gray-600 mt-1">See your website through every user's lens</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="main-content" tabIndex={-1}>
        {!scanResult ? (
          <div className="max-w-3xl">
            <HTMLEditor
              value={html}
              onChange={setHtml}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              isLoading={isScanning}
              error={scanError || undefined}
              onFetchFromUrl={handleFetchFromUrl}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
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
            <div className="lg:sticky lg:top-8 h-fit">
              {selectedFinding && (
                <FindingDetailPanel finding={selectedFinding} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-600">
            AccessLens uses axe-core for accessibility detection and Google Gemini for AI-powered explanations.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
