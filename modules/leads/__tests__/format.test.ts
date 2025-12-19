import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime, formatDisplayValue } from '../lib/format';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock Date.now to have consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "à l\'instant" for times less than 1 minute ago', () => {
    const thirtySecondsAgo = new Date('2024-06-15T11:59:30.000Z').toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe("à l'instant");
  });

  it('returns minutes for times less than 1 hour ago', () => {
    const tenMinutesAgo = new Date('2024-06-15T11:50:00.000Z').toISOString();
    expect(formatRelativeTime(tenMinutesAgo)).toBe('il y a 10 min');
  });

  it('returns hours for times less than 24 hours ago', () => {
    const threeHoursAgo = new Date('2024-06-15T09:00:00.000Z').toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('il y a 3h');
  });

  it('returns days for times less than 7 days ago', () => {
    const twoDaysAgo = new Date('2024-06-13T12:00:00.000Z').toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('il y a 2j');
  });

  it('returns formatted date for times more than 7 days ago', () => {
    const twoWeeksAgo = new Date('2024-06-01T12:00:00.000Z').toISOString();
    const result = formatRelativeTime(twoWeeksAgo);
    // Should contain day and month
    expect(result).toMatch(/1.*juin/i);
  });

  it('includes year for dates more than 365 days old', () => {
    const lastYear = new Date('2023-06-15T12:00:00.000Z').toISOString();
    const result = formatRelativeTime(lastYear);
    expect(result).toMatch(/2023/);
  });
});

describe('formatDisplayValue', () => {
  it('returns "(vide)" for null', () => {
    expect(formatDisplayValue(null)).toBe('(vide)');
  });

  it('returns "(vide)" for undefined', () => {
    expect(formatDisplayValue(undefined)).toBe('(vide)');
  });

  it('returns "(vide)" for empty string', () => {
    expect(formatDisplayValue('')).toBe('(vide)');
  });

  it('returns string representation of numbers', () => {
    expect(formatDisplayValue(42)).toBe('42');
    expect(formatDisplayValue(0)).toBe('0');
  });

  it('returns string representation of booleans', () => {
    expect(formatDisplayValue(true)).toBe('true');
    expect(formatDisplayValue(false)).toBe('false');
  });

  it('returns the string as-is', () => {
    expect(formatDisplayValue('Hello World')).toBe('Hello World');
  });
});
