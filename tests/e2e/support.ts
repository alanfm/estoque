import type { Page } from "@playwright/test";

export const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
export const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ?? "senha-de-teste-1234";

export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/^E-mail/).fill(adminEmail);
  await page.getByLabel(/^Senha/).fill(adminPassword);
  await page.getByRole("button", { name: /Entrar/ }).click();
  await page.waitForURL("/");
}
