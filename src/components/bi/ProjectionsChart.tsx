import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { KPICard } from "@/components/ui/KPICard";
import { TrendingUp, Calendar, Target } from "lucide-react";

interface ProjectionData {
  mes: string;
  projecaoOtimista: number;
  projecaoBase: number;
  projecaoPessimista: number;
}

interface ProjectionsChartProps {
  data: ProjectionData[];
  receitaAtual: number;
  crescimentoAtual: number;
}

export function ProjectionsChart({ data, receitaAtual, crescimentoAtual }: ProjectionsChartProps) {
  // Calculate totals
  const projecaoTotal = {
    otimista: data.reduce((sum, d) => sum + d.projecaoOtimista, 0),
    base: data.reduce((sum, d) => sum + d.projecaoBase, 0),
    pessimista: data.reduce((sum, d) => sum + d.projecaoPessimista, 0),
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Projeção Base (6 meses)"
          value={formatCurrency(projecaoTotal.base)}
          subtitle="Cenário mais provável"
          icon={Target}
        />
        <KPICard
          label="Projeção Otimista"
          value={formatCurrency(projecaoTotal.otimista)}
          subtitle="Cenário de crescimento"
          icon={TrendingUp}
          tone="success"
        />
        <KPICard
          label="Projeção Conservadora"
          value={formatCurrency(projecaoTotal.pessimista)}
          subtitle="Cenário cauteloso"
          icon={Calendar}
          tone="warning"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Projeção de Receita - Próximos 6 Meses</CardTitle>
          <CardDescription>
            Baseado na tendência atual de {crescimentoAtual >= 0 ? '+' : ''}{crescimentoAtual.toFixed(1)}% e receita de {formatCurrency(receitaAtual)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOtimista" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPessimista" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      projecaoOtimista: 'Cenário Otimista',
                      projecaoBase: 'Cenário Base',
                      projecaoPessimista: 'Cenário Conservador',
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const labels: Record<string, string> = {
                      projecaoOtimista: 'Otimista',
                      projecaoBase: 'Base',
                      projecaoPessimista: 'Conservador',
                    };
                    return labels[value] || value;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="projecaoOtimista"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#colorOtimista)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="projecaoBase"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#colorBase)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="projecaoPessimista"
                  stroke="hsl(var(--chart-3))"
                  fill="url(#colorPessimista)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Premissas das Projeções</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Cenário Otimista</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Crescimento acelerado de +10%</li>
                <li>• Tendência atual mantida x1.5</li>
                <li>• Novas aquisições de clientes</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Cenário Base</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Manutenção da tendência atual</li>
                <li>• Crescimento orgânico moderado</li>
                <li>• Sazonalidade considerada</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <h4 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">Cenário Conservador</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Crescimento desacelerado</li>
                <li>• Possíveis perdas de clientes</li>
                <li>• Fatores externos adversos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
