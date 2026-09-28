import { expect, test as setup } from "@playwright/test";
import { adminEmail, adminPassword } from "./support";

const stateFile = "tests/e2e/.auth/admin.json";

setup("autentica o administrador", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/^E-mail/).fill(adminEmail);
  await page.getByLabel(/^Senha/).fill(adminPassword);
  await page.getByRole("button", { name: /Entrar/ }).click();

  await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();

  await page.context().storageState({ path: stateFile });
});
