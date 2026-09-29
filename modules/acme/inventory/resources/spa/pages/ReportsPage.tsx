import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { Pagination } from "../../../../../../resources/spa/components/navigation/Pagination";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { useSession } from "../../../../../../resources/spa/stores/session/SessionContext";
import { can } from "../../../../../../resources/spa/lib/permissions";
import { reportsService, type ReportType } from "../services/reportsService";

const titles: Record<ReportType, string> = {
  stock: "Posição de estoque",
  replenishment: "Reposição",
  consumption: "Consumo",
  adjustments: "Ajustes e estornos",
};

export default function ReportsPage() {
  const { state } = useSession();
  const canExport = can(state.user, "inventory.reports.export");
  const [params, setParams] = useSearchParams();
  const [type, setType] = useState<ReportType>("stock");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const groupBy = params.get("groupBy") ?? "item";
  const itemId = params.get("itemId") ?? "";
  const categoryId = params.get("categoryId") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const filters = useMemo(
    () => ({ from, to, groupBy, itemId, categoryId, page, perPage: 20 }),
    [from, to, groupBy, itemId, categoryId, page],
  );
  const loader = useCallback(
    (signal: AbortSignal) => reportsService.report(type, filters, signal),
    [type, filters],
  );
  const { data, loading, error, reload } = useAsync(loader);
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next, { replace: true });
  }
  async function download(format: "csv" | "xlsx") {
    setExporting(true);
    setMessage("");
    try {
      await reportsService.export(type, filters, format);
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Falha ao exportar relatório.",
      );
    } finally {
      setExporting(false);
    }
  }
  const headers = data?.data[0] ? Object.keys(data.data[0]) : [];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios do almoxarifado"
        description="Consulte e exporte relatórios com filtros aplicados."
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: "Relatórios" },
        ]}
      />
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          Relatório
          <select
            className="mt-1 block rounded border p-2"
            value={type}
            onChange={(event) => setType(event.target.value as ReportType)}
          >
            {Object.entries(titles).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {(type === "consumption" || type === "adjustments") && (
          <>
            <label>
              De{" "}
              <input
                type="date"
                value={from}
                onChange={(event) => setFilter("from", event.target.value)}
                className="ml-2 rounded border p-2"
              />
            </label>
            <label>
              Até{" "}
              <input
                type="date"
                value={to}
                onChange={(event) => setFilter("to", event.target.value)}
                className="ml-2 rounded border p-2"
              />
            </label>
          </>
        )}
        {type === "consumption" && (
          <label className="block">
            Agrupar por
            <select
              className="mt-1 block rounded border p-2"
              value={groupBy}
              onChange={(event) => setFilter("groupBy", event.target.value)}
            >
              <option value="item">Item</option>
              <option value="category">Categoria</option>
              <option value="serviceOrderNumber">Ordem de serviço</option>
              <option value="month">Mês</option>
            </select>
          </label>
        )}
        <label>
          ID do item
          <input
            type="number"
            min="1"
            value={itemId}
            onChange={(event) => setFilter("itemId", event.target.value)}
            className="ml-2 rounded border p-2"
          />
        </label>
        <label>
          ID da categoria
          <input
            type="number"
            min="1"
            value={categoryId}
            onChange={(event) => setFilter("categoryId", event.target.value)}
            className="ml-2 rounded border p-2"
          />
        </label>
        {canExport && (
          <>
            <Button
              variant="secondary"
              loading={exporting}
              onClick={() => void download("csv")}
            >
              Exportar CSV
            </Button>
            <Button
              variant="secondary"
              loading={exporting}
              onClick={() => void download("xlsx")}
            >
              Exportar XLSX
            </Button>
          </>
        )}
      </div>
      {type === "stock" && (
        <p className="text-sm text-slate-600">
          Custo histórico conhecido de entradas; não representa avaliação
          financeira do saldo. Quantidades permanecem separadas por unidade.
        </p>
      )}
      {message && <p role="alert">{message}</p>}
      {loading && !data ? (
        <p role="status">Carregando relatório…</p>
      ) : error ? (
        <p role="alert">
          Não foi possível carregar o relatório.{" "}
          <button onClick={reload}>Tentar novamente</button>
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            {data?.meta.total ?? 0} linhas · referência {data?.asOf ?? "—"}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th className="p-2" key={header}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data.map((row, index) => (
                  <tr className="border-t" key={index}>
                    {headers.map((header) => (
                      <td className="p-2" key={header}>
                        {formatValue(row[header])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.data.length === 0 && (
              <p>Nenhum resultado para os filtros selecionados.</p>
            )}
          </div>
          {data && (
            <Pagination
              meta={data.meta}
              onPageChange={(nextPage) => {
                const next = new URLSearchParams(params);
                next.set("page", String(nextPage));
                setParams(next);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
