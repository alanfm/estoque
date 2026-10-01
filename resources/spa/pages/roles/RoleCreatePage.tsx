import { FormModal } from "../../components/overlays/FormModal";
import { RolesListPage } from "./RolesListPage";
import { useNavigate } from "react-router";
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
    <FormModal
      title="Criar papel"
      returnTo="/admin/roles"
      background={<RolesListPage />}
      backgroundPermission="roles.viewAny"
      description="Defina um identificador e selecione as permissões do papel."
    >
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
    </FormModal>
  );
}
