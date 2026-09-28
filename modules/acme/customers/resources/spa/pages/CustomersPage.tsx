import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { can } from "../../../../../../resources/spa/lib/permissions";
import { useSession } from "../../../../../../resources/spa/stores/session/SessionContext";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { Alert } from "../../../../../../resources/spa/components/feedback/Alert";
import { EmptyState } from "../../../../../../resources/spa/components/feedback/EmptyState";
import { ErrorState } from "../../../../../../resources/spa/components/feedback/ErrorState";
import { Spinner } from "../../../../../../resources/spa/components/feedback/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "../../../../../../resources/spa/components/data-display/Table";
import { Input } from "../../../../../../resources/spa/components/forms/Input";
import { Pagination } from "../../../../../../resources/spa/components/navigation/Pagination";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { ConfirmDialog } from "../../../../../../resources/spa/components/overlays/ConfirmDialog";
import { SimpleTooltip } from "../../../../../../resources/spa/components/overlays/Tooltip";
import { useAsync } from "../../../../../../resources/spa/hooks/useAsync";
import { useFlash } from "../../../../../../resources/spa/hooks/useFlash";
import { customersService, type Customer } from "../services/customersService";

export default function CustomersPage() {
  const { state } = useSession();
  const canCreate = can(state.user, "customers.create");
  const canUpdate =
    can(state.user, "customers.view") && can(state.user, "customers.update");
  const canDelete = can(state.user, "customers.delete");
  const [params, setParams] = useSearchParams();
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const flash = useFlash();
  const loader = useCallback(
    (signal: AbortSignal) => customersService.list(search, page, signal),
    [search, page],
  );
  const { data, loading, error, reload } = useAsync(loader);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput === search) return;
      const next = new URLSearchParams(params);
      if (searchInput) {
        next.set("search", searchInput);
      } else {
        next.delete("search");
      }
      next.delete("page");
      setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, search, params, setParams]);

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setErrorMessage(null);
    try {
      await customersService.remove(deleteTarget.id);
      setDeleteTarget(null);
      reload();
    } catch (caught) {
      setErrorMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível excluir o cliente.",
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastros de clientes do módulo de referência."
        breadcrumbs={[{ label: "Painel", to: "/" }, { label: "Clientes" }]}
        actions={
          canCreate ? (
            <Button asChild>
              <Link to="/admin/customers/new">
                <Plus className="size-4" aria-hidden="true" />
                Novo cliente
              </Link>
            </Button>
          ) : null
        }
      />
      {flash ? <Alert variant="success">{flash}</Alert> : null}
      {errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
      <div className="max-w-sm">
        <label htmlFor="customer-search" className="sr-only">
          Buscar clientes
        </label>
        <Input
          id="customer-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar nome, e-mail ou empresa"
        />
      </div>
      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando clientes" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data?.data.length === 0 ? (
        <EmptyState
          icon={Search}
          title={search ? "Nenhum resultado" : "Nenhum cliente"}
          description={
            search
              ? "Nenhum cliente corresponde à busca informada."
              : "Ainda não há clientes cadastrados."
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
              <caption className="sr-only">Clientes cadastrados</caption>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.name}
                    </TableCell>
                    <TableCell className="text-ink-secondary">
                      {customer.email}
                    </TableCell>
                    <TableCell className="text-ink-secondary">
                      {customer.company ?? "—"}
                    </TableCell>
                    <TableCell className="text-ink-secondary">
                      {customer.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        {canUpdate ? (
                          <SimpleTooltip label="Editar">
                            <Button asChild variant="ghost" size="iconCompact">
                              <Link
                                to={`/admin/customers/${customer.id}`}
                                aria-label={`Editar ${customer.name}`}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </Link>
                            </Button>
                          </SimpleTooltip>
                        ) : null}
                        {canDelete ? (
                          <SimpleTooltip label="Excluir">
                            <Button
                              variant="ghost"
                              size="iconCompact"
                              className="text-danger-status hover:bg-danger-status-surface hover:text-danger-status"
                              aria-label={`Excluir ${customer.name}`}
                              onClick={() => setDeleteTarget(customer)}
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
          <Pagination
            meta={data.meta}
            onPageChange={(nextPage) => {
              const next = new URLSearchParams(params);
              next.set("page", String(nextPage));
              setParams(next);
            }}
          />
        </div>
      ) : null}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Excluir cliente"
        description={
          deleteTarget
            ? `O cliente ${deleteTarget.name} será removido permanentemente. Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir cliente"
        destructive
        loading={deleting}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
