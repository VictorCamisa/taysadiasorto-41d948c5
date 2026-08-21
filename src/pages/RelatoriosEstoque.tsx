import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Package } from "lucide-react";
import { useEstoqueData } from "@/components/estoque/hooks/useEstoqueData";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";

const RelatoriosEstoque = () => {
  const { produtos, compras, kpis } = useEstoqueData();

  const exportCSV = (data: any[], filename: string) => {
    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const produtosCriticos = produtos.filter(
    p => Number(p.estoque_atual) < Number(p.estoque_minimo)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios do Estoque"
        description="Análises e relatórios completos"
        icon={<Package className="h-6 w-6 text-primary" />}
      />

      <Tabs defaultValue="valor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="valor">Valor do Estoque</TabsTrigger>
          <TabsTrigger value="criticos">Produtos Críticos</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="valor">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Valor do Estoque Atual</CardTitle>
                <Button
                  onClick={() =>
                    exportCSV(
                      produtos.map(p => ({
                        produto: p.nome,
                        estoque: p.estoque_atual,
                        custo_medio: p.custo_medio,
                        valor_total: Number(p.estoque_atual) * Number(p.custo_medio),
                      })),
                      "valor-estoque.csv"
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-4xl font-bold">
                  {kpis.valorTotalEstoque.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                {produtos.map((produto) => {
                  const valorTotal =
                    Number(produto.estoque_atual) * Number(produto.custo_medio);
                  return (
                    <div
                      key={produto.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {produto.estoque_atual} {produto.unidade_medida} × {formatCurrency(Number(produto.custo_medio))}
                        </p>
                      </div>
                      <p className="font-bold">
                        {valorTotal.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="criticos">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Produtos com Estoque Crítico</CardTitle>
                <Button
                  onClick={() =>
                    exportCSV(
                      produtosCriticos.map(p => ({
                        produto: p.nome,
                        estoque_atual: p.estoque_atual,
                        estoque_minimo: p.estoque_minimo,
                        diferenca: Number(p.estoque_minimo) - Number(p.estoque_atual),
                      })),
                      "produtos-criticos.csv"
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {produtosCriticos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto com estoque crítico
                </p>
              ) : (
                <div className="space-y-2">
                  {produtosCriticos.map((produto) => {
                    const diferenca =
                      Number(produto.estoque_minimo) - Number(produto.estoque_atual);
                    const percentual =
                      (Number(produto.estoque_atual) / Number(produto.estoque_minimo)) *
                      100;

                    return (
                      <div
                        key={produto.id}
                        className="flex justify-between items-center p-3 border border-destructive rounded-lg bg-destructive/5"
                      >
                        <div>
                          <p className="font-medium">{produto.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Estoque: {produto.estoque_atual} / Mínimo:{" "}
                            {produto.estoque_minimo}
                          </p>
                          <p className="text-sm font-medium text-destructive">
                            {percentual.toFixed(0)}% do mínimo
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Sugestão de compra
                          </p>
                          <p className="text-lg font-bold">
                            {diferenca.toFixed(2)} {produto.unidade_medida}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Histórico Completo de Compras</CardTitle>
                <Button
                  onClick={() =>
                    exportCSV(
                      compras.map(c => ({
                        numero_nf: c.numero_nf,
                        data: c.data_compra,
                        fornecedor: c.fornecedor?.nome,
                        valor_total: c.valor_total,
                        qtd_itens: c.itens?.length || 0,
                      })),
                      "historico-compras.csv"
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  Exportar CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {compras.map((compra) => (
                  <div
                    key={compra.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        NF {compra.numero_nf || "S/N"} - {compra.fornecedor?.nome || "S/F"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(compra.data_compra).toLocaleDateString("pt-BR")} •{" "}
                        {compra.itens?.length || 0} itens
                      </p>
                    </div>
                    <p className="font-bold">
                      {Number(compra.valor_total).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RelatoriosEstoque;
