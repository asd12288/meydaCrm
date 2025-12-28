import { Page, expect } from '@playwright/test'
import * as path from 'path'

/**
 * Test data files mapping
 * Located in test-data/import/
 */
export const TEST_FILES = {
  // Happy path files
  HAPPY_PATH: '01_happy_path.csv',
  SINGLE_ROW: '21_single_row.csv',
  LARGE_BATCH: '22_large_batch_100.csv',
  ALL_FIELDS: '20_all_fields_complete.csv',

  // Error case files
  EMPTY_FILE: '02_empty_file.csv',
  HEADERS_ONLY: '03_headers_only.csv',

  // Validation testing
  MIXED_VALID_INVALID: '11_mixed_valid_invalid.csv',
  MISSING_CONTACT: '04_missing_contact_fields.csv',
  INVALID_EMAILS: '05_invalid_emails.csv',

  // Column mapping
  FRENCH_COLUMNS: '12_french_column_names.csv',
  ENGLISH_COLUMNS: '13_english_column_names.csv',
  UNKNOWN_COLUMNS: '24_unknown_columns.csv',

  // Delimiter variations
  SEMICOLON: '25_semicolon_delimiter.csv',
  TAB_DELIMITER: '26_tab_delimiter.csv',

  // Special cases
  SPECIAL_CHARS: '09_special_characters.csv',
  WHITESPACE: '10_whitespace_issues.csv',
  PHONE_FORMATS: '07_phone_formats.csv',
} as const

/**
 * Get absolute path to a test file
 */
export function getTestFilePath(fileName: string): string {
  return path.resolve(process.cwd(), 'test-data', 'import', fileName)
}

/**
 * CRITICAL: Verify we're running against local Supabase
 * This MUST be called at the start of each test describe block
 */
export function ensureLocalSupabase(): void {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL not set - cannot verify environment safety')
  }

  const isLocal =
    supabaseUrl.includes('127.0.0.1') ||
    supabaseUrl.includes('localhost') ||
    supabaseUrl.includes(':54321')

  if (!isLocal) {
    throw new Error(
      `SAFETY CHECK FAILED: Tests must only run against local Supabase.\n` +
        `Current SUPABASE_URL: ${supabaseUrl}\n` +
        `Expected: http://127.0.0.1:54321 or localhost:54321`
    )
  }
}

/**
 * Navigate to import page and verify access
 */
export async function navigateToImport(page: Page): Promise<void> {
  await page.goto('/import')
  // Wait for page to load
  await expect(page.locator('body')).toBeVisible()
}

/**
 * Upload a file to the import wizard
 * Uses setInputFiles for reliable file upload
 */
export async function uploadFile(page: Page, fileName: string): Promise<void> {
  const filePath = getTestFilePath(fileName)

  // Find the hidden file input
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(filePath)
}

/**
 * Wait for file to be processed (shows file info in upload step)
 */
export async function waitForFileProcessed(page: Page): Promise<void> {
  // Wait for file info display (row count or file name badge)
  await expect(page.getByText(/lignes|colonnes/)).toBeVisible({ timeout: 30000 })
}

/**
 * Wait for auto-advance to mapping step after file upload
 */
export async function waitForMappingStep(page: Page): Promise<void> {
  // The wizard auto-advances after ~500ms when file is ready
  await expect(page.getByText('Associer les colonnes')).toBeVisible({ timeout: 15000 })
}

/**
 * Click Next/Continue button
 * Handles both "Continuer" and step-specific labels
 */
export async function clickNextButton(page: Page): Promise<void> {
  const nextButton = page.getByRole('button', { name: /Continuer|Lancer l'import/i })
  await expect(nextButton).toBeEnabled({ timeout: 5000 })
  await nextButton.click()
}

/**
 * Click Previous/Back button
 */
export async function clickPreviousButton(page: Page): Promise<void> {
  const prevButton = page.getByRole('button', { name: /Precedent/i })
  await prevButton.click()
}

/**
 * Wait for import to complete (success, failure, or cancellation)
 */
export async function waitForImportComplete(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 60000

  // Wait for terminal state text
  await expect(page.getByText(/Import terminé|Import échoué|Import annulé/i)).toBeVisible({
    timeout,
  })
}

/**
 * Get import result summary from results step
 */
export async function getImportResults(page: Page): Promise<{
  imported: number
  skipped: number
  invalid: number
  success: boolean
}> {
  // Check if import was successful
  const isSuccess = await page.getByText('Import terminé').isVisible()

  // Get stats from the results cards - look for the stat cards
  const statsContainer = page.locator('.grid').filter({ hasText: 'Importés' })

  let imported = 0
  let skipped = 0
  let invalid = 0

  try {
    const importedCard = statsContainer.locator('div').filter({ hasText: 'Importés' }).first()
    const importedText = await importedCard.locator('p.text-xl, .text-xl').textContent()
    imported = parseInt(importedText?.replace(/\s/g, '') || '0', 10)
  } catch {
    // Card may not exist
  }

  try {
    const skippedCard = statsContainer.locator('div').filter({ hasText: 'Ignorés' }).first()
    const skippedText = await skippedCard.locator('p.text-xl, .text-xl').textContent()
    skipped = parseInt(skippedText?.replace(/\s/g, '') || '0', 10)
  } catch {
    // Card may not exist
  }

  try {
    const invalidCard = statsContainer.locator('div').filter({ hasText: 'Invalides' }).first()
    const invalidText = await invalidCard.locator('p.text-xl, .text-xl').textContent()
    invalid = parseInt(invalidText?.replace(/\s/g, '') || '0', 10)
  } catch {
    // Card may not exist
  }

  return { imported, skipped, invalid, success: isSuccess }
}

/**
 * Get validation summary from preview step
 */
export async function getValidationSummary(page: Page): Promise<{
  total: number
  valid: number
  invalid: number
}> {
  let total = 0
  let valid = 0
  let invalid = 0

  try {
    // Look for the summary cards in preview step
    const totalCard = page.locator('div').filter({ hasText: /^Total$/ }).first()
    const totalText = await totalCard.locator('p.text-xl, .text-xl').first().textContent()
    total = parseInt(totalText?.replace(/\s/g, '') || '0', 10)
  } catch {
    // Card may not exist
  }

  try {
    const validCard = page.locator('div').filter({ hasText: /^Valides$/ }).first()
    const validText = await validCard.locator('p.text-xl, .text-xl').first().textContent()
    valid = parseInt(validText?.replace(/\s/g, '') || '0', 10)
  } catch {
    // Card may not exist
  }

  try {
    const invalidCard = page.locator('div').filter({ hasText: /^Invalides$/ }).first()
    const invalidText = await invalidCard.locator('p.text-xl, .text-xl').first().textContent()
    invalid = parseInt(invalidText?.replace(/\s/g, '') || '0', 10)
  } catch {
    // Card may not exist
  }

  return { total, valid, invalid }
}

/**
 * Get mapping status from mapping step
 */
export async function getMappingStatus(page: Page): Promise<{
  mapped: number
  total: number
  isComplete: boolean
}> {
  // Look for "X/Y mappees" badge
  const statusBadge = page.locator('text=/\\d+\\/\\d+ mappées/i')
  const text = (await statusBadge.textContent()) || ''

  const match = text.match(/(\d+)\/(\d+)/)
  if (match) {
    const isComplete = await page.getByRole('button', { name: /Continuer/ }).isEnabled()
    return {
      mapped: parseInt(match[1], 10),
      total: parseInt(match[2], 10),
      isComplete,
    }
  }

  return { mapped: 0, total: 0, isComplete: false }
}

/**
 * Select assignment option in options step
 */
export async function selectAssignmentOption(
  page: Page,
  option: 'none' | 'round_robin' | 'by_column'
): Promise<void> {
  const labels = {
    none: 'Ne pas assigner',
    round_robin: 'Repartir',
    by_column: 'Par colonne',
  }

  const button = page.locator('button, [role="button"]').filter({ hasText: labels[option] })
  await button.click()
}

/**
 * Select duplicate handling option in options step
 */
export async function selectDuplicateOption(
  page: Page,
  option: 'skip' | 'update' | 'create'
): Promise<void> {
  const labels = {
    skip: 'Ignorer',
    update: 'Mettre a jour',
    create: 'Creer',
  }

  const button = page.locator('button, [role="button"]').filter({ hasText: labels[option] })
  await button.click()
}

/**
 * Click "View leads" button after successful import
 */
export async function clickViewLeads(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Voir les leads/i }).click()
  await page.waitForURL(/leads/)
}

/**
 * Click "New import" button to start fresh
 */
export async function clickNewImport(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Nouvel import/i }).click()
}

/**
 * Cancel an in-progress import
 */
export async function cancelImport(page: Page): Promise<void> {
  const cancelButton = page.getByRole('button', { name: /Annuler l'import/i })
  if (await cancelButton.isVisible()) {
    await cancelButton.click()
    // Wait for cancellation confirmation
    await expect(page.getByText(/annulé/i)).toBeVisible({ timeout: 10000 })
  }
}

/**
 * Run a complete import flow (helper for full flow tests)
 */
export async function runFullImport(
  page: Page,
  fileName: string,
  options: {
    assignment?: 'none' | 'round_robin' | 'by_column'
    duplicates?: 'skip' | 'update' | 'create'
  } = {}
): Promise<{ success: boolean; imported: number }> {
  // Upload
  await uploadFile(page, fileName)
  await waitForFileProcessed(page)
  await waitForMappingStep(page)

  // Mapping - continue with auto-detected mapping
  await clickNextButton(page)

  // Wait for options step
  await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })

  // Set options if specified
  if (options.assignment) {
    await selectAssignmentOption(page, options.assignment)
  }
  if (options.duplicates) {
    await selectDuplicateOption(page, options.duplicates)
  }

  // Continue to preview
  await clickNextButton(page)
  await expect(page.getByText("Apercu de l'import")).toBeVisible({ timeout: 10000 })

  // Start import
  await clickNextButton(page)

  // Wait for completion
  await waitForImportComplete(page)

  // Get results
  const results = await getImportResults(page)
  return {
    success: results.success,
    imported: results.imported,
  }
}
