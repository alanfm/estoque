import type { ApiResource, ListQuery, Paginated } from "../../types/api";
import type { CreateRoleData, Role, UpdateRoleData } from "../../types/auth";
import { apiRequest } from "../api/client";
import { toListQuery } from "../api/query";

export const rolesService = {
  async list(
    query?: ListQuery,
    signal?: AbortSignal,
  ): Promise<Paginated<Role>> {
    return apiRequest<Paginated<Role>>("/admin/roles", {
      query: toListQuery(query),
      signal,
    });
  },

  async get(id: number | string, signal?: AbortSignal): Promise<Role> {
    const response = await apiRequest<ApiResource<Role>>(`/admin/roles/${id}`, {
      signal,
    });

    return response.data;
  },

  async create(data: CreateRoleData): Promise<Role> {
    const response = await apiRequest<ApiResource<Role>>("/admin/roles", {
      method: "POST",
      body: data,
    });

    return response.data;
  },

  async update(id: number | string, data: UpdateRoleData): Promise<Role> {
    const response = await apiRequest<ApiResource<Role>>(`/admin/roles/${id}`, {
      method: "PATCH",
      body: data,
    });

    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    await apiRequest<void>(`/admin/roles/${id}`, { method: "DELETE" });
  },
};
