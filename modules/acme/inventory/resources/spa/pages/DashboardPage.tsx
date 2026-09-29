import { useCallback } from "react";
import { useSearchParams, Link } from "react-router";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { reportsService } from "../services/reportsService";

const cards = [
  ["activeItems", "Itens ativos"],
  ["inconsistentItems", "Itens inconsistentes"],
  ["outOfStockItems", "Sem estoque"],
  ["itemsWithoutMinimum", "Sem mínimo configurado"],
  ["replenishmentAlerts", "Alertas de reposição"],
  ["entryUnits", "Unidades recebidas no período"],
  ["issueUnits", "Unidades consumidas no período"],
] as const;

export default function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const loader = useCallback(
    (signal: AbortSignal) => reportsService.dashboard({ from, to }, signal),
    [from, to],
  );
  const { data, loading, error, reload } = useAsync(loader);
  function change(key: "from" | "to", value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel do almoxarifado"
        description="Posição do estoque e movimentações do período selecionado."
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: "Painel" },
        ]}
        actions={
          <Link className="underline" to="/admin/inventory/reports">
            Abrir relatórios
          </Link>
        }
      />
      <div className="flex flex-wrap gap-4">
        <label>
          De{" "}
          <input
            type="date"
            value={from}
            onChange={(event) => change("from", event.target.value)}
            className="ml-2 rounded border p-2"
          />
        </label>
        <label>
          Até{" "}
          <input
            type="date"
            value={to}
            onChange={(event) => change("to", event.target.value)}
            className="ml-2 rounded border p-2"
          />
        </label>
      </div>
      {loading && !data ? (
        <p role="status">Carregando painel…</p>
      ) : error || !data ? (
        <p role="alert">
          Não foi possível carregar o painel.{" "}
          <button onClick={reload}>Tentar novamente</button>
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Referência: {String(data.data.asOf)}
          </p>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map(([key, label]) => (
              <div className="rounded border p-4" key={key}>
                <dt className="text-sm text-slate-600">{label}</dt>
                <dd className="text-2xl font-semibold">
                  {String(data.data[key] ?? 0)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  );
}
