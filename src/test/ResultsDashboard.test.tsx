import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultsDashboard } from '../components/ResultsDashboard';
import type { ScanResult } from '../types/accessibility';

describe('ResultsDashboard', () => {
  const mockScanResult: ScanResult = {
    violations: [
      {
        id: 'test-violation-1',
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
      },
    ],
    passes: [
      {
        id: 'test-pass-1',
        ruleId: 'button-name',
        impact: 'minor',
        description: 'Buttons must have accessible names',
        help: 'Ensure buttons have text content',
        helpUrl: 'https://example.com/button-name',
        tags: ['wcag2a', 'wcag412'],
        nodes: [],
      },
    ],
    incomplete: [],
  };

  it('renders summary statistics correctly', () => {
    render(
      <ResultsDashboard
        scanResult={mockScanResult}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
      />
    );

    expect(screen.getByText('Total Issues')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Total issues
    expect(screen.getByText('Serious')).toBeInTheDocument();
  });

  it('renders violation list', () => {
    render(
      <ResultsDashboard
        scanResult={mockScanResult}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
      />
    );

    expect(screen.getByText('color-contrast')).toBeInTheDocument();
    expect(screen.getByText('Elements must have sufficient color contrast')).toBeInTheDocument();
  });

  it('displays no issues message when violations are empty', () => {
    const emptyResult: ScanResult = {
      violations: [],
      passes: [],
      incomplete: [],
    };

    render(
      <ResultsDashboard
        scanResult={emptyResult}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
      />
    );

    expect(screen.getByText('No accessibility issues found!')).toBeInTheDocument();
  });

  it('calls onSelectFinding when a violation is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ResultsDashboard
        scanResult={mockScanResult}
        selectedFindingId={null}
        onSelectFinding={handleSelect}
      />
    );

    const violationButton = screen.getByText('color-contrast').closest('button');
    if (violationButton) {
      fireEvent.click(violationButton);
      expect(handleSelect).toHaveBeenCalledWith('test-violation-1');
    }
  });

  it('displays passed checks count', () => {
    render(
      <ResultsDashboard
        scanResult={mockScanResult}
        selectedFindingId={null}
        onSelectFinding={vi.fn()}
      />
    );

    expect(screen.getByText('Passed Checks (1)')).toBeInTheDocument();
  });
});
