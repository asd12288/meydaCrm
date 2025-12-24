import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { UserAvatar } from '../ui/user-avatar';

describe('UserAvatar', () => {
  // Clean up after each test to prevent DOM pollution
  afterEach(() => {
    cleanup();
  });

  it('renders initials from single word name', () => {
    render(<UserAvatar name="John" />);
    expect(screen.getByText('JO')).toBeInTheDocument();
  });

  it('renders initials from two word name', () => {
    render(<UserAvatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders initials from multi-word name (first and last)', () => {
    render(<UserAvatar name="John Middle Doe" />);
    // Takes first letter of first word + first letter of last word
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders "?" for null name', () => {
    render(<UserAvatar name={null} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders "?" for undefined name', () => {
    render(<UserAvatar name={undefined} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    // Test each size in isolation
    const { container: xsContainer, unmount: unmountXs } = render(<UserAvatar name="Test" size="xs" />);
    expect(xsContainer.firstChild).toHaveClass('w-6', 'h-6');
    unmountXs();

    const { container: smContainer, unmount: unmountSm } = render(<UserAvatar name="Test" size="sm" />);
    expect(smContainer.firstChild).toHaveClass('w-8', 'h-8');
    unmountSm();

    const { container: mdContainer, unmount: unmountMd } = render(<UserAvatar name="Test" size="md" />);
    expect(mdContainer.firstChild).toHaveClass('w-10', 'h-10');
    unmountMd();

    const { container: lgContainer, unmount: unmountLg } = render(<UserAvatar name="Test" size="lg" />);
    expect(lgContainer.firstChild).toHaveClass('w-12', 'h-12');
    unmountLg();

    const { container: xlContainer } = render(<UserAvatar name="Test" size="xl" />);
    expect(xlContainer.firstChild).toHaveClass('w-20', 'h-20');
  });

  it('applies consistent color based on name', () => {
    const { container: first, unmount: unmountFirst } = render(<UserAvatar name="John Doe" />);
    const firstClasses = (first.firstChild as HTMLElement)?.className;
    unmountFirst();

    const { container: second } = render(<UserAvatar name="John Doe" />);
    const secondClasses = (second.firstChild as HTMLElement)?.className;

    // Same name should produce same color class
    expect(firstClasses).toBe(secondClasses);
  });

  it('applies custom className', () => {
    const { container } = render(<UserAvatar name="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has title attribute with name', () => {
    const { container } = render(<UserAvatar name="John Doe" />);
    expect(container.firstChild).toHaveAttribute('title', 'John Doe');
  });

  it('has title "Inconnu" for null name', () => {
    const { container } = render(<UserAvatar name={null} />);
    expect(container.firstChild).toHaveAttribute('title', 'Inconnu');
  });
});
