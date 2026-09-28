import { expect, test } from "@playwright/test";

test.describe("Sessão autenticada", () => {
  test("mantém a sessão após recarregar a página", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("recusa alteração de senha com senha atual incorreta", async ({
    page,
  }) => {
    await page.goto("/password");
    await page.getByLabel(/^Senha atual/).fill("senha-atual-errada");
    await page.getByLabel(/^Nova senha/).fill("uma-nova-senha-longa");
    await page.getByLabel(/Confirmar nova senha/).fill("uma-nova-senha-longa");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();

    await expect(page.getByText("Senha atual inválida.")).toBeVisible();
  });

  test("abre a administração de usuários", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page.getByRole("heading", { name: "Usuários" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Criar usuário/ }),
    ).toBeVisible();
  });
});
