import { test, expect } from "@playwright/test"

function uniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

test("signup, build a form with a jump rule, respondent skips the branched question", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail()
  const password = "testpass123"

  await page.goto("/signup")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  const formId = page.url().split("/form/")[1]

  const waitForAutosave = () =>
    page.waitForResponse(
      (r) =>
        r.url().includes(`/api/forms/${formId}`) &&
        r.request().method() === "PUT" &&
        r.ok(),
    )

  await page.getByLabel("Form title").fill("Conditional Logic Form")

  await page.getByRole("button", { name: "Question type" }).first().click()
  await page.getByRole("menuitemcheckbox", { name: "Multiple choice" }).click()
  await page.getByLabel("Question 1 label").fill("Are you in?")
  await page.getByLabel("Choice 1").fill("Yes")
  await page.getByLabel("Choice 2").fill("No")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 2 label").fill("Your reason?")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 3 label").fill("Your name?")
  await waitForAutosave()

  await page.getByRole("button", { name: "Toggle logic" }).first().click()
  const q1Card = page.locator("ul > li").first()
  await q1Card.locator('select[aria-label="Operator"]').selectOption({ value: "equals" })
  await q1Card.locator('select[aria-label="Value"]').selectOption({ value: "Yes" })

  const autosaveAfterTarget = waitForAutosave()
  await q1Card
    .locator('select[aria-label="Target question"]')
    .selectOption({ label: "Q3: Your name? (Short text)" })
  await autosaveAfterTarget

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeVisible()

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()

  const publicFormResponse = publicPage.waitForResponse(
    (r) => r.url().includes(`/api/public/forms/${formId}`) && r.ok(),
  )
  await publicPage.goto(`/f/${formId}`)
  const publicBody = (await (await publicFormResponse).json()) as {
    questions: { id: string; position: number }[]
  }
  const [q1, q2, q3] = [...publicBody.questions].sort((a, b) => a.position - b.position)

  await expect(publicPage.getByRole("heading", { name: "Are you in?" })).toBeVisible()
  await publicPage.getByRole("button", { name: "Yes", exact: true }).click()

  const submitRequest = publicPage.waitForRequest(
    (r) => r.url().includes("/submit") && r.method() === "POST",
  )
  await publicPage.getByRole("button", { name: "Next" }).click()

  await expect(publicPage.getByRole("heading", { name: "Your name?" })).toBeVisible()
  await expect(publicPage.getByRole("heading", { name: "Your reason?" })).toBeHidden()

  await publicPage.getByPlaceholder("Type your answer here…").fill("Ada Lovelace")
  await publicPage.getByRole("button", { name: "Submit" }).click()

  const submitBody = (await submitRequest).postDataJSON() as { path: string[] }
  expect(submitBody.path).toEqual([q1.id, q3.id])
  expect(submitBody.path).not.toContain(q2.id)

  await expect(
    publicPage.getByRole("heading", { name: "Thanks for your response." }),
  ).toBeVisible()
  await publicContext.close()
})

test("signup, build a form where a jump targets a hidden question, respondent visits it and then continues", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail()
  const password = "testpass123"

  await page.goto("/signup")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  const formId = page.url().split("/form/")[1]

  const waitForAutosave = () =>
    page.waitForResponse(
      (r) =>
        r.url().includes(`/api/forms/${formId}`) &&
        r.request().method() === "PUT" &&
        r.ok(),
    )

  await page.getByLabel("Form title").fill("Jump To Hidden Form")

  await page.getByRole("button", { name: "Question type" }).first().click()
  await page.getByRole("menuitemcheckbox", { name: "Multiple choice" }).click()
  await page.getByLabel("Question 1 label").fill("Are you in?")
  await page.getByLabel("Choice 1").fill("Yes")
  await page.getByLabel("Choice 2").fill("No")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 2 label").fill("Secret branch question")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 3 label").fill("Your email")
  await waitForAutosave()

  const autosaveAfterHidden = waitForAutosave()
  await page.locator("ul > li").nth(1).getByLabel("Hidden").check()
  await autosaveAfterHidden

  await page.getByRole("button", { name: "Toggle logic" }).first().click()
  const q1Card = page.locator("ul > li").first()
  await q1Card.locator('select[aria-label="Operator"]').selectOption({ value: "equals" })
  await q1Card.locator('select[aria-label="Value"]').selectOption({ value: "Yes" })

  const autosaveAfterTarget = waitForAutosave()
  await q1Card
    .locator('select[aria-label="Target question"]')
    .selectOption({ label: "Q2: Secret branch question (Short text, hidden)" })
  await autosaveAfterTarget

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeVisible()

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()

  const publicFormResponse = publicPage.waitForResponse(
    (r) => r.url().includes(`/api/public/forms/${formId}`) && r.ok(),
  )
  await publicPage.goto(`/f/${formId}`)
  const publicBody = (await (await publicFormResponse).json()) as {
    questions: { id: string; position: number }[]
  }
  const [q1, q2, q3] = [...publicBody.questions].sort((a, b) => a.position - b.position)

  await expect(publicPage.getByRole("heading", { name: "Are you in?" })).toBeVisible()
  await publicPage.getByRole("button", { name: "Yes", exact: true }).click()
  await publicPage.getByRole("button", { name: "Next" }).click()

  await expect(
    publicPage.getByRole("heading", { name: "Secret branch question" }),
  ).toBeVisible()
  await publicPage.getByPlaceholder("Type your answer here…").fill("branch answer")
  await publicPage.getByRole("button", { name: "Next" }).click()

  await expect(publicPage.getByRole("heading", { name: "Your email" })).toBeVisible()

  const submitRequest = publicPage.waitForRequest(
    (r) => r.url().includes("/submit") && r.method() === "POST",
  )
  await publicPage.getByPlaceholder("Type your answer here…").fill("ada@example.com")
  await publicPage.getByRole("button", { name: "Submit" }).click()

  const submitBody = (await submitRequest).postDataJSON() as { path: string[] }
  expect(submitBody.path).toEqual([q1.id, q2.id, q3.id])

  await expect(
    publicPage.getByRole("heading", { name: "Thanks for your response." }),
  ).toBeVisible()
  await publicContext.close()
})

test("signup, build a form with a jump rule, respondent goes back and reroutes through the jump", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail()
  const password = "testpass123"

  await page.goto("/signup")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  const formId = page.url().split("/form/")[1]

  const waitForAutosave = () =>
    page.waitForResponse(
      (r) =>
        r.url().includes(`/api/forms/${formId}`) &&
        r.request().method() === "PUT" &&
        r.ok(),
    )

  await page.getByLabel("Form title").fill("Back And Change Form")

  await page.getByRole("button", { name: "Question type" }).first().click()
  await page.getByRole("menuitemcheckbox", { name: "Multiple choice" }).click()
  await page.getByLabel("Question 1 label").fill("Are you in?")
  await page.getByLabel("Choice 1").fill("Yes")
  await page.getByLabel("Choice 2").fill("No")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 2 label").fill("Reason")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 3 label").fill("Name")
  await waitForAutosave()

  await page.getByRole("button", { name: "Toggle logic" }).first().click()
  const q1Card = page.locator("ul > li").first()
  await q1Card.locator('select[aria-label="Operator"]').selectOption({ value: "equals" })
  await q1Card.locator('select[aria-label="Value"]').selectOption({ value: "Yes" })

  const autosaveAfterTarget = waitForAutosave()
  await q1Card
    .locator('select[aria-label="Target question"]')
    .selectOption({ label: "Q3: Name (Short text)" })
  await autosaveAfterTarget

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeVisible()

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()

  const publicFormResponse = publicPage.waitForResponse(
    (r) => r.url().includes(`/api/public/forms/${formId}`) && r.ok(),
  )
  await publicPage.goto(`/f/${formId}`)
  const publicBody = (await (await publicFormResponse).json()) as {
    questions: { id: string; position: number }[]
  }
  const [q1, q2, q3] = [...publicBody.questions].sort((a, b) => a.position - b.position)

  await expect(publicPage.getByRole("heading", { name: "Are you in?" })).toBeVisible()
  await publicPage.getByRole("button", { name: "No", exact: true }).click()
  await publicPage.getByRole("button", { name: "Next" }).click()

  await expect(publicPage.getByRole("heading", { name: "Reason" })).toBeVisible()
  await publicPage.getByPlaceholder("Type your answer here…").fill("browsing")
  await publicPage.getByRole("button", { name: "Next" }).click()

  await expect(publicPage.getByRole("heading", { name: "Name" })).toBeVisible()
  await publicPage.getByPlaceholder("Type your answer here…").fill("Grace")

  await publicPage.getByRole("button", { name: "Back" }).click()
  await expect(publicPage.getByRole("heading", { name: "Reason" })).toBeVisible()
  await publicPage.getByRole("button", { name: "Back" }).click()
  await expect(publicPage.getByRole("heading", { name: "Are you in?" })).toBeVisible()

  await publicPage.getByRole("button", { name: "Yes", exact: true }).click()
  await publicPage.getByRole("button", { name: "Next" }).click()

  await expect(publicPage.getByRole("heading", { name: "Name" })).toBeVisible()
  await expect(publicPage.getByRole("heading", { name: "Reason" })).toBeHidden()

  const submitRequest = publicPage.waitForRequest(
    (r) => r.url().includes("/submit") && r.method() === "POST",
  )
  await publicPage.getByRole("button", { name: "Submit" }).click()

  const submitBody = (await submitRequest).postDataJSON() as { path: string[] }
  expect(submitBody.path).toEqual([q1.id, q3.id])
  expect(submitBody.path).not.toContain(q2.id)

  await expect(
    publicPage.getByRole("heading", { name: "Thanks for your response." }),
  ).toBeVisible()
  await publicContext.close()
})

test("signup, build a form with a hidden question, respondent skips it on the default path", async ({
  page,
  browser,
}) => {
  const email = uniqueEmail()
  const password = "testpass123"

  await page.goto("/signup")
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Create account" }).click()
  await expect(page.getByRole("heading", { name: "Your forms" })).toBeVisible()

  await page.getByRole("link", { name: "+ New form" }).first().click()
  await expect(page).toHaveURL(/\/form\/[0-9a-f-]+$/)
  const formId = page.url().split("/form/")[1]

  const waitForAutosave = () =>
    page.waitForResponse(
      (r) =>
        r.url().includes(`/api/forms/${formId}`) &&
        r.request().method() === "PUT" &&
        r.ok(),
    )

  await page.getByLabel("Form title").fill("Hidden Question Form")

  await page.getByLabel("Question 1 label").fill("What's your name?")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 2 label").fill("Hidden internal note")
  await waitForAutosave()

  await page.getByRole("button", { name: "Add question" }).click()
  await page.getByLabel("Question 3 label").fill("What's your email?")
  await waitForAutosave()

  const autosaveAfterHidden = waitForAutosave()
  await page.locator("ul > li").nth(1).getByLabel("Hidden").check()
  await autosaveAfterHidden

  await page.getByRole("button", { name: "Publish" }).click()
  await expect(page.getByRole("button", { name: "Published" })).toBeVisible()

  const publicContext = await browser.newContext()
  const publicPage = await publicContext.newPage()

  const publicFormResponse = publicPage.waitForResponse(
    (r) => r.url().includes(`/api/public/forms/${formId}`) && r.ok(),
  )
  await publicPage.goto(`/f/${formId}`)
  const publicBody = (await (await publicFormResponse).json()) as {
    questions: { id: string; position: number }[]
  }
  const [q1, q2, q3] = [...publicBody.questions].sort((a, b) => a.position - b.position)

  await expect(publicPage.getByRole("heading", { name: "What's your name?" })).toBeVisible()
  await publicPage.getByPlaceholder("Type your answer here…").fill("Ada Lovelace")

  await publicPage.getByRole("button", { name: "Next" }).click()

  await expect(publicPage.getByRole("heading", { name: "What's your email?" })).toBeVisible()
  await expect(publicPage.getByRole("heading", { name: "Hidden internal note" })).toBeHidden()

  const submitRequest = publicPage.waitForRequest(
    (r) => r.url().includes("/submit") && r.method() === "POST",
  )
  await publicPage.getByPlaceholder("Type your answer here…").fill("ada@example.com")
  await publicPage.getByRole("button", { name: "Submit" }).click()

  const submitBody = (await submitRequest).postDataJSON() as { path: string[] }
  expect(submitBody.path).toEqual([q1.id, q3.id])
  expect(submitBody.path).not.toContain(q2.id)

  await expect(
    publicPage.getByRole("heading", { name: "Thanks for your response." }),
  ).toBeVisible()
  await publicContext.close()
})
