import { test, expect, type Page } from "@playwright/test"

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

async function signupAndCreateEmptyForm(page: Page) {
  await page.goto("/signup")
  await page.getByLabel("Email").fill(uniqueEmail())
  await page.getByLabel("Password").fill("testpass123")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()
  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()
}

test("rename form from the index", async ({ page }) => {
  await signupAndCreateEmptyForm(page)

  await page.getByRole("button", { name: "More actions" }).click()
  await page.getByRole("menuitem", { name: "Rename" }).click()

  const dialogInput = page.getByPlaceholder("Form title")
  await dialogInput.fill("Renamed Form")
  await page.getByRole("button", { name: "Save" }).click()

  await expect(page.getByRole("heading", { name: "Renamed Form" })).toBeVisible()
})

test("duplicate form creates a second entry", async ({ page }) => {
  await signupAndCreateEmptyForm(page)

  await expect(page.getByRole("button", { name: "More actions" })).toHaveCount(1)

  await page.getByRole("button", { name: "More actions" }).click()
  const duplicateResponse = page.waitForResponse(
    (r) => r.url().includes("/duplicate") && r.request().method() === "POST" && r.ok(),
  )
  await page.getByRole("menuitem", { name: "Duplicate" }).click()
  await duplicateResponse
  await page.reload()

  await expect(page.getByRole("button", { name: "More actions" })).toHaveCount(2)
})

test("delete form removes it from the list", async ({ page }) => {
  await signupAndCreateEmptyForm(page)

  await expect(page.getByRole("button", { name: "More actions" })).toHaveCount(1)

  await page.getByRole("button", { name: "More actions" }).click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Delete", exact: true }).click()

  await expect(page.getByText("No forms yet. Create your first form.")).toBeVisible()
})
