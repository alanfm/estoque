import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "../../components/actions/Button";
import { Alert } from "../../components/feedback/Alert";
import { FormError } from "../../components/feedback/FormError";
import { Spinner } from "../../components/feedback/Spinner";
import { CheckboxField } from "../../components/forms/CheckboxField";
import { CheckboxGroup } from "../../components/forms/CheckboxGroup";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { applyApiError } from "../../lib/formErrors";
import type { Permission } from "../../types/auth";

export interface RoleFormValues {
  slug: string;
  name: string;
  permissions: string[];
}

export interface RoleFormProps {
  defaultValues: RoleFormValues;
  submitLabel: string;
  cancelTo: string;
  permissions: Permission[];
  permissionsAvailable: boolean;
  permissionsLoading: boolean;
  slugReadOnly?: boolean;
  disabled?: boolean;
  disabledNotice?: string;
  onSubmit(values: RoleFormValues): Promise<void>;
}

export function RoleForm({
  defaultValues,
  submitLabel,
  cancelTo,
  permissions,
  permissionsAvailable,
  permissionsLoading,
  slugReadOnly = false,
  disabled = false,
  disabledNotice,
  onSubmit,
}: RoleFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({ defaultValues });

  const groups = useMemo(() => {
    const map = new Map<string, Permission[]>();

    for (const permission of permissions) {
      if (permission.obsolete) continue;
      const list = map.get(permission.module) ?? [];
      list.push(permission);
      map.set(permission.module, list);
    }

    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permissions]);

  const submit = handleSubmit(async (values) => {
    setGeneralError(null);

    try {
      await onSubmit(values);
    } catch (error) {
      setGeneralError(applyApiError(error, setError));
    }
  });

  return (
    <form noValidate onSubmit={submit} className="max-w-[720px] space-y-6">
      {disabledNotice ? (
        <Alert variant="warning" title="Papel protegido">
          {disabledNotice}
        </Alert>
      ) : null}

      <FormError message={generalError} />

      <Field
        id="slug"
        label="Identificador"
        required
        hint="Use letras minúsculas, números e hífens. Não pode ser alterado depois."
        error={errors.slug?.message}
      >
        <Input
          readOnly={slugReadOnly}
          disabled={disabled}
          {...register("slug", {
            required: "Informe o identificador.",
            pattern: {
              value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message:
                "Use apenas letras minúsculas, números e hífens simples.",
            },
          })}
        />
      </Field>

      <Field id="name" label="Nome" required error={errors.name?.message}>
        <Input
          disabled={disabled}
          {...register("name", { required: "Informe o nome do papel." })}
        />
      </Field>

      <CheckboxGroup
        legend="Permissões"
        description={
          permissionsAvailable
            ? "As permissões marcadas serão concedidas a quem tiver este papel."
            : "Você não tem permissão para visualizar o catálogo de permissões."
        }
      >
        {permissionsLoading ? (
          <Spinner label="Carregando permissões" />
        ) : permissionsAvailable ? (
          groups.map(([module, items]) => (
            <div key={module} className="space-y-2 sm:col-span-2">
              <p className="text-caption font-semibold uppercase tracking-wide text-ink-muted">
                {module}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((permission) => (
                  <CheckboxField
                    key={permission.name}
                    id={`permission-${permission.name}`}
                    value={permission.name}
                    label={permission.name}
                    description={permission.description}
                    disabled={disabled}
                    {...register("permissions")}
                  />
                ))}
              </div>
            </div>
          ))
        ) : null}
      </CheckboxGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting} disabled={disabled}>
          {submitLabel}
        </Button>
        <Button asChild variant="secondary">
          <Link to={cancelTo}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
