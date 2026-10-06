import type { SessionUser } from "../types/auth";

/** Exceção centralizada, equivalente ao bypass do Gate no backend. */
export function isSuperAdmin(user: SessionUser | null): boolean {
  return (
    user?.isSuperAdmin === true ||
    (user?.roles?.includes("super-admin") ?? false)
  );
}

export function can(user: SessionUser | null, permission: string): boolean {
  return (
    isSuperAdmin(user) || (user?.permissions.includes(permission) ?? false)
  );
}

export function canAny(
  user: SessionUser | null,
  permissions: readonly string[],
): boolean {
  return (
    isSuperAdmin(user) ||
    permissions.some((permission) => can(user, permission))
  );
}

export function canAll(
  user: SessionUser | null,
  permissions: readonly string[],
): boolean {
  return (
    isSuperAdmin(user) ||
    permissions.every((permission) => can(user, permission))
  );
}
