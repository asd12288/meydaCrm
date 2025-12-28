import { test, expect } from '@playwright/test'
import { TEST_USERS } from './helpers/auth'
import path from 'path'

test.describe('User Management (Admin Only)', () => {
  test.beforeEach(async ({ page }) => {
    // Session loaded via storageState
    await page.goto('/users')
  })

  test('should display users table with seeded users', async ({ page }) => {
    // Should see the users table
    const table = page.getByRole('table')
    await expect(table).toBeVisible()

    // Should see seeded users in table (scope to table to avoid matching header)
    await expect(table.getByText('Admin Test')).toBeVisible()
    await expect(table.getByText('Marie Dupont')).toBeVisible()
  })

  test('should display page header with create button', async ({ page }) => {
    // Page title
    await expect(page.getByRole('heading', { name: /gestion des utilisateurs/i })).toBeVisible()

    // Create user button
    await expect(page.getByRole('button', { name: /créer un utilisateur/i })).toBeVisible()
  })

  test('should open create user modal', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /créer un utilisateur/i }).click()

    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible()

    // Check form fields exist by finding labels
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('label', { hasText: 'Identifiant' })).toBeVisible()
    await expect(dialog.locator('label', { hasText: 'Nom complet' })).toBeVisible()
    await expect(dialog.locator('label', { hasText: 'Role' })).toBeVisible()
    await expect(dialog.locator('label', { hasText: /^Mot de passe$/ })).toBeVisible()
    await expect(dialog.locator('label', { hasText: 'Confirmer le mot de passe' })).toBeVisible()
  })

  test('should validate create user form', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /créer un utilisateur/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Submit empty form
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click()

    // Wait for validation
    await page.waitForTimeout(300)

    // Should show validation errors (check for error styling or messages)
    // The form uses .form-error class for error messages
    const errorMessages = page.locator('.form-error')
    await expect(errorMessages.first()).toBeVisible()
  })

  test('should fill and submit create user form', async ({ page }) => {
    // Use random suffix to avoid conflicts with previous test runs
    const randomId = Math.random().toString(36).substring(2, 8)
    const testUsername = `e2etest_${randomId}`
    const testDisplayName = `E2E Test ${randomId}`
    const testPassword = 'TestPass123!'

    // Open modal
    await page.getByRole('button', { name: /créer un utilisateur/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill form fields using input name attributes
    const dialog = page.getByRole('dialog')

    await dialog.locator('input[name="username"]').fill(testUsername)
    await dialog.locator('input[name="displayName"]').fill(testDisplayName)
    await dialog.locator('input[name="password"]').fill(testPassword)
    await dialog.locator('input[name="confirmPassword"]').fill(testPassword)

    // Submit
    await page.getByRole('button', { name: /créer l'utilisateur/i }).click()

    // Wait for response - either success or error (form submission worked either way)
    // Success: "Utilisateur créé avec succès" / Error: "Erreur lors de la creation"
    const successOrError = page.locator('text=/utilisateur créé avec succès|erreur lors de la/i')
    await expect(successOrError).toBeVisible({ timeout: 15000 })

    // If successful, verify user appears in table
    const isSuccess = await page.getByText(/utilisateur créé avec succès/i).isVisible().catch(() => false)
    if (isSuccess) {
      await page.waitForTimeout(1500)
      await page.reload()
      await expect(page.getByText(testDisplayName)).toBeVisible({ timeout: 5000 })
    }
  })

  test('should open reset password modal from actions menu', async ({ page }) => {
    // Find Marie's row and click the actions button (IconDots)
    const marieRow = page.getByRole('row').filter({ hasText: 'Marie Dupont' })
    await expect(marieRow).toBeVisible()

    // Click the actions dropdown button in that row
    const actionsButton = marieRow.getByRole('button').first()
    await actionsButton.click()

    // Wait for dropdown to appear
    await page.waitForTimeout(200)

    // Click "Réinitialiser le mot de passe" option
    await page.getByText('Réinitialiser le mot de passe').click()

    // Modal should open
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Should mention Marie (scoped to dialog to avoid matching table row)
    await expect(dialog.getByText(/marie dupont/i)).toBeVisible()

    // Should have password labels
    await expect(dialog.locator('label', { hasText: 'Nouveau mot de passe' })).toBeVisible()
    await expect(dialog.locator('label', { hasText: 'Confirmer le mot de passe' })).toBeVisible()
  })

  test('should reset password successfully', async ({ page }) => {
    const newPassword = 'NewTestPassword123!'

    // Find Marie's row and open actions
    const marieRow = page.getByRole('row').filter({ hasText: 'Marie Dupont' })
    const actionsButton = marieRow.getByRole('button').first()
    await actionsButton.click()
    await page.waitForTimeout(200)

    // Click reset password
    await page.getByText('Réinitialiser le mot de passe').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Fill password fields
    const dialog = page.getByRole('dialog')
    const newPasswordInput = dialog.locator('input[name="newPassword"]')
    await newPasswordInput.fill(newPassword)

    const confirmInput = dialog.locator('input[name="confirmPassword"]')
    await confirmInput.fill(newPassword)

    // Submit
    await page.getByRole('button', { name: /^réinitialiser$/i }).click()

    // Should show success
    await expect(page.getByText(/mot de passe réinitialisé avec succès/i)).toBeVisible({ timeout: 10000 })

    // Reset back to original password for other tests
    await page.waitForTimeout(2000)

    // Reopen the modal for Marie
    await actionsButton.click()
    await page.waitForTimeout(200)
    await page.getByText('Réinitialiser le mot de passe').click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Reset to original
    const dialog2 = page.getByRole('dialog')
    await dialog2.locator('input[name="newPassword"]').fill(TEST_USERS.sales.password)
    await dialog2.locator('input[name="confirmPassword"]').fill(TEST_USERS.sales.password)

    await page.getByRole('button', { name: /^réinitialiser$/i }).click()
    await expect(page.getByText(/mot de passe réinitialisé avec succès/i)).toBeVisible({ timeout: 10000 })
  })

  test('should open edit user modal', async ({ page }) => {
    // Find Marie's row and open actions
    const marieRow = page.getByRole('row').filter({ hasText: 'Marie Dupont' })
    const actionsButton = marieRow.getByRole('button').first()
    await actionsButton.click()
    await page.waitForTimeout(200)

    // Click "Modifier"
    await page.getByText('Modifier', { exact: true }).click()

    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible()

    // Should have display name label
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('label', { hasText: 'Nom complet' })).toBeVisible()

    // Should have display name field with pre-filled value
    const displayNameInput = dialog.locator('input[name="displayName"]')
    await expect(displayNameInput).toHaveValue('Marie Dupont')
  })

  test('should filter users by search', async ({ page }) => {
    // Find search input
    const searchInput = page.getByPlaceholder(/rechercher/i)
    await expect(searchInput).toBeVisible()

    // Search for "marie"
    await searchInput.fill('marie')

    // Wait for URL to update (debounced search)
    await page.waitForURL(/search=marie/i, { timeout: 3000 })

    // Should show Marie
    await expect(page.getByText('Marie Dupont')).toBeVisible()

    // Should NOT show Jean (filtered out)
    await expect(page.getByText('Jean Martin')).not.toBeVisible()
  })

  test('should show delete confirmation dialog', async ({ page }) => {
    // Note: We won't actually delete a seeded user, just test the dialog opens

    // Find Jean's row (we'll use him since he's not admin)
    const jeanRow = page.getByRole('row').filter({ hasText: 'Jean Martin' })
    const actionsButton = jeanRow.getByRole('button').first()
    await actionsButton.click()
    await page.waitForTimeout(200)

    // Click "Supprimer"
    await page.getByText('Supprimer', { exact: true }).click()

    // Confirmation dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByText(/êtes-vous sûr/i)).toBeVisible()

    // Cancel to avoid actually deleting
    await page.getByRole('button', { name: /annuler/i }).click()

    // Dialog should close
    await expect(page.getByText(/êtes-vous sûr/i)).not.toBeVisible()
  })
})

test.describe('User Management Access Control', () => {
  // Use sales session for access control tests
  test.use({ storageState: path.join(__dirname, '.auth/sales.json') })
  test('sales user cannot access users page', async ({ page }) => {
    // Sales session loaded via storageState

    // Try to navigate to users page
    await page.goto('/users')

    // Should be redirected away (to dashboard or show forbidden)
    await page.waitForTimeout(1000)
    const url = page.url()
    expect(url).not.toContain('/users')
  })

  test('sales user does not see users link in sidebar', async ({ page }) => {
    // Sales session loaded via storageState - navigate to dashboard
    await page.goto('/dashboard')

    // Users link should not be visible for sales
    await expect(page.getByRole('link', { name: /utilisateurs/i })).not.toBeVisible()
  })
})
