import { describe, it, expect } from 'vitest';
import { normalizeProfile, isAdmin, createDefaultProfile } from '../index';
import type { SupabaseProfile, NormalizedProfile } from '../types';

describe('normalizeProfile', () => {
  it('converts snake_case to camelCase correctly', () => {
    const supabaseProfile: SupabaseProfile = {
      id: 'user-123',
      role: 'admin',
      display_name: 'Jean Dupont',
      avatar: 'avatar-01',
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-06-20T14:45:00Z',
    };

    const result = normalizeProfile(supabaseProfile);

    expect(result).toEqual({
      id: 'user-123',
      role: 'admin',
      displayName: 'Jean Dupont',
      avatar: 'avatar-01',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      updatedAt: new Date('2024-06-20T14:45:00Z'),
    });
  });

  it('handles null avatar correctly', () => {
    const supabaseProfile: SupabaseProfile = {
      id: 'user-456',
      role: 'sales',
      display_name: 'Marie Martin',
      avatar: null,
      created_at: '2024-03-01T09:00:00Z',
      updated_at: '2024-03-01T09:00:00Z',
    };

    const result = normalizeProfile(supabaseProfile);

    expect(result.avatar).toBeNull();
    expect(result.displayName).toBe('Marie Martin');
    expect(result.role).toBe('sales');
  });

  it('converts date strings to Date objects', () => {
    const supabaseProfile: SupabaseProfile = {
      id: 'user-789',
      role: 'developer',
      display_name: 'Dev User',
      avatar: null,
      created_at: '2024-12-01T00:00:00Z',
      updated_at: '2024-12-15T12:00:00Z',
    };

    const result = normalizeProfile(supabaseProfile);

    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(result.createdAt.toISOString()).toBe('2024-12-01T00:00:00.000Z');
    expect(result.updatedAt.toISOString()).toBe('2024-12-15T12:00:00.000Z');
  });
});

describe('isAdmin', () => {
  it('returns true for admin profile', () => {
    const profile: NormalizedProfile = {
      id: 'admin-id',
      role: 'admin',
      displayName: 'Admin User',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(isAdmin(profile)).toBe(true);
  });

  it('returns false for sales profile', () => {
    const profile: NormalizedProfile = {
      id: 'sales-id',
      role: 'sales',
      displayName: 'Sales User',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(isAdmin(profile)).toBe(false);
  });

  it('returns false for developer profile', () => {
    const profile: NormalizedProfile = {
      id: 'dev-id',
      role: 'developer',
      displayName: 'Dev User',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(isAdmin(profile)).toBe(false);
  });

  it('returns false for null profile', () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe('createDefaultProfile', () => {
  it('creates a profile with sales role', () => {
    const profile = createDefaultProfile('new-user-id', 'Nouveau Utilisateur');

    expect(profile.id).toBe('new-user-id');
    expect(profile.role).toBe('sales');
    expect(profile.displayName).toBe('Nouveau Utilisateur');
    expect(profile.avatar).toBeNull();
    expect(profile.createdAt).toBeInstanceOf(Date);
    expect(profile.updatedAt).toBeInstanceOf(Date);
  });

  it('creates dates close to current time', () => {
    const before = new Date();
    const profile = createDefaultProfile('test-id', 'Test');
    const after = new Date();

    expect(profile.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(profile.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
