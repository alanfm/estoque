import { ArrowLeftRight, Eye, Plus } from "lucide-react";
import { useCallback } from "react";
import { Link } from "react-router";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  SimpleTooltip,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
  can,
  useAsync,
  useSession,
} from "@starterkit/module-kit";
import { labeled, movementStatusLabels, movementTypeLabels } from "../labels";
import { movementService } from "../services/movementService";

export default function MovementsPage() {
  const { state } = useSession();
  const canCreateEntry = can(state.user, "inventory.entries.create");
  const canCreateIssue = can(state.user, "inventory.issues.create");
  const canView = can(state.user, "inventory.movements.view");
  const loader = useCallback(
    (signal: AbortSignal) => movementService.list(signal),
    [],
  );
  const { data, loading, error, reload } = useAsync(loader);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimentações"
        description="Rascunhos, entradas e saídas do almoxarifado."
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: "Movimentações" },
        ]}
        actions={
          canCreateEntry || canCreateIssue ? (
            <div className="flex flex-wrap gap-2">
              {canCreateEntry ? (
                <Button asChild>
                  <Link to="/admin/inventory/movements/entry">
                    <Plus className="size-4" aria-hidden="true" />
                    Nova entrada
                  </Link>
                </Button>
              ) : null}
              {canCreateIssue ? (
                <Button
                  asChild
                  variant={canCreateEntry ? "secondary" : "primary"}
                >
                  <Link to="/admin/inventory/movements/issue">
                    <Plus className="size-4" aria-hidden="true" />
                    Nova saída
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null
        }
      />
      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando movimentos" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Nenhuma movimentação"
          description="Ainda não há movimentações registradas."
        />
      ) : data ? (
        <TableWrapper>
          <Table>
            <caption className="sr-only">
              Lista de movimentações do almoxarifado
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>Movimento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="font-medium">#{movement.id}</TableCell>
                  <TableCell>
                    {labeled(movementTypeLabels, movement.type)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">
                      {labeled(movementStatusLabels, movement.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-ink-secondary">
                    {movement.occurred_on ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canView ? (
                      <SimpleTooltip label="Abrir">
                        <Button asChild variant="ghost" size="iconCompact">
                          <Link
                            to={`/admin/inventory/movements/${movement.id}`}
                            aria-label={`Abrir movimento ${movement.id}`}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </SimpleTooltip>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      ) : null}
    </div>
  );
}
