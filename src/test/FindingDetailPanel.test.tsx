import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
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
