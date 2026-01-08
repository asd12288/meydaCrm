import type { StoredAccount } from './types';

const STORAGE_KEY = 'crm-accounts';
const MAX_ACCOUNTS = 5;

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all stored accounts from localStorage
 */
export function getStoredAccounts(): StoredAccount[] {
  if (!isStorageAvailable()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const accounts = JSON.parse(stored) as StoredAccount[];
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

/**
 * Save accounts to localStorage
 */
function saveAccounts(accounts: StoredAccount[]): void {
  if (!isStorageAvailable()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // localStorage not available or quota exceeded
  }
}

/**
 * Add a new account to storage
 * Returns false if max accounts reached or account already exists
 */
export function addStoredAccount(
  account: Omit<StoredAccount, 'addedAt'>
): boolean {
  const accounts = getStoredAccounts();

  // Check if already exists
  if (accounts.some((a) => a.userId === account.userId)) {
    // Update existing account tokens instead
    updateStoredAccountTokens(
      account.userId,
      account.accessToken,
      account.refreshToken
    );
    return true;
  }

  // Check max accounts limit
  if (accounts.length >= MAX_ACCOUNTS) {
    return false;
  }

  const newAccount: StoredAccount = {
    ...account,
    addedAt: Date.now(),
  };

  accounts.push(newAccount);
  saveAccounts(accounts);
  return true;
}

/**
 * Remove an account from storage
 */
export function removeStoredAccount(userId: string): void {
  const accounts = getStoredAccounts();
  const filtered = accounts.filter((a) => a.userId !== userId);
  saveAccounts(filtered);
}

/**
 * Update tokens for an existing account
 */
export function updateStoredAccountTokens(
  userId: string,
  accessToken: string,
  refreshToken: string
): void {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.userId === userId);

  if (index !== -1) {
    accounts[index].accessToken = accessToken;
    accounts[index].refreshToken = refreshToken;
    saveAccounts(accounts);
  }
}

/**
 * Update profile info for an existing account (displayName, avatar, role)
 */
export function updateStoredAccountProfile(
  userId: string,
  updates: Partial<Pick<StoredAccount, 'displayName' | 'avatar' | 'role'>>
): void {
  const accounts = getStoredAccounts();
  const index = accounts.findIndex((a) => a.userId === userId);

  if (index !== -1) {
    if (updates.displayName !== undefined) {
      accounts[index].displayName = updates.displayName;
    }
    if (updates.avatar !== undefined) {
      accounts[index].avatar = updates.avatar;
    }
    if (updates.role !== undefined) {
      accounts[index].role = updates.role;
    }
    saveAccounts(accounts);
  }
}

/**
 * Get a single account by userId
 */
export function getStoredAccount(userId: string): StoredAccount | null {
  const accounts = getStoredAccounts();
  return accounts.find((a) => a.userId === userId) || null;
}

/**
 * Check if max accounts limit is reached
 */
export function isMaxAccountsReached(): boolean {
  return getStoredAccounts().length >= MAX_ACCOUNTS;
}

/**
 * Get max accounts limit
 */
export function getMaxAccounts(): number {
  return MAX_ACCOUNTS;
}

/**
 * Clear all stored accounts
 */
export function clearStoredAccounts(): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
