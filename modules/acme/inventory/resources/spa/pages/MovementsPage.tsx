import { useCallback } from "react";
import { Link } from "react-router";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { movementService } from "../services/movementService";

export default function MovementsPage() {
  const loader = useCallback(
    (signal: AbortSignal) => movementService.list(signal),
    [],
  );
  const { data, loading, error, reload } = useAsync(loader);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações"
        description="Rascunhos, entradas e saídas do almoxarifado."
      />
      <nav className="flex gap-3">
        <Link className="underline" to="/admin/inventory/movements/entry">
          Nova entrada
        </Link>
        <Link className="underline" to="/admin/inventory/movements/issue">
          Nova saída
        </Link>
      </nav>
      {loading && <p role="status">Carregando movimentos…</p>}
      {error && (
        <p role="alert">
          Não foi possível carregar movimentos.{" "}
          <button onClick={reload}>Tentar novamente</button>
        </p>
      )}
      {data?.data.length === 0 && <p>Nenhuma movimentação registrada.</p>}
      {data && data.data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th>Movimento</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((movement) => (
                <tr key={movement.id} className="border-t">
                  <td>
                    <Link
                      className="underline"
                      to={`/admin/inventory/movements/${movement.id}`}
                    >
                      #{movement.id}
                    </Link>
                  </td>
                  <td>{movement.type === "ENTRY" ? "Entrada" : "Saída"}</td>
                  <td>
                    {movement.status === "DRAFT" ? "Rascunho" : movement.status}
                  </td>
                  <td>{movement.occurred_on ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
