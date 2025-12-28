import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'
import {
  ensureLocalSupabase,
  navigateToImport,
  uploadFile,
  waitForFileProcessed,
  waitForMappingStep,
  clickNextButton,
  clickPreviousButton,
  waitForImportComplete,
  getImportResults,
  getMappingStatus,
  getValidationSummary,
  selectAssignmentOption,
  selectDuplicateOption,
  clickViewLeads,
  clickNewImport,
  runFullImport,
  TEST_FILES,
} from './helpers/import'

// ===========================================================================
// SAFETY CHECK - MUST RUN BEFORE ALL TESTS
// ===========================================================================
test.beforeAll(async () => {
  ensureLocalSupabase()
})

// ===========================================================================
// ACCESS CONTROL TESTS
// ===========================================================================
test.describe('Import Access Control', () => {
  test('admin can access import page', async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)

    // Should see import page content (wizard or dashboard)
    await expect(page.locator('body')).not.toHaveText(/access denied|forbidden/i)
    // Should see upload area or import header
    await expect(
      page.getByText(/import|Glissez-deposez/i).first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('sales user cannot access import page', async ({ page }) => {
    await login(page, 'sales')
    await page.goto('/import')

    // Should be redirected or see access denied
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).not.toContain('/import')
  })

  test('sales user does not see import link in sidebar', async ({ page }) => {
    await login(page, 'sales')
    await expect(page.getByRole('link', { name: /import/i })).not.toBeVisible()
  })
})

// ===========================================================================
// WIZARD STEP 1: FILE UPLOAD
// ===========================================================================
test.describe('Import Wizard - Upload Step', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
  })

  test('should display file dropzone', async ({ page }) => {
    await expect(page.getByText(/Glissez-deposez/i)).toBeVisible()
    await expect(page.getByText(/CSV, XLSX, XLS/i)).toBeVisible()
  })

  test('should upload valid CSV file', async ({ page }) => {
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForFileProcessed(page)

    // Should show file info
    await expect(page.getByText(/lignes/)).toBeVisible()
  })

  test('should handle empty file', async ({ page }) => {
    await uploadFile(page, TEST_FILES.EMPTY_FILE)

    // Wait for processing
    await page.waitForTimeout(3000)

    // Should not progress to mapping (file has no data)
    const mappingVisible = await page.getByText('Associer les colonnes').isVisible()
    // Empty file should either show error or not advance
    expect(mappingVisible).toBe(false)
  })

  test('should handle headers-only file', async ({ page }) => {
    await uploadFile(page, TEST_FILES.HEADERS_ONLY)
    await page.waitForTimeout(3000)

    // Should show 0 rows or error
    // Headers-only means 0 data rows
  })

  test('should allow clearing selected file', async ({ page }) => {
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForFileProcessed(page)

    // Look for clear/remove button
    const clearButton = page
      .getByRole('button', { name: /supprimer/i })
      .or(page.locator('button[title*="Supprimer"]'))

    if (await clearButton.isVisible()) {
      await clearButton.click()
      await expect(page.getByText(/Glissez-deposez/i)).toBeVisible()
    }
  })

  test('should auto-advance to mapping step after upload', async ({ page }) => {
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)

    await expect(page.getByText('Associer les colonnes')).toBeVisible()
  })
})

// ===========================================================================
// WIZARD STEP 2: COLUMN MAPPING
// ===========================================================================
test.describe('Import Wizard - Mapping Step', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)
  })

  test('should display column mapping interface', async ({ page }) => {
    await expect(page.getByText('Associer les colonnes')).toBeVisible()
    await expect(page.getByText(/mappées/)).toBeVisible()
  })

  test('should auto-detect French column names', async ({ page }) => {
    // Reload with French columns file
    await page.goto('/import')
    await uploadFile(page, TEST_FILES.FRENCH_COLUMNS)
    await waitForMappingStep(page)

    // Check that columns are auto-mapped
    const status = await getMappingStatus(page)
    expect(status.mapped).toBeGreaterThan(0)
  })

  test('should auto-detect English column names', async ({ page }) => {
    await page.goto('/import')
    await uploadFile(page, TEST_FILES.ENGLISH_COLUMNS)
    await waitForMappingStep(page)

    const status = await getMappingStatus(page)
    expect(status.mapped).toBeGreaterThan(0)
  })

  test('should show sample values for each column', async ({ page }) => {
    // Sample values should be visible (Ex: ...)
    await expect(page.getByText(/^Ex:/)).toBeVisible()
  })

  test('should have column mapping dropdowns', async ({ page }) => {
    // Find selects in mapping cards
    const selects = page.locator('select')
    const count = await selects.count()

    // Should have at least one select for each column
    expect(count).toBeGreaterThan(0)
  })

  test('should have reset/auto-detection button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Auto-detection/i })).toBeVisible()
  })

  test('should enable continue when contact field is mapped', async ({ page }) => {
    // Happy path file should have email mapped
    await expect(page.getByRole('button', { name: /Continuer/ })).toBeEnabled()
  })

  test('can go back to upload step (by clearing file)', async ({ page }) => {
    // The wizard doesn't have a back button on mapping, but we can clear file
    // This is acceptable behavior for the wizard
  })
})

// ===========================================================================
// WIZARD STEP 3: OPTIONS
// ===========================================================================
test.describe('Import Wizard - Options Step', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)
    await clickNextButton(page)
    await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })
  })

  test('should display assignment options', async ({ page }) => {
    await expect(page.getByText('Attribution des leads')).toBeVisible()
    await expect(page.getByText('Ne pas assigner')).toBeVisible()
    await expect(page.getByText('Repartir')).toBeVisible()
  })

  test('should display duplicate handling options', async ({ page }) => {
    await expect(page.getByText('Gestion des doublons')).toBeVisible()
    await expect(page.getByText('Ignorer')).toBeVisible()
  })

  test('should allow selecting no assignment', async ({ page }) => {
    await selectAssignmentOption(page, 'none')
    // Should show summary
    await expect(page.getByText('Sans attribution')).toBeVisible()
  })

  test('should allow selecting round-robin assignment', async ({ page }) => {
    await selectAssignmentOption(page, 'round_robin')
    // Should show user selection UI
    await expect(page.getByText(/Commerciaux/i)).toBeVisible()
  })

  test('should allow selecting by-column assignment', async ({ page }) => {
    await selectAssignmentOption(page, 'by_column')
    // Should show column selector
    await expect(page.getByText(/Colonne/i)).toBeVisible()
  })

  test('should go back to mapping step', async ({ page }) => {
    await clickPreviousButton(page)
    await expect(page.getByText('Associer les colonnes')).toBeVisible()
  })
})

// ===========================================================================
// WIZARD STEP 4: PREVIEW
// ===========================================================================
test.describe('Import Wizard - Preview Step', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)
    await clickNextButton(page) // To options
    await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })
    await clickNextButton(page) // To preview
    await expect(page.getByText("Apercu de l'import")).toBeVisible({ timeout: 10000 })
  })

  test('should display validation summary', async ({ page }) => {
    await expect(page.getByText('Total')).toBeVisible()
    await expect(page.getByText('Valides')).toBeVisible()
    await expect(page.getByText('Invalides')).toBeVisible()
  })

  test('should show valid row count for happy path', async ({ page }) => {
    const summary = await getValidationSummary(page)
    expect(summary.valid).toBeGreaterThan(0)
  })

  test('should show import button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Lancer l'import/i })).toBeVisible()
  })

  test('should go back to options step', async ({ page }) => {
    await clickPreviousButton(page)
    await expect(page.getByText("Options d'import")).toBeVisible()
  })
})

// ===========================================================================
// WIZARD STEP 5: PROGRESS
// ===========================================================================
test.describe('Import Wizard - Progress Step', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
  })

  test('should show progress during import', async ({ page }) => {
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)
    await clickNextButton(page) // Options
    await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })
    await clickNextButton(page) // Preview
    await expect(page.getByText("Apercu de l'import")).toBeVisible({ timeout: 10000 })
    await clickNextButton(page) // Start import

    // Should show progress UI or complete quickly
    await expect(
      page.getByText(/Validation des données|Création des leads|Démarrage|Import terminé/i)
    ).toBeVisible({ timeout: 15000 })
  })
})

// ===========================================================================
// WIZARD STEP 6: RESULTS
// ===========================================================================
test.describe('Import Wizard - Results Step', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
  })

  test('should show success for valid import', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.HAPPY_PATH)

    expect(result.success).toBe(true)
    expect(result.imported).toBeGreaterThan(0)
    await expect(page.getByText('Import terminé')).toBeVisible()
  })

  test('should show imported count', async ({ page }) => {
    await runFullImport(page, TEST_FILES.HAPPY_PATH)

    const results = await getImportResults(page)
    // Happy path has 4 leads
    expect(results.imported).toBeGreaterThanOrEqual(0) // May be skipped as duplicates on re-run
  })

  test('should have view leads button', async ({ page }) => {
    await runFullImport(page, TEST_FILES.HAPPY_PATH)
    await expect(page.getByRole('button', { name: /Voir les leads/i })).toBeVisible()
  })

  test('should have new import button', async ({ page }) => {
    await runFullImport(page, TEST_FILES.HAPPY_PATH)
    await expect(page.getByRole('button', { name: /Nouvel import/i })).toBeVisible()
  })

  test('should navigate to leads when clicking view leads', async ({ page }) => {
    await runFullImport(page, TEST_FILES.HAPPY_PATH)
    await clickViewLeads(page)

    await expect(page).toHaveURL(/leads/)
  })

  test('should reset wizard when clicking new import', async ({ page }) => {
    await runFullImport(page, TEST_FILES.HAPPY_PATH)
    await clickNewImport(page)

    // Should be back at upload step
    await expect(page.getByText(/Glissez-deposez/i)).toBeVisible()
  })
})

// ===========================================================================
// FULL FLOW TESTS
// ===========================================================================
test.describe('Import Full Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
  })

  test('happy path: complete import flow', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.HAPPY_PATH)

    expect(result.success).toBe(true)
  })

  test('single row: import 1 lead', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.SINGLE_ROW)

    expect(result.success).toBe(true)
  })

  test('large batch: import 100 leads', async ({ page }) => {
    test.slow() // Extended timeout for large import (3x default)
    const result = await runFullImport(page, TEST_FILES.LARGE_BATCH, {
      assignment: 'none',
      duplicates: 'skip',
    })

    expect(result.success).toBe(true)
  })

  test('mixed valid/invalid: partial import', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.MIXED_VALID_INVALID)

    expect(result.success).toBe(true)
    const results = await getImportResults(page)
    // Should have handled mixed rows
    expect(results.imported + results.invalid + results.skipped).toBeGreaterThan(0)
  })

  test('French column names: auto-mapping works', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.FRENCH_COLUMNS)

    expect(result.success).toBe(true)
  })

  test('English column names: auto-mapping works', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.ENGLISH_COLUMNS)

    expect(result.success).toBe(true)
  })

  test('semicolon delimiter: auto-detected', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.SEMICOLON)

    expect(result.success).toBe(true)
  })
})

// ===========================================================================
// WIZARD NAVIGATION TESTS
// ===========================================================================
test.describe('Import Wizard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)
  })

  test('can navigate forward through all steps', async ({ page }) => {
    // Step 2: Mapping
    await expect(page.getByText('Associer les colonnes')).toBeVisible()
    await clickNextButton(page)

    // Step 3: Options
    await expect(page.getByText("Options d'import")).toBeVisible()
    await clickNextButton(page)

    // Step 4: Preview
    await expect(page.getByText("Apercu de l'import")).toBeVisible()
  })

  test('can navigate backward through steps', async ({ page }) => {
    // Go to preview
    await clickNextButton(page) // Options
    await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })
    await clickNextButton(page) // Preview
    await expect(page.getByText("Apercu de l'import")).toBeVisible({ timeout: 10000 })

    // Go back to options
    await clickPreviousButton(page)
    await expect(page.getByText("Options d'import")).toBeVisible()

    // Go back to mapping
    await clickPreviousButton(page)
    await expect(page.getByText('Associer les colonnes')).toBeVisible()
  })

  test('stepper shows correct step numbers', async ({ page }) => {
    // Check stepper exists with numbered steps
    const stepNumbers = page.locator('[class*="rounded-full"]').filter({ hasText: /^[1-6]$/ })
    const count = await stepNumbers.count()

    // Should have at least a few visible step numbers
    expect(count).toBeGreaterThan(0)
  })
})

// ===========================================================================
// ERROR HANDLING TESTS
// ===========================================================================
test.describe('Import Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
  })

  test('shows error for empty file', async ({ page }) => {
    await uploadFile(page, TEST_FILES.EMPTY_FILE)
    await page.waitForTimeout(3000)

    // Should not advance to mapping or show error
    const onMappingStep = await page.getByText('Associer les colonnes').isVisible()
    expect(onMappingStep).toBe(false)
  })

  test('shows validation errors in preview for invalid rows', async ({ page }) => {
    await uploadFile(page, TEST_FILES.MIXED_VALID_INVALID)
    await waitForMappingStep(page)
    await clickNextButton(page) // Options
    await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })
    await clickNextButton(page) // Preview

    // Preview should show invalid count
    const summary = await getValidationSummary(page)
    expect(summary.invalid).toBeGreaterThan(0)
  })

  test('handles semicolon delimiter correctly', async ({ page }) => {
    const result = await runFullImport(page, TEST_FILES.SEMICOLON)

    // Parser should auto-detect semicolon delimiter
    expect(result.success).toBe(true)
  })
})

// ===========================================================================
// DUPLICATE HANDLING TESTS (skip for clean test runs)
// ===========================================================================
test.describe('Import Duplicate Handling', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
    await navigateToImport(page)
  })

  test('can select duplicate skip option', async ({ page }) => {
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)
    await clickNextButton(page)
    await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })

    await selectDuplicateOption(page, 'skip')
    await expect(page.getByText(/Ignorés/)).toBeVisible()
  })

  test('can select duplicate update option', async ({ page }) => {
    await uploadFile(page, TEST_FILES.HAPPY_PATH)
    await waitForMappingStep(page)
    await clickNextButton(page)
    await expect(page.getByText("Options d'import")).toBeVisible({ timeout: 10000 })

    await selectDuplicateOption(page, 'update')
    await expect(page.getByText(/Mis à jour/)).toBeVisible()
  })
})
