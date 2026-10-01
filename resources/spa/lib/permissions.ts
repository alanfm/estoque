import type { SessionUser } from "../types/auth";

export function can(user: SessionUser | null, permission: string): boolean {
  return (
    user?.isSuperAdmin === true ||
    (user?.permissions.includes(permission) ?? false)
  );
}

export function canAny(
  user: SessionUser | null,
  permissions: readonly string[],
): boolean {
  return permissions.some((permission) => can(user, permission));
}

export function canAll(
  user: SessionUser | null,
  permissions: readonly string[],
): boolean {
  return permissions.every((permission) => can(user, permission));
}
