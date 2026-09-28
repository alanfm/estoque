import { useCallback } from "react";
import { useAsync } from "./useAsync";
import { rolesService } from "../services/roles/rolesService";
import type { Role } from "../types/auth";

export function useRoleOptions(enabled: boolean): {
  roles: Role[];
  loading: boolean;
} {
  const loader = useCallback(
    (signal: AbortSignal) =>
      rolesService.list({ perPage: 100, sort: "name" }, signal),
    [],
  );

  const { data, loading } = useAsync(loader, enabled);

  return { roles: data?.data ?? [], loading };
}
