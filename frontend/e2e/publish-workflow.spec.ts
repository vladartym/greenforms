import { test, expect } from "@playwright/test"

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

test("editing a published form shows Changes pill, discard reverts it", async ({ page }) => {
  await page.goto("/signup")
  await page.getByLabel("Email").fill(uniqueEmail())
  await page.getByLabel("Password").fill("testpass123")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  const formId = page.url().split("/form/")[1]

  await page.getByLabel("Form title").fill("Workflow Form")
  await page.getByLabel("Question 1 label").fill("Original question")
  await page.waitForResponse(
    (r) => r.url().includes(`/api/forms/${formId}`) && r.request().method() === "PUT" && r.ok(),
  )

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeVisible()

  await page.getByLabel("Question 1 label").fill("Edited question")
  await page.waitForResponse(
    (r) => r.url().includes(`/api/forms/${formId}`) && r.request().method() === "PUT" && r.ok(),
  )

  const changesPill = page.getByRole("button", { name: "Changes" })
  await expect(changesPill).toBeVisible()

  await changesPill.click()
  await expect(page.getByLabel("Question 1 label")).toHaveValue("Original question")
  await expect(changesPill).toBeHidden()
})

test("public form shows published version, not unsaved draft edits", async ({ page, browser }) => {
  await page.goto("/signup")
  await page.getByLabel("Email").fill(uniqueEmail())
  await page.getByLabel("Password").fill("testpass123")
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  const formId = page.url().split("/form/")[1]

  await page.getByLabel("Form title").fill("Snapshot Form")
  await page.getByLabel("Question 1 label").fill("Published question")
  await page.waitForResponse(
    (r) => r.url().includes(`/api/forms/${formId}`) && r.request().method() === "PUT" && r.ok(),
  )

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeVisible()

  await page.getByLabel("Question 1 label").fill("Draft-only edit")
  await page.waitForResponse(
    (r) => r.url().includes(`/api/forms/${formId}`) && r.request().method() === "PUT" && r.ok(),
  )

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()
  await publicPage.goto(`/f/${formId}`)
  await expect(publicPage.getByRole("heading", { name: "Published question" })).toBeVisible()
  await expect(publicPage.getByRole("heading", { name: "Draft-only edit" })).toBeHidden()
  await publicContext.close()
})
