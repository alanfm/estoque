import {
  apiRequest,
  type ApiResource,
  type Paginated,
} from "@starterkit/module-kit";

export interface Category {
  id: string;
  name: string;
  active: boolean;
  version: number;
}
export interface Variant {
  id: string;
  itemId: string;
  brand: string | null;
  model: string | null;
  description: string;
  active: boolean;
  version: number;
  balances?: { locationId: string; quantity: number; version: number }[];
}
export interface Item {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: "UN" | "PAR" | "CX";
  active: boolean;
  version: number;
  category?: { id: string; name: string };
  minimumStock: number | null;
  purchaseLeadTimeDays: number | null;
  safetyStock: number | null;
  recommendationWindowDays: number;
  variants: Variant[];
}

export const catalogService = {
  categories(search = "", signal?: AbortSignal) {
    return apiRequest<Paginated<Category>>("/inventory/categories", {
      query: { search, perPage: "100" },
      signal,
    });
  },
  async createCategory(name: string) {
    return (
      await apiRequest<ApiResource<Category>>("/inventory/categories", {
        method: "POST",
        body: { name },
      })
    ).data;
  },
  async updateCategory(category: Category, name: string, active: boolean) {
    return (
      await apiRequest<ApiResource<Category>>(
        `/inventory/categories/${category.id}`,
        { method: "PATCH", body: { name, active, version: category.version } },
      )
    ).data;
  },
  items(
    search = "",
    page = 1,
    categoryId = "",
    signal?: AbortSignal,
    perPage = 20,
  ) {
    return apiRequest<Paginated<Item>>("/inventory/items", {
      query: {
        search,
        page: String(page),
        perPage: String(perPage),
        categoryId,
      },
      signal,
    });
  },
  async item(id: string, signal?: AbortSignal) {
    return (
      await apiRequest<ApiResource<Item>>(`/inventory/items/${id}`, { signal })
    ).data;
  },
  async createItem(input: {
    code: string;
    categoryId: string;
    name: string;
    description: string | null;
    unit: string;
  }) {
    return (
      await apiRequest<ApiResource<Item>>("/inventory/items", {
        method: "POST",
        body: input,
      })
    ).data;
  },
  async updateItem(
    item: Item,
    input: {
      code: string;
      categoryId: string;
      name: string;
      description: string | null;
      unit: string;
      active: boolean;
    },
  ) {
    return (
      await apiRequest<ApiResource<Item>>(`/inventory/items/${item.id}`, {
        method: "PATCH",
        body: { ...input, version: item.version },
      })
    ).data;
  },
  async createVariant(
    itemId: string,
    input: { brand: string | null; model: string | null; description: string },
  ) {
    return (
      await apiRequest<ApiResource<Variant>>(
        `/inventory/items/${itemId}/variants`,
        { method: "POST", body: input },
      )
    ).data;
  },
  async updateVariant(variant: Variant, active: boolean) {
    return (
      await apiRequest<ApiResource<Variant>>(
        `/inventory/variants/${variant.id}`,
        {
          method: "PATCH",
          body: {
            brand: variant.brand,
            model: variant.model,
            description: variant.description,
            active,
            version: variant.version,
          },
        },
      )
    ).data;
  },
};
