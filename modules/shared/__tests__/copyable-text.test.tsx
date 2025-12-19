import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyableText } from '../ui/copyable-text';

// Store original clipboard
const originalClipboard = navigator.clipboard;

describe('CopyableText', () => {
  beforeEach(() => {
    // Mock clipboard API using Object.defineProperty
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
  });

  describe('when text is empty', () => {
    it('renders "-" for empty text', () => {
      render(<CopyableText text="" />);
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('icon variant (default)', () => {
    it('renders the text', () => {
      render(<CopyableText text="test@example.com" />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('shows copy icon on hover', () => {
      render(<CopyableText text="test@example.com" />);
      // The button with copy icon should exist
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('copies text when button is clicked', async () => {
      render(<CopyableText text="test@example.com" />);

      const copyButton = screen.getByRole('button');
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
    });

    it('renders custom children instead of text', () => {
      render(
        <CopyableText text="hidden-text">
          <span>Custom Display</span>
        </CopyableText>
      );
      expect(screen.getByText('Custom Display')).toBeInTheDocument();
    });
  });

  describe('inline variant', () => {
    it('renders clickable text', () => {
      render(<CopyableText text="test@example.com" variant="inline" />);
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('test@example.com');
    });

    it('copies text when text is clicked', async () => {
      render(<CopyableText text="test@example.com" variant="inline" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test@example.com');
    });

    it('shows "Copié !" feedback after copy', async () => {
      render(<CopyableText text="test@example.com" variant="inline" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Copié !')).toBeInTheDocument();
      });
    });

    it('has correct aria-label', () => {
      render(<CopyableText text="test@example.com" variant="inline" />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Cliquer pour copier');
    });
  });

  describe('className prop', () => {
    it('applies custom className in icon variant', () => {
      const { container } = render(
        <CopyableText text="test" className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies custom className in inline variant', () => {
      render(
        <CopyableText text="test" variant="inline" className="custom-class" />
      );
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });
});
