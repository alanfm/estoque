import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/actions/Button";
import { FormError } from "../../components/feedback/FormError";
import { CheckboxField } from "../../components/forms/CheckboxField";
import { CheckboxGroup } from "../../components/forms/CheckboxGroup";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Spinner } from "../../components/feedback/Spinner";
import { applyApiError } from "../../lib/formErrors";
import type { Role } from "../../types/auth";

export interface UserFormValues {
  name: string;
  email: string;
  roles: string[];
  registry: string;
  ldapEnabled: boolean;
  localAuthEnabled: boolean;
}

export interface UserFormProps {
  defaultValues: UserFormValues;
  submitLabel: string;
  onCancel(): void;
  roles: Role[];
  rolesAvailable: boolean;
  rolesLoading: boolean;
  dataLocked?: boolean;
  onSubmit(values: UserFormValues): Promise<void>;
}

export function UserForm({
  defaultValues,
  submitLabel,
  onCancel,
  roles,
  rolesAvailable,
  rolesLoading,
  dataLocked = false,
  onSubmit,
}: UserFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({ defaultValues });

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
      <FormError message={generalError} />
      {dataLocked ? (
        <p className="text-body-sm text-ink-secondary">
          Os dados desta conta são administrados pelo LDAP. O usuário pode
          sincronizá-los no perfil. Os papéis são definidos nesta aplicação.
        </p>
      ) : null}

      <Field id="name" label="Nome" required error={errors.name?.message}>
        <Input
          autoComplete="name"
          readOnly={dataLocked}
          {...register("name", { required: "Informe o nome." })}
        />
      </Field>

      <Field id="email" label="E-mail" required error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          readOnly={dataLocked}
          {...register("email", {
            required: "Informe o e-mail.",
            pattern: {
              value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
              message: "Informe um e-mail válido.",
            },
          })}
        />
      </Field>

      <Field
        id="registry"
        label="Matrícula"
        required
        error={errors.registry?.message}
      >
        <Input
          autoComplete="off"
          readOnly={dataLocked}
          {...register("registry", {
            setValueAs: (value: string) => value.trim().toLowerCase(),
            required: "Informe a matrícula.",
            pattern: {
              value: /^[a-zA-Z0-9._-]+$/,
              message:
                "Use apenas letras, números, ponto, hífen ou sublinhado.",
            },
          })}
        />
      </Field>

      <CheckboxGroup
        legend="Origens de autenticação"
        description="As permissões continuam sendo administradas nesta aplicação."
      >
        <CheckboxField
          id="ldapEnabled"
          disabled={dataLocked}
          label="Permitir conta institucional IFCE"
          description="Autentica pela matrícula no diretório institucional."
          {...register("ldapEnabled")}
        />
        <CheckboxField
          id="localAuthEnabled"
          disabled={dataLocked}
          label="Permitir senha local"
          description="Quando LDAP e senha local estão habilitados, a senha local serve como contingência."
          {...register("localAuthEnabled")}
        />
      </CheckboxGroup>

      <CheckboxGroup
        legend="Papéis"
        description={
          rolesAvailable
            ? "A conta recebe as permissões dos papéis selecionados."
            : "Você não tem permissão para visualizar os papéis disponíveis."
        }
      >
        {rolesLoading ? (
          <Spinner label="Carregando papéis" />
        ) : rolesAvailable ? (
          roles.map((role) => (
            <CheckboxField
              key={role.slug}
              id={`role-${role.slug}`}
              value={role.slug}
              label={role.name}
              description={role.slug}
              {...register("roles")}
            />
          ))
        ) : null}
      </CheckboxGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
