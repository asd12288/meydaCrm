import { test as setup, expect } from '@playwright/test'
import { TEST_USERS } from './helpers/auth'
import path from 'path'

const STORAGE_DIR = path.join(__dirname, '.auth')

/**
 * Setup: Login as admin and save session state
 * This runs once before all admin tests
 */
setup('authenticate as admin', async ({ page }) => {
  const user = TEST_USERS.admin

  await page.goto('/login')
  await page.getByLabel('Identifiant').fill(user.username)
  await page.getByLabel('Mot de passe').fill(user.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  // Wait for successful login
  await page.waitForURL(/dashboard/, { timeout: 15000 })

  // Verify we're logged in
  await expect(page).toHaveURL(/dashboard/)

  // Save storage state (cookies + localStorage)
  await page.context().storageState({ path: path.join(STORAGE_DIR, 'admin.json') })
})

/**
 * Setup: Login as sales user and save session state
 * This runs once before all sales tests
 */
setup('authenticate as sales', async ({ page }) => {
  const user = TEST_USERS.sales

  await page.goto('/login')
  await page.getByLabel('Identifiant').fill(user.username)
  await page.getByLabel('Mot de passe').fill(user.password)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  // Wait for successful login
  await page.waitForURL(/dashboard/, { timeout: 15000 })

  // Verify we're logged in
  await expect(page).toHaveURL(/dashboard/)

  // Save storage state
  await page.context().storageState({ path: path.join(STORAGE_DIR, 'sales.json') })
})
