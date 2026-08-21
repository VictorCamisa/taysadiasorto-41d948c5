import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFornecedoresData = () => {
  // NOVA TABELA: clientes_fornecedores (filtrando tipo = 'fornecedor')
  const { data: fornecedores = [], isLoading, refetch } = useQuery({
    queryKey: ["fornecedores_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes_fornecedores")
        .select("*")
        .eq("tipo", "fornecedor")
        .order("nome");
      
      if (error) throw error;
      return data || [];
    },
  });

  // KPIs
  const totalFornecedores = fornecedores.length;

  // Contagem de produtos por fornecedor
  const { data: produtosPorFornecedor = [] } = useQuery({
    queryKey: ["produtos_por_fornecedor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_produtos")
        .select("fornecedor_id");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Contagem de compras por fornecedor
  const { data: comprasPorFornecedor = [] } = useQuery({
    queryKey: ["compras_por_fornecedor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_compras")
        .select("fornecedor_id, valor_total");
      
      if (error) throw error;
      return data || [];
    },
  });

  return {
    fornecedores,
    isLoading,
    refetch,
    kpis: {
      totalFornecedores,
    },
    produtosPorFornecedor,
    comprasPorFornecedor,
  };
};
