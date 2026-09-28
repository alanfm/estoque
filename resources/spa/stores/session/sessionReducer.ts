import type { SessionUser } from "../../types/auth";

export type SessionStatus = "unknown" | "loading" | "authenticated" | "guest";

export interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
}

export type SessionAction =
  | { type: "loading" }
  | { type: "authenticated"; user: SessionUser }
  | { type: "guest" };

export const initialSessionState: SessionState = {
  status: "unknown",
  user: null,
};

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "loading":
      return { status: "loading", user: null };
    case "authenticated":
      return { status: "authenticated", user: action.user };
    case "guest":
      return { status: "guest", user: null };
  }
}
