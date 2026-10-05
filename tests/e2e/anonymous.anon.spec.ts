import { expect, test } from "@playwright/test";
import { login } from "./support";

test.describe("Acesso anônimo", () => {
  test("entra e encerra a sessão", async ({ page }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();

    await page.getByRole("button", { name: "Menu do usuário" }).click();
    await page.getByRole("menuitem", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("redireciona visitante para o login", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: /Entrar/ })).toBeVisible();
  });

  test("protege rota administrativa de visitante", async ({ page }) => {
    await page.goto("/admin/users");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("recusa credenciais inválidas sem enumerar contas", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/^Matrícula/).fill("matricula-inexistente");
    await page.getByLabel(/^Senha/).fill("senha-incorreta");
    await page.getByRole("button", { name: /Entrar/ }).click();

    await expect(page.getByText(/inválid/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("solicita recuperação com resposta neutra", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel(/^E-mail/).fill("nao-cadastrado@example.com");
    await page.getByRole("button", { name: "Enviar link" }).click();

    await expect(
      page.getByRole("heading", { name: "Verifique seu e-mail" }),
    ).toBeVisible();
  });

  test("mostra página 404 distinta", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");

    await expect(
      page.getByRole("heading", { name: "Página não encontrada" }),
    ).toBeVisible();
  });

  test("mostra página 403 distinta", async ({ page }) => {
    await page.goto("/403");

    await expect(
      page.getByRole("heading", { name: "Acesso negado" }),
    ).toBeVisible();
  });
});
