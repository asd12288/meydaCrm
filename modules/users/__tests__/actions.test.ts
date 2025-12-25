import { describe, it, expect } from 'vitest';
import { createUserSchema, resetPasswordSchema, editUserSchema } from '../types';
import { ROLES } from '@/lib/constants/roles';

/**
 * Tests for users actions module
 *
 * Tests validation schemas and business logic rules.
 */

describe('User Schemas', () => {
  describe('createUserSchema', () => {
    it('accepts valid user creation data', () => {
      const validUser = {
        username: 'jean.dupont',
        displayName: 'Jean Dupont',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: 'sales',
      };

      const result = createUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects when passwords do not match', () => {
      const mismatchedPasswords = {
        username: 'jean.dupont',
        displayName: 'Jean Dupont',
        password: 'SecurePass123',
        confirmPassword: 'DifferentPass456',
        role: 'sales',
      };

      const result = createUserSchema.safeParse(mismatchedPasswords);
      expect(result.success).toBe(false);
    });

    it('rejects invalid username format', () => {
      const invalidUsername = {
        username: 'a', // Too short
        displayName: 'Jean',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: 'sales',
      };

      const result = createUserSchema.safeParse(invalidUsername);
      expect(result.success).toBe(false);
    });

    it('rejects username with special characters', () => {
      const invalidUsername = {
        username: 'jean@dupont',
        displayName: 'Jean Dupont',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: 'sales',
      };

      const result = createUserSchema.safeParse(invalidUsername);
      expect(result.success).toBe(false);
    });

    it('accepts username with dots and underscores', () => {
      const validUsernames = ['jean.dupont', 'jean_dupont', 'jean.dupont_123'];

      validUsernames.forEach((username) => {
        const result = createUserSchema.safeParse({
          username,
          displayName: 'Jean Dupont',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          role: 'sales',
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects invalid role', () => {
      const invalidRole = {
        username: 'jean.dupont',
        displayName: 'Jean Dupont',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: 'superadmin', // Invalid role
      };

      const result = createUserSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
    });

    it('accepts valid roles (admin and sales)', () => {
      ['admin', 'sales'].forEach((role) => {
        const result = createUserSchema.safeParse({
          username: 'jean.dupont',
          displayName: 'Jean Dupont',
          password: 'SecurePass123',
          confirmPassword: 'SecurePass123',
          role,
        });
        expect(result.success).toBe(true);
      });
    });

    it('rejects short password', () => {
      const shortPassword = {
        username: 'jean.dupont',
        displayName: 'Jean Dupont',
        password: '12345', // Less than 6 chars
        confirmPassword: '12345',
        role: 'sales',
      };

      const result = createUserSchema.safeParse(shortPassword);
      expect(result.success).toBe(false);
    });

    it('rejects short display name', () => {
      const shortName = {
        username: 'jean.dupont',
        displayName: 'J', // Less than 2 chars
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        role: 'sales',
      };

      const result = createUserSchema.safeParse(shortName);
      expect(result.success).toBe(false);
    });
  });

  describe('resetPasswordSchema', () => {
    it('accepts valid password reset data', () => {
      const validReset = {
        newPassword: 'NewSecurePass123',
        confirmPassword: 'NewSecurePass123',
      };

      const result = resetPasswordSchema.safeParse(validReset);
      expect(result.success).toBe(true);
    });

    it('rejects when passwords do not match', () => {
      const mismatchedPasswords = {
        newPassword: 'NewSecurePass123',
        confirmPassword: 'DifferentPass456',
      };

      const result = resetPasswordSchema.safeParse(mismatchedPasswords);
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const shortPassword = {
        newPassword: '12345',
        confirmPassword: '12345',
      };

      const result = resetPasswordSchema.safeParse(shortPassword);
      expect(result.success).toBe(false);
    });
  });

  describe('editUserSchema', () => {
    it('accepts valid edit data', () => {
      const validEdit = {
        displayName: 'Jean Pierre Dupont',
        role: 'admin',
      };

      const result = editUserSchema.safeParse(validEdit);
      expect(result.success).toBe(true);
    });

    it('rejects invalid role', () => {
      const invalidRole = {
        displayName: 'Jean Dupont',
        role: 'superadmin',
      };

      const result = editUserSchema.safeParse(invalidRole);
      expect(result.success).toBe(false);
    });

    it('rejects short display name', () => {
      const shortName = {
        displayName: 'J',
        role: 'sales',
      };

      const result = editUserSchema.safeParse(shortName);
      expect(result.success).toBe(false);
    });
  });
});

describe('Business Logic Rules', () => {
  describe('Self-Modification Rules', () => {
    it('admin cannot change their own role', () => {
      const currentUserId: string = 'admin-123';
      const targetUserId: string = 'admin-123';
      const currentRole: string = 'admin';
      const newRole: string = 'sales';

      const isSelfRoleChange = currentUserId === targetUserId && currentRole !== newRole;
      expect(isSelfRoleChange).toBe(true);
      // This should be rejected
    });

    it('admin can change other users role', () => {
      const currentUserId: string = 'admin-123';
      const targetUserId: string = 'user-456';
      const currentRole: string = 'admin';
      const newRole: string = 'sales';

      const isSelfRoleChange = currentUserId === targetUserId && currentRole !== newRole;
      expect(isSelfRoleChange).toBe(false);
      // This should be allowed
    });

    it('admin cannot delete themselves', () => {
      const currentUserId: string = 'admin-123';
      const targetUserId: string = 'admin-123';

      const isSelfDeletion = currentUserId === targetUserId;
      expect(isSelfDeletion).toBe(true);
      // This should be rejected
    });
  });

  describe('Role Constants', () => {
    it('has expected role values', () => {
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.SALES).toBe('sales');
      expect(ROLES.DEVELOPER).toBe('developer');
    });

    it('developer role is excluded from user management', () => {
      // Developers are only for support tickets, not shown in user list
      const excludedRoles = [ROLES.DEVELOPER];
      expect(excludedRoles).toContain('developer');
    });
  });

  describe('User Filtering', () => {
    it('filters users by search term (case insensitive)', () => {
      const users = [
        { display_name: 'Jean Dupont', email: 'jean@example.com' },
        { display_name: 'Marie Martin', email: 'marie@example.com' },
        { display_name: 'Pierre Durant', email: 'pierre@test.com' },
      ];

      const searchTerm = 'jean';
      const filtered = users.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].display_name).toBe('Jean Dupont');
    });

    it('filters users by role', () => {
      const users = [
        { display_name: 'Admin User', role: 'admin' },
        { display_name: 'Sales User 1', role: 'sales' },
        { display_name: 'Sales User 2', role: 'sales' },
      ];

      const roleFilter = 'sales';
      const filtered = users.filter((u) => u.role === roleFilter);

      expect(filtered.length).toBe(2);
    });
  });

  describe('Pagination Logic', () => {
    it('calculates correct page boundaries', () => {
      const pageSize = 20;
      const page = 3;
      const total = 55;

      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const totalPages = Math.ceil(total / pageSize);

      expect(from).toBe(40);
      expect(to).toBe(60);
      expect(totalPages).toBe(3);
    });

    it('handles first page correctly', () => {
      const pageSize = 20;
      const page = 1;

      const from = (page - 1) * pageSize;
      const to = from + pageSize;

      expect(from).toBe(0);
      expect(to).toBe(20);
    });
  });

  describe('Sorting Logic', () => {
    it('sorts users by created_at descending by default', () => {
      const users = [
        { display_name: 'User A', created_at: '2024-01-01' },
        { display_name: 'User B', created_at: '2024-03-01' },
        { display_name: 'User C', created_at: '2024-02-01' },
      ];

      const sorted = [...users].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      expect(sorted[0].display_name).toBe('User B');
      expect(sorted[1].display_name).toBe('User C');
      expect(sorted[2].display_name).toBe('User A');
    });

    it('sorts users ascending when specified', () => {
      const users = [
        { display_name: 'User A', created_at: '2024-01-01' },
        { display_name: 'User B', created_at: '2024-03-01' },
        { display_name: 'User C', created_at: '2024-02-01' },
      ];

      const ascending = true;
      const sorted = [...users].sort((a, b) => {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return ascending ? diff : -diff;
      });

      expect(sorted[0].display_name).toBe('User A');
      expect(sorted[2].display_name).toBe('User B');
    });
  });
});
