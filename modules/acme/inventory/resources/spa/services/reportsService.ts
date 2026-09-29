import {
  apiDownload,
  apiRequest,
  type Paginated,
} from "@starterkit/module-kit";

export type ReportType =
  "stock" | "replenishment" | "consumption" | "adjustments";
export type ReportFilters = {
  from?: string;
  to?: string;
  itemId?: string;
  categoryId?: string;
  groupBy?: string;
  page?: number;
  perPage?: number;
};

export const reportsService = {
  dashboard(filters: Pick<ReportFilters, "from" | "to">, signal?: AbortSignal) {
    return apiRequest<{ data: Record<string, string | number | object> }>(
      "/inventory/dashboard",
      { query: filters, signal },
    );
  },
  report(type: ReportType, filters: ReportFilters, signal?: AbortSignal) {
    return apiRequest<Paginated<Record<string, unknown>> & { asOf: string }>(
      `/inventory/reports/${type}`,
      { query: filters, signal },
    );
  },
  async export(
    type: ReportType,
    filters: ReportFilters,
    format: "csv" | "xlsx",
  ) {
    const blob = await apiDownload(`/inventory/exports/${type}`, {
      query: { ...filters, format },
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `inventory-${type}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
