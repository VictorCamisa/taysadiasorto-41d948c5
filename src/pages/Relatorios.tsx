import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Download, FileText, DollarSign, TrendingUp, Package, Filter, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { CashFlowProjection } from "@/components/relatorios/CashFlowProjection";
import { PageHeader } from "@/components/PageHeader";

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

// Componente de Badge de Variação
const VariacaoBadge = ({ valor }: { valor: number }) => {
  if (valor === 0) return null;
  
  const isPositivo = valor > 0;
  const Icon = isPositivo ? ArrowUpRight : ArrowDownRight;
  
  return (
    <Badge variant={isPositivo ? "default" : "destructive"} className="ml-2">
      <Icon className="h-3 w-3 mr-1" />
      {Math.abs(valor).toFixed(1)}%
    </Badge>
  );
};

const Relatorios = () => {
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [compararPeriodos, setCompararPeriodos] = useState(false);
  const [dataInicioComp, setDataInicioComp] = useState(format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [dataFimComp, setDataFimComp] = useState(format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'));
  const [tratamentoFiltro, setTratamentoFiltro] = useState<string>("todos");
  const [origemFiltro, setOrigemFiltro] = useState<string>("todos");
  const [categoriaSinteticaFiltro, setCategoriaSinteticaFiltro] = useState<string>("todos");
  const [fornecedorFiltro, setFornecedorFiltro] = useState<string>("todos");
  const [categoriaEstoqueFiltro, setCategoriaEstoqueFiltro] = useState<string>("todos");
  const [statusEstoqueFiltro, setStatusEstoqueFiltro] = useState<string>("todos");

  // Queries para dados básicos - usando novas tabelas
  const { data: tratamentos } = useQuery({
    queryKey: ['tratamentos-relatorios'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tratamentos')
        .select('*');
      return data || [];
    }
  });

  const { data: origens } = useQuery({
    queryKey: ['origens-relatorios'],
    queryFn: async () => {
      const { data } = await supabase
        .from('origens')
        .select('*');
      return data || [];
    }
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias-relatorios'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categorias')
        .select('*');
      return data || [];
    }
  });

  const { data: fornecedores } = useQuery({
    queryKey: ['fornecedores-relatorios'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clientes_fornecedores')
        .select('*')
        .eq('tipo', 'fornecedor');
      return data || [];
    }
  });

  // Query para receitas - Período Principal - usando td_fluxo_de_caixa
  const { data: receitas, isLoading: loadingReceitas } = useQuery({
    queryKey: ['relatorio-receitas', dataInicio, dataFim, tratamentoFiltro, origemFiltro],
    queryFn: async () => {
      let query = supabase
        .from('td_fluxo_de_caixa')
        .select(`
          *,
          tratamento:tratamento_id(nome, descricao),
          origem:origem_id(nome),
          forma_pagamento:forma_pagamento_id(nome)
        `)
        .eq('tipo', 'receita')
        .gte('data_lancamento', dataInicio)
        .lte('data_lancamento', dataFim);

      if (tratamentoFiltro !== 'todos') query = query.eq('tratamento_id', tratamentoFiltro);
      if (origemFiltro !== 'todos') query = query.eq('origem_id', origemFiltro);

      const { data } = await query.order('data_lancamento', { ascending: false });
      return data || [];
    }
  });

  // Query para receitas - Período de Comparação
  const { data: receitasComp } = useQuery({
    queryKey: ['relatorio-receitas-comp', dataInicioComp, dataFimComp, tratamentoFiltro, origemFiltro, compararPeriodos],
    queryFn: async () => {
      if (!compararPeriodos) return [];
      
      let query = supabase
        .from('td_fluxo_de_caixa')
        .select(`
          *,
          tratamento:tratamento_id(nome, descricao),
          origem:origem_id(nome),
          forma_pagamento:forma_pagamento_id(nome)
        `)
        .eq('tipo', 'receita')
        .gte('data_lancamento', dataInicioComp)
        .lte('data_lancamento', dataFimComp);

      if (tratamentoFiltro !== 'todos') query = query.eq('tratamento_id', tratamentoFiltro);
      if (origemFiltro !== 'todos') query = query.eq('origem_id', origemFiltro);

      const { data } = await query.order('data_lancamento', { ascending: false });
      return data || [];
    },
    enabled: compararPeriodos
  });

  // Query para despesas - Período Principal
  const { data: despesas, isLoading: loadingDespesas } = useQuery({
    queryKey: ['relatorio-despesas', dataInicio, dataFim, categoriaSinteticaFiltro, fornecedorFiltro],
    queryFn: async () => {
      let query = supabase
        .from('td_fluxo_de_caixa')
        .select(`
          *,
          categoria:categoria_id(nome_sintetico, nome_analitico),
          cliente_fornecedor:cliente_fornecedor_id(nome),
          forma_pagamento:forma_pagamento_id(nome)
        `)
        .eq('tipo', 'despesa')
        .gte('data_lancamento', dataInicio)
        .lte('data_lancamento', dataFim);

      if (fornecedorFiltro !== 'todos') query = query.eq('cliente_fornecedor_id', fornecedorFiltro);

      const { data } = await query.order('data_lancamento', { ascending: false });
      
      let filteredData = data || [];
      if (categoriaSinteticaFiltro !== 'todos') {
        filteredData = filteredData.filter((d: any) => d.categoria?.nome_sintetico === categoriaSinteticaFiltro);
      }
      
      return filteredData;
    }
  });

  // Query para despesas - Período de Comparação
  const { data: despesasComp } = useQuery({
    queryKey: ['relatorio-despesas-comp', dataInicioComp, dataFimComp, categoriaSinteticaFiltro, fornecedorFiltro, compararPeriodos],
    queryFn: async () => {
      if (!compararPeriodos) return [];
      
      let query = supabase
        .from('td_fluxo_de_caixa')
        .select(`
          *,
          categoria:categoria_id(nome_sintetico, nome_analitico),
          cliente_fornecedor:cliente_fornecedor_id(nome),
          forma_pagamento:forma_pagamento_id(nome)
        `)
        .eq('tipo', 'despesa')
        .gte('data_lancamento', dataInicioComp)
        .lte('data_lancamento', dataFimComp);

      if (fornecedorFiltro !== 'todos') query = query.eq('cliente_fornecedor_id', fornecedorFiltro);

      const { data } = await query.order('data_lancamento', { ascending: false });
      
      let filteredData = data || [];
      if (categoriaSinteticaFiltro !== 'todos') {
        filteredData = filteredData.filter((d: any) => d.categoria?.nome_sintetico === categoriaSinteticaFiltro);
      }
      
      return filteredData;
    },
    enabled: compararPeriodos
  });

  // Query para estoque
  const { data: estoque, isLoading: loadingEstoque } = useQuery({
    queryKey: ['relatorio-estoque', categoriaEstoqueFiltro, statusEstoqueFiltro],
    queryFn: async () => {
      let query = supabase
        .from('estoque_produtos')
        .select('*');

      if (categoriaEstoqueFiltro !== 'todos') {
        query = query.eq('categoria', categoriaEstoqueFiltro);
      }

      const { data, error } = await query.order('nome');

      if (error) throw error;
      
      let filteredData = data || [];
      if (statusEstoqueFiltro === 'baixo') {
        filteredData = filteredData.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0));
      } else if (statusEstoqueFiltro === 'ok') {
        filteredData = filteredData.filter(p => (p.estoque_atual || 0) > (p.estoque_minimo || 0));
      }
      
      return filteredData;
    }
  });

  // Cálculos para Receitas - usando valor ao invés de valor_entrada
  const receitaTotal = receitas?.reduce((sum, r: any) => sum + Number(r.valor || 0), 0) || 0;
  const quantidadeVendas = receitas?.length || 0;
  const ticketMedio = quantidadeVendas > 0 ? receitaTotal / quantidadeVendas : 0;
  
  const receitaTotalComp = receitasComp?.reduce((sum, r: any) => sum + Number(r.valor || 0), 0) || 0;
  const quantidadeVendasComp = receitasComp?.length || 0;
  const ticketMedioComp = quantidadeVendasComp > 0 ? receitaTotalComp / quantidadeVendasComp : 0;
  
  const variacaoReceita = receitaTotalComp > 0 ? ((receitaTotal - receitaTotalComp) / receitaTotalComp) * 100 : 0;
  const variacaoQuantidade = quantidadeVendasComp > 0 ? ((quantidadeVendas - quantidadeVendasComp) / quantidadeVendasComp) * 100 : 0;
  const variacaoTicket = ticketMedioComp > 0 ? ((ticketMedio - ticketMedioComp) / ticketMedioComp) * 100 : 0;

  const receitasPorTratamento = receitas?.reduce((acc: any[], r: any) => {
    const nome = r.tratamento?.nome || 'Sem tratamento';
    const existing = acc.find(item => item.nome === nome);
    if (existing) {
      existing.valor += Number(r.valor || 0);
      existing.quantidade += 1;
    } else {
      acc.push({ nome, valor: Number(r.valor || 0), quantidade: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.valor - a.valor).slice(0, 10) || [];

  const receitasPorOrigem = receitas?.reduce((acc: any[], r: any) => {
    const nome = r.origem?.nome || 'Sem origem';
    const existing = acc.find(item => item.name === nome);
    if (existing) {
      existing.value += Number(r.valor || 0);
    } else {
      acc.push({ name: nome, value: Number(r.valor || 0) });
    }
    return acc;
  }, []) || [];

  // Cálculos para Despesas
  const despesaTotal = despesas?.reduce((sum, d: any) => sum + Number(d.valor || 0), 0) || 0;
  const despesaMedia = despesas && despesas.length > 0 ? despesaTotal / despesas.length : 0;
  const maiorDespesa = despesas?.reduce((max, d: any) => Math.max(max, Number(d.valor || 0)), 0) || 0;
  
  const despesaTotalComp = despesasComp?.reduce((sum, d: any) => sum + Number(d.valor || 0), 0) || 0;
  const despesaMediaComp = despesasComp && despesasComp.length > 0 ? despesaTotalComp / despesasComp.length : 0;
  
  const variacaoDespesa = despesaTotalComp > 0 ? ((despesaTotal - despesaTotalComp) / despesaTotalComp) * 100 : 0;
  const variacaoDespesaMedia = despesaMediaComp > 0 ? ((despesaMedia - despesaMediaComp) / despesaMediaComp) * 100 : 0;

  const despesasPorCategoria = despesas?.reduce((acc: any[], d: any) => {
    const nome = d.categoria?.nome_sintetico || 'Sem categoria';
    const existing = acc.find(item => item.nome === nome);
    if (existing) {
      existing.valor += Number(d.valor || 0);
    } else {
      acc.push({ nome, valor: Number(d.valor || 0) });
    }
    return acc;
  }, []).sort((a, b) => b.valor - a.valor) || [];

  // Cálculos para Margens
  let margensPorTratamento = receitas?.reduce((acc: any[], r: any) => {
    if (!r.tratamento_id) return acc;
    
    const nome = r.tratamento?.nome || 'Sem nome';
    const receita = Number(r.valor || 0);
    const custo = Number(r.custo_material || 0);
    const margem = receita - custo;
    
    const existing = acc.find(item => item.nome === nome);
    if (existing) {
      existing.receita += receita;
      existing.custo += custo;
      existing.margem += margem;
      existing.quantidade += 1;
    } else {
      acc.push({
        nome,
        receita,
        custo,
        margem,
        quantidade: 1,
        percentual: 0
      });
    }
    return acc;
  }, []) || [];
  
  margensPorTratamento.forEach(item => {
    item.percentual = item.receita > 0 ? (item.margem / item.receita) * 100 : 0;
  });

  let margemBrutaTotal = margensPorTratamento.reduce((sum, m) => sum + m.margem, 0);
  let margemPercentualTotal = receitaTotal > 0 ? (margemBrutaTotal / receitaTotal) * 100 : 0;
  let tratamentoMaisRentavel = margensPorTratamento.sort((a, b) => b.margem - a.margem)[0];

  // Fallback: se não houver receitas no período, usar cadastro de tratamentos
  if ((!receitas || receitas.length === 0) && tratamentos && tratamentos.length > 0) {
    margensPorTratamento = tratamentos.map((t: any) => {
      const receita = Number(t.preco_padrao || 0);
      const custo = Number(t.custo_estimado || 0);
      const margem = receita - custo;

      return {
        nome: t.nome,
        receita,
        custo,
        margem,
        quantidade: 1,
        percentual: receita > 0 ? (margem / receita) * 100 : 0,
      };
    });

    const receitaTotalTratamentos = margensPorTratamento.reduce((sum, m) => sum + m.receita, 0);
    margemBrutaTotal = margensPorTratamento.reduce((sum, m) => sum + m.margem, 0);
    margemPercentualTotal =
      receitaTotalTratamentos > 0 ? (margemBrutaTotal / receitaTotalTratamentos) * 100 : 0;
    tratamentoMaisRentavel = margensPorTratamento.slice().sort((a, b) => b.margem - a.margem)[0];
  }

  const margensPorTratamentoComp = receitasComp?.reduce((acc: any[], r: any) => {
    if (!r.tratamento_id) return acc;
    
    const nome = r.tratamento?.nome || 'Sem nome';
    const receita = Number(r.valor || 0);
    const custo = Number(r.custo_material || 0);
    const margem = receita - custo;
    
    const existing = acc.find(item => item.nome === nome);
    if (existing) {
      existing.receita += receita;
      existing.custo += custo;
      existing.margem += margem;
      existing.quantidade += 1;
    } else {
      acc.push({
        nome,
        receita,
        custo,
        margem,
        quantidade: 1,
        percentual: 0
      });
    }
    return acc;
  }, []) || [];

  margensPorTratamentoComp.forEach(item => {
    item.percentual = item.receita > 0 ? (item.margem / item.receita) * 100 : 0;
  });

  const margemBrutaTotalComp = margensPorTratamentoComp.reduce((sum, m) => sum + m.margem, 0);
  const margemPercentualTotalComp = receitaTotalComp > 0 ? (margemBrutaTotalComp / receitaTotalComp) * 100 : 0;
  
  const variacaoMargemBruta = margemBrutaTotalComp > 0 ? ((margemBrutaTotal - margemBrutaTotalComp) / margemBrutaTotalComp) * 100 : 0;
  const variacaoMargemPercentual = margemPercentualTotalComp > 0 ? ((margemPercentualTotal - margemPercentualTotalComp) / margemPercentualTotalComp) * 100 : 0;

  // Cálculos para Estoque
  const totalProdutos = estoque?.length || 0;
  const valorTotalEstoque = estoque?.reduce((sum, p) => sum + ((p.estoque_atual || 0) * (p.custo_medio || 0)), 0) || 0;
  const produtosCriticos = estoque?.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0)).length || 0;

  const categoriasSinteticasUnicas = Array.from(new Set(categorias?.map(c => c.nome_sintetico)));
  const categoriasEstoqueUnicas = Array.from(new Set(estoque?.map(p => p.categoria)));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Relatórios"
        description="Análises e relatórios detalhados com comparação de períodos"
        icon={<FileText className="h-6 w-6 text-primary" />}
      />

      <Tabs defaultValue="receitas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="receitas">Receitas</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="margens">Margens</TabsTrigger>
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
        </TabsList>

        {/* ABA RECEITAS */}
        <TabsContent value="receitas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filtros e Comparação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <Switch
                    id="comparar-periodos"
                    checked={compararPeriodos}
                    onCheckedChange={setCompararPeriodos}
                  />
                  <Label htmlFor="comparar-periodos" className="cursor-pointer font-medium">
                    Comparar com período anterior
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início (Período Atual)</Label>
                    <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim (Período Atual)</Label>
                    <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                  </div>
                  {compararPeriodos && (
                    <>
                      <div className="space-y-2">
                        <Label>Data Início (Comparação)</Label>
                        <Input type="date" value={dataInicioComp} onChange={(e) => setDataInicioComp(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Data Fim (Comparação)</Label>
                        <Input type="date" value={dataFimComp} onChange={(e) => setDataFimComp(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Tratamento</Label>
                    <Select value={tratamentoFiltro} onValueChange={setTratamentoFiltro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os tratamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os tratamentos</SelectItem>
                        {tratamentos?.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Origem</Label>
                    <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as origens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas as origens</SelectItem>
                        {origens?.map((o: any) => (
                          <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs de Receitas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">
                    {receitaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {compararPeriodos && <VariacaoBadge valor={variacaoReceita} />}
                </div>
                {compararPeriodos && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Período anterior: {receitaTotalComp.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Quantidade de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{quantidadeVendas}</p>
                  {compararPeriodos && <VariacaoBadge valor={variacaoQuantidade} />}
                </div>
                {compararPeriodos && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Período anterior: {quantidadeVendasComp}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">
                    {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {compararPeriodos && <VariacaoBadge valor={variacaoTicket} />}
                </div>
                {compararPeriodos && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Período anterior: {ticketMedioComp.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Receitas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Tratamentos por Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={receitasPorTratamento} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <YAxis dataKey="nome" type="category" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receitas por Origem</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={receitasPorOrigem}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {receitasPorOrigem.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA DESPESAS */}
        <TabsContent value="despesas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoriaSinteticaFiltro} onValueChange={setCategoriaSinteticaFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as categorias</SelectItem>
                      {categoriasSinteticasUnicas.map((cat) => (
                        <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select value={fornecedorFiltro} onValueChange={setFornecedorFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os fornecedores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os fornecedores</SelectItem>
                      {fornecedores?.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs de Despesas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Despesa Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-destructive">
                    {despesaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {compararPeriodos && <VariacaoBadge valor={-variacaoDespesa} />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Despesa Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">
                    {despesaMedia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {compararPeriodos && <VariacaoBadge valor={-variacaoDespesaMedia} />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Maior Despesa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {maiorDespesa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Despesas por Categoria */}
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={despesasPorCategoria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
                  <Bar dataKey="valor" fill="hsl(var(--destructive))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA MARGENS */}
        <TabsContent value="margens" className="space-y-6">
          {/* KPIs de Margens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Margem Bruta Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-green-600">
                    {margemBrutaTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  {compararPeriodos && <VariacaoBadge valor={variacaoMargemBruta} />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Margem Percentual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{margemPercentualTotal.toFixed(1)}%</p>
                  {compararPeriodos && <VariacaoBadge valor={variacaoMargemPercentual} />}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Tratamento Mais Rentável</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{tratamentoMaisRentavel?.nome || '-'}</p>
                <p className="text-sm text-muted-foreground">
                  Margem: {tratamentoMaisRentavel?.margem?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Margens por Tratamento */}
          <Card>
            <CardHeader>
              <CardTitle>Análise de Margem por Tratamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tratamento</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Margem R$</TableHead>
                    <TableHead className="text-right">Margem %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {margensPorTratamento.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum dado disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    margensPorTratamento.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">
                          {item.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.custo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {item.margem.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.percentual >= 50 ? "default" : item.percentual >= 30 ? "secondary" : "destructive"}>
                            {item.percentual.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA ESTOQUE */}
        <TabsContent value="estoque" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoriaEstoqueFiltro} onValueChange={setCategoriaEstoqueFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as categorias</SelectItem>
                      {categoriasEstoqueUnicas.map((cat) => (
                        <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status do Estoque</Label>
                  <Select value={statusEstoqueFiltro} onValueChange={setStatusEstoqueFiltro}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="baixo">Estoque Baixo</SelectItem>
                      <SelectItem value="ok">Estoque OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs de Estoque */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Total de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalProdutos}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Valor Total em Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {valorTotalEstoque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Produtos em Nível Crítico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{produtosCriticos}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Estoque */}
          <Card>
            <CardHeader>
              <CardTitle>Posição de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Estoque Atual</TableHead>
                    <TableHead className="text-right">Estoque Mínimo</TableHead>
                    <TableHead className="text-right">Custo Médio</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoque?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhum produto encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    estoque?.map((produto) => {
                      const isCritico = (produto.estoque_atual || 0) <= (produto.estoque_minimo || 0);
                      return (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>{produto.categoria}</TableCell>
                          <TableCell className="text-right">{produto.estoque_atual} {produto.unidade_medida}</TableCell>
                          <TableCell className="text-right">{produto.estoque_minimo} {produto.unidade_medida}</TableCell>
                          <TableCell className="text-right">
                            {(produto.custo_medio || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                          <TableCell className="text-right">
                            {((produto.estoque_atual || 0) * (produto.custo_medio || 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isCritico ? "destructive" : "default"}>
                              {isCritico ? "Crítico" : "OK"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA PROJEÇÕES */}
        <TabsContent value="projecoes" className="space-y-6">
          <CashFlowProjection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;