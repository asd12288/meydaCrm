import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { Spinner, LoadingState, InlineSpinner } from '../ui/spinner';

describe('Spinner', () => {
  afterEach(() => {
    cleanup();
  });

  describe('type variants', () => {
    it('renders ring spinner by default', () => {
      const { container } = render(<Spinner />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner.tagName).toBe('DIV');
      expect(spinner).toHaveClass('animate-spin', 'rounded-full');
    });

    it('renders ring spinner when type="ring"', () => {
      const { container } = render(<Spinner type="ring" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner).toHaveClass('animate-spin', 'rounded-full');
    });

    it('renders dots spinner when type="dots"', () => {
      const { container } = render(<Spinner type="dots" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner.tagName).toBe('SPAN');
      // Should have 3 dot children + sr-only text
      const dots = spinner.querySelectorAll('.animate-bounce');
      expect(dots).toHaveLength(3);
    });

    it('renders bars spinner when type="bars"', () => {
      const { container } = render(<Spinner type="bars" />);
      const spinner = container.firstChild as HTMLElement;
      expect(spinner.tagName).toBe('SPAN');
      // Should have 5 bar children + sr-only text
      const bars = spinner.querySelectorAll('.animate-pulse');
      expect(bars).toHaveLength(5);
    });
  });

  describe('size variants', () => {
    it('applies sm size classes for ring', () => {
      const { container } = render(<Spinner size="sm" type="ring" />);
      expect(container.firstChild).toHaveClass('w-4', 'h-4');
    });

    it('applies md size classes for ring (default)', () => {
      const { container } = render(<Spinner type="ring" />);
      expect(container.firstChild).toHaveClass('w-6', 'h-6');
    });

    it('applies lg size classes for ring', () => {
      const { container } = render(<Spinner size="lg" type="ring" />);
      expect(container.firstChild).toHaveClass('w-8', 'h-8');
    });

    it('applies xl size classes for ring', () => {
      const { container } = render(<Spinner size="xl" type="ring" />);
      expect(container.firstChild).toHaveClass('w-10', 'h-10');
    });
  });

  describe('variant colors', () => {
    it('applies primary variant by default (ring)', () => {
      const { container } = render(<Spinner type="ring" />);
      expect(container.firstChild).toHaveClass('text-primary');
    });

    it('applies secondary variant (ring)', () => {
      const { container } = render(<Spinner variant="secondary" type="ring" />);
      expect(container.firstChild).toHaveClass('text-secondary');
    });

    it('applies muted variant (ring)', () => {
      const { container } = render(<Spinner variant="muted" type="ring" />);
      expect(container.firstChild).toHaveClass('text-darklink');
    });

    it('applies white variant (ring)', () => {
      const { container } = render(<Spinner variant="white" type="ring" />);
      expect(container.firstChild).toHaveClass('text-white');
    });

    it('applies primary variant for dots', () => {
      const { container } = render(<Spinner type="dots" variant="primary" />);
      const dots = container.querySelectorAll('.bg-primary');
      expect(dots).toHaveLength(3);
    });

    it('applies primary variant for bars', () => {
      const { container } = render(<Spinner type="bars" variant="primary" />);
      const bars = container.querySelectorAll('.bg-primary');
      expect(bars).toHaveLength(5);
    });
  });

  describe('accessibility', () => {
    it('has role="status" (ring)', () => {
      render(<Spinner type="ring" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has role="status" (dots)', () => {
      render(<Spinner type="dots" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has role="status" (bars)', () => {
      render(<Spinner type="bars" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-label for screen readers', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Chargement...');
    });

    it('has sr-only text', () => {
      render(<Spinner />);
      expect(screen.getByText('Chargement...')).toHaveClass('sr-only');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<Spinner className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});

describe('LoadingState', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders spinner centered with padding', () => {
    const { container } = render(<LoadingState />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center', 'py-12');
  });

  it('renders message when provided', () => {
    render(<LoadingState message="Chargement des données..." />);
    expect(screen.getByText('Chargement des données...')).toBeInTheDocument();
  });

  it('does not render message when not provided', () => {
    const { container } = render(<LoadingState />);
    const paragraphs = container.querySelectorAll('p');
    // Only sr-only text should be present
    expect(paragraphs).toHaveLength(0);
  });

  it('uses lg size by default', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('uses ring type by default', () => {
    const { container } = render(<LoadingState />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full');
  });

  it('accepts type prop for bars', () => {
    const { container } = render(<LoadingState type="bars" />);
    const bars = container.querySelectorAll('.animate-pulse');
    expect(bars).toHaveLength(5);
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<LoadingState className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('InlineSpinner', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders inline with flex', () => {
    const { container } = render(<InlineSpinner />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.tagName).toBe('SPAN');
    expect(wrapper).toHaveClass('inline-flex', 'items-center', 'gap-2');
  });

  it('renders children text', () => {
    render(<InlineSpinner>Envoi en cours...</InlineSpinner>);
    expect(screen.getByText('Envoi en cours...')).toBeInTheDocument();
  });

  it('uses dots type by default', () => {
    const { container } = render(<InlineSpinner />);
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('uses sm size by default', () => {
    const { container } = render(<InlineSpinner type="ring" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('accepts type prop for ring', () => {
    const { container } = render(<InlineSpinner type="ring" />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveClass('animate-spin', 'rounded-full');
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<InlineSpinner className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders complex children', () => {
    render(
      <InlineSpinner>
        <span data-testid="child">Custom content</span>
      </InlineSpinner>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
