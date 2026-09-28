import {
  apiRequest,
  type ApiResource,
  type Paginated,
} from "@starterkit/module-kit";

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

export interface CustomerInput {
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

export const customersService = {
  list(search: string, page: number, signal?: AbortSignal) {
    return apiRequest<Paginated<Customer>>("/customers", {
      query: {
        search,
        page: String(page),
        per_page: "20",
      },
      signal,
    });
  },

  async get(id: number | string, signal?: AbortSignal): Promise<Customer> {
    const response = await apiRequest<ApiResource<Customer>>(
      `/customers/${id}`,
      {
        signal,
      },
    );

    return response.data;
  },

  async create(data: CustomerInput): Promise<Customer> {
    const response = await apiRequest<ApiResource<Customer>>("/customers", {
      method: "POST",
      body: data,
    });

    return response.data;
  },

  async update(id: number | string, data: CustomerInput): Promise<Customer> {
    const response = await apiRequest<ApiResource<Customer>>(
      `/customers/${id}`,
      {
        method: "PATCH",
        body: data,
      },
    );

    return response.data;
  },

  async remove(id: number | string): Promise<void> {
    await apiRequest<void>(`/customers/${id}`, { method: "DELETE" });
  },
};
