import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { LoginCredentials, SessionUser } from "../../types/auth";
import { authService } from "../../services/auth/authService";
import { ApiError } from "../../services/api/errors";
import {
  initialSessionState,
  sessionReducer,
  type SessionState,
} from "./sessionReducer";

export interface SessionContextValue {
  state: SessionState;
  isAuthenticated: boolean;
  login(credentials: LoginCredentials): Promise<SessionUser>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  syncProfile(password: string): Promise<SessionUser>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);

  const refresh = useCallback(async () => {
    dispatch({ type: "loading" });

    try {
      const user = await authService.currentUser();
      dispatch({ type: "authenticated", user });
    } catch (error) {
      if (error instanceof ApiError && error.kind === "unauthorized") {
        dispatch({ type: "guest" });
        return;
      }

      if (error instanceof Error && error.name === "AbortError") return;

      dispatch({ type: "guest" });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const user = await authService.login(credentials);
    dispatch({ type: "authenticated", user });
    return user;
  }, []);

  const syncProfile = useCallback(async (password: string) => {
    const user = await authService.syncProfile(password);
    dispatch({ type: "authenticated", user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      dispatch({ type: "guest" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUnauthorized = () => dispatch({ type: "guest" });
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("auth:csrf-expired", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("auth:csrf-expired", handleUnauthorized);
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      isAuthenticated: state.status === "authenticated",
      login,
      logout,
      refresh,
      syncProfile,
    }),
    [state, login, logout, refresh, syncProfile],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession deve ser usado dentro de SessionProvider.");
  }

  return context;
}

export function useCurrentUser(): SessionUser | null {
  return useSession().state.user;
}
