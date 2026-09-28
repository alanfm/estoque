export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
}

export type ThemeAction =
  | { type: "setPreference"; preference: ThemePreference }
  | { type: "setResolved"; resolved: ResolvedTheme };

export const THEME_STORAGE_KEY = "starterkit.theme";

export function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? systemTheme() : preference;
}

export function themeReducer(
  state: ThemeState,
  action: ThemeAction,
): ThemeState {
  switch (action.type) {
    case "setPreference":
      return {
        preference: action.preference,
        resolved: resolveTheme(action.preference),
      };
    case "setResolved":
      return { ...state, resolved: action.resolved };
  }
}
