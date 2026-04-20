import { test, expect } from "@playwright/test"

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

test("signup, logout, log back in", async ({ page }) => {
  const email = uniqueEmail()
  const password = "testpass123"

  await page.goto("/signup")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("button", { name: "Log out" }).click()
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible()
  await page.getByRole("link", { name: "Log in" }).click()
  await expect(page.getByRole("button", { name: "Log in" })).toBeVisible()

  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()
})

test("unauthenticated form route redirects to login", async ({ browser }) => {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto("/form/00000000-0000-0000-0000-000000000000")
  await page.waitForURL(/\/login/)
  await context.close()
})
