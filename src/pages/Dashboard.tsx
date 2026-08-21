import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, LayoutDashboard, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KPICard } from "@/components/ui/KPICard";
import { TopTreatmentsChart } from "@/components/dashboard/TopTreatmentsChart";
import { RevenueOriginPieChart } from "@/components/dashboard/RevenueOriginPieChart";
import { MonthlyRevenueChart } from "@/components/dashboard/MonthlyRevenueChart";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { PageHeader } from "@/components/PageHeader";
import { useDashboardData } from "@/hooks/useDashboardData";
import { startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { formatCurrency } from "@/lib/utils";

const Dashboard = () => {
  const [period, setPeriod] = useState("month");
  
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
  
  const [filters] = useState({
    startDate: start,
    endDate: end,
    tratamentoIds: [] as string[],
    origemIds: [] as string[],
  });

  const { kpis, charts } = useDashboardData({
    ...filters,
    startDate: start,
    endDate: end,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Dashboard Financeiro"
          description="Visão geral do desempenho"
          icon={<LayoutDashboard className="h-5 w-5 text-primary" />}
          className="mb-0"
        />
        
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[160px]">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mês Atual</SelectItem>
            <SelectItem value="quarter">Últimos 3 Meses</SelectItem>
            <SelectItem value="semester">Últimos 6 Meses</SelectItem>
            <SelectItem value="year">Ano Atual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main KPIs - 2x2 Grid on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Receita Total"
          value={formatCurrency(kpis.receitaTotal)}
          trend={{ value: kpis.taxaCrescimentoReceita, label: "vs período anterior" }}
          icon={DollarSign}
          tone="success"
        />
        <KPICard
          label="Despesas"
          value={formatCurrency(kpis.despesaTotal)}
          icon={TrendingDown}
          tone="danger"
        />
        <KPICard
          label="Lucro Líquido"
          value={formatCurrency(kpis.lucroLiquido)}
          trend={{ value: kpis.taxaCrescimentoLucro }}
          icon={TrendingUp}
          tone={kpis.lucroLiquido >= 0 ? "success" : "danger"}
        />
        <KPICard
          label="Ticket Médio"
          value={formatCurrency(kpis.ticketMedio)}
          icon={CreditCard}
        />
      </div>

      {/* Revenue Chart */}
      <MonthlyRevenueChart />

      {/* Treatment Performance */}
      <div className="grid lg:grid-cols-2 gap-4">
        <TopTreatmentsChart
          data={charts.topTratamentosReceita}
          title="Top 5 Tratamentos por Receita"
          dataKey="receita"
        />
        <RevenueOriginPieChart data={charts.receitaPorOrigem} />
      </div>

      {/* Alerts and Payments */}
      <div className="grid lg:grid-cols-2 gap-4">
        <UpcomingPayments />
        <LowStockAlert />
      </div>
    </div>
  );
};

export default Dashboard;
