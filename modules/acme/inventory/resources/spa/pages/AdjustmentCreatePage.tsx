import { useCallback, useMemo, useState } from "react";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { Field } from "../../../../../../resources/spa/components/forms/Field";
import { Input } from "../../../../../../resources/spa/components/forms/Input";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { catalogService } from "../services/catalogService";
import { movementService } from "../services/movementService";

export default function AdjustmentCreatePage() {
  const loader = useCallback(
    (signal: AbortSignal) => catalogService.items("", 1, "", signal, 100),
    [],
  );
  const { data, loading, error, reload } = useAsync(loader);
  const variants = useMemo(
    () =>
      data?.data.flatMap((item) =>
        item.variants.map((variant) => ({
          item,
          variant,
          balance: variant.balances?.[0],
        })),
      ) ?? [],
    [data],
  );
  const [variantId, setVariantId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selected =
    variants.find(({ variant }) => variant.id === variantId) ?? variants[0];
  const [selectedCount, setSelectedCount] = useState("");
  const delta = selected
    ? Number(selectedCount || 0) - (selected.balance?.quantity ?? 0)
    : 0;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected?.balance) {
      setMessage(
        "Saldo/local indisponível; recarregue os dados antes de contar.",
      );
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const result = await movementService.adjust({
        locationId: selected.balance.locationId,
        variantId: selected.variant.id,
        countedQuantity: Number(form.get("countedQuantity")),
        expectedBalanceVersion: selected.balance.version,
        reason: String(form.get("reason")),
      });
      setMessage(`Contagem registrada. Diferença aplicada: ${result.delta}.`);
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível registrar a contagem.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contagem e ajuste"
        description="Informe o saldo físico conferido. A diferença será registrada no livro."
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: "Contagem" },
        ]}
      />
      {message && <p role="status">{message}</p>}
      {loading && <p role="status">Carregando saldos…</p>}
      {error && (
        <p role="alert">
          Não foi possível carregar saldos.{" "}
          <button onClick={reload}>Tentar novamente</button>
        </p>
      )}
      {variants.length > 0 && (
        <form
          className="grid max-w-2xl gap-4"
          onSubmit={(event) => void submit(event)}
        >
          <Field id="variantId" label="Variante" required>
            <select
              id="variantId"
              value={selected?.variant.id ?? ""}
              onChange={(event) => {
                setVariantId(event.target.value);
                setSelectedCount("");
              }}
              className="w-full rounded border p-2"
            >
              {variants.map(({ item, variant }) => (
                <option key={variant.id} value={variant.id}>
                  {item.code} — {item.name} / {variant.brand ?? ""}{" "}
                  {variant.model ?? ""} {variant.description}
                </option>
              ))}
            </select>
          </Field>
          <p>
            Saldo atual:{" "}
            <strong>{selected?.balance?.quantity ?? "indisponível"}</strong>
          </p>
          <Field id="countedQuantity" label="Quantidade contada" required>
            <Input
              id="countedQuantity"
              name="countedQuantity"
              type="number"
              min="0"
              step="1"
              required
              value={selectedCount}
              onChange={(event) => setSelectedCount(event.target.value)}
            />
          </Field>
          <p>
            Prévia da diferença: {delta > 0 ? "+" : ""}
            {delta}
          </p>
          <Field id="reason" label="Motivo" required>
            <textarea
              id="reason"
              name="reason"
              required
              maxLength={5000}
              className="w-full rounded border p-2"
            />
          </Field>
          <p className="text-sm">
            Se o saldo mudar após a leitura, a contagem será rejeitada e será
            necessário atualizar os dados.
          </p>
          <div>
            <Button type="submit" loading={busy}>
              Registrar contagem
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
