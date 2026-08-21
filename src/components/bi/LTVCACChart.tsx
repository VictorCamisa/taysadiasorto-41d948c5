import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { KPICard } from "@/components/ui/KPICard";
import { TrendingUp, Users, DollarSign, Target } from "lucide-react";

interface LTVCACChartProps {
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  arpu: number;
  avgLifespan: number;
  numClientes: number;
  novosClientes: number;
}

export function LTVCACChart({
  ltv,
  cac,
  ltvCacRatio,
  arpu,
  avgLifespan,
  numClientes,
  novosClientes,
}: LTVCACChartProps) {
  const data = [
    { name: 'LTV', value: ltv, color: 'hsl(var(--chart-2))' },
    { name: 'CAC', value: cac, color: 'hsl(var(--chart-5))' },
  ];

  const getRatioColor = () => {
    if (ltvCacRatio >= 3) return 'text-emerald-600 dark:text-emerald-400';
    if (ltvCacRatio >= 2) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRatioLabel = () => {
    if (ltvCacRatio >= 3) return 'Excelente';
    if (ltvCacRatio >= 2) return 'Bom';
    if (ltvCacRatio >= 1) return 'Atenção';
    return 'Crítico';
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="LTV (Lifetime Value)"
          value={formatCurrency(ltv)}
          subtitle="Valor médio por cliente"
          icon={DollarSign}
          tone="success"
        />
        <KPICard
          label="CAC (Custo Aquisição)"
          value={formatCurrency(cac)}
          subtitle="Custo por cliente"
          icon={Target}
          tone="warning"
        />
        <KPICard
          label="Ratio LTV:CAC"
          value={`${ltvCacRatio.toFixed(1)}x`}
          subtitle={getRatioLabel()}
          icon={TrendingUp}
          tone={ltvCacRatio >= 3 ? 'success' : ltvCacRatio >= 2 ? 'warning' : 'danger'}
        />
        <KPICard
          label="Base de Clientes"
          value={numClientes.toLocaleString()}
          subtitle={`+${novosClientes} novos no período`}
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comparativo LTV vs CAC</CardTitle>
            <CardDescription>
              Um ratio saudável é de pelo menos 3:1
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => formatCurrency(v)}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análise de Retorno</CardTitle>
            <CardDescription>
              Métricas complementares de retenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ARPU (Receita Média)</span>
                  <span className="font-semibold">{formatCurrency(arpu)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--chart-1))] rounded-full transition-all"
                    style={{ width: `${Math.min((arpu / ltv) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vida Média do Cliente</span>
                  <span className="font-semibold">{avgLifespan.toFixed(0)} meses</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--chart-2))] rounded-full transition-all"
                    style={{ width: `${Math.min((avgLifespan / 24) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payback Period</span>
                  <span className="font-semibold">
                    {arpu > 0 ? (cac / (arpu / 12)).toFixed(1) : 0} meses
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(var(--chart-3))] rounded-full transition-all"
                    style={{ width: `${Math.min((12 / (cac / (arpu / 12 || 1))) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg bg-muted/50 text-center`}>
                <p className="text-sm text-muted-foreground mb-1">Índice de Saúde</p>
                <p className={`text-3xl font-bold ${getRatioColor()}`}>
                  {ltvCacRatio.toFixed(1)}x
                </p>
                <p className={`text-sm font-medium ${getRatioColor()}`}>
                  {getRatioLabel()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
