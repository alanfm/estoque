import { expect, test } from "@playwright/test";

test.describe("Administração de usuários", () => {
  test("cria usuário e envia convite por e-mail", async ({ page }) => {
    await page.goto("/admin/users");
    await page.getByRole("link", { name: /Criar usuário/ }).click();

    const email = `e2e-${Date.now()}@example.com`;

    await page.getByLabel(/^Nome/).fill("Usuária E2E");
    await page.getByLabel(/^E-mail/).fill(email);
    await page.getByRole("button", { name: "Criar usuário" }).click();

    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(
      page.getByText("Usuário criado e convite enviado por e-mail."),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("filtra usuários e reflete o filtro na URL", async ({ page }) => {
    await page.goto("/admin/users");
    await page
      .getByPlaceholder("Buscar por nome ou e-mail")
      .fill("consulta-inexistente");

    await expect(page).toHaveURL(/search=consulta-inexistente/);
    await expect(page.getByText("Nenhum resultado")).toBeVisible();
  });
});
