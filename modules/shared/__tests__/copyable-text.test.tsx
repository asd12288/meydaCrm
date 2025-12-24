import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { screen } from '@testing-library/dom';
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
    cleanup();
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

    it('renders a span container with button', () => {
      const { container } = render(<CopyableText text="test@example.com" />);
      // Icon variant renders a span with inline-flex
      expect(container.querySelector('span.inline-flex')).toBeInTheDocument();
      // Should have a button inside
      expect(container.querySelector('button')).toBeInTheDocument();
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
    it('renders a button element', () => {
      const { container } = render(<CopyableText text="test@example.com" variant="inline" />);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('test@example.com');
    });

    it('has title attribute', () => {
      const { container } = render(<CopyableText text="test@example.com" variant="inline" />);
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('title', 'Cliquer pour copier');
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
      const { container } = render(
        <CopyableText text="test" variant="inline" className="custom-class" />
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});
