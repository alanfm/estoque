import { describe, expect, test } from "vitest";
import { initialSessionState, sessionReducer } from "./sessionReducer";

const user = {
  id: 1,
  name: "Ana",
  email: "ana@example.com",
  roles: ["admin"],
  permissions: ["users.viewAny"],
  isSuperAdmin: false,
};

describe("sessionReducer", () => {
  test("começa em unknown", () => {
    expect(initialSessionState.status).toBe("unknown");
    expect(initialSessionState.user).toBeNull();
  });

  test("transita unknown -> loading -> authenticated", () => {
    const loading = sessionReducer(initialSessionState, { type: "loading" });
    expect(loading).toEqual({ status: "loading", user: null });

    const authenticated = sessionReducer(loading, {
      type: "authenticated",
      user,
    });
    expect(authenticated).toEqual({ status: "authenticated", user });
  });

  test("transita para guest limpando o usuário", () => {
    const state = sessionReducer(
      { status: "authenticated", user },
      { type: "guest" },
    );
    expect(state).toEqual({ status: "guest", user: null });
  });
});
