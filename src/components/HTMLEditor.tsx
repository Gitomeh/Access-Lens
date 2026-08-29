import { useState } from 'react';

interface HTMLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onHome?: () => void;
  isLoading: boolean;
  loadingState?: 'idle' | 'validating' | 'fetching' | 'analyzing' | 'generating';
  error?: string;
  onFetchFromUrl?: (url: string) => Promise<void>;
}

const MAX_HTML_SIZE = 500_000; // 500KB limit

export function HTMLEditor({ value, onChange, onAnalyze, onClear, onHome, isLoading, loadingState = 'idle', error, onFetchFromUrl }: HTMLEditorProps) {
  const [characterCount, setCharacterCount] = useState(value.length);
  const [url, setUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length > MAX_HTML_SIZE) {
      return; // Prevent exceeding size limit
    }
    setCharacterCount(newValue.length);
    onChange(newValue);
  };

  const handleFetchFromUrl = async () => {
    if (!url.trim() || !onFetchFromUrl) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      await onFetchFromUrl(url);
      setUrl('');
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch HTML from URL');
    } finally {
      setIsFetching(false);
    }
  };

  const getLoadingMessage = () => {
    switch (loadingState) {
      case 'validating':
        return 'Validating...';
      case 'fetching':
        return 'Fetching...';
      case 'analyzing':
        return 'Analyzing...';
      case 'generating':
        return 'Generating...';
      default:
        return 'Analyzing...';
    }
  };

  return (
    <div className="w-full">
      {/* URL Input Section */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
          Or fetch from URL
        </label>
        <div className="flex gap-2">
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isFetching || isLoading}
          />
          <button
            onClick={handleFetchFromUrl}
            disabled={isFetching || isLoading || !url.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-busy={isFetching}
          >
            {isFetching ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
        {fetchError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {fetchError}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Note: Some websites may block fetching due to CORS policies.
        </p>
      </div>

      {/* HTML Input Section */}
      <label htmlFor="html-input" className="block text-sm font-medium text-gray-700 mb-2">
        HTML Input
      </label>
      <textarea
        id="html-input"
        value={value}
        onChange={handleChange}
        placeholder="Paste your HTML code here to analyze accessibility..."
        className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        aria-describedby="html-input-help html-input-error html-input-charcount"
      />
      <div className="flex justify-between items-center mt-2">
        <p id="html-input-help" className="text-sm text-gray-500">
          Enter HTML code to check for accessibility issues
        </p>
        <p id="html-input-charcount" className="text-sm text-gray-500" aria-live="polite">
          {characterCount.toLocaleString()} / {MAX_HTML_SIZE.toLocaleString()} characters
        </p>
      </div>
      {error && (
        <p id="html-input-error" className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onAnalyze}
          disabled={isLoading || !value.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-busy={isLoading}
        >
          {isLoading ? getLoadingMessage() : 'Analyze Accessibility'}
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Clear
        </button>
        {onHome && (
          <button
            onClick={onHome}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Home
          </button>
        )}
      </div>
    </div>
  );
}
