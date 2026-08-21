import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  Package,
  BarChart3,
  Target,
  Calendar,
  ChevronLeft,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { KPICard } from "@/components/ui/KPICard";
import { EmptyState } from "@/components/ui/EmptyState";

interface NavItem {
  label: string;
  to: string;
  icon?: LucideIcon;
}

const financeiroNavItems: NavItem[] = [
  { label: "Dashboard", to: "/financeiro" },
  { label: "Diário", to: "/financeiro/diario-caixa", icon: FileText },
  { label: "Lançamentos", to: "/financeiro/lancamentos", icon: DollarSign },
  { label: "Contas", to: "/financeiro/contas-pagar", icon: CreditCard },
  { label: "Estoque", to: "/financeiro/estoque", icon: Package },
  { label: "DRE", to: "/financeiro/dre", icon: BarChart3 },
];

interface ListItemProps {
  title: string;
  subtitle?: string;
  value: string;
  valueColor?: "default" | "success" | "danger";
}

function ListItem({ title, subtitle, value, valueColor = "default" }: ListItemProps) {
  const valueStyles = {
    default: "text-foreground",
    success: "text-primary",
    danger: "text-destructive",
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <p className={cn("font-semibold shrink-0 ml-3", valueStyles[valueColor])}>{value}</p>
    </div>
  );
}

export function MobileDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("month");
  const [activeNav, setActiveNav] = useState("/financeiro");
  
  const getPeriodDates = (p: string) => {
    const now = new Date();
    switch (p) {
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "quarter":
        return { start: subMonths(startOfMonth(now), 2), end: endOfMonth(now) };
      case "semester":
        return { start: subMonths(startOfMonth(now), 5), end: endOfMonth(now) };
      case "year":
        return { start: startOfYear(now), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getPeriodDates(period);
  
  const dashboardData = useDashboardData({
    startDate: start,
    endDate: end,
    tratamentoIds: [],
    origemIds: [],
  });
  const { kpis, charts } = dashboardData;
  const isLoading = !kpis || kpis.receitaTotal === undefined;

  const periodLabel = useMemo(() => {
    const labels: Record<string, string> = {
      month: format(start, "MMMM yyyy", { locale: ptBR }),
      quarter: "Últimos 3 meses",
      semester: "Últimos 6 meses",
      year: `Ano ${format(start, "yyyy")}`,
    };
    return labels[period] || "";
  }, [period, start]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl shrink-0"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Financeiro</h1>
            <p className="text-xs text-muted-foreground capitalize">{periodLabel}</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-auto h-9 rounded-xl px-3 gap-1.5 border-border/50">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="quarter">3 Meses</SelectItem>
              <SelectItem value="semester">6 Meses</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Module Nav */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {financeiroNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  "active:scale-95",
                  activeNav === item.to
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground"
                )}
                onClick={() => setActiveNav(item.to)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-28 space-y-5 overflow-y-auto">
        {/* Main KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-2xl bg-card/80 border border-border/30">
                  <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </>
          ) : (
            <>
              <KPICard
                label="Receita"
                value={formatCurrency(kpis.receitaTotal)}
                icon={TrendingUp}
                tone="success"
                size="sm"
              />
              <KPICard
                label="Despesas"
                value={formatCurrency(kpis.despesaTotal)}
                icon={TrendingDown}
                tone="danger"
                size="sm"
              />
              <KPICard
                label="Lucro Líquido"
                value={formatCurrency(kpis.lucroLiquido)}
                icon={Wallet}
                tone={kpis.lucroLiquido >= 0 ? "success" : "danger"}
                size="sm"
              />
              <KPICard
                label="Ticket Médio"
                value={formatCurrency(kpis.ticketMedio)}
                icon={Target}
                size="sm"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {[
            { label: "Novo Lançamento", icon: DollarSign, to: "/financeiro/lancamentos" },
            { label: "Ver DRE", icon: BarChart3, to: "/financeiro/dre" },
            { label: "Relatórios", icon: FileText, to: "/financeiro/relatorios" },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0",
                "bg-primary/10 border border-primary/20",
                "active:scale-95 transition-all"
              )}
            >
              <action.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{action.label}</span>
            </Link>
          ))}
        </div>

        {/* Top Tratamentos */}
        <div className="rounded-2xl bg-card/80 border border-border/30 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border/30">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Top Tratamentos</h3>
              <p className="text-xs text-muted-foreground">Mais vendidos no período</p>
            </div>
          </div>
          <div className="px-4">
            {isLoading ? (
              <div className="py-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : charts.topTratamentosReceita.length > 0 ? (
              charts.topTratamentosReceita.slice(0, 5).map((item: any) => (
                <ListItem
                  key={item.nome}
                  title={item.nome}
                  subtitle={`${item.quantidade || 0} vendas`}
                  value={formatCurrency(item.valor || 0)}
                  valueColor="success"
                />
              ))
            ) : (
              <EmptyState icon={TrendingUp} title="Nenhum tratamento no período" description="Ajuste o período selecionado." size="sm" />
            )}
          </div>
        </div>

        {/* Revenue by Origin */}
        <div className="rounded-2xl bg-card/80 border border-border/30 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border/30">
            <div className="w-9 h-9 rounded-lg bg-accent/50 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Por Origem</h3>
              <p className="text-xs text-muted-foreground">Receita por canal</p>
            </div>
          </div>
          <div className="px-4">
            {isLoading ? (
              <div className="py-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            ) : Object.keys(charts.receitaPorOrigem || {}).length > 0 ? (
              Object.entries(charts.receitaPorOrigem || {}).slice(0, 5).map(([nome, valor]: [string, any]) => (
                <ListItem
                  key={nome}
                  title={nome}
                  value={formatCurrency(valor || 0)}
                />
              ))
            ) : (
              <EmptyState icon={BarChart3} title="Nenhuma origem no período" description="Ajuste o período selecionado." size="sm" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}