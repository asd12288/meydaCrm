import { Page } from '@playwright/test'

/**
 * Test users from seed.sql (local Supabase only)
 * These users exist in the local database after `supabase start`
 */
export const TEST_USERS = {
  admin: {
    username: 'admin',
    password: '123456',
    role: 'admin',
    displayName: 'Admin Test',
  },
  sales: {
    username: 'marie',
    password: '123456',
    role: 'sales',
    displayName: 'Marie Dupont',
  },
  sales2: {
    username: 'jean',
    password: '123456',
    role: 'sales',
    displayName: 'Jean Martin',
  },
} as const

type UserType = keyof typeof TEST_USERS

/**
 * Login as a test user via the UI
 */
export async function login(page: Page, userType: UserType = 'admin') {
  const user = TEST_USERS[userType]

  await page.goto('/login')

  // Fill login form (French labels from login-form.tsx)
  await page.getByLabel('Identifiant').fill(user.username)
  await page.getByLabel('Mot de passe').fill(user.password)

  // Submit
  await page.getByRole('button', { name: 'Se connecter' }).click()

  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard/, { timeout: 10000 })
}

/**
 * Logout via the UI
 */
export async function logout(page: Page) {
  // Click user menu or logout button
  const logoutButton = page.getByRole('button', { name: /déconnexion|logout/i })
  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  } else {
    // Try sidebar logout link
    await page.getByRole('link', { name: /déconnexion|logout/i }).click()
  }

  await page.waitForURL(/login/)
}

/**
 * Check if user is on login page
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  return page.url().includes('/login')
}

/**
 * Check if user is authenticated (on a protected page)
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  return !page.url().includes('/login')
}
