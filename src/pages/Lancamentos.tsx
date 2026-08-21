import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";

const Lancamentos = () => {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [tipoFiltro, setTipoFiltro] = useState<string | "todos">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tipo: "receita" as "receita" | "despesa" | "transferencia" | "ajuste",
    data_lancamento: format(new Date(), "yyyy-MM-dd"),
    descricao: "",
    cliente_fornecedor_id: "",
    valor: "",
    categoria_id: "",
    forma_pagamento_id: "",
    conta_financeira_id: "",
    tratamento_id: "",
    origem_id: "",
    status: "pago" as string,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Query principal - usando td_fluxo_de_caixa
  const { data: lancamentos = [] } = useQuery({
    queryKey: ["lancamentos-list", startDate, endDate, tipoFiltro],
    queryFn: async () => {
      let query = supabase
        .from("td_fluxo_de_caixa")
        .select(`
          *,
          categorias(nome_sintetico, nome_analitico),
          formas_pagamento(nome),
          contas_financeiras(nome),
          tratamentos(nome, custo_estimado),
          origens(nome),
          clientes_fornecedores(nome, tipo)
        `)
        .gte("data_lancamento", startDate)
        .lte("data_lancamento", endDate)
        .order("data_lancamento", { ascending: false });

      if (tipoFiltro !== "todos") {
        query = query.eq("tipo", tipoFiltro);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Categorias - usando tabela 'categorias'
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Formas de pagamento - usando tabela 'formas_pagamento'
  const { data: formasPagamento = [] } = useQuery({
    queryKey: ["formas-pagamento-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Contas financeiras - usando tabela 'contas_financeiras'
  const { data: contas = [] } = useQuery({
    queryKey: ["contas-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_financeiras")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Tratamentos - usando tabela 'tratamentos'
  const { data: tratamentos = [] } = useQuery({
    queryKey: ["tratamentos-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tratamentos")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Origens - usando tabela 'origens'
  const { data: origens = [] } = useQuery({
    queryKey: ["origens-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("origens")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Clientes/Fornecedores - usando tabela 'clientes_fornecedores'
  const { data: clientesFornecedores = [] } = useQuery({
    queryKey: ["clientes-fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_fornecedores")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Mutations para td_fluxo_de_caixa
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("td_fluxo_de_caixa")
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos-list"] });
      toast.success("Lançamento criado com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar lançamento: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("td_fluxo_de_caixa")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos-list"] });
      toast.success("Lançamento atualizado com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar lançamento: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("td_fluxo_de_caixa")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lancamentos-list"] });
      toast.success("Lançamento excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir lançamento: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      tipo: "receita",
      data_lancamento: format(new Date(), "yyyy-MM-dd"),
      descricao: "",
      cliente_fornecedor_id: "",
      valor: "",
      categoria_id: "",
      forma_pagamento_id: "",
      conta_financeira_id: "",
      tratamento_id: "",
      origem_id: "",
      status: "pago",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const valor = parseFloat(formData.valor) || 0;

    // Calcular custo do material se for receita com tratamento
    let custo_material = 0;
    if (formData.tipo === "receita" && formData.tratamento_id) {
      const tratamentoSelecionado = tratamentos.find((t: any) => t.id === formData.tratamento_id);
      if (tratamentoSelecionado) {
        custo_material = Number(tratamentoSelecionado.custo_estimado || 0);
      }
    }
    
    const payload = {
      tipo: formData.tipo,
      data_lancamento: formData.data_lancamento,
      descricao: formData.descricao || null,
      cliente_fornecedor_id: formData.cliente_fornecedor_id || null,
      valor: valor,
      categoria_id: formData.categoria_id || null,
      forma_pagamento_id: formData.forma_pagamento_id || null,
      conta_financeira_id: formData.conta_financeira_id || null,
      tratamento_id: formData.tratamento_id || null,
      origem_id: formData.origem_id || null,
      custo_material: custo_material,
      status: formData.status,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (lanc: any) => {
    setEditingId(lanc.id);
    setFormData({
      tipo: lanc.tipo,
      data_lancamento: lanc.data_lancamento,
      descricao: lanc.descricao || "",
      cliente_fornecedor_id: lanc.cliente_fornecedor_id || "",
      valor: lanc.valor?.toString() || "",
      categoria_id: lanc.categoria_id || "",
      forma_pagamento_id: lanc.forma_pagamento_id || "",
      conta_financeira_id: lanc.conta_financeira_id || "",
      tratamento_id: lanc.tratamento_id || "",
      origem_id: lanc.origem_id || "",
      status: lanc.status || "pago",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "receita": return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200";
      case "despesa": return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200";
      case "transferencia": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  // Filtrar categorias por tipo
  const categoriasFiltradas = categorias.filter((cat: any) => {
    if (formData.tipo === "receita") return cat.tipo === "receita";
    if (formData.tipo === "despesa") return cat.tipo === "despesa";
    return true;
  });

  // Filtrar clientes/fornecedores por tipo
  const clientesFornecedoresFiltrados = clientesFornecedores.filter((cf: any) => {
    if (formData.tipo === "receita") return cf.tipo === "cliente";
    if (formData.tipo === "despesa") return cf.tipo === "fornecedor";
    return true;
  });

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <PageHeader
          title="Lançamentos Financeiros"
          description="Gerencie todas as movimentações financeiras"
          icon={<DollarSign className="h-6 w-6 text-primary" />}
          actions={
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </Button>
            </DialogTrigger>
          }
        />
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Lançamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="ajuste">Ajuste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data_lancamento}
                    onChange={(e) => setFormData({ ...formData, data_lancamento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{formData.tipo === "receita" ? "Cliente" : "Fornecedor"}</Label>
                  <Select value={formData.cliente_fornecedor_id} onValueChange={(value) => setFormData({ ...formData, cliente_fornecedor_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientesFornecedoresFiltrados.map((cf: any) => (
                        <SelectItem key={cf.id} value={cf.id}>
                          {cf.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do lançamento"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.categoria_id} onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasFiltradas.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome_sintetico}
                          {cat.nome_analitico && (
                            <span className="text-muted-foreground"> → {cat.nome_analitico}</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={formData.forma_pagamento_id} onValueChange={(value) => setFormData({ ...formData, forma_pagamento_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map((fp: any) => (
                        <SelectItem key={fp.id} value={fp.id}>
                          {fp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Conta Financeira</Label>
                  <Select value={formData.conta_financeira_id} onValueChange={(value) => setFormData({ ...formData, conta_financeira_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map((conta: any) => (
                        <SelectItem key={conta.id} value={conta.id}>
                          {conta.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago">Pago</SelectItem>
                      <SelectItem value="recebido">Recebido</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.tipo === "receita" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tratamento</Label>
                    <Select 
                      value={formData.tratamento_id} 
                      onValueChange={(value) => {
                        const tratamentoSelecionado = tratamentos.find((t: any) => t.id === value);
                        setFormData({ 
                          ...formData, 
                          tratamento_id: value,
                          valor: tratamentoSelecionado?.preco_padrao?.toString() || formData.valor
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tratamentos.map((trat: any) => (
                          <SelectItem key={trat.id} value={trat.id}>
                            {trat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Origem</Label>
                    <Select value={formData.origem_id} onValueChange={(value) => setFormData({ ...formData, origem_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {origens.map((orig: any) => (
                          <SelectItem key={orig.id} value={orig.id}>
                            {orig.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.tipo === "receita" && formData.tratamento_id && formData.valor && (
                <Card className="bg-muted/50 border-primary/20">
                  <CardContent className="pt-4 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Cálculo Automático</p>
                    {(() => {
                      const tratamentoSelecionado = tratamentos.find((t: any) => t.id === formData.tratamento_id);
                      const valorReceita = parseFloat(formData.valor) || 0;
                      const custoTratamento = Number(tratamentoSelecionado?.custo_estimado || 0);
                      const margemBruta = valorReceita - custoTratamento;
                      const percentualMargem = valorReceita > 0 ? (margemBruta / valorReceita) * 100 : 0;

                      return (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Custo:</span>
                            <p className="font-medium text-destructive">{formatCurrency(custoTratamento)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Margem:</span>
                            <p className="font-medium text-green-600">{formatCurrency(margemBruta)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">% Margem:</span>
                            <p className="font-medium text-primary">{percentualMargem.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? "Atualizar" : "Criar"} Lançamento
                </Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>

      <FilterBar
        filters={
          <>
            <div className="space-y-1.5">
              <Label>Data Inicial</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Data Final</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[160px]" />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        }
      />

      {/* Tabela de Lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos ({lancamentos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tratamento</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Forma Pgto</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead className="text-right">Margem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState icon={DollarSign} title="Nenhum lançamento encontrado" description="Ajuste o período ou cadastre um novo lançamento." size="sm" />
                  </TableCell>
                </TableRow>
              ) : (
                lancamentos.map((lanc: any) => {
                  const custo = Number(lanc.custo_material || 0);
                  const valor = Number(lanc.valor || 0);
                  const margem = lanc.tipo === 'receita' ? valor - custo : 0;
                  const percentMargem = valor > 0 && lanc.tipo === 'receita' ? (margem / valor) * 100 : 0;

                  return (
                    <TableRow key={lanc.id} className="hover:bg-muted/50">
                      <TableCell>
                        {format(new Date(lanc.data_lancamento), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTipoColor(lanc.tipo)}>
                          {lanc.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {lanc.clientes_fornecedores?.nome || lanc.descricao || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lanc.tratamentos?.nome || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lanc.categorias?.nome_sintetico || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lanc.formas_pagamento?.nome || "-"}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${lanc.tipo === 'receita' ? 'text-green-600' : 'text-destructive'}`}>
                        {lanc.tipo === 'receita' ? '+' : '-'}{formatCurrency(valor)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-orange-600">
                        {lanc.tipo === 'receita' && custo > 0 ? formatCurrency(custo) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {lanc.tipo === 'receita' && lanc.tratamento_id ? (
                          <span className={margem >= 0 ? 'text-green-600' : 'text-destructive'}>
                            {formatCurrency(margem)}
                            <span className="text-muted-foreground ml-1">({percentMargem.toFixed(0)}%)</span>
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DataTableRowActions
                          className="justify-end"
                          onEdit={() => handleEdit(lanc)}
                          onDelete={() => handleDelete(lanc.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este lançamento?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
};

export default Lancamentos;
