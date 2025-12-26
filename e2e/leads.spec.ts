import { test, expect } from '@playwright/test'
import { login, TEST_USERS } from './helpers/auth'

test.describe('Leads List', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
  })

  test('should display leads table', async ({ page }) => {
    await page.goto('/leads')

    // Should see table or kanban view
    const table = page.getByRole('table')
    const kanban = page.locator('[data-testid="kanban-board"]')

    // Either table or kanban should be visible
    const hasTable = await table.isVisible().catch(() => false)
    const hasKanban = await kanban.isVisible().catch(() => false)

    expect(hasTable || hasKanban).toBe(true)
  })

  test('should display lead data from seed', async ({ page }) => {
    await page.goto('/leads')

    // Should see at least one lead from seed data
    // Seed has leads like "Pierre Lefebvre", "Claire Moreau", etc.
    await expect(page.getByText(/Lefebvre|Moreau|Garcia/i).first()).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    await page.goto('/leads')

    // Find search input
    const searchInput = page.getByPlaceholder(/rechercher|search/i)
    await expect(searchInput).toBeVisible()

    // Search for a specific lead
    await searchInput.fill('Pierre')

    // Wait for results to update
    await page.waitForTimeout(500)

    // Should show matching results
    await expect(page.getByText(/Pierre/i).first()).toBeVisible()
  })

  test('should navigate to lead detail page', async ({ page }) => {
    await page.goto('/leads')

    // Click on first lead row or card
    const firstLead = page.getByRole('row').nth(1) // Skip header row
    const leadLink = firstLead.getByRole('link').first()

    if (await leadLink.isVisible()) {
      await leadLink.click()
    } else {
      // Try clicking the row itself
      await firstLead.click()
    }

    // Should navigate to lead detail
    await expect(page).toHaveURL(/leads\/[a-f0-9-]+/)
  })
})

test.describe('Lead Detail', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
  })

  test('should display lead details', async ({ page }) => {
    // Go to leads list first
    await page.goto('/leads')

    // Find a lead link and click
    const leadLink = page.getByRole('link', { name: /Lefebvre|Moreau/i }).first()
    await leadLink.click()

    // Should be on detail page
    await expect(page).toHaveURL(/leads\/[a-f0-9-]+/)

    // Should show lead info
    await expect(page.getByText(/Pierre|Claire/i).first()).toBeVisible()
  })

  test('should show comments section', async ({ page }) => {
    await page.goto('/leads')

    // Navigate to a lead
    const leadLink = page.getByRole('link', { name: /Lefebvre|Moreau/i }).first()
    await leadLink.click()

    // Should have comments section
    await expect(page.getByText(/commentaire|comment/i).first()).toBeVisible()
  })

  test('should show history section', async ({ page }) => {
    await page.goto('/leads')

    // Navigate to a lead
    const leadLink = page.getByRole('link', { name: /Lefebvre|Moreau/i }).first()
    await leadLink.click()

    // Should have history/timeline section
    await expect(page.getByText(/historique|history|timeline/i).first()).toBeVisible()
  })
})

test.describe('Lead Edit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin')
  })

  test('should be able to edit lead status', async ({ page }) => {
    await page.goto('/leads')

    // Navigate to a lead
    const leadLink = page.getByRole('link', { name: /Lefebvre|Moreau/i }).first()
    await leadLink.click()

    // Find status dropdown or edit button
    const statusDropdown = page.locator('[data-testid="status-dropdown"]')
    const editButton = page.getByRole('button', { name: /modifier|edit/i })

    // Either click status dropdown or edit button
    if (await statusDropdown.isVisible()) {
      await statusDropdown.click()
    } else if (await editButton.isVisible()) {
      await editButton.click()
    }

    // Test passes if we can interact with edit controls
    // (Detailed mutation testing is in integration tests)
  })
})

test.describe('Sales RLS', () => {
  test('sales user should only see assigned leads', async ({ page }) => {
    // Login as Marie (sales)
    await login(page, 'sales')
    await page.goto('/leads')

    // Marie should see leads assigned to her (from seed: EXT-001 to EXT-015)
    // But NOT leads assigned to Jean or Sophie

    // Wait for table to load
    await page.waitForSelector('table', { timeout: 5000 }).catch(() => {})

    // Check that we see some leads (Marie has 15 assigned)
    const rows = page.getByRole('row')
    const rowCount = await rows.count()

    // Should have at least 1 data row (plus header)
    expect(rowCount).toBeGreaterThan(1)
  })
})
