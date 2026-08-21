import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { KPICard } from "@/components/ui/KPICard";
import { Target, TrendingUp, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrigemAnalysis {
  id: string;
  nome: string;
  leads: number;
  conversoes: number;
  receita: number;
  cac: number;
  roas: number;
  taxaConversao: number;
}

interface MarketingROASChartProps {
  custoMarketing: number;
  roas: number;
  origemAnalysis: OrigemAnalysis[];
  taxaConversaoGeral: number;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function MarketingROASChart({
  custoMarketing,
  roas,
  origemAnalysis,
  taxaConversaoGeral,
}: MarketingROASChartProps) {
  const receitaTotal = origemAnalysis.reduce((sum, o) => sum + o.receita, 0);
  const leadsTotal = origemAnalysis.reduce((sum, o) => sum + o.leads, 0);

  const pieData = origemAnalysis
    .filter(o => o.receita > 0)
    .map((o, index) => ({
      name: o.nome,
      value: o.receita,
      fill: COLORS[index % COLORS.length],
    }));

  const barData = origemAnalysis
    .filter(o => o.leads > 0 || o.receita > 0)
    .map((o, index) => ({
      ...o,
      fill: COLORS[index % COLORS.length],
    }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Investimento Marketing"
          value={formatCurrency(custoMarketing)}
          subtitle="Total no período"
          icon={DollarSign}
          tone="warning"
        />
        <KPICard
          label="ROAS"
          value={`${roas.toFixed(1)}x`}
          subtitle={roas >= 3 ? 'Excelente' : roas >= 2 ? 'Bom' : 'Atenção'}
          icon={TrendingUp}
          tone={roas >= 3 ? 'success' : roas >= 2 ? 'warning' : 'danger'}
        />
        <KPICard
          label="Taxa Conversão"
          value={`${taxaConversaoGeral.toFixed(1)}%`}
          subtitle="Leads para clientes"
          icon={Percent}
          tone={taxaConversaoGeral >= 25 ? 'success' : taxaConversaoGeral >= 15 ? 'warning' : 'danger'}
        />
        <KPICard
          label="Total Leads"
          value={leadsTotal.toLocaleString()}
          subtitle="Gerados no período"
          icon={Target}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Receita por Origem</CardTitle>
            <CardDescription>Distribuição de receita por canal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance por Canal</CardTitle>
            <CardDescription>Leads vs Conversões</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="nome" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Bar dataKey="leads" name="Leads" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversoes" name="Conversões" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise Detalhada por Origem</CardTitle>
          <CardDescription>Métricas completas de cada canal de aquisição</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Taxa Conv.</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">CAC</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {origemAnalysis.map((origem) => (
                  <TableRow key={origem.id}>
                    <TableCell className="font-medium">{origem.nome}</TableCell>
                    <TableCell className="text-right">{origem.leads}</TableCell>
                    <TableCell className="text-right">{origem.conversoes}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={
                        origem.taxaConversao >= 30 ? 'default' :
                        origem.taxaConversao >= 15 ? 'secondary' :
                        'outline'
                      }>
                        {origem.taxaConversao.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(origem.receita)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(origem.cac)}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn(
                        "font-semibold",
                        origem.roas >= 3 ? "text-emerald-600 dark:text-emerald-400" :
                        origem.roas >= 2 ? "text-amber-600 dark:text-amber-400" :
                        "text-red-600 dark:text-red-400"
                      )}>
                        {origem.roas.toFixed(1)}x
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
