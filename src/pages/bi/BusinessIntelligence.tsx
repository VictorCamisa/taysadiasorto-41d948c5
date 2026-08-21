import { useState } from "react";
import { BarChart3, TrendingUp, Target, LineChart, Users, Calendar, PieChart } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useBIData } from "@/hooks/useBIData";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { KPICard } from "@/components/ui/KPICard";
import { LTVCACChart } from "@/components/bi/LTVCACChart";
import { FunnelChart } from "@/components/bi/FunnelChart";
import { MarketingROASChart } from "@/components/bi/MarketingROASChart";
import { TreatmentPerformanceChart } from "@/components/bi/TreatmentPerformanceChart";
import { SeasonalityChart } from "@/components/bi/SeasonalityChart";
import { CohortChart } from "@/components/bi/CohortChart";
import { ProjectionsChart } from "@/components/bi/ProjectionsChart";
import { ExpenseBreakdownChart } from "@/components/bi/ExpenseBreakdownChart";
import { DollarSign, Percent, TrendingDown, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessIntelligence() {
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'semestre' | 'ano'>('trimestre');
  
  const { isLoading, kpis, ltvCac, marketing, funnel, treatments, seasonality, cohorts, expenses, projecoes } = useBIData({ periodo });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Business Intelligence"
          description="Análises estratégicas e indicadores de performance"
          icon={<BarChart3 className="h-6 w-6 text-[hsl(var(--module-bi))]" />}
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Business Intelligence"
          description="Análises estratégicas e indicadores de performance"
          icon={<BarChart3 className="h-6 w-6 text-[hsl(var(--module-bi))]" />}
        />
        
        <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Último Mês</SelectItem>
            <SelectItem value="trimestre">Último Trimestre</SelectItem>
            <SelectItem value="semestre">Último Semestre</SelectItem>
            <SelectItem value="ano">Último Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Receita Total"
          value={formatCurrency(kpis.receitaTotal)}
          icon={DollarSign}
          trend={{ value: kpis.crescimentoReceita, label: "vs período anterior" }}
          tone="success"
        />
        <KPICard
          label="Lucro Líquido"
          value={formatCurrency(kpis.lucroLiquido)}
          icon={Wallet}
          trend={{ value: kpis.crescimentoLucro, label: "vs período anterior" }}
          tone={kpis.lucroLiquido >= 0 ? "success" : "danger"}
        />
        <KPICard
          label="Margem Bruta"
          value={`${formatNumber(kpis.margemBrutaPercent, 1)}%`}
          subtitle={formatCurrency(kpis.margemBruta)}
          icon={Percent}
          tone={kpis.margemBrutaPercent >= 50 ? "success" : kpis.margemBrutaPercent >= 30 ? "warning" : "danger"}
        />
        <KPICard
          label="Ticket Médio"
          value={formatCurrency(kpis.ticketMedio)}
          subtitle={`${kpis.totalTransacoes} transações`}
          icon={TrendingUp}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="ltv-cac" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">LTV/CAC</span>
          </TabsTrigger>
          <TabsTrigger value="marketing" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Marketing</span>
          </TabsTrigger>
          <TabsTrigger value="tratamentos" className="gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Tratamentos</span>
          </TabsTrigger>
          <TabsTrigger value="sazonalidade" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Sazonalidade</span>
          </TabsTrigger>
          <TabsTrigger value="projecoes" className="gap-2">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Projeções</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <FunnelChart data={funnel} taxaConversaoGeral={marketing.taxaConversaoGeral} />
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Resumo LTV/CAC</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">LTV</span>
                    <span className="font-semibold">{formatCurrency(ltvCac.ltv)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">CAC</span>
                    <span className="font-semibold">{formatCurrency(ltvCac.cac)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg">
                    <span className="text-sm text-muted-foreground">Ratio LTV:CAC</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{ltvCac.ltvCacRatio.toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">ROAS</span>
                    <span className="font-semibold">{marketing.roas.toFixed(1)}x</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <ExpenseBreakdownChart porCategoria={expenses.porCategoria} porNatureza={expenses.porNatureza} />
        </TabsContent>

        {/* LTV/CAC Tab */}
        <TabsContent value="ltv-cac" className="space-y-6">
          <LTVCACChart {...ltvCac} />
          <CohortChart data={cohorts} />
        </TabsContent>

        {/* Marketing Tab */}
        <TabsContent value="marketing" className="space-y-6">
          <MarketingROASChart
            custoMarketing={marketing.custoMarketing}
            roas={marketing.roas}
            origemAnalysis={marketing.origemAnalysis}
            taxaConversaoGeral={marketing.taxaConversaoGeral}
          />
        </TabsContent>

        {/* Tratamentos Tab */}
        <TabsContent value="tratamentos" className="space-y-6">
          <TreatmentPerformanceChart data={treatments} />
        </TabsContent>

        {/* Sazonalidade Tab */}
        <TabsContent value="sazonalidade" className="space-y-6">
          <SeasonalityChart data={seasonality} />
        </TabsContent>

        {/* Projeções Tab */}
        <TabsContent value="projecoes" className="space-y-6">
          <ProjectionsChart 
            data={projecoes} 
            receitaAtual={kpis.receitaTotal} 
            crescimentoAtual={kpis.crescimentoReceita} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
