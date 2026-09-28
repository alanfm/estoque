import type { ListQuery } from "../../types/api";
import type { QueryValue } from "./client";

export function toListQuery(query?: ListQuery): Record<string, QueryValue> {
  const params: Record<string, QueryValue> = {};

  if (query?.page) params.page = query.page;
  if (query?.perPage) params.perPage = query.perPage;
  if (query?.sort) params.sort = query.sort;

  for (const [key, value] of Object.entries(query?.filter ?? {})) {
    if (value !== undefined && value !== "") {
      params[`filter[${key}]`] = value;
    }
  }

  return params;
}
