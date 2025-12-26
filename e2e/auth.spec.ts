import { test, expect } from '@playwright/test'
import { login, TEST_USERS } from './helpers/auth'

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('should login as admin and redirect to dashboard', async ({ page }) => {
    await login(page, 'admin')

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/)

    // Should see admin-specific elements (user management link in sidebar)
    await expect(page.getByRole('link', { name: /utilisateurs/i })).toBeVisible()
  })

  test('should login as sales and redirect to dashboard', async ({ page }) => {
    await login(page, 'sales')

    // Should be on dashboard
    await expect(page).toHaveURL(/dashboard/)

    // Sales should NOT see user management link
    await expect(page.getByRole('link', { name: /utilisateurs/i })).not.toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Identifiant').fill('wronguser')
    await page.getByLabel('Mot de passe').fill('wrongpassword')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    // Should show error message
    await expect(page.getByText(/identifiant ou mot de passe incorrect|invalid/i)).toBeVisible()

    // Should stay on login page
    await expect(page).toHaveURL(/login/)
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await login(page, 'admin')
    await expect(page).toHaveURL(/dashboard/)

    // Find and click logout (in sidebar or header)
    await page.getByRole('link', { name: /déconnexion/i }).click()

    // Should redirect to login
    await expect(page).toHaveURL(/login/)
  })

  test('admin should access user management page', async ({ page }) => {
    await login(page, 'admin')

    // Navigate to users
    await page.getByRole('link', { name: /utilisateurs/i }).click()

    // Should be on users page
    await expect(page).toHaveURL(/users/)

    // Should see users table or list
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('sales should NOT access user management page', async ({ page }) => {
    await login(page, 'sales')

    // Try to navigate directly to users page
    await page.goto('/users')

    // Should redirect away or show access denied
    // Either redirected to dashboard or shows forbidden
    const url = page.url()
    const isForbidden = url.includes('dashboard') || url.includes('login')
    expect(isForbidden).toBe(true)
  })
})
