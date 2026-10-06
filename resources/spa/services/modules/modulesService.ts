import { apiRequest } from "../api/client";

export interface InstalledModule {
  name: string;
  displayName: string;
  version: string;
  core: string;
  enabled: boolean;
  issues: string[];
  dependencies: { name: string; version: string }[];
}

export const modulesService = {
  list: (signal?: AbortSignal) =>
    apiRequest<{
      data: InstalledModule[];
      meta: {
        coreVersion: string;
        managementEnabled: boolean;
        issues: string[];
      };
    }>("/admin/modules", { signal }),
  install: (repository: string) =>
    apiRequest<void>("/admin/modules", {
      method: "POST",
      body: { repository },
    }),
  enable: (name: string) =>
    apiRequest<void>(`/admin/modules/${encodeURIComponent(name)}/enable`, {
      method: "POST",
    }),
  disable: (name: string) =>
    apiRequest<void>(`/admin/modules/${encodeURIComponent(name)}/disable`, {
      method: "POST",
    }),
  remove: (name: string) =>
    apiRequest<void>(`/admin/modules/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),
};
