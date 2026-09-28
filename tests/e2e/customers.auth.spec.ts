import { expect, test } from "@playwright/test";

test.describe("Módulo de clientes", () => {
  test("cria, filtra, edita e remove um cliente", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByRole("link", { name: "Novo cliente" }).click();

    const email = `customer-${Date.now()}@example.test`;
    await page.getByRole("textbox", { name: "Nome" }).fill("Cliente E2E");
    await page.getByRole("textbox", { name: "E-mail" }).fill(email);
    await page
      .getByRole("textbox", { name: "Empresa" })
      .fill("Empresa Inicial");
    await page.getByRole("button", { name: "Criar cliente" }).click();
    await expect(page.getByText("Cliente E2E")).toBeVisible();

    await page.getByPlaceholder("Buscar nome, e-mail ou empresa").fill(email);
    await expect
      .poll(() => new URL(page.url()).searchParams.get("search"))
      .toBe(email);
    await expect(page.getByText(email)).toBeVisible();

    await page.getByRole("link", { name: "Editar Cliente E2E" }).hover();
    await expect(page.getByRole("tooltip")).toHaveText("Editar");
    await page.getByRole("link", { name: "Editar Cliente E2E" }).click();
    await page
      .getByRole("textbox", { name: "Empresa" })
      .fill("Empresa Atualizada");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByText("Empresa Atualizada")).toBeVisible();
    await page.getByPlaceholder("Buscar nome, e-mail ou empresa").fill(email);
    await expect
      .poll(() => new URL(page.url()).searchParams.get("search"))
      .toBe(email);

    await page.getByRole("button", { name: "Excluir Cliente E2E" }).click();
    await page
      .getByRole("dialog", { name: "Excluir cliente" })
      .getByRole("button", { name: "Excluir cliente" })
      .click();
    await expect(page.getByText("Nenhum resultado")).toBeVisible();
  });
});
