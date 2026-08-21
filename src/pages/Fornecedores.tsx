import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package, ShoppingCart, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/PageHeader";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useFornecedoresData } from "@/components/fornecedores/hooks/useFornecedoresData";
import { FornecedoresKPIs } from "@/components/fornecedores/FornecedoresKPIs";
import { FornecedoresFilters } from "@/components/fornecedores/FornecedoresFilters";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";

const Fornecedores = () => {
  const {
    fornecedores,
    refetch,
    kpis,
    produtosPorFornecedor,
    comprasPorFornecedor,
  } = useFornecedoresData();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<string | null>(null);

  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter((f) => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesNome = f.nome.toLowerCase().includes(searchLower);
        const matchesCpfCnpj = f.cpf_cnpj?.toLowerCase().includes(searchLower);
        if (!matchesNome && !matchesCpfCnpj) return false;
      }
      return true;
    });
  }, [fornecedores, search]);

  const saveFornecedorMutation = useMutation({
    mutationFn: async (fornecedor: any) => {
      const payload = {
        nome: fornecedor.nome,
        cpf_cnpj: fornecedor.cpf_cnpj || null,
        tipo: 'fornecedor',
      };
      
      if (fornecedor.id) {
        const { error } = await supabase
          .from("clientes_fornecedores")
          .update(payload)
          .eq("id", fornecedor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clientes_fornecedores")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetch();
      setFormOpen(false);
      setSelectedFornecedor(null);
      toast({ title: "Fornecedor salvo com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteFornecedorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clientes_fornecedores")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setFornecedorToDelete(null);
      toast({ title: "Fornecedor excluído com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir fornecedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (fornecedor: any) => {
    setSelectedFornecedor(fornecedor);
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedFornecedor(null);
    setFormOpen(true);
  };

  const handleConfirmDelete = (id: string) => {
    setFornecedorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (fornecedorToDelete) {
      deleteFornecedorMutation.mutate(fornecedorToDelete);
    }
  };

  const getProdutosCount = (fornecedorId: string) => {
    return produtosPorFornecedor.filter(p => p.fornecedor_id === fornecedorId).length;
  };

  const getComprasCount = (fornecedorId: string) => {
    return comprasPorFornecedor.filter(c => c.fornecedor_id === fornecedorId).length;
  };

  const getComprasTotal = (fornecedorId: string) => {
    return comprasPorFornecedor
      .filter(c => c.fornecedor_id === fornecedorId)
      .reduce((sum, c) => sum + Number(c.valor_total || 0), 0);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fornecedores"
        description="Gerencie seus fornecedores"
        icon={<Users className="h-6 w-6 text-primary" />}
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        }
      />

      <FornecedoresKPIs totalFornecedores={kpis.totalFornecedores} />

      <FornecedoresFilters search={search} setSearch={setSearch} />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Total Comprado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum fornecedor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredFornecedores.map((fornecedor) => {
                  const produtosCount = getProdutosCount(fornecedor.id);
                  const comprasCount = getComprasCount(fornecedor.id);
                  const comprasTotal = getComprasTotal(fornecedor.id);

                  return (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                      <TableCell>{fornecedor.cpf_cnpj || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {produtosCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          {comprasCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        {comprasTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell>
                        <DataTableRowActions
                          onEdit={() => handleEdit(fornecedor)}
                          onDelete={() => handleConfirmDelete(fornecedor.id)}
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

      <FornecedorForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedFornecedor(null);
        }}
        onSave={(fornecedor) => {
          if (selectedFornecedor) {
            saveFornecedorMutation.mutate({ ...fornecedor, id: selectedFornecedor.id });
          } else {
            saveFornecedorMutation.mutate(fornecedor);
          }
        }}
        fornecedor={selectedFornecedor}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmar exclusão"
        description="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Fornecedores;