import { useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { Input } from "../../../../../../resources/spa/components/forms/Input";
import { catalogService } from "../services/catalogService";
import { can } from "../../../../../../resources/spa/lib/permissions";
import { useSession } from "../../../../../../resources/spa/stores/session/SessionContext";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { Pagination } from "../../../../../../resources/spa/components/navigation/Pagination";

export default function ItemsPage() {
  const { state } = useSession();
  const canCreate = can(state.user, "inventory.items.create");
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const categoryId = params.get("categoryId") ?? "";
  const loader = useCallback((signal: AbortSignal) => catalogService.items(search, page, categoryId, signal), [search, page, categoryId]);
  const { data, loading, error, reload } = useAsync(loader);
  const categoryLoader = useCallback((signal: AbortSignal) => catalogService.categories("", signal), []);
  const { data: categories } = useAsync(categoryLoader);
  return <div className="space-y-6">
    <PageHeader title="Itens do almoxarifado" description="Códigos agregados, categorias e variantes de produto." breadcrumbs={[{ label: "Painel", to: "/" }, { label: "Almoxarifado" }]} actions={canCreate ? <Button asChild><Link to="/admin/inventory/new">Novo item</Link></Button> : null} />
    <div className="flex flex-wrap gap-4"><label className="block max-w-sm">Buscar código ou nome<Input type="search" value={search} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value) next.set("search", event.target.value); else next.delete("search"); next.delete("page"); setParams(next, { replace: true }); }} /></label><label className="block">Categoria<select className="block rounded border p-2" value={categoryId} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value) next.set("categoryId", event.target.value); else next.delete("categoryId"); next.delete("page"); setParams(next); }}><option value="">Todas</option>{categories?.data.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
    {loading && !data ? <p role="status">Carregando…</p> : error ? <p role="alert">Falha ao carregar itens. <button onClick={reload}>Tentar novamente</button></p> : <div className="space-y-4"><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Código</th><th>Item</th><th>Categoria</th><th>Unidade</th><th>Estado</th></tr></thead><tbody>{data?.data.map((item) => <tr key={item.id} className="border-t"><td className="py-3"><Link to={`/admin/inventory/${item.id}`} className="underline">{item.code}</Link></td><td>{item.name}</td><td>{item.category?.name ?? "—"}</td><td>{item.unit}</td><td>{item.active ? "Ativo" : "Inativo"}</td></tr>)}</tbody></table>{data?.data.length === 0 && <p>Nenhum item encontrado.</p>}</div>{data && <Pagination meta={data.meta} onPageChange={(nextPage) => { const next = new URLSearchParams(params); next.set("page", String(nextPage)); setParams(next); }} />}</div>}
  </div>;
}
