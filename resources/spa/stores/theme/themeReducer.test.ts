import { afterEach, describe, expect, test, vi } from "vitest";
import {
  readStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  themeReducer,
} from "./themeReducer";

afterEach(() => {
  window.localStorage.clear();
});

describe("themeReducer", () => {
  test("setPreference resolve o tema explícito", () => {
    const state = themeReducer(
      { preference: "system", resolved: "light" },
      { type: "setPreference", preference: "dark" },
    );

    expect(state).toEqual({ preference: "dark", resolved: "dark" });
  });

  test("setResolved altera apenas o tema resolvido", () => {
    const state = themeReducer(
      { preference: "system", resolved: "light" },
      { type: "setResolved", resolved: "dark" },
    );

    expect(state).toEqual({ preference: "system", resolved: "dark" });
  });
});

describe("preferência persistida", () => {
  test("padrão é system", () => {
    expect(readStoredPreference()).toBe("system");
  });

  test("lê valor persistido válido", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(readStoredPreference()).toBe("dark");
  });

  test("ignora valor inválido", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "blue");
    expect(readStoredPreference()).toBe("system");
  });

  test("resolve tema explícito sem consultar o sistema", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
});

describe("resolveTheme no sistema", () => {
  test("segue prefers-color-scheme", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    expect(resolveTheme("system")).toBe("dark");
    vi.unstubAllGlobals();
  });
});
