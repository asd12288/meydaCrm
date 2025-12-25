import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getErrorMessage,
  logSupabaseError,
  logActionError,
  actionSuccess,
  actionError,
  FR_MESSAGES,
} from '../errors';

describe('getErrorMessage', () => {
  it('extracts message from Error instance', () => {
    const error = new Error('Something went wrong');
    expect(getErrorMessage(error)).toBe('Something went wrong');
  });

  it('returns string error as-is', () => {
    expect(getErrorMessage('Direct error message')).toBe('Direct error message');
  });

  it('returns default message for null', () => {
    expect(getErrorMessage(null)).toBe('Erreur inconnue');
  });

  it('returns default message for undefined', () => {
    expect(getErrorMessage(undefined)).toBe('Erreur inconnue');
  });

  it('returns default message for objects', () => {
    expect(getErrorMessage({ code: 'ERR001' })).toBe('Erreur inconnue');
  });
});

describe('logSupabaseError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs error with Supabase prefix', () => {
    const error = new Error('Connection failed');
    logSupabaseError('fetchLeads', error);
    expect(consoleSpy).toHaveBeenCalledWith('[Supabase] fetchLeads:', error);
  });
});

describe('logActionError', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs error with Action prefix', () => {
    logActionError('createUser', new Error('Validation failed'));
    expect(consoleSpy).toHaveBeenCalledWith('[Action: createUser] Validation failed');
  });
});

describe('actionSuccess', () => {
  it('returns success without data', () => {
    expect(actionSuccess()).toEqual({ success: true });
  });

  it('returns success with data', () => {
    expect(actionSuccess({ id: '123' })).toEqual({ success: true, data: { id: '123' } });
  });
});

describe('actionError', () => {
  it('returns error with message', () => {
    expect(actionError('Something went wrong')).toEqual({
      success: false,
      error: 'Something went wrong',
    });
  });
});

describe('FR_MESSAGES', () => {
  it('contains French authentication messages', () => {
    expect(FR_MESSAGES.UNAUTHENTICATED).toBe('Non authentifié');
    expect(FR_MESSAGES.UNAUTHORIZED).toBe("Vous n'avez pas accès à cette ressource");
  });

  it('contains French error messages', () => {
    expect(FR_MESSAGES.LEAD_NOT_FOUND).toBe('Lead non trouvé');
    expect(FR_MESSAGES.ERROR_TRANSFER).toBe('Erreur lors du transfert du lead');
  });

  it('contains French success messages', () => {
    expect(FR_MESSAGES.SUCCESS_UPDATE).toBe('Modifications enregistrées');
  });
});
