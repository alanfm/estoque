import { Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { usersService } from "../../services/users/usersService";
import { useSession } from "../../stores/session/SessionContext";
import type { User } from "../../types/auth";

export function UsersListPage() {
  useDocumentTitle("Usuários");
  const { state } = useSession();
  const user = state.user;

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const [searchInput, setSearchInput] = useState(search);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const flash = useFlash();

  const loader = useCallback(
    (signal: AbortSignal) =>
      usersService.list(
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
      await usersService.remove(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível excluir o usuário.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const canCreate = can(user, "users.create");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Contas com acesso ao sistema e seus papéis."
        breadcrumbs={[{ label: "Painel", to: "/" }, { label: "Usuários" }]}
        actions={
          canCreate ? (
            <Button asChild>
              <Link to="/admin/users/new">
                <Plus className="size-4" aria-hidden="true" />
                Criar usuário
              </Link>
            </Button>
          ) : null
        }
      />

      {flash ? <Alert variant="success">{flash}</Alert> : null}
      {actionError ? <Alert variant="danger">{actionError}</Alert> : null}

      <div className="max-w-sm">
        <label htmlFor="users-search" className="sr-only">
          Buscar usuários
        </label>
        <Input
          id="users-search"
          type="search"
          placeholder="Buscar por nome ou e-mail"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando usuários" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Nenhum resultado" : "Nenhum usuário"}
          description={
            search
              ? "Nenhum usuário corresponde à busca informada."
              : "Ainda não há usuários cadastrados."
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
              <caption className="sr-only">
                Lista de usuários cadastrados
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-ink-secondary">
                      {item.email}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.roles.length === 0 ? (
                          <span className="text-ink-muted">—</span>
                        ) : (
                          item.roles.map((role) => (
                            <Badge key={role} variant="neutral">
                              {role}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {can(user, "users.update") ? (
                          <SimpleTooltip label="Editar">
                            <Button asChild variant="ghost" size="iconCompact">
                              <Link
                                to={`/admin/users/${item.id}`}
                                aria-label={`Editar ${item.name}`}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Link>
                            </Button>
                          </SimpleTooltip>
                        ) : null}
                        {can(user, "users.delete") ? (
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
        title="Excluir usuário"
        description={
          deleteTarget
            ? `A conta de ${deleteTarget.name} será removida permanentemente. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir usuário"
        destructive
        loading={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
