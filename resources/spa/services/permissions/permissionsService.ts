import type { ApiResource } from "../../types/api";
import type { Permission } from "../../types/auth";
import { apiRequest } from "../api/client";

export const permissionsService = {
  async list(signal?: AbortSignal): Promise<Permission[]> {
    const response = await apiRequest<ApiResource<Permission[]>>(
      "/admin/permissions",
      { signal },
    );

    return response.data;
  },
};
