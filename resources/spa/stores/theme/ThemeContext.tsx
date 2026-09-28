import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  readStoredPreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  themeReducer,
  type ResolvedTheme,
  type ThemePreference,
} from "./themeReducer";

export interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference(preference: ThemePreference): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(themeReducer, undefined, () => {
    const preference = readStoredPreference();
    return { preference, resolved: resolveTheme(preference) };
  });

  useEffect(() => {
    document.documentElement.dataset.theme = state.resolved;
  }, [state.resolved]);

  useEffect(() => {
    if (state.preference !== "system" || !window.matchMedia) return;

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      dispatch({
        type: "setResolved",
        resolved: event.matches ? "dark" : "light",
      });
    };

    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [state.preference]);

  const setPreference = useCallback((preference: ThemePreference) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    dispatch({ type: "setPreference", preference });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference: state.preference,
      resolved: state.resolved,
      setPreference,
    }),
    [state.preference, state.resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider.");
  }

  return context;
}
