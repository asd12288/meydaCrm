import { getImportActivityData } from '../lib/actions';
import { ImportActivityTable } from '../components/import-activity-table';

/**
 * Async server component that fetches import activity independently
 * Wrapped in Suspense for streaming
 */
export async function ImportActivitySection() {
  const imports = await getImportActivityData();

  return <ImportActivityTable imports={imports} />;
}
