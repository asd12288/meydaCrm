/**
 * Stored account information in localStorage
 */
export interface StoredAccount {
  userId: string;
  displayName: string;
  role: string;
  avatar: string | null;
  accessToken: string;
  refreshToken: string;
  addedAt: number; // timestamp
}

/**
 * Account switcher context value
 */
export interface AccountSwitcherContextValue {
  /** List of stored accounts */
  accounts: StoredAccount[];
  /** Currently active user ID */
  currentUserId: string | null;
  /** Whether currently switching accounts */
  isSwitching: boolean;
  /** Switch to a different account */
  switchAccount: (userId: string) => Promise<void>;
  /** Add a new account to storage */
  addAccount: (account: Omit<StoredAccount, 'addedAt'>) => void;
  /** Remove an account from storage */
  removeAccount: (userId: string) => void;
  /** Update tokens for an account */
  updateTokens: (userId: string, accessToken: string, refreshToken: string) => void;
  /** Whether add account modal is open */
  isAddModalOpen: boolean;
  /** Open the add account modal */
  openAddModal: () => void;
  /** Close the add account modal */
  closeAddModal: () => void;
  /** Whether max accounts limit reached */
  isMaxAccountsReached: boolean;
}
