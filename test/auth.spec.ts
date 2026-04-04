import { expect, test } from "@playwright/test";

test("register page shows client-side validation for short passwords", async ({ page }) => {
  await page.goto("/register");

  await page.getByLabel("Name").fill("Ada Lovelace");
  await page.getByLabel("Email").fill("ada@example.com");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
});

test("login flow redirects to the dashboard when auth succeeds", async ({ page }) => {
  await page.route("**/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: {
        accessToken: "test-access-token",
        user: {
          id: "user-1",
          name: "Test User",
          role: "Student"
        }
      }
    });
  });

  await page.route("**/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: []
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("student@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "CI/CD Pipeline Simulator" })).toBeVisible();
  await expect(page.getByText("No Projects Yet")).toBeVisible();
});

test("login page create account link opens register page", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("link", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
});

test("login button stays disabled until required fields are filled", async ({ page }) => {
  await page.goto("/login");

  const signInButton = page.getByRole("button", { name: "Sign in" });
  await expect(signInButton).toBeDisabled();

  await page.getByLabel("Email").fill("student@example.com");
  await expect(signInButton).toBeDisabled();

  await page.getByLabel("Password").fill("password123");
  await expect(signInButton).toBeEnabled();
});