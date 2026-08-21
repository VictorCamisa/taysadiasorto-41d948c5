import { Package, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";
import { formatCurrency } from "@/lib/utils";

interface EstoqueKPIsProps {
  valorTotalEstoque: number;
  produtosAtivos: number;
  produtosCriticos: number;
  totalComprasMes: number;
}

export const EstoqueKPIs = ({
  valorTotalEstoque,
  produtosAtivos,
  produtosCriticos,
  totalComprasMes,
}: EstoqueKPIsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard label="Valor Total do Estoque" value={formatCurrency(valorTotalEstoque)} icon={Package} />
      <KPICard label="Produtos Ativos" value={produtosAtivos} icon={CheckCircle} tone="success" />
      <KPICard label="Produtos Críticos" value={produtosCriticos} icon={AlertTriangle} tone="danger" />
      <KPICard label="Total Compras (Mês)" value={formatCurrency(totalComprasMes)} icon={DollarSign} />
    </div>
  );
};
