import { useNavigate } from "react-router";
import { PageHeader } from "../../components/navigation/PageHeader";
import { usePermissionOptions } from "../../hooks/usePermissionOptions";
import { can } from "../../lib/permissions";
import { useDocumentTitle } from "../../router/guards";
import { rolesService } from "../../services/roles/rolesService";
import { useSession } from "../../stores/session/SessionContext";
import { RoleForm } from "./RoleForm";

export function RoleCreatePage() {
  useDocumentTitle("Criar papel");
  const navigate = useNavigate();
  const { state } = useSession();
  const permissionsAvailable = can(state.user, "permissions.viewAny");
  const { permissions, loading } = usePermissionOptions(permissionsAvailable);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar papel"
        description="Defina um identificador e selecione as permissões do papel."
        breadcrumbs={[
          { label: "Painel", to: "/" },
          { label: "Papéis", to: "/admin/roles" },
          { label: "Criar" },
        ]}
      />

      <RoleForm
        defaultValues={{ slug: "", name: "", permissions: [] }}
        submitLabel="Criar papel"
        cancelTo="/admin/roles"
        permissions={permissions}
        permissionsAvailable={permissionsAvailable}
        permissionsLoading={loading}
        onSubmit={async (values) => {
          await rolesService.create(values);
          navigate("/admin/roles", {
            replace: true,
            state: { flash: "Papel criado." },
          });
        }}
      />
    </div>
  );
}
