import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/PageHeader";
import { useEstoqueData } from "@/components/estoque/hooks/useEstoqueData";
import { EstoqueKPIs } from "@/components/estoque/EstoqueKPIs";
import { ProdutosTab } from "@/components/estoque/ProdutosTab";
import { ComprasTab } from "@/components/estoque/ComprasTab";
import { MovimentacoesTab } from "@/components/estoque/MovimentacoesTab";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Estoque = () => {
  const [produtosSimples, setProdutosSimples] = useState<any[]>([]);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("*")
        .order("nome");

      if (error) throw error;
      setProdutosSimples(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar produtos de estoque:", error);
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const {
    produtos,
    compras,
    fornecedores,
    formasPagamento,
    contasFinanceiras,
    refetchProdutos,
    refetchCompras,
    kpis,
  } = useEstoqueData();

  const produtosParaUI = produtosSimples.length ? produtosSimples : produtos;

  const valorTotalEstoque = produtosParaUI.reduce(
    (sum, p) => sum + Number(p.estoque_atual) * Number(p.custo_medio),
    0
  );

  const produtosAtivos = produtosParaUI.filter((p) => p.ativo).length;

  const produtosCriticos = produtosParaUI.filter(
    (p) => Number(p.estoque_atual) < Number(p.estoque_minimo)
  ).length;

  const saveProdutoMutation = useMutation({
    mutationFn: async (produto: any) => {
      if (produto.id) {
        const { id, user_id, ...produtoUpdate } = produto;
        const { error } = await supabase
          .from("estoque_produtos")
          .update(produtoUpdate)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("estoque_produtos")
          .insert(produto);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchProdutos();
      fetchProdutos();
      toast({ title: "Produto salvo com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProdutoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("estoque_produtos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetchProdutos();
      fetchProdutos();
      toast({ title: "Produto excluído com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveCompraMutation = useMutation({
    mutationFn: async (compra: any) => {
      const { data: compraData, error: compraError } = await supabase
        .from("estoque_compras")
        .insert([{
          user_id: "00000000-0000-0000-0000-000000000000",
          numero_nf: compra.numero_nf,
          data_compra: compra.data_compra,
          fornecedor_id: compra.fornecedor_id,
          forma_pagamento_id: compra.forma_pagamento_id,
          conta_financeira_id: compra.conta_financeira_id,
          valor_total: compra.valor_total,
          observacoes: compra.observacoes,
        }])
        .select()
        .single();

      if (compraError) throw compraError;

      // Insert itens
      const itensToInsert = compra.itens.map((item: any) => ({
        compra_id: compraData.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
      }));

      const { error: itensError } = await supabase
        .from("estoque_compras_itens")
        .insert(itensToInsert);

      if (itensError) throw itensError;

      // Update produtos estoque and custo_medio
      for (const item of compra.itens) {
        const produto = produtos.find((p) => p.id === item.produto_id);
        if (produto) {
          const estoqueAtual = Number(produto.estoque_atual);
          const custoMedioAtual = Number(produto.custo_medio);
          const novoEstoque = estoqueAtual + Number(item.quantidade);
          
          const valorEstoqueAtual = estoqueAtual * custoMedioAtual;
          const valorCompra = Number(item.quantidade) * Number(item.valor_unitario);
          const novoCustoMedio = (valorEstoqueAtual + valorCompra) / novoEstoque;

          const { error: updateError } = await supabase
            .from("estoque_produtos")
            .update({
              estoque_atual: novoEstoque,
              custo_medio: novoCustoMedio,
            })
            .eq("id", item.produto_id);

          if (updateError) throw updateError;
        }
      }
    },
    onSuccess: () => {
      refetchCompras();
      refetchProdutos();
      fetchProdutos();
      toast({ title: "Compra registrada com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar compra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Estoque"
        description="Controle produtos e compras"
        icon={<Package className="h-6 w-6 text-primary" />}
      />

      <EstoqueKPIs
        valorTotalEstoque={valorTotalEstoque}
        produtosAtivos={produtosAtivos}
        produtosCriticos={produtosCriticos}
        totalComprasMes={kpis.totalComprasMes}
      />

      <Tabs defaultValue="produtos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="compras">Compras</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <ProdutosTab
            produtos={produtosParaUI}
            fornecedores={fornecedores}
            onSaveProduto={(produto) => saveProdutoMutation.mutate(produto)}
            onDeleteProduto={(id) => deleteProdutoMutation.mutate(id)}
          />
        </TabsContent>

        <TabsContent value="compras">
          <ComprasTab
            compras={compras}
            fornecedores={fornecedores}
            formasPagamento={formasPagamento}
            contasFinanceiras={contasFinanceiras}
            produtos={produtos}
            onSaveCompra={(compra) => saveCompraMutation.mutate(compra)}
          />
        </TabsContent>

        <TabsContent value="movimentacoes">
          <MovimentacoesTab produtos={produtos} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Estoque;
