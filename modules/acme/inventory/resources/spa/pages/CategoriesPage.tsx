import { useCallback, useState } from "react";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { Field } from "../../../../../../resources/spa/components/forms/Field";
import { Input } from "../../../../../../resources/spa/components/forms/Input";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { catalogService, type Category } from "../services/catalogService";
import { can } from "../../../../../../resources/spa/lib/permissions";
import { useSession } from "../../../../../../resources/spa/stores/session/SessionContext";

export default function CategoriesPage() {
  const { state } = useSession();
  const canCreate = can(state.user, "inventory.categories.create");
  const canUpdate = can(state.user, "inventory.categories.update");
  const loader = useCallback((signal: AbortSignal) => catalogService.categories("", signal), []);
  const { data, loading, error, reload } = useAsync(loader);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      if (editing) await catalogService.updateCategory(editing, name, editing.active);
      else await catalogService.createCategory(name);
      setName(""); setEditing(null); reload();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Não foi possível salvar a categoria."); }
    finally { setSaving(false); }
  }
  async function toggle(category: Category) {
    try { await catalogService.updateCategory(category, category.name, !category.active); reload(); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "Não foi possível atualizar a categoria."); }
  }
  return <div className="space-y-6">
    <PageHeader title="Categorias" description="Classificações dos itens do almoxarifado." breadcrumbs={[{ label: "Almoxarifado", to: "/admin/inventory" }, { label: "Categorias" }]} />
    {message && <p role="alert">{message}</p>}{error && <p role="alert">Não foi possível carregar as categorias. <button onClick={reload}>Tentar novamente</button></p>}
    {canCreate || editing ? <form className="flex max-w-xl items-end gap-3" onSubmit={(event) => void submit(event)}>
      <Field id="category-name" label="Nome da categoria" required><Input id="category-name" maxLength={120} value={name} onChange={(event) => setName(event.target.value)} required /></Field>
      <Button type="submit" loading={saving}>{editing ? "Salvar" : "Adicionar"}</Button>
      {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setName(""); }}>Cancelar</Button>}
    </form> : null}
    {loading && !data ? <p role="status">Carregando…</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Categoria</th><th>Estado</th><th>Ações</th></tr></thead><tbody>{data?.data.map((category) => <tr key={category.id} className="border-t"><td className="py-3">{category.name}</td><td>{category.active ? "Ativa" : "Inativa"}</td><td className="space-x-2">{canUpdate ? <><button onClick={() => { setEditing(category); setName(category.name); }}>Editar</button><button onClick={() => void toggle(category)}>{category.active ? "Inativar" : "Reativar"}</button></> : "—"}</td></tr>)}</tbody></table>{data?.data.length === 0 && <p>Nenhuma categoria cadastrada.</p>}</div>}
  </div>;
}
