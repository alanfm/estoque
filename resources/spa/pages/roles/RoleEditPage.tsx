import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ErrorState } from "../../components/feedback/ErrorState";
import { Spinner } from "../../components/feedback/Spinner";
import { PageHeader } from "../../components/navigation/PageHeader";
import { useAsync } from "../../hooks/useAsync";
import { usePermissionOptions } from "../../hooks/usePermissionOptions";
import { can } from "../../lib/permissions";
import { useDocumentTitle } from "../../router/guards";
import { rolesService } from "../../services/roles/rolesService";
import { useSession } from "../../stores/session/SessionContext";
import { RoleForm } from "./RoleForm";

export function RoleEditPage() {
  useDocumentTitle("Editar papel");
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { state } = useSession();
  const permissionsAvailable = can(state.user, "permissions.viewAny");
  const { permissions, loading: permissionsLoading } =
    usePermissionOptions(permissionsAvailable);

  const loader = useCallback(
    (signal: AbortSignal) => rolesService.get(id, signal),
    [id],
  );
  const { data, loading, error, reload } = useAsync(loader);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Editar papel"
        description="Atualize o nome e as permissões do papel."
        breadcrumbs={[
          { label: "Painel", to: "/" },
          { label: "Papéis", to: "/admin/roles" },
          { label: "Editar" },
        ]}
      />

      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando papel" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data ? (
        <RoleForm
          defaultValues={{
            slug: data.slug,
            name: data.name,
            permissions: data.permissions,
          }}
          submitLabel="Salvar alterações"
          cancelTo="/admin/roles"
          permissions={permissions}
          permissionsAvailable={permissionsAvailable}
          permissionsLoading={permissionsLoading}
          slugReadOnly
          disabled={data.isSystem}
          disabledNotice={
            data.isSystem
              ? "Este papel é o superadministrador e não pode ser editado pela interface."
              : undefined
          }
          onSubmit={async (values) => {
            await rolesService.update(id, {
              name: values.name,
              permissions: values.permissions,
            });
            navigate("/admin/roles", {
              replace: true,
              state: { flash: "Papel atualizado." },
            });
          }}
        />
      ) : null}
    </div>
  );
}
