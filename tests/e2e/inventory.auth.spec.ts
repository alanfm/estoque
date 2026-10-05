import { expect, test } from "@playwright/test";
import { adminRegistry, adminPassword } from "./support";

const basePermissions = [
  "inventory.items.viewAny",
  "inventory.items.view",
  "inventory.categories.viewAny",
  "inventory.movements.viewAny",
  "inventory.movements.view",
  "inventory.dashboard.view",
  "inventory.reports.view",
];

const roleActors = [
  {
    role: "almoxarife",
    permissions: ["inventory.entries.create", "inventory.issues.create"],
  },
  {
    role: "gestor",
    permissions: [
      ...basePermissions,
      "inventory.entries.create",
      "inventory.issues.create",
      "inventory.categories.create",
      "inventory.categories.update",
      "inventory.items.create",
      "inventory.items.update",
      "inventory.variants.create",
      "inventory.variants.update",
      "inventory.adjustments.create",
      "inventory.movements.reverse",
      "inventory.movements.manageDrafts",
    ],
  },
  { role: "auditor", permissions: basePermissions },
  {
    role: "administrador-operacional",
    permissions: [
      ...basePermissions,
      "inventory.entries.create",
      "inventory.issues.create",
      "inventory.items.configureReplenishment",
      "inventory.imports.view",
      "inventory.imports.execute",
    ],
  },
];

test.describe("Módulo de almoxarifado — papéis operacionais", () => {
  for (const actor of roleActors) {
    test(`${actor.role}: navega conforme permissões atribuídas`, async ({
      page,
    }) => {
      await page.context().clearCookies();
      await page.goto("/login");
      await page.getByLabel(/^Matrícula/).fill(adminRegistry);
      await page.getByLabel(/^Senha/).fill(adminPassword);
      await page.getByRole("button", { name: /Entrar/ }).click();
      await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();
      const csrfResponse = await page.request.get("/sanctum/csrf-cookie");
      expect(csrfResponse.status()).toBe(204);
      const impersonateStatus = await page.evaluate(async (role) => {
        const xsrf = document.cookie
          .split("; ")
          .find((entry) => entry.startsWith("XSRF-TOKEN="))
          ?.slice("XSRF-TOKEN=".length);
        const response = await fetch(`/api/v1/e2e/role-login/${role}`, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            ...(xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf) } : {}),
          },
        });

        return response.status;
      }, actor.role);
      expect(impersonateStatus).toBe(200);
      await page.reload();
      await expect(page.getByRole("heading", { name: /Olá/ })).toBeVisible();

      await page.goto("/admin/inventory");
      await expect(
        page.getByRole("heading", { name: "Itens do almoxarifado" }),
      ).toBeVisible();

      const userResponse = await page.request.get("/api/v1/auth/user", {
        headers: { Accept: "application/json" },
      });
      const userData = await userResponse.json();
      expect(userData.data.permissions).toEqual(
        expect.arrayContaining(actor.permissions),
      );

      if (actor.role === "auditor") {
        await page.goto("/admin/inventory/new");
        await expect(page).toHaveURL(/\/403$/);
      } else if (actor.role === "almoxarife") {
        await page.goto("/admin/inventory/adjustments/new");
        await expect(page).toHaveURL(/\/403$/);
      } else {
        await page.goto("/admin/inventory/reports");
        await expect(
          page.getByRole("heading", { name: "Relatórios do almoxarifado" }),
        ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Exportar CSV" }),
        ).toHaveCount(0);
        await expect(
          page.getByRole("button", { name: "Exportar XLSX" }),
        ).toHaveCount(0);
      }

      await page.context().clearCookies();
    });
  }
});
