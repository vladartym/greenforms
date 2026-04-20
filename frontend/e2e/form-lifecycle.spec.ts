import { test, expect } from "@playwright/test"

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

test("signup, build a form, publish, respond, see the response", async ({ page, browser }) => {
  const email = uniqueEmail()
  const password = "testpass123"
  const formTitle = "Interview Test Form"
  const questionLabel = "What is your name?"
  const answerText = "Ada Lovelace"

  await page.goto("/signup")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  const formUrl = page.url()
  const formId = formUrl.split("/form/")[1]

  await page.getByLabel("Form title").fill(formTitle)
  await page.getByLabel("Question 1 label").fill(questionLabel)

  await page.waitForResponse(
    (r) => r.url().includes(`/api/forms/${formId}`) && r.request().method() === "PUT" && r.ok(),
  )

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeVisible()

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()
  await publicPage.goto(`/f/${formId}`)
  await expect(publicPage.getByRole("heading", { name: questionLabel })).toBeVisible()
  await publicPage.getByPlaceholder("Type your answer here…").fill(answerText)
  await publicPage.getByRole("button", { name: "Submit" }).click()
  await expect(publicPage.getByRole("heading", { name: "Thanks for your response." })).toBeVisible()
  await publicContext.close()

  await page.goto(`/form/${formId}/responses`)
  await expect(page.getByText(answerText)).toBeVisible()
})
