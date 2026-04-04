import { expect, test } from "@playwright/test";

test("dashboard loads project data and opens a workspace", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sim_access_token", "test-access-token");
    localStorage.setItem(
      "sim_user",
      JSON.stringify({
        id: "user-1",
        name: "Test User",
        role: "Student"
      })
    );
  });

  await page.route("**/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: [
        {
          id: "proj-1",
          name: "Demo Pipeline",
          description: "Sample project used for browser testing",
          createdAt: "2026-04-01T10:00:00.000Z",
          uploadPath: "/uploads/demo"
        }
      ]
    });
  });

  await page.route("**/projects/proj-1/workspace", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: {
        type: "NODE",
        files: {
          "package.json": true,
          "src/index.js": true
        },
        pipeline: {
          id: "pipeline-1"
        }
      }
    });
  });

  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "CI/CD Pipeline Simulator" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open", exact: true }).click();

  await expect(page.getByRole("button", { name: /Test cases and execution/ })).toBeVisible();
  await expect(page.getByText("Pipeline Status")).toBeVisible();
  await expect(page.getByText("✓ Ready")).toBeVisible();
});

test("dashboard redirects to login when no session exists", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("logout clears session and returns to login page", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sim_access_token", "test-access-token");
    localStorage.setItem(
      "sim_user",
      JSON.stringify({
        id: "user-1",
        name: "Test User",
        role: "Student"
      })
    );
  });

  await page.route("**/projects", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      json: []
    });
  });

  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "CI/CD Pipeline Simulator" })).toBeVisible();

  await page.getByRole("button", { name: "Logout" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await expect
    .poll(async () =>
      page.evaluate(() => ({
        accessToken: localStorage.getItem("sim_access_token"),
        user: localStorage.getItem("sim_user")
      }))
    )
    .toEqual({ accessToken: null, user: null });
});