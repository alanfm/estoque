import { useCallback, useState } from "react";
import { useParams } from "react-router";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { Field } from "../../../../../../resources/spa/components/forms/Field";
import { Input } from "../../../../../../resources/spa/components/forms/Input";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import {
  catalogService,
  type Variant,
  type ReplenishmentRecommendation,
} from "../services/catalogService";
import { can } from "../../../../../../resources/spa/lib/permissions";
import { useSession } from "../../../../../../resources/spa/stores/session/SessionContext";

export default function ItemDetailPage() {
  const { state } = useSession();
  const canEditItem = can(state.user, "inventory.items.update");
  const canCreateVariant = can(state.user, "inventory.variants.create");
  const canUpdateVariant = can(state.user, "inventory.variants.update");
  const { id = "" } = useParams();
  const loader = useCallback(
    (signal: AbortSignal) => catalogService.item(id, signal),
    [id],
  );
  const { data: item, loading, error, reload } = useAsync(loader);
  const categoryLoader = useCallback(
    (signal: AbortSignal) => catalogService.categories("", signal),
    [],
  );
  const { data: categories } = useAsync(categoryLoader);
  const replenishmentLoader = useCallback(
    async (signal: AbortSignal) =>
      (await catalogService.replenishment(id, signal)).data,
    [id],
  );
  const {
    data: recommendation,
    loading: replenishmentLoading,
    error: replenishmentError,
    reload: reloadReplenishment,
  } = useAsync<ReplenishmentRecommendation>(replenishmentLoader);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      await catalogService.updateItem(item, {
        code: String(form.get("code")),
        categoryId: String(form.get("categoryId")),
        name: String(form.get("name")),
        description: String(form.get("description")) || null,
        unit: String(form.get("unit")),
        active: form.get("active") === "on",
      });
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível atualizar o item.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function createVariant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setMessage("");
    try {
      await catalogService.createVariant(id, {
        brand: String(form.get("brand")) || null,
        model: String(form.get("model")) || null,
        description: String(form.get("variantDescription")),
      });
      event.currentTarget.reset();
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível criar a variante.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function toggleVariant(variant: Variant) {
    try {
      await catalogService.updateVariant(variant, !variant.active);
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível atualizar a variante.",
      );
    }
  }
  async function saveReplenishment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item) return;
    const form = new FormData(event.currentTarget);
    const numberOrNull = (key: string) => {
      const value = String(form.get(key) ?? "").trim();
      return value === "" ? null : Number(value);
    };
    setSaving(true);
    setMessage("");
    try {
      await catalogService.configureReplenishment(item, {
        minimumStock: numberOrNull("minimumStock"),
        purchaseLeadTimeDays: numberOrNull("purchaseLeadTimeDays"),
        safetyStock: numberOrNull("safetyStock"),
        recommendationWindowDays: Number(form.get("recommendationWindowDays")),
      });
      reload();
      reloadReplenishment();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar os parâmetros de reposição.",
      );
    } finally {
      setSaving(false);
    }
  }
  if (loading && !item) return <p role="status">Carregando item…</p>;
  if (error || !item)
    return (
      <p role="alert">
        Não foi possível carregar o item.{" "}
        <button onClick={reload}>Tentar novamente</button>
      </p>
    );
  return (
    <div className="space-y-8">
      <PageHeader
        title={`${item.code} — ${item.name}`}
        description={item.category?.name}
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: item.code },
        ]}
      />
      {message && <p role="alert">{message}</p>}
      <section
        className="space-y-4 rounded border p-4"
        aria-labelledby="replenishment-title"
      >
        <div>
          <h2 id="replenishment-title" className="text-xl font-semibold">
            Reposição
          </h2>
          <p className="text-sm">
            Sugestão calculada sobre dias completos; o mínimo efetivo não é
            alterado automaticamente.
          </p>
        </div>
        {replenishmentLoading && !recommendation ? (
          <p role="status">Calculando recomendação…</p>
        ) : replenishmentError || !recommendation ? (
          <p role="alert">
            Não foi possível carregar a recomendação.{" "}
            <button onClick={reloadReplenishment}>Tentar novamente</button>
          </p>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="font-medium">Situação</dt>
              <dd>{situationLabel(recommendation.situation)}</dd>
            </div>
            <div>
              <dt className="font-medium">Saldo agregado</dt>
              <dd>
                {recommendation.stock} {item.unit}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Mínimo efetivo</dt>
              <dd>{recommendation.minimumStock ?? "Não configurado"}</dd>
            </div>
            <div>
              <dt className="font-medium">Período analisado</dt>
              <dd>
                {recommendation.from} a {recommendation.to} (
                {recommendation.windowDays} dias)
              </dd>
            </div>
            <div>
              <dt className="font-medium">Consumo líquido</dt>
              <dd>
                {recommendation.consumption ?? "—"}{" "}
                {recommendation.consumption !== undefined ? item.unit : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Média diária</dt>
              <dd>
                {recommendation.averageDailyConsumption?.toFixed(3) ?? "—"}{" "}
                {recommendation.averageDailyConsumption !== undefined
                  ? `${item.unit}/dia`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Prazo de compra</dt>
              <dd>
                {recommendation.purchaseLeadTimeDays ?? "Não configurado"} dias
              </dd>
            </div>
            <div>
              <dt className="font-medium">Estoque de segurança</dt>
              <dd>
                {recommendation.safetyStock ?? "Não configurado"} {item.unit}
              </dd>
            </div>
            <div>
              <dt className="font-medium">Mínimo sugerido</dt>
              <dd>
                {recommendation.suggestedMinimumStock ??
                  statusReason(recommendation.reason)}
              </dd>
            </div>
          </dl>
        )}
        {can(state.user, "inventory.items.configureReplenishment") && (
          <form
            className="grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-5"
            onSubmit={(event) => void saveReplenishment(event)}
          >
            <Field id="minimum-stock" label="Mínimo efetivo">
              <Input
                id="minimum-stock"
                name="minimumStock"
                type="number"
                min="0"
                defaultValue={item.minimumStock ?? ""}
              />
            </Field>
            <Field id="lead-time" label="Prazo de compra (dias)">
              <Input
                id="lead-time"
                name="purchaseLeadTimeDays"
                type="number"
                min="0"
                defaultValue={item.purchaseLeadTimeDays ?? ""}
              />
            </Field>
            <Field id="safety-stock" label="Estoque de segurança">
              <Input
                id="safety-stock"
                name="safetyStock"
                type="number"
                min="0"
                defaultValue={item.safetyStock ?? ""}
              />
            </Field>
            <Field id="window-days" label="Janela (30–365 dias)">
              <Input
                id="window-days"
                name="recommendationWindowDays"
                type="number"
                min="30"
                max="365"
                defaultValue={item.recommendationWindowDays}
                required
              />
            </Field>
            <div className="self-end">
              <Button type="submit" loading={saving}>
                Salvar parâmetros
              </Button>
            </div>
          </form>
        )}
      </section>
      {canEditItem && (
        <form
          className="grid max-w-3xl gap-4 md:grid-cols-2"
          onSubmit={(event) => void saveItem(event)}
        >
          <Field id="edit-code" label="Código" required>
            <Input
              id="edit-code"
              name="code"
              defaultValue={item.code}
              required
              maxLength={32}
            />
          </Field>
          <Field id="edit-name" label="Nome" required>
            <Input
              id="edit-name"
              name="name"
              defaultValue={item.name}
              required
              maxLength={200}
            />
          </Field>
          <Field id="edit-category" label="Categoria" required>
            <select
              id="edit-category"
              name="categoryId"
              defaultValue={item.category?.id}
              className="w-full rounded border p-2"
            >
              {categories?.data
                .filter(
                  (category) =>
                    category.active || category.id === item.category?.id,
                )
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field id="edit-unit" label="Unidade">
            <select
              id="edit-unit"
              name="unit"
              defaultValue={item.unit}
              className="w-full rounded border p-2"
            >
              <option value="UN">Unidade</option>
              <option value="PAR">Par</option>
              <option value="CX">Caixa</option>
            </select>
          </Field>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="active" defaultChecked={item.active} />
            Ativo
          </label>
          <Field id="edit-description" label="Descrição">
            <textarea
              id="edit-description"
              name="description"
              defaultValue={item.description ?? ""}
              maxLength={5000}
              className="w-full rounded border p-2"
            />
          </Field>
          <div>
            <Button type="submit" loading={saving}>
              Salvar alterações
            </Button>
          </div>
        </form>
      )}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Variantes de produto</h2>
        <ul className="space-y-2">
          {item.variants.map((variant) => (
            <li
              key={variant.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"
            >
              <span>
                <strong>
                  {[variant.brand, variant.model].filter(Boolean).join(" ") ||
                    "Sem marca/modelo"}
                </strong>{" "}
                — {variant.description}{" "}
                <small>
                  ({variant.active ? "Ativa" : "Inativa"}; saldo:{" "}
                  {variant.balances?.reduce(
                    (total, balance) => total + balance.quantity,
                    0,
                  ) ?? 0}
                  )
                </small>
              </span>
              {canUpdateVariant && (
                <Button
                  variant="secondary"
                  onClick={() => void toggleVariant(variant)}
                >
                  {variant.active ? "Inativar" : "Reativar"}
                </Button>
              )}
            </li>
          ))}
        </ul>
        {item.variants.length === 0 && <p>Nenhuma variante cadastrada.</p>}
        {canCreateVariant && (
          <form
            className="grid max-w-3xl gap-4 md:grid-cols-3"
            onSubmit={(event) => void createVariant(event)}
          >
            <Field id="variant-brand" label="Marca">
              <Input id="variant-brand" name="brand" maxLength={120} />
            </Field>
            <Field id="variant-model" label="Modelo">
              <Input id="variant-model" name="model" maxLength={120} />
            </Field>
            <Field id="variant-description" label="Descrição" required>
              <Input
                id="variant-description"
                name="variantDescription"
                required
                maxLength={2000}
              />
            </Field>
            <div>
              <Button type="submit" loading={saving}>
                Adicionar variante
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function situationLabel(
  situation: ReplenishmentRecommendation["situation"],
): string {
  return {
    INCONSISTENT: "Inconsistente — há variante com saldo negativo",
    OUT_OF_STOCK: "Sem estoque",
    NOT_CONFIGURED: "Mínimo não configurado",
    REPLENISHMENT: "Atingiu o mínimo de reposição",
    OK: "Dentro do nível configurado",
  }[situation];
}

function statusReason(reason: string | null): string {
  if (reason === "REPLENISHMENT_PARAMETERS_MISSING")
    return "Parâmetros de prazo/segurança pendentes";
  if (reason === "HISTORY_DOES_NOT_COVER_WINDOW")
    return "Histórico insuficiente para o período";
  return "Não calculável";
}
