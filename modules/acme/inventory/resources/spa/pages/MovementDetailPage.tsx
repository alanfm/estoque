import { useCallback, useState } from "react";
import { Link, useParams } from "react-router";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { movementService } from "../services/movementService";

export default function MovementDetailPage() {
  const { id = "" } = useParams();
  const loader = useCallback(
    (signal: AbortSignal) => movementService.get(id, signal),
    [id],
  );
  const { data: movement, loading, error, reload } = useAsync(loader);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function cancel() {
    if (!movement) return;
    setBusy(true);
    setMessage("");
    try {
      await movementService.cancel(movement.id);
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível descartar o rascunho.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading && !movement)
    return <p role="status">Carregando movimentação…</p>;
  if (error || !movement)
    return (
      <p role="alert">
        Não foi possível carregar o movimento.{" "}
        <button onClick={reload}>Tentar novamente</button>
      </p>
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title={`${movement.type === "ENTRY" ? "Entrada" : "Saída"} #${movement.id}`}
        breadcrumbs={[
          { label: "Movimentos", to: "/admin/inventory/movements" },
          { label: `#${movement.id}` },
        ]}
      />
      {message && <p role="alert">{message}</p>}
      <dl className="grid max-w-2xl grid-cols-2 gap-3">
        <dt>Estado</dt>
        <dd>{movement.status}</dd>
        <dt>Data do fato</dt>
        <dd>{movement.occurred_on ?? "Não informada"}</dd>
        <dt>Finalidade</dt>
        <dd>{movement.description || "Não informada"}</dd>
        <dt>OS</dt>
        <dd>{movement.service_order_number || "Não informada"}</dd>
        <dt>Documento</dt>
        <dd>{movement.document_number || "Não informado"}</dd>
        <dt>Observações</dt>
        <dd>{movement.observations || "—"}</dd>
      </dl>
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Linhas</h2>
        {movement.lines.length === 0 ? (
          <p>Rascunho sem linhas.</p>
        ) : (
          <ul className="space-y-2">
            {movement.lines.map((line) => (
              <li key={line.id} className="rounded border p-3">
                {line.snapshot.code} — {line.snapshot.itemName}: {line.quantity}{" "}
                {line.snapshot.unit}{" "}
                <small>
                  (
                  {[
                    line.snapshot.brand,
                    line.snapshot.model,
                    line.snapshot.description,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  )
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
      {movement.status === "DRAFT" && (
        <div className="flex gap-3">
          <Button variant="danger" loading={busy} onClick={() => void cancel()}>
            Descartar rascunho
          </Button>
          <span className="self-center text-sm">
            Confirmação de estoque será habilitada após a validação das regras
            de concorrência e data.
          </span>
        </div>
      )}
      <Link className="underline" to="/admin/inventory/movements">
        Voltar à lista
      </Link>
    </div>
  );
}
