import { Button, PageHeader } from "@starterkit/module-kit";

export default function ContractSamplePage() {
  return (
    <section className="grid gap-4">
      <PageHeader
        title="Amostra de Contrato"
        description="Página de exemplo do módulo de contrato."
      />
      <Button>Contrato carregado</Button>
    </section>
  );
}
