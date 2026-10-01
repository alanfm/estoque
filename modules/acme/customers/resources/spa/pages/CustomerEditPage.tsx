import CustomersPage from "./CustomersPage";
import {
  FormModal,
  ErrorState,
  Spinner,
  useAsync,
  useDocumentTitle,
} from "@starterkit/module-kit";
import { useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { customersService } from "../services/customersService";
import { CustomerForm } from "./CustomerForm";

export default function CustomerEditPage() {
  useDocumentTitle("Editar cliente");
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const loader = useCallback(
    (signal: AbortSignal) => customersService.get(id, signal),
    [id],
  );
  const { data, loading, error, reload } = useAsync(loader);

  return (
    <FormModal
      title="Editar cliente"
      returnTo="/admin/customers"
      background={<CustomersPage />}
      backgroundPermission="customers.viewAny"
      description="Atualize os dados de contato e da empresa."
    >
      {loading && !data ? (
        <div className="flex justify-center p-10">
          <Spinner label="Carregando cliente" />
        </div>
      ) : error ? (
        <ErrorState requestId={error.requestId} onRetry={reload} />
      ) : data ? (
        <CustomerForm
          defaultValues={{
            name: data.name,
            email: data.email,
            phone: data.phone ?? "",
            company: data.company ?? "",
          }}
          submitLabel="Salvar alterações"
          onSubmit={async (values) => {
            await customersService.update(id, values);
            navigate("/admin/customers", {
              replace: true,
              state: { flash: "Cliente atualizado." },
            });
          }}
        />
      ) : null}
    </FormModal>
  );
}
