import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindingDetailPanel } from '../components/FindingDetailPanel';
import * as explainClient from '../lib/explain-client';
import type { AccessibilityFinding } from '../types/accessibility';

const finding: AccessibilityFinding = {
  id: 'image-alt',
  ruleId: 'image-alt',
  impact: 'critical',
  description: 'Ensure <img> elements have alternative text.',
  help: 'Images must have alternate text',
  helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
  tags: ['wcag2a', 'wcag111'],
  nodes: [{ html: '<img src="logo.png">', target: ['img'] }],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FindingDetailPanel failure handling', () => {
  it('displays error state when AI explanation fails', async () => {
    const user = userEvent.setup();
    
    vi.spyOn(explainClient, 'getAIExplanation').mockResolvedValue({
      success: false,
      error: 'The AI service is temporarily busy. Please try again in a moment.'
    });

    render(<FindingDetailPanel finding={finding} />);

    const explainButton = screen.getByRole('button', { name: /get ai explanation/i });
    await user.click(explainButton);

    await waitFor(() => {
      expect(screen.getByText(/couldn't finish that explanation/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/the ai service is temporarily busy/i)).toBeInTheDocument();
  });

  it('shows retry button after failure', async () => {
    const user = userEvent.setup();
    
    vi.spyOn(explainClient, 'getAIExplanation').mockResolvedValue({
      success: false,
      error: 'Network error'
    });

    render(<FindingDetailPanel finding={finding} />);

    const explainButton = screen.getByRole('button', { name: /get ai explanation/i });
    await user.click(explainButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry explanation/i })).toBeInTheDocument();
    });
  });

  it('prevents double-clicking retry button', async () => {
    const user = userEvent.setup();
    
    const mockGetAI = vi.spyOn(explainClient, 'getAIExplanation')
      .mockResolvedValueOnce({
        success: false,
        error: 'Error'
      })
      .mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: false, error: 'Error' }), 1000)
      ));

    render(<FindingDetailPanel finding={finding} />);

    const explainButton = screen.getByRole('button', { name: /get ai explanation/i });
    await user.click(explainButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry explanation/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry explanation/i });
    
    // Click twice rapidly
    await user.click(retryButton);
    await user.click(retryButton);

    // Should only call the API once more (protected by isRetrying state)
    await waitFor(() => {
      expect(mockGetAI).toHaveBeenCalledTimes(2); // Initial + one retry
    });
  });

  it('shows loading state during retry', async () => {
    const user = userEvent.setup();
    
    vi.spyOn(explainClient, 'getAIExplanation')
      .mockResolvedValueOnce({
        success: false,
        error: 'Error'
      })
      .mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: false, error: 'Error' }), 500)
      ));

    render(<FindingDetailPanel finding={finding} />);

    const explainButton = screen.getByRole('button', { name: /get ai explanation/i });
    await user.click(explainButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry explanation/i })).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry explanation/i });
    await user.click(retryButton);

    // Should show "Retrying..." on the main button
    expect(screen.getByRole('button', { name: /retrying/i })).toBeInTheDocument();
  });
});
