import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/ui/FilterBar";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";

const ContasPagar = () => {
  const [statusFiltro, setStatusFiltro] = useState<string | "todos">("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    descricao: "",
    fornecedor_id: "",
    categoria_id: "",
    valor: "",
    vencimento: format(new Date(), "yyyy-MM-dd"),
    forma_pagamento_id: "",
    conta_financeira_id: "",
    observacoes: "",
    status: "pendente" as "pendente" | "pago" | "atrasado" | "cancelado",
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [marcarPagoId, setMarcarPagoId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Query principal - usando td_fluxo_de_caixa para despesas ou financeiro_contas_pagar
  const { data: contasPagar = [] } = useQuery({
    queryKey: ["contas-pagar-list", statusFiltro],
    queryFn: async () => {
      let query = supabase
        .from("financeiro_contas_pagar")
        .select(`
          *,
          clientes_fornecedores(nome),
          categorias(nome_sintetico),
          formas_pagamento(nome),
          contas_financeiras(nome)
        `)
        .order("data_vencimento", { ascending: true });

      if (statusFiltro !== "todos") {
        query = query.eq("status", statusFiltro as "pendente" | "pago" | "atrasado" | "cancelado");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Fornecedores - usando clientes_fornecedores com tipo = 'fornecedor'
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_fornecedores")
        .select("*")
        .eq("tipo", "fornecedor");
      if (error) throw error;
      return data || [];
    },
  });

  // Categorias - usando tabela 'categorias' com tipo = 'despesa'
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-despesa"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("tipo", "despesa");
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("financeiro_contas_pagar")
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-pagar-list"] });
      toast.success("Conta a pagar criada com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar conta a pagar: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("financeiro_contas_pagar")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-pagar-list"] });
      toast.success("Conta a pagar atualizada com sucesso!");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar conta a pagar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financeiro_contas_pagar")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-pagar-list"] });
      toast.success("Conta a pagar excluída com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir conta a pagar: " + error.message);
    },
  });

  const marcarPagoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financeiro_contas_pagar")
        .update({ 
          status: "pago",
          data_pagamento: new Date().toISOString().split('T')[0]
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-pagar-list"] });
      toast.success("Conta marcada como paga!");
    },
    onError: (error: any) => {
      toast.error("Erro ao marcar conta como paga: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      descricao: "",
      fornecedor_id: "",
      categoria_id: "",
      valor: "",
      vencimento: format(new Date(), "yyyy-MM-dd"),
      forma_pagamento_id: "",
      conta_financeira_id: "",
      observacoes: "",
      status: "pendente",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      user_id: "00000000-0000-0000-0000-000000000000",
      descricao: formData.descricao,
      fornecedor_id: formData.fornecedor_id || null,
      categoria_id: formData.categoria_id || null,
      valor: parseFloat(formData.valor),
      data_vencimento: formData.vencimento,
      forma_pagamento_id: formData.forma_pagamento_id || null,
      conta_id: formData.conta_financeira_id || null,
      observacoes: formData.observacoes || null,
      status: formData.status,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (conta: any) => {
    setEditingId(conta.id);
    setFormData({
      descricao: conta.descricao || "",
      fornecedor_id: conta.fornecedor_id || "",
      categoria_id: conta.categoria_id || "",
      valor: conta.valor?.toString() || "",
      vencimento: conta.data_vencimento || format(new Date(), "yyyy-MM-dd"),
      forma_pagamento_id: conta.forma_pagamento_id || "",
      conta_financeira_id: conta.conta_id || "",
      observacoes: conta.observacoes || "",
      status: conta.status || "pendente",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleMarcarPago = (id: string) => {
    setMarcarPagoId(id);
  };

  const getStatusColor = (status: string, vencimento: string) => {
    if (status === "pago") return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200";
    if (status === "atrasado" || new Date(vencimento) < new Date()) {
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200";
    }
    if (status === "cancelado") return "bg-muted text-muted-foreground";
    return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200";
  };

  const getStatusLabel = (status: string, vencimento: string) => {
    if (status === "pago") return "Pago";
    if (status === "atrasado" || (status !== "pago" && new Date(vencimento) < new Date())) return "Atrasado";
    if (status === "cancelado") return "Cancelado";
    return "Pendente";
  };

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <PageHeader
          title="Contas a Pagar"
          description="Gerencie suas despesas e pagamentos"
          icon={<CreditCard className="h-6 w-6 text-primary" />}
          actions={
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
          }
        />
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nova"} Conta a Pagar</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição da conta"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fornecedor</Label>
                  <Select value={formData.fornecedor_id} onValueChange={(value) => setFormData({ ...formData, fornecedor_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((forn: any) => (
                        <SelectItem key={forn.id} value={forn.id}>
                          {forn.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={formData.categoria_id} onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome_sintetico}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={formData.vencimento}
                    onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? "Atualizar" : "Criar"} Conta
                </Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>

      <FilterBar
        filters={
          <Select value={statusFiltro} onValueChange={setStatusFiltro}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Contas do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contasPagar.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={CreditCard} title="Nenhuma conta encontrada" description="Ajuste o filtro ou cadastre uma nova conta a pagar." size="sm" />
                  </TableCell>
                </TableRow>
              ) : (
                contasPagar.map((conta: any) => (
                  <TableRow key={conta.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{conta.descricao}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {conta.clientes_fornecedores?.nome || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {conta.categorias?.nome_sintetico || "-"}
                    </TableCell>
                    <TableCell>
                      {conta.data_vencimento ? format(new Date(conta.data_vencimento), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(conta.status, conta.data_vencimento)}>
                        {getStatusLabel(conta.status, conta.data_vencimento)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatCurrency(Number(conta.valor || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableRowActions
                        className="justify-end"
                        onEdit={() => handleEdit(conta)}
                        statusActions={
                          conta.status !== "pago"
                            ? [{ icon: CheckCircle, label: "Marcar como pago", tone: "success", onClick: () => handleMarcarPago(conta.id) }]
                            : undefined
                        }
                        onDelete={() => handleDelete(conta.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir esta conta a pagar?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
          setDeleteId(null);
        }}
      />

      <ConfirmDialog
        open={!!marcarPagoId}
        onOpenChange={(open) => !open && setMarcarPagoId(null)}
        title="Marcar como pago"
        description="Deseja marcar esta conta como paga?"
        confirmLabel="Confirmar"
        onConfirm={() => {
          if (marcarPagoId) marcarPagoMutation.mutate(marcarPagoId);
          setMarcarPagoId(null);
        }}
      />
    </div>
  );
};

export default ContasPagar;
