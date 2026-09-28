import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
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
}

export interface UserFormProps {
  defaultValues: UserFormValues;
  submitLabel: string;
  cancelTo: string;
  roles: Role[];
  rolesAvailable: boolean;
  rolesLoading: boolean;
  onSubmit(values: UserFormValues): Promise<void>;
}

export function UserForm({
  defaultValues,
  submitLabel,
  cancelTo,
  roles,
  rolesAvailable,
  rolesLoading,
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

      <Field id="name" label="Nome" required error={errors.name?.message}>
        <Input
          autoComplete="name"
          {...register("name", { required: "Informe o nome." })}
        />
      </Field>

      <Field id="email" label="E-mail" required error={errors.email?.message}>
        <Input
          type="email"
          autoComplete="email"
          {...register("email", {
            required: "Informe o e-mail.",
            pattern: {
              value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
              message: "Informe um e-mail válido.",
            },
          })}
        />
      </Field>

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
        <Button asChild variant="secondary">
          <Link to={cancelTo}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
