import { Pencil, Power, Tags } from "lucide-react";
import { useCallback, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
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
import { catalogService, type Category } from "../services/catalogService";

export default function CategoriesPage() {
  const { state } = useSession();
  const canCreate = can(state.user, "inventory.categories.create");
  const canUpdate = can(state.user, "inventory.categories.update");
  const loader = useCallback(
    (signal: AbortSignal) => catalogService.categories("", signal),
    [],
  );
  const { data, loading, error, reload } = useAsync(loader);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editing) {
        await catalogService.updateCategory(editing, name, editing.active);
      } else {
        await catalogService.createCategory(name);
      }
      setName("");
      setEditing(null);
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível salvar a categoria.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggle(category: Category) {
    setMessage("");
    try {
      await catalogService.updateCategory(
        category,
        category.name,
        !category.active,
      );
      reload();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "Não foi possível atualizar a categoria.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        description="Classificações dos itens do almoxarifado."
        breadcrumbs={[
          { label: "Almoxarifado", to: "/admin/inventory" },
          { label: "Categorias" },
        ]}
      />
      {message ? <Alert variant="danger">{message}</Alert> : null}
      {canCreate || editing ? (
        <form
          className="flex max-w-xl items-end gap-3"
          onSubmit={(event) => void submit(event)}
        >
          <Field id="category-name" label="Nome da categoria" required>
            <Input
              id="category-name"
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>
          <Button type="submit" loading={saving}>
            {editing ? "Salvar" : "Adicionar"}
          </Button>
          {editing ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(null);
                setName("");
              }}
            >
              Cancelar
            </Button>
          ) : null}
        </form>
      ) : null}
      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando categorias" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data && data.data.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria"
          description="Ainda não há categorias cadastradas."
        />
      ) : data ? (
        <TableWrapper>
          <Table>
            <caption className="sr-only">
              Lista de categorias do almoxarifado
            </caption>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">
                      {category.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canUpdate ? (
                      <div className="inline-flex items-center gap-1">
                        <SimpleTooltip label="Editar">
                          <Button
                            type="button"
                            variant="ghost"
                            size="iconCompact"
                            aria-label={`Editar ${category.name}`}
                            onClick={() => {
                              setEditing(category);
                              setName(category.name);
                            }}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                        </SimpleTooltip>
                        <SimpleTooltip
                          label={category.active ? "Inativar" : "Reativar"}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="iconCompact"
                            aria-label={`${category.active ? "Inativar" : "Reativar"} ${category.name}`}
                            onClick={() => void toggle(category)}
                          >
                            <Power className="size-4" aria-hidden="true" />
                          </Button>
                        </SimpleTooltip>
                      </div>
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
