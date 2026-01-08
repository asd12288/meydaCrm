import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStoredAccounts,
  addStoredAccount,
  removeStoredAccount,
  updateStoredAccountTokens,
  updateStoredAccountProfile,
  getStoredAccount,
  isMaxAccountsReached,
  getMaxAccounts,
  clearStoredAccounts,
} from '../storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Helper to create a mock account
function createMockAccount(id: string, name: string, role = 'sales') {
  return {
    userId: id,
    displayName: name,
    role,
    avatar: null,
    accessToken: `access-token-${id}`,
    refreshToken: `refresh-token-${id}`,
  };
}

describe('account-switcher/storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getStoredAccounts', () => {
    it('returns empty array when no accounts stored', () => {
      const accounts = getStoredAccounts();
      expect(accounts).toEqual([]);
    });

    it('returns stored accounts', () => {
      const mockAccounts = [
        { ...createMockAccount('1', 'User 1'), addedAt: Date.now() },
      ];
      localStorageMock.setItem('crm-accounts', JSON.stringify(mockAccounts));

      const accounts = getStoredAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].displayName).toBe('User 1');
    });

    it('handles corrupted JSON gracefully', () => {
      localStorageMock.setItem('crm-accounts', 'not-valid-json');
      const accounts = getStoredAccounts();
      expect(accounts).toEqual([]);
    });

    it('handles non-array data gracefully', () => {
      localStorageMock.setItem('crm-accounts', '"string"');
      const accounts = getStoredAccounts();
      expect(accounts).toEqual([]);
    });
  });

  describe('addStoredAccount', () => {
    it('adds a new account successfully', () => {
      const account = createMockAccount('1', 'Test User');
      const result = addStoredAccount(account);

      expect(result).toBe(true);
      const stored = getStoredAccounts();
      expect(stored).toHaveLength(1);
      expect(stored[0].displayName).toBe('Test User');
      expect(stored[0].addedAt).toBeDefined();
    });

    it('updates tokens if account already exists', () => {
      // Add initial account
      addStoredAccount(createMockAccount('1', 'Test User'));

      // Try to add same user with different tokens
      const updatedAccount = {
        ...createMockAccount('1', 'Test User Updated'),
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      const result = addStoredAccount(updatedAccount);

      expect(result).toBe(true);
      const stored = getStoredAccounts();
      expect(stored).toHaveLength(1); // Still only one account
      expect(stored[0].accessToken).toBe('new-access-token');
    });

    it('respects max accounts limit (5)', () => {
      // Add 5 accounts
      for (let i = 1; i <= 5; i++) {
        addStoredAccount(createMockAccount(`user-${i}`, `User ${i}`));
      }

      expect(getStoredAccounts()).toHaveLength(5);

      // Try to add 6th account
      const result = addStoredAccount(createMockAccount('user-6', 'User 6'));
      expect(result).toBe(false);
      expect(getStoredAccounts()).toHaveLength(5);
    });

    it('adds multiple unique accounts', () => {
      addStoredAccount(createMockAccount('1', 'Admin', 'admin'));
      addStoredAccount(createMockAccount('2', 'Marie', 'sales'));
      addStoredAccount(createMockAccount('3', 'Jean', 'sales'));

      const stored = getStoredAccounts();
      expect(stored).toHaveLength(3);
    });
  });

  describe('removeStoredAccount', () => {
    it('removes an existing account', () => {
      addStoredAccount(createMockAccount('1', 'User 1'));
      addStoredAccount(createMockAccount('2', 'User 2'));

      removeStoredAccount('1');

      const stored = getStoredAccounts();
      expect(stored).toHaveLength(1);
      expect(stored[0].userId).toBe('2');
    });

    it('does nothing if account does not exist', () => {
      addStoredAccount(createMockAccount('1', 'User 1'));

      removeStoredAccount('non-existent');

      expect(getStoredAccounts()).toHaveLength(1);
    });
  });

  describe('updateStoredAccountTokens', () => {
    it('updates tokens for existing account', () => {
      addStoredAccount(createMockAccount('1', 'User 1'));

      updateStoredAccountTokens('1', 'new-access', 'new-refresh');

      const stored = getStoredAccounts();
      expect(stored[0].accessToken).toBe('new-access');
      expect(stored[0].refreshToken).toBe('new-refresh');
    });

    it('does nothing if account does not exist', () => {
      addStoredAccount(createMockAccount('1', 'User 1'));

      updateStoredAccountTokens('non-existent', 'new-access', 'new-refresh');

      const stored = getStoredAccounts();
      expect(stored[0].accessToken).toBe('access-token-1');
    });
  });

  describe('updateStoredAccountProfile', () => {
    it('updates displayName', () => {
      addStoredAccount(createMockAccount('1', 'Old Name'));

      updateStoredAccountProfile('1', { displayName: 'New Name' });

      const stored = getStoredAccounts();
      expect(stored[0].displayName).toBe('New Name');
    });

    it('updates avatar', () => {
      addStoredAccount(createMockAccount('1', 'User 1'));

      updateStoredAccountProfile('1', { avatar: 'avatar-123' });

      const stored = getStoredAccounts();
      expect(stored[0].avatar).toBe('avatar-123');
    });

    it('updates role', () => {
      addStoredAccount(createMockAccount('1', 'User 1', 'sales'));

      updateStoredAccountProfile('1', { role: 'admin' });

      const stored = getStoredAccounts();
      expect(stored[0].role).toBe('admin');
    });

    it('can update multiple fields at once', () => {
      addStoredAccount(createMockAccount('1', 'Old Name', 'sales'));

      updateStoredAccountProfile('1', {
        displayName: 'New Name',
        role: 'admin',
        avatar: 'new-avatar',
      });

      const stored = getStoredAccounts();
      expect(stored[0].displayName).toBe('New Name');
      expect(stored[0].role).toBe('admin');
      expect(stored[0].avatar).toBe('new-avatar');
    });
  });

  describe('getStoredAccount', () => {
    it('returns account if found', () => {
      addStoredAccount(createMockAccount('1', 'Test User'));

      const account = getStoredAccount('1');
      expect(account).not.toBeNull();
      expect(account?.displayName).toBe('Test User');
    });

    it('returns null if not found', () => {
      const account = getStoredAccount('non-existent');
      expect(account).toBeNull();
    });
  });

  describe('isMaxAccountsReached', () => {
    it('returns false when under limit', () => {
      addStoredAccount(createMockAccount('1', 'User 1'));
      expect(isMaxAccountsReached()).toBe(false);
    });

    it('returns true when at limit', () => {
      for (let i = 1; i <= 5; i++) {
        addStoredAccount(createMockAccount(`user-${i}`, `User ${i}`));
      }
      expect(isMaxAccountsReached()).toBe(true);
    });
  });

  describe('getMaxAccounts', () => {
    it('returns 5', () => {
      expect(getMaxAccounts()).toBe(5);
    });
  });

  describe('clearStoredAccounts', () => {
    it('removes all accounts', () => {
      addStoredAccount(createMockAccount('1', 'User 1'));
      addStoredAccount(createMockAccount('2', 'User 2'));

      clearStoredAccounts();

      expect(getStoredAccounts()).toEqual([]);
    });
  });

  describe('data integrity', () => {
    it('preserves all account fields', () => {
      const account = {
        userId: 'test-id',
        displayName: 'Test User',
        role: 'admin',
        avatar: 'avatar-123',
        accessToken: 'my-access-token',
        refreshToken: 'my-refresh-token',
      };

      addStoredAccount(account);

      const stored = getStoredAccounts()[0];
      expect(stored.userId).toBe('test-id');
      expect(stored.displayName).toBe('Test User');
      expect(stored.role).toBe('admin');
      expect(stored.avatar).toBe('avatar-123');
      expect(stored.accessToken).toBe('my-access-token');
      expect(stored.refreshToken).toBe('my-refresh-token');
      expect(typeof stored.addedAt).toBe('number');
    });

    it('maintains order after operations', () => {
      addStoredAccount(createMockAccount('1', 'First'));
      addStoredAccount(createMockAccount('2', 'Second'));
      addStoredAccount(createMockAccount('3', 'Third'));

      removeStoredAccount('2');
      addStoredAccount(createMockAccount('4', 'Fourth'));

      const stored = getStoredAccounts();
      expect(stored.map((a) => a.displayName)).toEqual([
        'First',
        'Third',
        'Fourth',
      ]);
    });
  });
});
