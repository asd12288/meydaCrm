import { describe, it, expect } from 'vitest';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validation';

describe('updateProfileSchema', () => {
  it('accepts valid display name', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'Jean Dupont' });
    expect(result.success).toBe(true);
  });

  it('accepts display name with accents', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'Élodie Müller-André' });
    expect(result.success).toBe(true);
  });

  it('rejects display name shorter than 2 characters', () => {
    const result = updateProfileSchema.safeParse({ displayName: 'J' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('2 caractères');
    }
  });

  it('rejects display name longer than 100 characters', () => {
    const longName = 'A'.repeat(101);
    const result = updateProfileSchema.safeParse({ displayName: longName });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100 caractères');
    }
  });

  it('rejects empty display name', () => {
    const result = updateProfileSchema.safeParse({ displayName: '' });
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid password change', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      newPassword: 'newpass456',
      confirmPassword: 'newpass456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      newPassword: 'newpass456',
      confirmPassword: 'different789',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('ne correspondent pas');
    }
  });

  it('rejects when current password is empty', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'newpass456',
      confirmPassword: 'newpass456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('requis');
    }
  });

  it('rejects when new password is too short', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      newPassword: '12345',
      confirmPassword: '12345',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('6 caractères');
    }
  });

  it('rejects when new password is too long', () => {
    const longPassword = 'a'.repeat(101);
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      newPassword: longPassword,
      confirmPassword: longPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100 caractères');
    }
  });

  it('rejects when confirm password is empty', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass123',
      newPassword: 'newpass456',
      confirmPassword: '',
    });
    expect(result.success).toBe(false);
  });
});
