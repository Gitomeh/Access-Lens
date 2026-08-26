import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { FindingDetailPanel } from '../components/FindingDetailPanel';
import type { AccessibilityFinding } from '../types/accessibility';

const mockFinding: AccessibilityFinding = {
  id: 'test-finding-1',
  ruleId: 'color-contrast',
  impact: 'serious',
  description: 'Elements must have sufficient color contrast',
  help: 'Ensure color contrast is at least 4.5:1',
  helpUrl: 'https://example.com/color-contrast',
  tags: ['wcag2aa', 'wcag143'],
  nodes: [
    {
      html: '<button style="color: red;">Click</button>',
      target: ['button'],
    },
  ],
};

describe('FindingDetailPanel', () => {
  it('renders finding details correctly', () => {
    render(<FindingDetailPanel finding={mockFinding} />);

    expect(screen.getByText('color-contrast')).toBeInTheDocument();
    expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
    expect(screen.getByText('SERIOUS')).toBeInTheDocument();
  });

  it('displays affected HTML', () => {
    render(<FindingDetailPanel finding={mockFinding} />);
    expect(screen.getByText(/<button style="color: red;">Click<\/button>/)).toBeInTheDocument();
  });

  it('displays WCAG tags', () => {
    render(<FindingDetailPanel finding={mockFinding} />);
    expect(screen.getByText('wcag2aa')).toBeInTheDocument();
    expect(screen.getByText('wcag143')).toBeInTheDocument();
  });

  it('displays help URL link', () => {
    render(<FindingDetailPanel finding={mockFinding} />);
    const link = screen.getByRole('link', { name: /view detailed documentation/i });
    expect(link).toHaveAttribute('href', 'https://example.com/color-contrast');
  });

  it('shows AI explanation button', () => {
    render(<FindingDetailPanel finding={mockFinding} />);
    expect(screen.getByRole('button', { name: /get ai explanation/i })).toBeInTheDocument();
  });

  it('displays fallback help text when AI is not available', () => {
    render(<FindingDetailPanel finding={mockFinding} />);
    expect(screen.getByText('Ensure color contrast is at least 4.5:1')).toBeInTheDocument();
  });
});

const explanation = {
  summary: 'Text and background colours are too similar.',
  whyItMatters: 'Low contrast text is hard to read.',
  whoIsAffected: 'Users with low vision or colour blindness.',
  recommendedFix: 'Darken the text colour until the ratio is at least 4.5:1.',
  codeExample: '<button style="color: #a30000;">Click</button>',
};

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body };
}

function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: async () => body };
}

describe('FindingDetailPanel AI explanation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the AI explanation returned by /api/explain', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ success: true, data: explanation })));

    render(<FindingDetailPanel finding={mockFinding} />);
    await user.click(screen.getByRole('button', { name: /get ai explanation/i }));

    expect(await screen.findByText(explanation.summary)).toBeInTheDocument();
    expect(screen.getByText(explanation.recommendedFix)).toBeInTheDocument();
    expect(screen.getByText(explanation.codeExample)).toBeInTheDocument();
  });

  it('keeps the axe finding visible and offers a retry when the AI fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        errorResponse(503, { success: false, code: 'missing_api_key', message: 'The AI service is not configured on the server.' })
      )
    );

    render(<FindingDetailPanel finding={mockFinding} />);
    await user.click(screen.getByRole('button', { name: /get ai explanation/i }));

    expect(await screen.findByText('AI Explanation Unavailable')).toBeInTheDocument();
    expect(screen.getByText('The AI service is not configured on the server.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();

    // The deterministic axe finding is still fully available.
    expect(screen.getByText('color-contrast')).toBeInTheDocument();
    expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
    expect(screen.getByText('Ensure color contrast is at least 4.5:1')).toBeInTheDocument();
  });

  it('recovers when the retry succeeds', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse({ success: true, data: explanation }));
    vi.stubGlobal('fetch', fetchMock);

    render(<FindingDetailPanel finding={mockFinding} />);
    await user.click(screen.getByRole('button', { name: /get ai explanation/i }));

    expect(await screen.findByRole('button', { name: /retry/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText(explanation.summary)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('AI Explanation Unavailable')).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never sends an API key from the browser', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ success: true, data: explanation }));
    vi.stubGlobal('fetch', fetchMock);

    render(<FindingDetailPanel finding={mockFinding} />);
    await user.click(screen.getByRole('button', { name: /get ai explanation/i }));

    await screen.findByText(explanation.summary);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/explain');
    expect(JSON.stringify(init)).not.toMatch(/api[_-]?key/i);
  });
});
