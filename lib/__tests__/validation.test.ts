import { describe, it, expect } from 'vitest';
import {
  extractValidationError,
  validateWithSchema,
  passwordSchema,
  displayNameSchema,
  emailSchema,
  roleEnum,
  usernameSchema,
  changePasswordSchema,
  resetPasswordSchema,
  createUserSchema,
  editUserSchema,
  updateProfileSchema,
  createPasswordConfirmRefine,
} from '../validation';
import { z } from 'zod';

describe('extractValidationError', () => {
  it('returns empty string for successful validation', () => {
    const result = { success: true as const, data: 'valid' };
    expect(extractValidationError(result)).toBe('');
  });

  it('returns first error message for failed validation', () => {
    const result = {
      success: false as const,
      error: {
        issues: [
          { message: 'First error' },
          { message: 'Second error' },
        ],
      },
    };
    expect(extractValidationError(result)).toBe('First error');
  });

  it('returns default message when no issues', () => {
    const result = {
      success: false as const,
      error: { issues: [] },
    };
    expect(extractValidationError(result)).toBe('Données invalides');
  });

  it('uses custom default message', () => {
    const result = {
      success: false as const,
      error: { issues: [] },
    };
    expect(extractValidationError(result, 'Custom error')).toBe('Custom error');
  });
});

describe('validateWithSchema', () => {
  const testSchema = z.object({
    name: z.string().min(2),
    age: z.number().min(0),
  });

  it('returns success with data for valid input', () => {
    const result = validateWithSchema(testSchema, { name: 'John', age: 25 });
    expect(result).toEqual({
      success: true,
      data: { name: 'John', age: 25 },
    });
  });

  it('returns error for invalid input', () => {
    const result = validateWithSchema(testSchema, { name: 'J', age: 25 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('passwordSchema', () => {
  it('accepts valid passwords', () => {
    expect(passwordSchema.safeParse('password123').success).toBe(true);
    expect(passwordSchema.safeParse('123456').success).toBe(true);
    expect(passwordSchema.safeParse('a'.repeat(100)).success).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = passwordSchema.safeParse('12345');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('6 caractères');
    }
  });

  it('rejects long passwords', () => {
    const result = passwordSchema.safeParse('a'.repeat(101));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('100 caractères');
    }
  });
});

describe('displayNameSchema', () => {
  it('accepts valid display names', () => {
    expect(displayNameSchema.safeParse('Jo').success).toBe(true);
    expect(displayNameSchema.safeParse('Jean-Pierre Dupont').success).toBe(true);
  });

  it('rejects short names', () => {
    const result = displayNameSchema.safeParse('J');
    expect(result.success).toBe(false);
  });

  it('rejects long names', () => {
    const result = displayNameSchema.safeParse('a'.repeat(101));
    expect(result.success).toBe(false);
  });
});

describe('emailSchema', () => {
  it('accepts valid emails', () => {
    expect(emailSchema.safeParse('test@example.com').success).toBe(true);
  });

  it('accepts empty string (optional field)', () => {
    expect(emailSchema.safeParse('').success).toBe(true);
  });

  it('accepts null (optional field)', () => {
    expect(emailSchema.safeParse(null).success).toBe(true);
  });

  it('rejects invalid emails', () => {
    const result = emailSchema.safeParse('not-an-email');
    expect(result.success).toBe(false);
  });
});

describe('roleEnum', () => {
  it('accepts valid roles', () => {
    expect(roleEnum.safeParse('admin').success).toBe(true);
    expect(roleEnum.safeParse('sales').success).toBe(true);
    expect(roleEnum.safeParse('developer').success).toBe(true);
  });

  it('rejects invalid roles', () => {
    expect(roleEnum.safeParse('superadmin').success).toBe(false);
  });
});

describe('usernameSchema', () => {
  it('accepts valid usernames', () => {
    expect(usernameSchema.safeParse('john').success).toBe(true);
    expect(usernameSchema.safeParse('john_doe').success).toBe(true);
    expect(usernameSchema.safeParse('john.doe').success).toBe(true);
  });

  it('rejects short usernames', () => {
    const result = usernameSchema.safeParse('ab');
    expect(result.success).toBe(false);
  });

  it('rejects usernames with invalid characters', () => {
    const result = usernameSchema.safeParse('john@doe');
    expect(result.success).toBe(false);
  });
});

describe('changePasswordSchema', () => {
  it('accepts valid password change data', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpass',
      newPassword: 'newpass123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid reset data', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = resetPasswordSchema.safeParse({
      newPassword: 'newpass123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });
});

describe('createUserSchema', () => {
  it('accepts valid user creation data', () => {
    const result = createUserSchema.safeParse({
      username: 'johndoe',
      displayName: 'John Doe',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'sales',
    });
    expect(result.success).toBe(true);
  });

  it('rejects when passwords do not match', () => {
    const result = createUserSchema.safeParse({
      username: 'johndoe',
      displayName: 'John Doe',
      password: 'password123',
      confirmPassword: 'different',
      role: 'sales',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid role', () => {
    const result = createUserSchema.safeParse({
      username: 'johndoe',
      displayName: 'John Doe',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'superadmin',
    });
    expect(result.success).toBe(false);
  });
});

describe('editUserSchema', () => {
  it('accepts valid edit data', () => {
    const result = editUserSchema.safeParse({
      displayName: 'Jane Doe',
      role: 'admin',
    });
    expect(result.success).toBe(true);
  });
});

describe('updateProfileSchema', () => {
  it('accepts valid profile data', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'New Name',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short name', () => {
    const result = updateProfileSchema.safeParse({
      displayName: 'X',
    });
    expect(result.success).toBe(false);
  });
});

describe('createPasswordConfirmRefine', () => {
  it('creates a validator that checks matching passwords', () => {
    const refine = createPasswordConfirmRefine('password', 'confirm');
    expect(refine.validator({ password: 'abc123', confirm: 'abc123' })).toBe(true);
    expect(refine.validator({ password: 'abc123', confirm: 'different' })).toBe(false);
  });

  it('has French error message', () => {
    const refine = createPasswordConfirmRefine();
    expect(refine.message).toContain('ne correspondent pas');
  });
});
