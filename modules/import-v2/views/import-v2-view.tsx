/**
 * Import V2 View
 *
 * Main view component for the import-v2 page
 */

'use client';

import { ImportWizardV2 } from '../components';
import type { SalesUser } from '@/modules/leads/types';

interface ImportV2ViewProps {
  salesUsers: SalesUser[];
}

export function ImportV2View({ salesUsers }: ImportV2ViewProps) {
  return <ImportWizardV2 salesUsers={salesUsers} />;
}
