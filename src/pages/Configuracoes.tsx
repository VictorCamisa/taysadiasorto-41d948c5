import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Tag, Wallet, CreditCard, Target } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useConfiguracoesData } from "@/components/configuracoes/hooks/useConfiguracoesData";
import { CategoriaForm } from "@/components/configuracoes/CategoriaForm";
import { ContaForm } from "@/components/configuracoes/ContaForm";
import { FormaPagamentoForm } from "@/components/configuracoes/FormaPagamentoForm";
import { OrigemForm } from "@/components/configuracoes/OrigemForm";
import { PageHeader } from "@/components/PageHeader";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";

const Configuracoes = () => {
  const {
    categorias,
    contas,
    formasPagamento,
    origens,
    refetchCategorias,
    refetchContas,
    refetchFormas,
    refetchOrigens,
  } = useConfiguracoesData();

  const [categoriaFormOpen, setCategoriaFormOpen] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; table: string } | null>(null);

  const [contaFormOpen, setContaFormOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);

  const [formaFormOpen, setFormaFormOpen] = useState(false);
  const [selectedForma, setSelectedForma] = useState<any>(null);

  const [origemFormOpen, setOrigemFormOpen] = useState(false);
  const [selectedOrigem, setSelectedOrigem] = useState<any>(null);

  // Categoria mutations - usando tabela 'categorias'
  const saveCategoriaMutation = useMutation({
    mutationFn: async (categoria: any) => {
      if (categoria.id) {
        const { id, ...categoriaUpdate } = categoria;
        const { error } = await supabase
          .from("categorias")
          .update(categoriaUpdate)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("categorias")
          .insert(categoria);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchCategorias();
      setCategoriaFormOpen(false);
      setSelectedCategoria(null);
      toast({ title: "Categoria salva com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar categoria", description: error.message, variant: "destructive" });
    },
  });

  // Conta mutations - usando tabela 'contas_financeiras'
  const saveContaMutation = useMutation({
    mutationFn: async (conta: any) => {
      if (conta.id) {
        const { id, ...contaUpdate } = conta;
        const { error } = await supabase
          .from("contas_financeiras")
          .update(contaUpdate)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("contas_financeiras")
          .insert(conta);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchContas();
      setContaFormOpen(false);
      setSelectedConta(null);
      toast({ title: "Conta salva com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar conta", description: error.message, variant: "destructive" });
    },
  });

  // Forma pagamento mutations - usando tabela 'formas_pagamento'
  const saveFormaMutation = useMutation({
    mutationFn: async (forma: any) => {
      if (forma.id) {
        const { id, ...formaUpdate } = forma;
        const { error } = await supabase
          .from("formas_pagamento")
          .update(formaUpdate)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("formas_pagamento")
          .insert(forma);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchFormas();
      setFormaFormOpen(false);
      setSelectedForma(null);
      toast({ title: "Forma de pagamento salva com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar forma de pagamento", description: error.message, variant: "destructive" });
    },
  });

  // Origem mutations - usando tabela 'origens'
  const saveOrigemMutation = useMutation({
    mutationFn: async (origem: any) => {
      if (origem.id) {
        const { id, ...origemUpdate } = origem;
        const { error } = await supabase
          .from("origens")
          .update(origemUpdate)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("origens")
          .insert(origem);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchOrigens();
      setOrigemFormOpen(false);
      setSelectedOrigem(null);
      toast({ title: "Origem salva com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar origem", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutation - usando novas tabelas
  const deleteMutation = useMutation({
    mutationFn: async ({ id, table }: { id: string; table: string }) => {
      let error;
      if (table === "categorias") {
        const result = await supabase.from("categorias").delete().eq("id", id);
        error = result.error;
      } else if (table === "contas_financeiras") {
        const result = await supabase.from("contas_financeiras").delete().eq("id", id);
        error = result.error;
      } else if (table === "formas_pagamento") {
        const result = await supabase.from("formas_pagamento").delete().eq("id", id);
        error = result.error;
      } else if (table === "origens") {
        const result = await supabase.from("origens").delete().eq("id", id);
        error = result.error;
      }
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      if (variables.table === "categorias") refetchCategorias();
      if (variables.table === "contas_financeiras") refetchContas();
      if (variables.table === "formas_pagamento") refetchFormas();
      if (variables.table === "origens") refetchOrigens();
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast({ title: "Item excluído com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir item", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const tipoLabels: Record<string, string> = {
    receita: "Receita",
    despesa: "Despesa",
    corrente: "Corrente",
    poupanca: "Poupança",
    caixa: "Caixa",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Configure categorias, contas, formas de pagamento e origens"
        icon={<Settings className="h-6 w-6 text-primary" />}
      />

      <Tabs defaultValue="categorias" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="contas">Contas</TabsTrigger>
          <TabsTrigger value="formas">Formas de Pagamento</TabsTrigger>
          <TabsTrigger value="origens">Origens</TabsTrigger>
        </TabsList>

        {/* CATEGORIAS */}
        <TabsContent value="categorias" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedCategoria(null);
                setCategoriaFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Categorias Financeiras</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria Principal</TableHead>
                    <TableHead>Subcategoria</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categorias.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState icon={Tag} title="Nenhuma categoria cadastrada" description="Cadastre a primeira categoria financeira." size="sm" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    categorias
                      .sort((a, b) => {
                        const compareMain = a.nome_sintetico.localeCompare(b.nome_sintetico);
                        if (compareMain !== 0) return compareMain;
                        return (a.nome_analitico || "").localeCompare(b.nome_analitico || "");
                      })
                      .map((categoria) => (
                        <TableRow key={categoria.id}>
                          <TableCell>
                            <Badge variant="outline">{tipoLabels[String(categoria.tipo)] || categoria.tipo}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{categoria.nome_sintetico}</TableCell>
                          <TableCell>
                            {categoria.nome_analitico ? (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">↳</span>
                                <Badge variant="secondary" className="font-normal">
                                  {categoria.nome_analitico}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DataTableRowActions
                              onEdit={() => {
                                setSelectedCategoria(categoria);
                                setCategoriaFormOpen(true);
                              }}
                              onDelete={() => {
                                setItemToDelete({ id: categoria.id, table: "categorias" });
                                setDeleteDialogOpen(true);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTAS */}
        <TabsContent value="contas" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedConta(null);
                setContaFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova Conta
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contas Financeiras</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Saldo Inicial</TableHead>
                    <TableHead className="text-right">Saldo Atual</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyState icon={Wallet} title="Nenhuma conta cadastrada" description="Cadastre a primeira conta financeira." size="sm" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    contas.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.nome}</TableCell>
                        <TableCell>{tipoLabels[String(conta.tipo)] || conta.tipo}</TableCell>
                        <TableCell className="text-right">
                          {Number(conta.saldo_inicial || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(conta.saldo_atual || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </TableCell>
                        <TableCell>
                          <DataTableRowActions
                            onEdit={() => {
                              setSelectedConta(conta);
                              setContaFormOpen(true);
                            }}
                            onDelete={() => {
                              setItemToDelete({ id: conta.id, table: "contas_financeiras" });
                              setDeleteDialogOpen(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMAS DE PAGAMENTO */}
        <TabsContent value="formas" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedForma(null);
                setFormaFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova Forma
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Taxa (%)</TableHead>
                    <TableHead>Dias Recebimento</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formasPagamento.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <EmptyState icon={CreditCard} title="Nenhuma forma de pagamento cadastrada" description="Cadastre a primeira forma de pagamento." size="sm" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    formasPagamento.map((forma) => (
                      <TableRow key={forma.id}>
                        <TableCell className="font-medium">{forma.nome}</TableCell>
                        <TableCell>{Number(forma.taxa_percentual || 0).toFixed(2)}%</TableCell>
                        <TableCell>{forma.dias_recebimento || 0} dias</TableCell>
                        <TableCell>
                          <DataTableRowActions
                            onEdit={() => {
                              setSelectedForma(forma);
                              setFormaFormOpen(true);
                            }}
                            onDelete={() => {
                              setItemToDelete({ id: forma.id, table: "formas_pagamento" });
                              setDeleteDialogOpen(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORIGENS */}
        <TabsContent value="origens" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSelectedOrigem(null);
                setOrigemFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Nova Origem
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Origens de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {origens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <EmptyState icon={Target} title="Nenhuma origem cadastrada" description="Cadastre a primeira origem de clientes." size="sm" />
                      </TableCell>
                    </TableRow>
                  ) : (
                    origens.map((origem) => (
                      <TableRow key={origem.id}>
                        <TableCell className="font-medium">{origem.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{origem.descricao || "-"}</TableCell>
                        <TableCell>
                          <DataTableRowActions
                            onEdit={() => {
                              setSelectedOrigem(origem);
                              setOrigemFormOpen(true);
                            }}
                            onDelete={() => {
                              setItemToDelete({ id: origem.id, table: "origens" });
                              setDeleteDialogOpen(true);
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <CategoriaForm
        open={categoriaFormOpen}
        onClose={() => {
          setCategoriaFormOpen(false);
          setSelectedCategoria(null);
        }}
        categoria={selectedCategoria}
        onSave={(data) => saveCategoriaMutation.mutate(data)}
      />

      <ContaForm
        open={contaFormOpen}
        onClose={() => {
          setContaFormOpen(false);
          setSelectedConta(null);
        }}
        conta={selectedConta}
        onSave={(data) => saveContaMutation.mutate(data)}
      />

      <FormaPagamentoForm
        open={formaFormOpen}
        onClose={() => {
          setFormaFormOpen(false);
          setSelectedForma(null);
        }}
        formaPagamento={selectedForma}
        onSave={(data) => saveFormaMutation.mutate(data)}
      />

      <OrigemForm
        open={origemFormOpen}
        onClose={() => {
          setOrigemFormOpen(false);
          setSelectedOrigem(null);
        }}
        origem={selectedOrigem}
        onSave={(data) => saveOrigemMutation.mutate(data)}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Configuracoes;
