import { useNavigate } from "react-router";
import { PageHeader } from "../../../../../../resources/spa/components/navigation/PageHeader";
import { useDocumentTitle } from "../../../../../../resources/spa/router/guards";
import { customersService } from "../services/customersService";
import { CustomerForm } from "./CustomerForm";

export default function CustomerCreatePage() {
  useDocumentTitle("Criar cliente");
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Criar cliente"
        description="Cadastre os dados de contato e da empresa."
        breadcrumbs={[
          { label: "Painel", to: "/" },
          { label: "Clientes", to: "/admin/customers" },
          { label: "Criar" },
        ]}
      />
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
    </div>
  );
}
