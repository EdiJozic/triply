import { expect, test } from "@playwright/test";

async function enterDemo(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: /continue with the demo workspace/i }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /your next chapter/i })).toBeVisible();
}

test("public landing page links into authentication", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page.getByRole("heading", { name: /your next adventure starts here/i })).toBeVisible();
  await page.getByRole("link", { name: /plan my trip/i }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("creates a trip and generates a labeled demo itinerary", async ({ page }) => {
  await enterDemo(page);
  await page.getByRole("button", { name: /plan a new trip/i }).click();
  await page.getByPlaceholder("A city, country, or coast").fill("Porto");
  await page.getByRole("textbox", { name: "COUNTRY OPTIONAL" }).fill("Portugal");
  await page.getByRole("button", { name: "Continue" }).click();

  const tomorrow = new Date(Date.now() + 86_400_000);
  const nextWeek = new Date(Date.now() + 8 * 86_400_000);
  await page.locator('input[type="date"]').nth(0).fill(tomorrow.toISOString().slice(0, 10));
  await page.locator('input[type="date"]').nth(1).fill(nextWeek.toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Create my trip" }).click();

  await expect(page.getByRole("heading", { name: /Porto/ })).toBeVisible();
  await expect(page.getByText("Explore a walkable neighborhood in Porto").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/illustrative idea only/i).first()).toBeVisible();
});

test("edits itinerary progress and records an expense", async ({ page }) => {
  await enterDemo(page);
  await page.getByRole("button", { name: "Amalfi Coast Jun 12 –" }).click();
  await expect(page.getByRole("heading", { name: /Amalfi Coast/ })).toBeVisible();
  await page.getByRole("button", { name: "Mark complete" }).first().click();
  await expect(page.getByRole("button", { name: "Mark incomplete" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Edit Check in & settle in" }).click();
  await page.getByRole("textbox", { name: "ACTIVITY", exact: true }).fill("Settle into the hotel");
  await page.getByRole("button", { name: "Save activity" }).click();
  await expect(page.getByRole("heading", { name: "Settle into the hotel" })).toBeVisible();

  await page.getByRole("button", { name: "Budget planner" }).click();
  await page.getByRole("button", { name: "Add expense" }).first().click();
  await page.getByPlaceholder("e.g. Dinner by the water").fill("Test ferry");
  await page.locator('input[name="amount"]').fill("35");
  await page.locator('form.expense-modal').getByRole("button", { name: /add expense/i }).click();
  await expect(page.getByText("Test ferry")).toBeVisible();
  await page.getByRole("button", { name: "Delete Test ferry" }).click();
  await expect(page.getByText("Test ferry")).toHaveCount(0);
});

test("saves a destination and keeps the workspace within a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterDemo(page);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await page.getByRole("button", { name: "Save Lisbon" }).click();
  await page.getByRole("navigation").getByRole("button", { name: /Saved places/ }).click();
  await expect(page.getByRole("heading", { name: "Saved places" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lisbon" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test("assistant and planner reject invalid request payloads", async ({ request }) => {
  const planner = await request.post("/api/trip-planner", { data: { destination: "" } });
  expect(planner.status()).toBe(400);

  const assistant = await request.post("/api/trip-assistant", { data: {} });
  expect(assistant.status()).toBe(400);
});
