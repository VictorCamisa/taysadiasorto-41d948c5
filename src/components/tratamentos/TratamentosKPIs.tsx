import { BarChart3, DollarSign, Percent } from "lucide-react";
import { KPICard } from "@/components/ui/KPICard";

interface TratamentosKPIsProps {
  tratamentos: any[];
}

export const TratamentosKPIs = ({ tratamentos }: TratamentosKPIsProps) => {
  const totalTratamentos = tratamentos.length;

  // Usar preco_padrao da nova tabela tratamentos
  const ticketMedio = tratamentos.length > 0
    ? tratamentos.reduce((sum, t) => sum + Number(t.preco_padrao || 0), 0) / tratamentos.length
    : 0;

  // Calcular margem média baseado em preco_padrao e custo_estimado
  const margemMedia = tratamentos.length > 0
    ? tratamentos.reduce((sum, t) => {
        const preco = Number(t.preco_padrao || 0);
        const custo = Number(t.custo_estimado || 0);
        const margem = preco > 0 ? ((preco - custo) / preco) * 100 : 0;
        return sum + margem;
      }, 0) / tratamentos.length
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KPICard label="Total Tratamentos" value={totalTratamentos} icon={BarChart3} />
      <KPICard
        label="Ticket Médio"
        value={ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        icon={DollarSign}
      />
      <KPICard label="Margem Média" value={`${margemMedia.toFixed(1)}%`} icon={Percent} />
    </div>
  );
};
