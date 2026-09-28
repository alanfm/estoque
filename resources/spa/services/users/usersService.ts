import type { ApiResource, ListQuery, Paginated } from "../../types/api";
import type { CreateUserData, UpdateUserData, User } from "../../types/auth";
import { apiRequest } from "../api/client";
import { toListQuery } from "../api/query";

export const usersService = {
  async list(
    query?: ListQuery,
    signal?: AbortSignal,
  ): Promise<Paginated<User>> {
    return apiRequest<Paginated<User>>("/admin/users", {
      query: toListQuery(query),
      signal,
    });
  },

  async get(id: number | string, signal?: AbortSignal): Promise<User> {
    const response = await apiRequest<ApiResource<User>>(`/admin/users/${id}`, {
      signal,
    });

    return response.data;
  },

  async create(data: CreateUserData): Promise<User> {
    const response = await apiRequest<ApiResource<User>>("/admin/users", {
      method: "POST",
      body: data,
    });

    return response.data;
  },

  async update(id: number | string, data: UpdateUserData): Promise<User> {
    const response = await apiRequest<ApiResource<User>>(`/admin/users/${id}`, {
      method: "PATCH",
      body: data,
    });

    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    await apiRequest<void>(`/admin/users/${id}`, { method: "DELETE" });
  },
};
