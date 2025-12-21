import { describe, it, expect } from 'vitest';
import { isAdmin, isDeveloper, isAdminOrDeveloper } from '../lib/utils';
import type { AuthUser } from '../types';

// Helper to create mock user with a specific role
function createMockUser(role: 'admin' | 'sales' | 'developer' | null): AuthUser | null {
  if (role === null) return null;
  return {
    id: 'test-user-id',
    email: 'test@crm.local',
    profile: {
      id: 'test-user-id',
      displayName: 'Test User',
      role,
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

describe('Auth Utility Functions', () => {
  describe('isAdmin', () => {
    it('returns true for admin user', () => {
      const user = createMockUser('admin');
      expect(isAdmin(user)).toBe(true);
    });

    it('returns false for sales user', () => {
      const user = createMockUser('sales');
      expect(isAdmin(user)).toBe(false);
    });

    it('returns false for developer user', () => {
      const user = createMockUser('developer');
      expect(isAdmin(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });

    it('returns false for user without profile', () => {
      const user: AuthUser = {
        id: 'test-id',
        email: 'test@crm.local',
        profile: null,
      };
      expect(isAdmin(user)).toBe(false);
    });
  });

  describe('isDeveloper', () => {
    it('returns true for developer user', () => {
      const user = createMockUser('developer');
      expect(isDeveloper(user)).toBe(true);
    });

    it('returns false for admin user', () => {
      const user = createMockUser('admin');
      expect(isDeveloper(user)).toBe(false);
    });

    it('returns false for sales user', () => {
      const user = createMockUser('sales');
      expect(isDeveloper(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(isDeveloper(null)).toBe(false);
    });

    it('returns false for user without profile', () => {
      const user: AuthUser = {
        id: 'test-id',
        email: 'test@crm.local',
        profile: null,
      };
      expect(isDeveloper(user)).toBe(false);
    });
  });

  describe('isAdminOrDeveloper', () => {
    it('returns true for admin user', () => {
      const user = createMockUser('admin');
      expect(isAdminOrDeveloper(user)).toBe(true);
    });

    it('returns true for developer user', () => {
      const user = createMockUser('developer');
      expect(isAdminOrDeveloper(user)).toBe(true);
    });

    it('returns false for sales user', () => {
      const user = createMockUser('sales');
      expect(isAdminOrDeveloper(user)).toBe(false);
    });

    it('returns false for null user', () => {
      expect(isAdminOrDeveloper(null)).toBe(false);
    });

    it('returns false for user without profile', () => {
      const user: AuthUser = {
        id: 'test-id',
        email: 'test@crm.local',
        profile: null,
      };
      expect(isAdminOrDeveloper(user)).toBe(false);
    });
  });
});
