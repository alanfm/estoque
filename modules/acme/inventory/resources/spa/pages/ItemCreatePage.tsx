import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { Field } from "../../../../../../resources/spa/components/forms/Field";
import { Input } from "../../../../../../resources/spa/components/forms/Input";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { catalogService } from "../services/catalogService";

export default function ItemCreatePage() {
  const navigate = useNavigate();
  const loader = useCallback(
    (signal: AbortSignal) => catalogService.categories("", signal),
    [],
  );
  const { data } = useAsync(loader);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const item = await catalogService.createItem({
        code: String(form.get("code")),
        categoryId: String(form.get("categoryId")),
        name: String(form.get("name")),
        description: String(form.get("description")) || null,
        unit: String(form.get("unit")),
      });
      navigate(`/admin/inventory/${item.id}`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível criar o item.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo item"
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: "Novo item" },
        ]}
      />
      {error && <p role="alert">{error}</p>}
      <form
        className="max-w-2xl space-y-4"
        onSubmit={(event) => void submit(event)}
      >
        <Field id="item-code" label="Código" required>
          <Input
            id="item-code"
            name="code"
            maxLength={32}
            required
            pattern="[A-Za-z0-9_-]+"
          />
        </Field>
        <Field id="item-name" label="Nome" required>
          <Input id="item-name" name="name" maxLength={200} required />
        </Field>
        <Field id="item-category" label="Categoria" required>
          <select
            id="item-category"
            name="categoryId"
            className="w-full rounded border p-2"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Selecione
            </option>
            {data?.data
              .filter((category) => category.active)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </Field>
        <Field id="item-unit" label="Unidade" required>
          <select
            id="item-unit"
            name="unit"
            className="w-full rounded border p-2"
          >
            <option value="UN">Unidade</option>
            <option value="PAR">Par</option>
            <option value="CX">Caixa</option>
          </select>
        </Field>
        <Field id="item-description" label="Descrição">
          <textarea
            id="item-description"
            name="description"
            maxLength={5000}
            className="w-full rounded border p-2"
          />
        </Field>
        <Button type="submit" loading={saving}>
          Criar item
        </Button>
      </form>
    </div>
  );
}
