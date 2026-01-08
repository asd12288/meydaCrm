'use client';

import { IconCheck, IconPlus, IconX } from '@tabler/icons-react';
import { UserAvatar, Button } from '@/modules/shared';
import { useAccountSwitcher } from '@/lib/account-switcher';
import { getRoleLabel } from '@/lib/constants';

/**
 * Account switcher section to be rendered inside the header dropdown
 * Shows connected accounts with ability to switch or remove
 */
export function AccountSwitcherSection() {
  const {
    accounts,
    currentUserId,
    isSwitching,
    switchAccount,
    removeAccount,
    openAddModal,
    isMaxAccountsReached,
  } = useAccountSwitcher();

  // Only show if there's at least one account (current user is always stored)
  if (accounts.length === 0) {
    return null;
  }

  // Sort accounts: current user first, then by added date
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return b.addedAt - a.addedAt;
  });

  return (
    <div className="py-2">
      {/* Account list */}
      <div className="space-y-0.5">
        {sortedAccounts.map((account) => {
          const isCurrent = account.userId === currentUserId;

          return (
            <div
              key={account.userId}
              className={`
                group flex items-center gap-3 px-4 py-2.5
                ${isCurrent ? 'bg-lightprimary/50 dark:bg-primary/10' : 'hover:bg-lightgray dark:hover:bg-darkgray'}
                ${!isCurrent && !isSwitching ? 'cursor-pointer' : ''}
                transition-colors duration-150
              `}
              onClick={() => {
                if (!isCurrent && !isSwitching) {
                  switchAccount(account.userId);
                }
              }}
            >
              {/* Avatar */}
              <UserAvatar
                name={account.displayName}
                avatar={account.avatar}
                size="sm"
              />

              {/* User info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ld truncate">
                  {account.displayName}
                </p>
                <p className="text-xs text-darklink truncate">
                  {getRoleLabel(account.role)}
                </p>
              </div>

              {/* Status indicator or remove button */}
              {isCurrent ? (
                <div className="flex items-center gap-1 text-xs text-primary font-medium">
                  <IconCheck size={14} />
                  <span>Actif</span>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-error/10 text-darklink hover:text-error transition-all duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAccount(account.userId);
                  }}
                  title="Retirer ce compte"
                  disabled={isSwitching}
                >
                  <IconX size={14} />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add account button */}
      <div className="px-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-darklink hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            openAddModal();
          }}
          disabled={isMaxAccountsReached || isSwitching}
        >
          <IconPlus size={16} />
          {isMaxAccountsReached ? 'Limite atteinte (5 max)' : 'Ajouter un compte'}
        </Button>
      </div>
    </div>
  );
}
