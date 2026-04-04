import { expect, test } from "@playwright/test";

test("landing page shows the main product message and auth links", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Run a real-looking CI\/CD platform without touching real cloud infrastructure\./i
    })
  ).toBeVisible();
  await expect(page.getByText("Project Upload & Analysis")).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: "Sign In" })).toHaveAttribute(
    "href",
    "/login"
  );
  await expect(
    page.locator("header").getByRole("link", { name: "Start Free Lab" })
  ).toHaveAttribute("href", "/register");
});

test("landing page sign in link opens login page", async ({ page }) => {
  await page.goto("/");

  await page.locator("header").getByRole("link", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});