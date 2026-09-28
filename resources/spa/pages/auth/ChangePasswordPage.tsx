import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/actions/Button";
import { Alert } from "../../components/feedback/Alert";
import { FormError } from "../../components/feedback/FormError";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { applyApiError } from "../../lib/formErrors";
import { useDocumentTitle } from "../../router/guards";
import { authService } from "../../services/auth/authService";

interface ChangeFormValues {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

export function ChangePasswordPage() {
  useDocumentTitle("Alterar senha");
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangeFormValues>({
    defaultValues: {
      currentPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);
    setSuccess(false);

    try {
      await authService.changePassword(values);
      reset();
      setSuccess(true);
    } catch (error) {
      setGeneralError(applyApiError(error, setError));
    }
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h1">Alterar senha</h1>
        <p className="text-body text-ink-secondary">
          Informe sua senha atual e escolha uma nova senha com pelo menos 12
          caracteres.
        </p>
      </div>

      <div className="max-w-[720px] space-y-4">
        {success ? (
          <Alert variant="success" title="Senha alterada">
            Sua senha foi alterada com sucesso.
          </Alert>
        ) : null}

        <FormError message={generalError} />

        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <Field
            id="currentPassword"
            label="Senha atual"
            required
            error={errors.currentPassword?.message}
          >
            <Input
              type="password"
              autoComplete="current-password"
              {...register("currentPassword", {
                required: "Informe a senha atual.",
              })}
            />
          </Field>

          <Field
            id="password"
            label="Nova senha"
            required
            hint="Mínimo de 12 caracteres."
            error={errors.password?.message}
          >
            <Input
              type="password"
              autoComplete="new-password"
              {...register("password", {
                required: "Informe a nova senha.",
                minLength: {
                  value: 12,
                  message: "A senha deve ter pelo menos 12 caracteres.",
                },
              })}
            />
          </Field>

          <Field
            id="passwordConfirmation"
            label="Confirmar nova senha"
            required
            error={errors.passwordConfirmation?.message}
          >
            <Input
              type="password"
              autoComplete="new-password"
              {...register("passwordConfirmation", {
                required: "Confirme a nova senha.",
                validate: (value, values) =>
                  value === values.password || "As senhas não coincidem.",
              })}
            />
          </Field>

          <Button type="submit" loading={isSubmitting}>
            Salvar nova senha
          </Button>
        </form>
      </div>
    </div>
  );
}
