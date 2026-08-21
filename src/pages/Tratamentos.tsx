import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { TratamentosKPIs } from "@/components/tratamentos/TratamentosKPIs";
import { TratamentosFilters } from "@/components/tratamentos/TratamentosFilters";
import { TratamentoForm } from "@/components/tratamentos/TratamentoForm";
import { useTratamentoCalculations } from "@/components/tratamentos/hooks/useTratamentoCalculations";

export default function Tratamentos() {
  const queryClient = useQueryClient();
  const { getMargemColor } = useTratamentoCalculations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTratamento, setSelectedTratamento] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tratamentoToDelete, setTratamentoToDelete] = useState<any>(null);

  const [search, setSearch] = useState("");

  // Fetch tratamentos - usando nova tabela 'tratamentos'
  const { data: tratamentos = [], isLoading } = useQuery({
    queryKey: ["tratamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tratamentos")
        .select("*")
        .order("nome", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch produtos
  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch ficha técnica for selected tratamento
  const { data: fichaTecnica = [] } = useQuery({
    queryKey: ["ficha-tecnica", selectedTratamento?.id],
    enabled: !!selectedTratamento?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tratamentos_ficha_tecnica")
        .select(`
          *,
          produto:estoque_produtos(id, nome, unidade_medida, custo_medio)
        `)
        .eq("tratamento_id", selectedTratamento.id);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const { fichaTecnica, lucro_sessao, margem_bruta, margem_contribuicao, custo_total, ...tratamentoData } = data;
      
      const payload = {
        nome: tratamentoData.nome,
        descricao: tratamentoData.descricao || null,
        preco_padrao: tratamentoData.preco_padrao || tratamentoData.preco || 0,
        custo_estimado: tratamentoData.custo_estimado || 0,
      };
      
      if (selectedTratamento) {
        const { error: updateError } = await supabase
          .from("tratamentos")
          .update(payload)
          .eq("id", selectedTratamento.id);
        
        if (updateError) throw updateError;

        await supabase
          .from("tratamentos_ficha_tecnica")
          .delete()
          .eq("tratamento_id", selectedTratamento.id);

        if (fichaTecnica && fichaTecnica.length > 0) {
          const items = fichaTecnica.map((item: any) => ({
            tratamento_id: selectedTratamento.id,
            produto_id: item.produto_id,
            quantidade_utilizada: item.quantidade || item.quantidade_utilizada,
            custo_unitario: item.custo_unitario,
            custo_total: item.custo_total,
          }));

          const { error: insertError } = await supabase
            .from("tratamentos_ficha_tecnica")
            .insert(items);
          
          if (insertError) throw insertError;
        }

        return selectedTratamento.id;
      } else {
        const { data: newTratamento, error: createError } = await supabase
          .from("tratamentos")
          .insert([payload])
          .select()
          .single();
        
        if (createError) throw createError;

        if (fichaTecnica && fichaTecnica.length > 0) {
          const items = fichaTecnica.map((item: any) => ({
            tratamento_id: newTratamento.id,
            produto_id: item.produto_id,
            quantidade_utilizada: item.quantidade || item.quantidade_utilizada,
            custo_unitario: item.custo_unitario,
            custo_total: item.custo_total,
          }));

          const { error: insertError } = await supabase
            .from("tratamentos_ficha_tecnica")
            .insert(items);
          
          if (insertError) throw insertError;
        }

        return newTratamento.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tratamentos"] });
      queryClient.invalidateQueries({ queryKey: ["ficha-tecnica"] });
      setDialogOpen(false);
      setSelectedTratamento(null);
      toast.success(selectedTratamento ? "Tratamento atualizado!" : "Tratamento criado!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar tratamento: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if there are any lancamentos linked to this tratamento
      const { data: lancamentos, error: checkError } = await supabase
        .from("td_fluxo_de_caixa")
        .select("id")
        .eq("tratamento_id", id)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (lancamentos && lancamentos.length > 0) {
        throw new Error("Este tratamento não pode ser excluído porque possui lançamentos financeiros vinculados.");
      }

      // Delete ficha técnica first
      await supabase
        .from("tratamentos_ficha_tecnica")
        .delete()
        .eq("tratamento_id", id);

      // Delete tratamento
      const { error } = await supabase
        .from("tratamentos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tratamentos"] });
      toast.success("Tratamento excluído!");
      setDeleteDialogOpen(false);
      setTratamentoToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (tratamento: any) => {
    setSelectedTratamento(tratamento);
    setTimeout(() => {
      setDialogOpen(true);
    }, 100);
  };

  const handleDelete = (tratamento: any) => {
    setTratamentoToDelete(tratamento);
    setDeleteDialogOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedTratamento(null);
    setDialogOpen(true);
  };

  const filteredTratamentos = tratamentos.filter((t: any) => {
    if (search && !t.nome.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Prepare tratamento with ficha técnica for form
  const tratamentoComFicha = selectedTratamento ? {
    ...selectedTratamento,
    preco: selectedTratamento.preco_padrao,
    fichaTecnica: fichaTecnica,
  } : null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Tratamentos"
        description="Gerencie tratamentos, custos e fichas técnicas"
        icon={<Stethoscope className="h-6 w-6 text-primary" />}
        actions={
          <Button onClick={handleOpenNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tratamento
          </Button>
        }
      />

      <TratamentosKPIs tratamentos={tratamentos} />

      <TratamentosFilters search={search} onSearchChange={setSearch} />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Tratamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : filteredTratamentos.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="Nenhum tratamento encontrado"
              description="Ajuste a busca ou cadastre um novo tratamento."
            />
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Custo Estimado</TableHead>
                    <TableHead className="text-right">Margem %</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTratamentos.map((tratamento: any) => {
                    const preco = Number(tratamento.preco_padrao || 0);
                    const custo = Number(tratamento.custo_estimado || 0);
                    const margem = preco > 0 ? ((preco - custo) / preco) * 100 : 0;
                    
                    return (
                      <TableRow key={tratamento.id}>
                        <TableCell className="font-medium">{tratamento.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{tratamento.descricao || "-"}</TableCell>
                        <TableCell className="text-right">
                          {preco.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {custo.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getMargemColor(margem)}`}>
                          {margem.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <DataTableRowActions
                            className="justify-end"
                            onEdit={() => handleEdit(tratamento)}
                            onDelete={() => handleDelete(tratamento)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TratamentoForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tratamento={tratamentoComFicha}
        produtos={produtos}
        onSave={(data) => saveMutation.mutate(data)}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir o tratamento "${tratamentoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => tratamentoToDelete && deleteMutation.mutate(tratamentoToDelete.id)}
      />
    </div>
  );
}