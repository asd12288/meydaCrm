import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../ui/user-avatar';

describe('UserAvatar', () => {
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

  it('applies correct size classes', () => {
    const { container: smContainer } = render(<UserAvatar name="Test" size="sm" />);
    expect(smContainer.firstChild).toHaveClass('w-6', 'h-6');

    const { container: mdContainer } = render(<UserAvatar name="Test" size="md" />);
    expect(mdContainer.firstChild).toHaveClass('w-8', 'h-8');

    const { container: lgContainer } = render(<UserAvatar name="Test" size="lg" />);
    expect(lgContainer.firstChild).toHaveClass('w-10', 'h-10');

    const { container: xlContainer } = render(<UserAvatar name="Test" size="xl" />);
    expect(xlContainer.firstChild).toHaveClass('w-16', 'h-16');
  });

  it('applies consistent color based on name', () => {
    const { container: first } = render(<UserAvatar name="John Doe" />);
    const { container: second } = render(<UserAvatar name="John Doe" />);

    // Same name should produce same color class
    const firstClasses = (first.firstChild as HTMLElement)?.className;
    const secondClasses = (second.firstChild as HTMLElement)?.className;
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
