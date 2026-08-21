import { Users } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";

interface FornecedoresKPIsProps {
  totalFornecedores: number;
}

export const FornecedoresKPIs = ({ totalFornecedores }: FornecedoresKPIsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-1">
      <KPICard label="Total de Fornecedores" value={totalFornecedores} icon={Users} />
    </div>
  );
};
