import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../components/actions/Button";
import { Alert } from "../../components/feedback/Alert";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { Spinner } from "../../components/feedback/Spinner";
import { Badge } from "../../components/data-display/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "../../components/data-display/Table";
import { Input } from "../../components/forms/Input";
import { Pagination } from "../../components/navigation/Pagination";
import { PageHeader } from "../../components/navigation/PageHeader";
import { ConfirmDialog } from "../../components/overlays/ConfirmDialog";
import { SimpleTooltip } from "../../components/overlays/Tooltip";
import { useAsync } from "../../hooks/useAsync";
import { useFlash } from "../../hooks/useFlash";
import { can } from "../../lib/permissions";
import { useDocumentTitle } from "../../router/guards";
import { rolesService } from "../../services/roles/rolesService";
import { useSession } from "../../stores/session/SessionContext";
import type { Role } from "../../types/auth";

export function RolesListPage() {
  useDocumentTitle("Papéis");
  const { state } = useSession();
  const user = state.user;

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [searchInput, setSearchInput] = useState(search);

  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const flash = useFlash();

  const loader = useCallback(
    (signal: AbortSignal) =>
      rolesService.list(
        { page, perPage: 20, sort: "name", filter: { search } },
        signal,
      ),
    [page, search],
  );

  const { data, loading, error, reload } = useAsync(loader);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchInput === search) return;

      const next = new URLSearchParams(searchParams);
      if (searchInput) {
        next.set("search", searchInput);
      } else {
        next.delete("search");
      }
      next.delete("page");
      setSearchParams(next, { replace: true });
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchInput, search, searchParams, setSearchParams]);

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setActionError(null);

    try {
      await rolesService.remove(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível excluir o papel.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Papéis"
        description="Agrupe permissões em papéis atribuíveis a usuários."
        breadcrumbs={[{ label: "Painel", to: "/" }, { label: "Papéis" }]}
        actions={
          can(user, "roles.create") ? (
            <Button asChild>
              <Link to="/admin/roles/new">
                <Plus className="size-4" aria-hidden="true" />
                Criar papel
              </Link>
            </Button>
          ) : null
        }
      />

      {flash ? <Alert variant="success">{flash}</Alert> : null}
      {actionError ? <Alert variant="danger">{actionError}</Alert> : null}

      <div className="max-w-sm">
        <label htmlFor="roles-search" className="sr-only">
          Buscar papéis
        </label>
        <Input
          id="roles-search"
          type="search"
          placeholder="Buscar por nome ou identificador"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando papéis" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={search ? "Nenhum resultado" : "Nenhum papel"}
          description={
            search
              ? "Nenhum papel corresponde à busca informada."
              : "Ainda não há papéis cadastrados."
          }
          action={
            search ? (
              <Button variant="secondary" onClick={() => setSearchInput("")}>
                Limpar filtros
              </Button>
            ) : null
          }
        />
      ) : data ? (
        <div className="space-y-4">
          <TableWrapper>
            <Table>
              <caption className="sr-only">Lista de papéis</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead className="text-right">Permissões</TableHead>
                  <TableHead className="text-right">Usuários</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {item.name}
                        {item.isSystem ? (
                          <Badge variant="info">Sistema</Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-ink-secondary">
                      {item.slug}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.permissions.length}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.usersCount ?? 0}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {can(user, "roles.update") ? (
                          <SimpleTooltip label="Editar">
                            <Button asChild variant="ghost" size="iconCompact">
                              <Link
                                to={`/admin/roles/${item.id}`}
                                aria-label={`Editar ${item.name}`}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Link>
                            </Button>
                          </SimpleTooltip>
                        ) : null}
                        {can(user, "roles.delete") && !item.isSystem ? (
                          <SimpleTooltip label="Excluir">
                            <Button
                              variant="ghost"
                              size="iconCompact"
                              className="text-danger-status hover:bg-danger-status-surface hover:text-danger-status"
                              aria-label={`Excluir ${item.name}`}
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          </SimpleTooltip>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>

          <Pagination meta={data.meta} onPageChange={changePage} />
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Excluir papel"
        description={
          deleteTarget
            ? `O papel ${deleteTarget.name} será removido permanentemente. Papéis atribuídos a usuários não podem ser excluídos.`
            : undefined
        }
        confirmLabel="Excluir papel"
        destructive
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
