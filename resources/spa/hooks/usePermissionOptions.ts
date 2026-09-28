import { useCallback } from "react";
import { useAsync } from "./useAsync";
import { permissionsService } from "../services/permissions/permissionsService";
import type { Permission } from "../types/auth";

export function usePermissionOptions(enabled: boolean): {
  permissions: Permission[];
  loading: boolean;
} {
  const loader = useCallback(
    (signal: AbortSignal) => permissionsService.list(signal),
    [],
  );

  const { data, loading } = useAsync(loader, enabled);

  return { permissions: data ?? [], loading };
}
