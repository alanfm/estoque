import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../components/actions/Button";
import { Alert } from "../../components/feedback/Alert";
import { FormError } from "../../components/feedback/FormError";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { applyApiError } from "../../lib/formErrors";
import { useDocumentTitle } from "../../router/guards";
import { authService } from "../../services/auth/authService";

interface ResetFormValues {
  email: string;
  password: string;
  passwordConfirmation: string;
}

export function ResetPasswordPage() {
  useDocumentTitle("Definir nova senha");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const [done, setDone] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    defaultValues: { email, password: "", passwordConfirmation: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);

    try {
      await authService.resetPassword({ ...values, token });
      setDone(true);
    } catch (error) {
      setGeneralError(applyApiError(error, setError));
    }
  });

  if (!token) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2">Link inválido</h1>
        <Alert variant="danger">
          Este link de redefinição está incompleto ou expirou. Solicite um novo
          link.
        </Alert>
        <Button
          asChild
          variant="secondary"
          size="comfortable"
          className="w-full"
        >
          <Link to="/forgot-password">Solicitar novo link</Link>
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2">Senha definida</h1>
        <Alert variant="success">
          Sua senha foi definida com sucesso. Entre novamente com a nova senha.
        </Alert>
        <Button asChild size="comfortable" className="w-full">
          <Link to="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h2">Definir nova senha</h1>
        <p className="text-body-sm text-ink-secondary">
          Escolha uma senha com pelo menos 12 caracteres.
        </p>
      </div>

      <FormError message={generalError} />

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <Field id="email" label="E-mail" required error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="username"
            readOnly={email !== ""}
            {...register("email", { required: "Informe o e-mail." })}
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

        <Button
          type="submit"
          size="comfortable"
          className="w-full"
          loading={isSubmitting}
        >
          Definir senha
        </Button>
      </form>
    </div>
  );
}
