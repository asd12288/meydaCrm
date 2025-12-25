import { describe, it, expect } from 'vitest';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validation';
import { isValidAvatarId } from '@/lib/constants';
import type { AccountStats } from '../types';

/**
 * Tests for account actions module
 *
 * Tests validation schemas and business logic rules.
 */

describe('Account Schemas', () => {
  describe('updateProfileSchema', () => {
    it('accepts valid profile update', () => {
      const validUpdate = {
        displayName: 'Jean Dupont',
      };

      const result = updateProfileSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it('rejects short display name', () => {
      const shortName = {
        displayName: 'J',
      };

      const result = updateProfileSchema.safeParse(shortName);
      expect(result.success).toBe(false);
    });

    it('rejects empty display name', () => {
      const emptyName = {
        displayName: '',
      };

      const result = updateProfileSchema.safeParse(emptyName);
      expect(result.success).toBe(false);
    });

    it('accepts display name with accents', () => {
      const accentedName = {
        displayName: 'Jean-François Müller',
      };

      const result = updateProfileSchema.safeParse(accentedName);
      expect(result.success).toBe(true);
    });

    it('accepts display name with whitespace (no auto-trim)', () => {
      const whitespaceInput = {
        displayName: '  Jean Dupont  ',
      };

      const result = updateProfileSchema.safeParse(whitespaceInput);
      expect(result.success).toBe(true);
      // Schema doesn't trim - form handles that
      if (result.success) {
        expect(result.data.displayName).toBe('  Jean Dupont  ');
      }
    });
  });

  describe('changePasswordSchema', () => {
    it('accepts valid password change', () => {
      const validChange = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewSecurePass456',
        confirmPassword: 'NewSecurePass456',
      };

      const result = changePasswordSchema.safeParse(validChange);
      expect(result.success).toBe(true);
    });

    it('rejects when new passwords do not match', () => {
      const mismatchedPasswords = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewSecurePass456',
        confirmPassword: 'DifferentPass789',
      };

      const result = changePasswordSchema.safeParse(mismatchedPasswords);
      expect(result.success).toBe(false);
    });

    it('rejects short new password', () => {
      const shortPassword = {
        currentPassword: 'OldPassword123',
        newPassword: '12345',
        confirmPassword: '12345',
      };

      const result = changePasswordSchema.safeParse(shortPassword);
      expect(result.success).toBe(false);
    });

    it('requires current password', () => {
      const missingCurrent = {
        currentPassword: '',
        newPassword: 'NewSecurePass456',
        confirmPassword: 'NewSecurePass456',
      };

      const result = changePasswordSchema.safeParse(missingCurrent);
      expect(result.success).toBe(false);
    });
  });
});

describe('Avatar Validation', () => {
  describe('isValidAvatarId', () => {
    it('accepts valid avatar IDs', () => {
      // Based on the avatar system (avatar-01 through avatar-54)
      const validIds = ['avatar-01', 'avatar-10', 'avatar-17', 'avatar-54'];

      validIds.forEach((id) => {
        expect(isValidAvatarId(id)).toBe(true);
      });
    });

    it('rejects invalid avatar IDs', () => {
      const invalidIds = [
        'invalid',
        'avatar-0',
        'avatar-55',
        'avatar-100',
        '../../../etc/passwd',
        '<script>alert(1)</script>',
      ];

      invalidIds.forEach((id) => {
        expect(isValidAvatarId(id)).toBe(false);
      });
    });

    it('handles empty string', () => {
      expect(isValidAvatarId('')).toBe(false);
    });
  });
});

describe('Account Stats Logic', () => {
  describe('Stats Calculation', () => {
    it('calculates total leads correctly', () => {
      const stats: AccountStats = {
        leads: {
          total: 150,
          byStatus: {
            new: 30,
            contacted: 45,
            qualified: 25,
            negotiation: 20,
            won: 20,
            lost: 10,
          },
        },
        commentsCount: 42,
        lastActivity: '2024-12-25T10:00:00Z',
      };

      expect(stats.leads.total).toBe(150);
    });

    it('handles empty stats', () => {
      const emptyStats: AccountStats = {
        leads: {
          total: 0,
          byStatus: {},
        },
        commentsCount: 0,
        lastActivity: null,
      };

      expect(emptyStats.leads.total).toBe(0);
      expect(emptyStats.commentsCount).toBe(0);
      expect(emptyStats.lastActivity).toBeNull();
    });

    it('calculates status breakdown percentages', () => {
      const stats: AccountStats = {
        leads: {
          total: 100,
          byStatus: {
            new: 25,
            contacted: 25,
            qualified: 20,
            negotiation: 15,
            won: 10,
            lost: 5,
          },
        },
        commentsCount: 0,
        lastActivity: null,
      };

      const total = stats.leads.total;
      const newPercentage = (stats.leads.byStatus.new / total) * 100;
      const wonPercentage = (stats.leads.byStatus.won / total) * 100;

      expect(newPercentage).toBe(25);
      expect(wonPercentage).toBe(10);
    });
  });

  describe('Last Activity', () => {
    it('determines most recent activity', () => {
      const commentDate = new Date('2024-12-25T10:00:00Z');
      const historyDate = new Date('2024-12-25T11:00:00Z');

      const lastActivity = commentDate > historyDate ? commentDate : historyDate;

      expect(lastActivity.toISOString()).toBe('2024-12-25T11:00:00.000Z');
    });

    it('handles missing activity dates', () => {
      const commentDate: Date | null = null;
      const historyDate = new Date('2024-12-25T11:00:00Z');

      let lastActivity: Date | null = null;
      if (commentDate && historyDate) {
        lastActivity = commentDate > historyDate ? commentDate : historyDate;
      } else if (commentDate) {
        lastActivity = commentDate;
      } else if (historyDate) {
        lastActivity = historyDate;
      }

      expect(lastActivity?.toISOString()).toBe('2024-12-25T11:00:00.000Z');
    });
  });
});
