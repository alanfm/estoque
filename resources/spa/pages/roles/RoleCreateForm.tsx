import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/overlays/Dialog";
import { usePermissionOptions } from "../../hooks/usePermissionOptions";
import { can } from "../../lib/permissions";
import { rolesService } from "../../services/roles/rolesService";
import { useSession } from "../../stores/session/SessionContext";
import { RoleForm } from "./RoleForm";

export function RoleCreateForm({
  onCancel,
  onSaved,
}: {
  onCancel(): void;
  onSaved(message: string): void;
}) {
  const { state } = useSession();
  const permissionsAvailable = can(state.user, "permissions.viewAny");
  const { permissions, loading } = usePermissionOptions(permissionsAvailable);

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Criar papel</DialogTitle>
        <DialogDescription>
          Defina um identificador e selecione as permissões do papel.
        </DialogDescription>
      </DialogHeader>

      <RoleForm
        defaultValues={{ slug: "", name: "", permissions: [] }}
        submitLabel="Criar papel"
        onCancel={onCancel}
        permissions={permissions}
        permissionsAvailable={permissionsAvailable}
        permissionsLoading={loading}
        onSubmit={async (values) => {
          await rolesService.create(values);
          onSaved("Papel criado.");
        }}
      />
    </div>
  );
}
