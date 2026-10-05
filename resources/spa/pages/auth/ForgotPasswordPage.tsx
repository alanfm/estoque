import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { Button } from "../../components/actions/Button";
import { Alert } from "../../components/feedback/Alert";
import { FormError } from "../../components/feedback/FormError";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { applyApiError } from "../../lib/formErrors";
import { useDocumentTitle } from "../../router/guards";
import { authService } from "../../services/auth/authService";
import type { AuthOptions } from "../../types/auth";

interface ForgotFormValues {
  email: string;
}

export function ForgotPasswordPage() {
  useDocumentTitle("Recuperar senha");
  const [sent, setSent] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [authOptions, setAuthOptions] = useState<AuthOptions | null>(null);
  useEffect(() => {
    void authService
      .options()
      .then(setAuthOptions)
      .catch(() => setAuthOptions(null));
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({ defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setGeneralError(null);

    try {
      await authService.forgotPassword(values);
      setSent(true);
    } catch (error) {
      setGeneralError(applyApiError(error, setError));
    }
  });

  if (sent) {
    return (
      <div className="space-y-6">
        <h1 className="text-h2">Verifique seu e-mail</h1>
        <Alert variant="success">
          Se o e-mail informado estiver cadastrado, enviaremos um link para
          redefinir a senha. Confira também a caixa de spam.
        </Alert>
        <Button
          asChild
          variant="secondary"
          size="comfortable"
          className="w-full"
        >
          <Link to="/login">Voltar para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-h2">Recuperar senha</h1>
        <p className="text-body-sm text-ink-secondary">
          Informe o e-mail da conta local para receber um link de redefinição.
          Senhas institucionais devem ser recuperadas com a TI do IFCE.
        </p>
        {authOptions?.ldapPasswordHelpUrl ? (
          <a
            className="text-body-sm text-brand underline"
            href={authOptions.ldapPasswordHelpUrl}
          >
            Recuperar senha institucional
          </a>
        ) : null}
      </div>

      <FormError message={generalError} />

      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <Field id="email" label="E-mail" required error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="username"
            autoFocus
            {...register("email", {
              required: "Informe o e-mail.",
              pattern: {
                value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                message: "Informe um e-mail válido.",
              },
            })}
          />
        </Field>

        <Button
          type="submit"
          size="comfortable"
          className="w-full"
          loading={isSubmitting}
        >
          Enviar link
        </Button>
      </form>

      <Alert variant="neutral">
        <Link to="/login" className="underline">
          Voltar para o login
        </Link>
      </Alert>
    </div>
  );
}
