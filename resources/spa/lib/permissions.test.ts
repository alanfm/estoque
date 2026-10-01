import { describe, expect, test } from "vitest";
import { can, canAll, canAny } from "./permissions";
import type { SessionUser } from "../types/auth";

const user: SessionUser = {
  id: 1,
  name: "Ana",
  email: "ana@example.com",
  roles: ["admin"],
  permissions: ["users.viewAny", "users.create"],
  isSuperAdmin: false,
};

describe("helpers de permissão", () => {
  test("can verifica uma permissão presente", () => {
    expect(can(user, "users.create")).toBe(true);
    expect(can(user, "users.delete")).toBe(false);
  });

  test("can retorna falso sem usuário", () => {
    expect(can(null, "users.viewAny")).toBe(false);
  });

  test("superadministrador permite permissões independentemente do catálogo", () => {
    const superAdmin: SessionUser = {
      ...user,
      roles: ["super-admin"],
      permissions: [],
      isSuperAdmin: true,
    };

    expect(can(superAdmin, "inventory.imports.execute")).toBe(true);
    expect(canAny(superAdmin, ["not.in.catalog"])).toBe(true);
    expect(canAll(superAdmin, ["one", "two"])).toBe(true);
  });

  test("canAny aceita ao menos uma permissão", () => {
    expect(canAny(user, ["users.delete", "users.create"])).toBe(true);
    expect(canAny(user, ["roles.viewAny", "users.delete"])).toBe(false);
  });

  test("canAll exige todas as permissões", () => {
    expect(canAll(user, ["users.viewAny", "users.create"])).toBe(true);
    expect(canAll(user, ["users.viewAny", "users.delete"])).toBe(false);
  });
});
