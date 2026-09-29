import { useCallback, useState } from "react";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { can } from "../../../../../../resources/spa/lib/permissions";
import { useSession } from "../../../../../../resources/spa/stores/session/SessionContext";
import {
  importService,
  type ImportBatch,
  type ImportRow,
} from "../services/importService";

export default function ImportsPage() {
  const { state } = useSession();
  const allowed = can(state.user, "inventory.imports.execute");
  const loader = useCallback(
    (signal: AbortSignal) => importService.list(signal),
    [],
  );
  const { data, loading, error, reload } = useAsync(loader);
  const [file, setFile] = useState<File | null>(null);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [mappings, setMappings] = useState<
    Record<
      number,
      { itemId: string; variantId: string; type: "ENTRY" | "ISSUE" }
    >
  >({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function analyze(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await importService.analyze(file);
      setBatch(result);
      await loadBatch(result.id);
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Falha ao analisar a planilha.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function loadBatch(id: number, selectedPage = 1) {
    const result = await importService.detail(id, selectedPage);
    setBatch(result.data);
    setRows(result.rows.data);
    setPage(result.rows.meta.currentPage);
    setLastPage(result.rows.meta.lastPage);
    setMappings(
      Object.fromEntries(
        result.rows.data.map((row) => [
          row.id,
          {
            itemId: String(row.corrected_payload?.itemId ?? ""),
            variantId: String(row.corrected_payload?.variantId ?? ""),
            type: (row.corrected_payload?.type === "ISSUE"
              ? "ISSUE"
              : "ENTRY") as "ENTRY" | "ISSUE",
          },
        ]),
      ),
    );
  }
  async function saveResolutions() {
    if (!batch) return;
    setBusy(true);
    try {
      await importService.resolve(
        batch.id,
        batch.analysis_version,
        rows.map((row) => {
          const mapping = mappings[row.id];
          return {
            id: row.id,
            itemId: Number(mapping?.itemId),
            variantId: Number(mapping?.variantId),
            type: mapping?.type ?? "ENTRY",
          };
        }),
      );
      await loadBatch(batch.id, page);
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar o saneamento.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (
      !batch ||
      !window.confirm(
        "Confirmar a importação? Isso cria movimentos e altera os saldos.",
      )
    )
      return;
    setBusy(true);
    try {
      await importService.commit(batch);
      setMessage("Lote importado.");
      await loadBatch(batch.id);
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : "Falha ao importar o lote.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importação legada"
        description="Analise e revise uma cópia privada antes de qualquer alteração nos saldos."
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: "Importação" },
        ]}
      />
      <p role="note">
        Use somente um XLSX no formato canônico: cabeçalhos type, code, quantity
        e date (AAAA-MM-DD); colunas opcionais category, description, origin,
        document_number, service_order_number e cost. Fórmulas são ignoradas. A
        estrutura da planilha real ainda precisa ser mapeada.
      </p>
      {message && <p role="status">{message}</p>}
      {allowed && (
        <form
          className="flex items-end gap-3"
          onSubmit={(event) => void analyze(event)}
        >
          <label className="grid gap-1">
            Arquivo XLSX
            <input
              type="file"
              accept=".xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" loading={busy} disabled={!file}>
            Enviar e analisar
          </Button>
        </form>
      )}
      {error && (
        <p role="alert">
          Não foi possível listar lotes.{" "}
          <button onClick={reload}>Tentar novamente</button>
        </p>
      )}
      {loading && !data ? (
        <p role="status">Carregando lotes…</p>
      ) : (
        <ul className="space-y-2">
          {(data?.data ?? []).map((entry) => (
            <li key={entry.id} className="flex items-center gap-3">
              <span>
                #{entry.id} — {entry.original_name} — {entry.status}
              </span>
              <Button
                variant="secondary"
                onClick={() => void loadBatch(entry.id)}
              >
                Abrir prévia
              </Button>
            </li>
          ))}
        </ul>
      )}
      {batch && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Prévia do lote #{batch.id} · {batch.status}
          </h2>
          <p>
            Linhas {page} de {lastPage}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Aba / linha</th>
                  <th>Dados fonte</th>
                  <th>Item ID</th>
                  <th>Variante ID</th>
                  <th>Tipo</th>
                  <th>Erros</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.sheet_name} / {row.row_number}
                    </td>
                    <td>
                      <code>
                        {JSON.stringify(
                          row.corrected_payload ?? row.source_payload,
                        )}
                      </code>
                    </td>
                    <td>
                      <input
                        aria-label={`Item da linha ${row.row_number}`}
                        inputMode="numeric"
                        value={mappings[row.id]?.itemId ?? ""}
                        onChange={(event) =>
                          setMappings((current) => ({
                            ...current,
                            [row.id]: {
                              ...current[row.id],
                              itemId: event.target.value,
                              variantId: current[row.id]?.variantId ?? "",
                              type: current[row.id]?.type ?? "ENTRY",
                            },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`Variante da linha ${row.row_number}`}
                        inputMode="numeric"
                        value={mappings[row.id]?.variantId ?? ""}
                        onChange={(event) =>
                          setMappings((current) => ({
                            ...current,
                            [row.id]: {
                              ...current[row.id],
                              itemId: current[row.id]?.itemId ?? "",
                              variantId: event.target.value,
                              type: current[row.id]?.type ?? "ENTRY",
                            },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`Tipo da linha ${row.row_number}`}
                        value={mappings[row.id]?.type ?? "ENTRY"}
                        onChange={(event) =>
                          setMappings((current) => ({
                            ...current,
                            [row.id]: {
                              ...current[row.id],
                              itemId: current[row.id]?.itemId ?? "",
                              variantId: current[row.id]?.variantId ?? "",
                              type: event.target.value as "ENTRY" | "ISSUE",
                            },
                          }))
                        }
                      >
                        <option value="ENTRY">Entrada</option>
                        <option value="ISSUE">Saída</option>
                      </select>
                    </td>
                    <td>{row.errors?.join("; ") ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={page <= 1}
              onClick={() => void loadBatch(batch.id, page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              disabled={page >= lastPage}
              onClick={() => void loadBatch(batch.id, page + 1)}
            >
              Próxima
            </Button>
          </div>
          {allowed && batch.status !== "IMPORTED" && (
            <Button
              variant="secondary"
              loading={busy}
              onClick={() => void saveResolutions()}
            >
              Salvar mapeamento desta página
            </Button>
          )}
          {allowed && batch.status === "READY" && (
            <Button loading={busy} onClick={() => void commit()}>
              Confirmar importação
            </Button>
          )}
        </section>
      )}
    </div>
  );
}
