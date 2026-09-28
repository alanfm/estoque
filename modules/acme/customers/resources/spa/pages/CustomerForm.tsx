import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "../../../../../../resources/spa/components/actions/Button";
import { FormError } from "../../../../../../resources/spa/components/feedback/FormError";
import { Field } from "../../../../../../resources/spa/components/forms/Field";
import { Input } from "../../../../../../resources/spa/components/forms/Input";
import { applyApiError } from "../../../../../../resources/spa/lib/formErrors";
import type { CustomerInput } from "../services/customersService";

export interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface CustomerFormProps {
  defaultValues: CustomerFormValues;
  submitLabel: string;
  onSubmit(values: CustomerInput): Promise<void>;
}

export function CustomerForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: CustomerFormProps) {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({ defaultValues });

  const submit = handleSubmit(async (values) => {
    setGeneralError(null);

    try {
      await onSubmit({
        ...values,
        phone: values.phone || null,
        company: values.company || null,
      });
    } catch (error) {
      setGeneralError(applyApiError(error, setError));
    }
  });

  return (
    <form noValidate onSubmit={submit} className="max-w-[720px] space-y-6">
      <FormError message={generalError} />

      <Field
        id="customer-name"
        label="Nome"
        required
        error={errors.name?.message}
      >
        <Input
          autoComplete="organization"
          maxLength={160}
          {...register("name", { required: "Informe o nome." })}
        />
      </Field>

      <Field
        id="customer-email"
        label="E-mail"
        required
        error={errors.email?.message}
      >
        <Input
          type="email"
          autoComplete="email"
          maxLength={254}
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
        id="customer-company"
        label="Empresa"
        error={errors.company?.message}
      >
        <Input maxLength={160} {...register("company")} />
      </Field>

      <Field id="customer-phone" label="Telefone" error={errors.phone?.message}>
        <Input
          type="tel"
          autoComplete="tel"
          maxLength={32}
          {...register("phone")}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
        <Button asChild variant="secondary">
          <Link to="/admin/customers">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
