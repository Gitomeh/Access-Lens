import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the header with correct title', () => {
    render(<App />);
    expect(screen.getByText('AccessLens')).toBeInTheDocument();
    expect(screen.getByText('See your website through every user\'s lens')).toBeInTheDocument();
  });

  it('renders the HTML editor by default', () => {
    render(<App />);
    expect(screen.getByLabelText(/html input/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze accessibility/i })).toBeInTheDocument();
  });

  it('has default HTML content in the editor', () => {
    render(<App />);
    const textarea = screen.getByLabelText(/html input/i);
    expect(textarea).toHaveValue();
  });

  it('clears editor when clear button is clicked', () => {
    render(<App />);
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);
    
    const textarea = screen.getByLabelText(/html input/i);
    expect(textarea).toHaveValue('');
  });

  it('prevents analyzing empty HTML', async () => {
    render(<App />);

    const textarea = screen.getByLabelText(/html input/i);
    fireEvent.change(textarea, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyze accessibility/i })).toBeDisabled();
    });
  });
});
