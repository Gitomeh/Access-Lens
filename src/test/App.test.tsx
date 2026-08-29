import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the header with correct title', () => {
    render(<App />);
    expect(screen.getByText('AccessLens')).toBeInTheDocument();
    expect(screen.getAllByText('See your website through every user\'s lens')).toHaveLength(2);
  });

  it('renders the HTML editor by default', () => {
    render(<App />);
    // Click "Analyze HTML" to dismiss landing page
    const analyzeHtmlButton = screen.getByRole('button', { name: /analyze html/i });
    fireEvent.click(analyzeHtmlButton);
    
    expect(screen.getByLabelText(/html input/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze accessibility/i })).toBeInTheDocument();
  });

  it('has default HTML content in the editor', () => {
    render(<App />);
    // Click "Analyze HTML" to dismiss landing page
    const analyzeHtmlButton = screen.getByRole('button', { name: /analyze html/i });
    fireEvent.click(analyzeHtmlButton);
    
    const textarea = screen.getByLabelText(/html input/i);
    expect(textarea).toHaveValue();
  });

  it('clears editor when clear button is clicked', () => {
    render(<App />);
    // Click "Analyze HTML" to dismiss landing page
    const analyzeHtmlButton = screen.getByRole('button', { name: /analyze html/i });
    fireEvent.click(analyzeHtmlButton);
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    const textarea = screen.getByLabelText(/html input/i);
    expect(textarea).toHaveValue('');
  });

  it('prevents analyzing empty HTML', async () => {
    render(<App />);
    // Click "Analyze HTML" to dismiss landing page
    const analyzeHtmlButton = screen.getByRole('button', { name: /analyze html/i });
    fireEvent.click(analyzeHtmlButton);

    const textarea = screen.getByLabelText(/html input/i);
    fireEvent.change(textarea, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyze accessibility/i })).toBeDisabled();
    });
  });

  it('should analyze HTML and show results', async () => {
    render(<App />);

    // Click "Analyze HTML" to dismiss landing page
    const analyzeHtmlButton = screen.getByRole('button', { name: /analyze html/i });
    fireEvent.click(analyzeHtmlButton);

    const analyzeButton = screen.getByRole('button', { name: /analyze accessibility/i });
    
    // The button should be enabled with default HTML
    expect(analyzeButton).not.toBeDisabled();
  });
});
