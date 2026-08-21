import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KPICard } from "@/components/ui/KPICard";
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useState } from "react";
import { useDREGerencial } from "@/hooks/useDREGerencial";
import { cn } from "@/lib/utils";

// ========== UTILS ==========
const formatCurrency = (value: number, compact = false) => {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

// ========== DRE ROW TYPES ==========
type RowType = "header" | "revenue" | "expense" | "subtotal" | "total";

interface DRETableRowProps {
  label: string;
  values: (number | string)[];
  total: number | string;
  type?: RowType;
  indent?: number;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  percent?: number[];
  totalPercent?: number;
}

const DRETableRow = ({
  label,
  values,
  total,
  type = "expense",
  indent = 0,
  expandable,
  expanded,
  onToggle,
  percent,
  totalPercent,
}: DRETableRowProps) => {
  const getValueColor = (val: number | string) => {
    if (typeof val === "string") return "text-muted-foreground";
    if (type === "expense") return val !== 0 ? "text-red-500 dark:text-red-400" : "text-muted-foreground/50";
    if (type === "revenue" || type === "subtotal") return val > 0 ? "text-emerald-600 dark:text-emerald-400" : val < 0 ? "text-red-500 dark:text-red-400" : "text-muted-foreground/50";
    if (type === "total") return val >= 0 ? "text-primary" : "text-destructive";
    return "text-foreground";
  };

  const rowClasses = cn(
    "transition-colors",
    type === "subtotal" && "bg-muted/40 font-semibold",
    type === "total" && "bg-primary/5 font-bold border-t-2 border-primary/20",
    type === "expense" && "hover:bg-muted/30",
    type === "revenue" && "hover:bg-muted/30",
    expandable && "cursor-pointer"
  );

  const cellClasses = "py-3 px-3 text-right tabular-nums whitespace-nowrap";
  const labelCellClasses = "py-3 px-4 text-left font-medium";

  return (
    <TableRow className={rowClasses} onClick={onToggle}>
      <TableCell 
        className={cn(labelCellClasses, type === "total" && "text-primary")}
        style={{ paddingLeft: `${16 + indent * 20}px` }}
      >
        <div className="flex items-center gap-2">
          {expandable && (
            <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground hover:bg-muted/80">
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          )}
          <span className={cn(
            "text-sm",
            type === "subtotal" && "text-foreground",
            type === "total" && "text-primary text-base"
          )}>
            {label}
          </span>
        </div>
      </TableCell>
      
      {values.map((val, i) => (
        <TableCell key={i} className={cn(cellClasses, getValueColor(val), "text-sm")}>
          {typeof val === "string" ? val : formatCurrency(val, true)}
          {percent && percent[i] !== undefined && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {formatPercent(percent[i])}
            </div>
          )}
        </TableCell>
      ))}
      
      <TableCell className={cn(
        cellClasses, 
        "font-semibold bg-muted/30 text-sm",
        type === "total" && "bg-primary/10 text-primary text-base",
        type !== "total" && getValueColor(total)
      )}>
        <div className="flex items-center justify-end gap-1.5">
          {typeof total === "number" && total !== 0 && type !== "total" && (
            type === "expense" ? (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            ) : total > 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )
          )}
          {typeof total === "string" ? total : formatCurrency(total)}
        </div>
        {totalPercent !== undefined && (
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {formatPercent(totalPercent)}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

// ========== COLLAPSIBLE SECTION ==========
interface CollapsibleSectionProps {
  label: string;
  values: number[];
  total: number;
  details: Map<string, number>[];
  totalDetails: Map<string, number>;
}

const CollapsibleSection = ({ label, values, total, details, totalDetails }: CollapsibleSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  
  const categories = new Set<string>();
  details.forEach(d => d.forEach((_, cat) => categories.add(cat)));
  totalDetails.forEach((_, cat) => categories.add(cat));

  return (
    <>
      <DRETableRow
        label={label}
        values={values.map(v => -v)}
        total={-total}
        type="expense"
        expandable
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      />
      {expanded && Array.from(categories).sort().map(cat => (
        <DRETableRow
          key={cat}
          label={cat}
          values={details.map(d => -(d.get(cat) || 0))}
          total={-(totalDetails.get(cat) || 0)}
          type="expense"
          indent={2}
        />
      ))}
    </>
  );
};

// ========== MAIN COMPONENT ==========
const DRE = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data, isLoading } = useDREGerencial(selectedYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const meses = data?.meses || [];
  const totais = data?.totais;

  const monthLabels = meses.map(m => m.mesLabel);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1800px] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1800px] space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">DRE Gerencial</h1>
          <p className="text-sm text-muted-foreground">
            Demonstração do Resultado do Exercício
          </p>
        </div>
        <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
          <SelectTrigger className="w-[140px] bg-card">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-lg z-50">
            {years.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Receita Líquida"
          value={formatCurrency(totais?.receitaLiquida || 0)}
        />
        <KPICard
          label="Lucro Bruto"
          value={formatCurrency(totais?.lucroBruto || 0)}
          subtitle={totais?.margemBruta !== undefined ? `${formatPercent(totais.margemBruta)} margem` : undefined}
          tone="success"
        />
        <KPICard
          label="EBIT"
          value={formatCurrency(totais?.resultadoOperacional || 0)}
          subtitle={totais?.margemOperacional !== undefined ? `${formatPercent(totais.margemOperacional)} margem` : undefined}
          tone="info"
        />
        <KPICard
          label="Lucro Líquido"
          value={formatCurrency(totais?.lucroLiquido || 0)}
          subtitle={totais?.margemLiquida !== undefined ? `${formatPercent(totais.margemLiquida)} margem` : undefined}
          tone={(totais?.lucroLiquido || 0) >= 0 ? "success" : "warning"}
        />
      </div>

      {/* DRE Table */}
      <Card className="overflow-hidden border border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-base font-semibold">
            Demonstração de Resultados — {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[280px] py-4 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Descrição
                  </TableHead>
                  {monthLabels.map((label, i) => (
                    <TableHead key={i} className="py-4 px-3 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground min-w-[85px]">
                      {label}
                    </TableHead>
                  ))}
                  <TableHead className="py-4 px-4 text-center text-xs font-bold uppercase tracking-wider text-foreground bg-muted/60 min-w-[110px]">
                    Total Ano
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* RECEITA BRUTA */}
                <DRETableRow
                  label="Receita Bruta"
                  values={meses.map(m => m.receitaBruta)}
                  total={totais?.receitaBruta || 0}
                  type="subtotal"
                />

                {/* Deduções */}
                <DRETableRow
                  label="(-) Impostos sobre serviços"
                  values={meses.map(m => -m.deducoes)}
                  total={-(totais?.deducoes || 0)}
                  type="expense"
                  indent={1}
                />

                {/* RECEITA LÍQUIDA */}
                <DRETableRow
                  label="= Receita Líquida"
                  values={meses.map(m => m.receitaLiquida)}
                  total={totais?.receitaLiquida || 0}
                  type="subtotal"
                />

                {/* Custos */}
                <DRETableRow
                  label="(-) Custo dos serviços prestados"
                  values={meses.map(m => -m.custoMaterial)}
                  total={-(totais?.custoMaterial || 0)}
                  type="expense"
                  indent={1}
                />
                <DRETableRow
                  label="(-) Custos variáveis"
                  values={meses.map(m => -m.custosVariaveis)}
                  total={-(totais?.custosVariaveis || 0)}
                  type="expense"
                  indent={1}
                />

                {/* LUCRO BRUTO */}
                <DRETableRow
                  label="= Lucro Bruto"
                  values={meses.map(m => m.lucroBruto)}
                  total={totais?.lucroBruto || 0}
                  percent={meses.map(m => m.margemBruta)}
                  totalPercent={totais?.margemBruta}
                  type="subtotal"
                />

                {/* Despesas Operacionais */}
                <CollapsibleSection
                  label="(-) Despesas operacionais"
                  values={meses.map(m => m.despesasOperacionais)}
                  total={totais?.despesasOperacionais || 0}
                  details={meses.map(m => m.despesasOpexDetalhe)}
                  totalDetails={totais?.despesasOpexDetalhe || new Map()}
                />

                {/* RESULTADO OPERACIONAL (EBIT) */}
                <DRETableRow
                  label="= Resultado Operacional (EBIT)"
                  values={meses.map(m => m.resultadoOperacional)}
                  total={totais?.resultadoOperacional || 0}
                  percent={meses.map(m => m.margemOperacional)}
                  totalPercent={totais?.margemOperacional}
                  type="subtotal"
                />

                {/* Despesas Financeiras */}
                <DRETableRow
                  label="(-) Despesas financeiras"
                  values={meses.map(m => -m.despesasFinanceiras)}
                  total={-(totais?.despesasFinanceiras || 0)}
                  type="expense"
                  indent={1}
                />

                {/* RESULTADO ANTES IR */}
                <DRETableRow
                  label="= Resultado antes do IR/CSLL"
                  values={meses.map(m => m.resultadoAntesIR)}
                  total={totais?.resultadoAntesIR || 0}
                  type="subtotal"
                />

                {/* Impostos sobre lucro */}
                <DRETableRow
                  label="(-) IRPJ / CSLL"
                  values={meses.map(m => -m.impostoLucro)}
                  total={-(totais?.impostoLucro || 0)}
                  type="expense"
                  indent={1}
                />

                {/* LUCRO LÍQUIDO */}
                <DRETableRow
                  label="= Lucro Líquido do Exercício"
                  values={meses.map(m => m.lucroLiquido)}
                  total={totais?.lucroLiquido || 0}
                  percent={meses.map(m => m.margemLiquida)}
                  totalPercent={totais?.margemLiquida}
                  type="total"
                />
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DRE;
