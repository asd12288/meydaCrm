'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/modules/shared';
import { FR_MESSAGES } from '@/lib/errors';
import { analytics } from '@/lib/analytics';
import type { StoredAccount, AccountSwitcherContextValue } from './types';
import {
  getStoredAccounts,
  addStoredAccount,
  removeStoredAccount,
  updateStoredAccountTokens,
  isMaxAccountsReached as checkMaxAccounts,
} from './storage';

const AccountSwitcherContext = createContext<AccountSwitcherContextValue | undefined>(undefined);

interface AccountSwitcherProviderProps {
  children: ReactNode;
  currentUserId: string;
  currentUserProfile: {
    displayName: string;
    role: string;
    avatar: string | null;
  };
}

export function AccountSwitcherProvider({
  children,
  currentUserId,
  currentUserProfile,
}: AccountSwitcherProviderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<StoredAccount[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchingToUserId, setSwitchingToUserId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load accounts from localStorage on mount and ensure current user is stored
  useEffect(() => {
    const loadAccounts = async () => {
      // Get stored accounts
      let stored = getStoredAccounts();

      // Check if current user is already in the list
      const currentUserStored = stored.find((a) => a.userId === currentUserId);

      if (!currentUserStored) {
        // Get current session tokens to store
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          const newAccount: Omit<StoredAccount, 'addedAt'> = {
            userId: currentUserId,
            displayName: currentUserProfile.displayName,
            role: currentUserProfile.role,
            avatar: currentUserProfile.avatar,
            accessToken: sessionData.session.access_token,
            refreshToken: sessionData.session.refresh_token,
          };
          addStoredAccount(newAccount);
          stored = getStoredAccounts();
        }
      } else {
        // Update profile info if changed
        if (
          currentUserStored.displayName !== currentUserProfile.displayName ||
          currentUserStored.role !== currentUserProfile.role ||
          currentUserStored.avatar !== currentUserProfile.avatar
        ) {
          // We could update profile here, but let's keep it simple
        }
      }

      setAccounts(stored);
      setMounted(true);
    };

    loadAccounts();
  }, [currentUserId, currentUserProfile, supabase.auth]);

  // Listen for token refresh to update stored tokens
  useEffect(() => {
    if (!mounted) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session) {
          // Update tokens for current user
          updateStoredAccountTokens(
            currentUserId,
            session.access_token,
            session.refresh_token
          );
          // Also update local state
          setAccounts((prev) =>
            prev.map((a) =>
              a.userId === currentUserId
                ? {
                    ...a,
                    accessToken: session.access_token,
                    refreshToken: session.refresh_token,
                  }
                : a
            )
          );
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted, currentUserId, supabase.auth]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'crm-accounts') {
        setAccounts(getStoredAccounts());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [mounted]);

  // Switch to a different account
  const switchAccount = useCallback(
    async (userId: string) => {
      if (userId === currentUserId) return;

      const account = accounts.find((a) => a.userId === userId);
      if (!account) {
        return;
      }

      setIsSwitching(true);
      setSwitchingToUserId(userId);

      // Track switch started
      analytics.accountSwitchStarted({
        toUserId: userId,
        toDisplayName: account.displayName,
      });

      try {
        // Set the session using stored tokens
        const { error } = await supabase.auth.setSession({
          access_token: account.accessToken,
          refresh_token: account.refreshToken,
        });

        if (error) {
          // Token likely expired - remove the invalid account from storage
          analytics.accountSwitchFailed({
            toUserId: userId,
            toDisplayName: account.displayName,
            error: error.message,
            reason: 'session_expired',
          });
          analytics.accountRemoved({ reason: 'session_expired' });

          removeStoredAccount(userId);
          setAccounts((prev) => prev.filter((a) => a.userId !== userId));
          toast.error(FR_MESSAGES.SESSION_EXPIRED_FOR_USER(account.displayName));
          setIsSwitching(false);
          setSwitchingToUserId(null);
          return;
        }

        // Track success before reload
        analytics.accountSwitchSuccess({
          toUserId: userId,
          toDisplayName: account.displayName,
        });

        // Success - refresh the page to get new user data
        router.refresh();

        // Force a hard refresh to ensure all server components reload
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } catch (err) {
        // Track failure
        analytics.accountSwitchFailed({
          toUserId: userId,
          toDisplayName: account.displayName,
          error: err instanceof Error ? err.message : 'Unknown error',
          reason: 'unknown',
        });

        // Reset state on any error
        setIsSwitching(false);
        setSwitchingToUserId(null);
        toast.error(FR_MESSAGES.ERROR_ACCOUNT_SWITCH);
      }
    },
    [currentUserId, accounts, supabase.auth, router, toast]
  );

  // Add a new account
  const addAccount = useCallback(
    (account: Omit<StoredAccount, 'addedAt'>) => {
      if (checkMaxAccounts()) {
        return;
      }

      const success = addStoredAccount(account);
      if (success) {
        const updatedAccounts = getStoredAccounts();
        setAccounts(updatedAccounts);

        // Track account added
        analytics.accountAdded({
          role: account.role,
          totalAccounts: updatedAccounts.length,
        });
      }
    },
    []
  );

  // Remove an account from storage
  const removeAccount = useCallback(
    (userId: string) => {
      if (userId === currentUserId) {
        return;
      }

      removeStoredAccount(userId);
      setAccounts((prev) => prev.filter((a) => a.userId !== userId));

      // Track manual account removal
      analytics.accountRemoved({ reason: 'manual' });
    },
    [currentUserId]
  );

  // Update tokens for an account
  const updateTokens = useCallback(
    (userId: string, accessToken: string, refreshToken: string) => {
      updateStoredAccountTokens(userId, accessToken, refreshToken);
      setAccounts((prev) =>
        prev.map((a) =>
          a.userId === userId ? { ...a, accessToken, refreshToken } : a
        )
      );
    },
    []
  );

  // Modal controls
  const openAddModal = useCallback(() => {
    if (checkMaxAccounts()) {
      return;
    }
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const value: AccountSwitcherContextValue = {
    accounts,
    currentUserId,
    isSwitching,
    switchingToUserId,
    switchAccount,
    addAccount,
    removeAccount,
    updateTokens,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    isMaxAccountsReached: checkMaxAccounts(),
  };

  return (
    <AccountSwitcherContext.Provider value={value}>
      {children}
    </AccountSwitcherContext.Provider>
  );
}

export function useAccountSwitcher(): AccountSwitcherContextValue {
  const context = useContext(AccountSwitcherContext);
  if (!context) {
    throw new Error(
      'useAccountSwitcher must be used within an AccountSwitcherProvider'
    );
  }
  return context;
}
