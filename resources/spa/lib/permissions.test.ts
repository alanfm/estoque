import { describe, expect, test } from "vitest";
import { can, canAll, canAny } from "./permissions";
import type { SessionUser } from "../types/auth";

const user: SessionUser = {
  id: 1,
  name: "Ana",
  email: "ana@example.com",
  roles: ["admin"],
  permissions: ["users.viewAny", "users.create"],
};

describe("helpers de permissão", () => {
  test("can verifica uma permissão presente", () => {
    expect(can(user, "users.create")).toBe(true);
    expect(can(user, "users.delete")).toBe(false);
  });

  test("can retorna falso sem usuário", () => {
    expect(can(null, "users.viewAny")).toBe(false);
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
