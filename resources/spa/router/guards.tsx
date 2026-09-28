import { useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { Spinner } from "../components/feedback/Spinner";
import { can, canAll, canAny } from "../lib/permissions";
import { useSession } from "../stores/session/SessionContext";

function FullPageLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas">
      <Spinner label="Carregando sessão" />
    </div>
  );
}

export function RequireAuth() {
  const { state } = useSession();
  const location = useLocation();

  if (state.status === "unknown" || state.status === "loading") {
    return <FullPageLoading />;
  }

  if (state.status === "guest") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RequireGuest() {
  const { state } = useSession();

  if (state.status === "unknown" || state.status === "loading") {
    return <FullPageLoading />;
  }

  if (state.status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export interface RequirePermissionProps {
  permission?: string;
  any?: string[];
  all?: string[];
  children?: ReactNode;
}

export function RequirePermission({
  permission,
  any,
  all,
  children,
}: RequirePermissionProps) {
  const { state } = useSession();
  const user = state.user;

  const allowed =
    (permission ? can(user, permission) : true) &&
    (any ? canAny(user, any) : true) &&
    (all ? canAll(user, all) : true);

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }

  return children ?? <Outlet />;
}

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} · Starter Kit`;
  }, [title]);
}
