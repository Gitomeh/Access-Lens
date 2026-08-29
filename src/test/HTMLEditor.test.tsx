import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HTMLEditor } from '../components/HTMLEditor';

describe('HTMLEditor', () => {
  const defaultProps = {
    value: '<button>Click me</button>',
    onChange: vi.fn(),
    onAnalyze: vi.fn(),
    onClear: vi.fn(),
    isLoading: false,
    onFetchFromUrl: vi.fn(),
  };

  it('renders correctly with initial value', () => {
    render(<HTMLEditor {...defaultProps} />);
    const textarea = screen.getByLabelText(/html input/i);
    expect(textarea).toHaveValue('<button>Click me</button>');
  });

  it('calls onChange when textarea value changes', () => {
    render(<HTMLEditor {...defaultProps} />);
    const textarea = screen.getByLabelText(/html input/i);
    fireEvent.change(textarea, { target: { value: '<div>New content</div>' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith('<div>New content</div>');
  });

  it('calls onAnalyze when analyze button is clicked', () => {
    render(<HTMLEditor {...defaultProps} />);
    const analyzeButton = screen.getByRole('button', { name: /analyze accessibility/i });
    fireEvent.click(analyzeButton);
    expect(defaultProps.onAnalyze).toHaveBeenCalled();
  });

  it('disables analyze button when loading', () => {
    render(<HTMLEditor {...defaultProps} isLoading={true} />);
    const analyzeButton = screen.getByRole('button', { name: /analyzing/i });
    expect(analyzeButton).toBeDisabled();
  });

  it('disables analyze button when value is empty', () => {
    render(<HTMLEditor {...defaultProps} value="" />);
    const analyzeButton = screen.getByRole('button', { name: /analyze accessibility/i });
    expect(analyzeButton).toBeDisabled();
  });

  it('calls onClear when clear button is clicked', () => {
    render(<HTMLEditor {...defaultProps} />);
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    render(<HTMLEditor {...defaultProps} error="Please enter HTML" />);
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toHaveTextContent('Please enter HTML');
  });

  it('displays character count', () => {
    render(<HTMLEditor {...defaultProps} value="<div>test</div>" />);
    expect(screen.getByText(/15 \/ 500,000 characters/i)).toBeInTheDocument();
  });

  it('renders URL input section', () => {
    render(<HTMLEditor {...defaultProps} />);
    expect(screen.getByLabelText(/or fetch from url/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/example.com/i)).toBeInTheDocument();
  });

  it('calls onFetchFromUrl when fetch button is clicked', () => {
    const mockFetch = vi.fn();
    render(<HTMLEditor {...defaultProps} onFetchFromUrl={mockFetch} />);
    const urlInput = screen.getByPlaceholderText(/https:\/\/example.com/i);
    const fetchButton = screen.getByRole('button', { name: /fetch/i });
    
    fireEvent.change(urlInput, { target: { value: 'https://example.com' } });
    fireEvent.click(fetchButton);
    
    expect(mockFetch).toHaveBeenCalledWith('https://example.com');
  });

  it('disables fetch button when URL is empty', () => {
    render(<HTMLEditor {...defaultProps} />);
    const fetchButton = screen.getByRole('button', { name: /fetch/i });
    expect(fetchButton).toBeDisabled();
  });
});
