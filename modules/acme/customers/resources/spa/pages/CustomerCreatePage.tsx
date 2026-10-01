import CustomersPage from "./CustomersPage";
import { FormModal, useDocumentTitle } from "@starterkit/module-kit";
import { useNavigate } from "react-router";
import { customersService } from "../services/customersService";
import { CustomerForm } from "./CustomerForm";

export default function CustomerCreatePage() {
  useDocumentTitle("Criar cliente");
  const navigate = useNavigate();

  return (
    <FormModal
      title="Criar cliente"
      returnTo="/admin/customers"
      background={<CustomersPage />}
      backgroundPermission="customers.viewAny"
      description="Cadastre os dados de contato e da empresa."
    >
      <CustomerForm
        defaultValues={{ name: "", email: "", phone: "", company: "" }}
        submitLabel="Criar cliente"
        onSubmit={async (values) => {
          await customersService.create(values);
          navigate("/admin/customers", {
            replace: true,
            state: { flash: "Cliente criado." },
          });
        }}
      />
    </FormModal>
  );
}
