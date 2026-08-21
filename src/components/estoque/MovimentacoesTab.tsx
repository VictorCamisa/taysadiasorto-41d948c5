import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowLeftRight } from "lucide-react";

interface MovimentacoesTabProps {
  produtos: any[];
}

export const MovimentacoesTab = ({ produtos }: MovimentacoesTabProps) => {
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [produtoId, setProdutoId] = useState("todos");
  const [tipo, setTipo] = useState("todos");

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["estoque-movimentacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estoque_movimentacoes")
        .select(`
          *,
          estoque_produtos(nome),
          financeiro_lancamentos(cliente, financeiro_tratamentos(nome)),
          estoque_compras(numero_nf)
        `)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter((mov: any) => {
      if (dataInicial && new Date(mov.data) < new Date(dataInicial)) return false;
      if (dataFinal && new Date(mov.data) > new Date(dataFinal)) return false;
      if (produtoId !== "todos" && mov.produto_id !== produtoId) return false;
      if (tipo !== "todos" && mov.tipo !== tipo) return false;
      return true;
    });
  }, [movimentacoes, dataInicial, dataFinal, produtoId, tipo]);

  const getOrigemDisplay = (mov: any) => {
    if (mov.origem === "compra" && mov.estoque_compras) {
      return `Compra NF ${mov.estoque_compras.numero_nf || "S/N"}`;
    }
    if (mov.origem === "venda" && mov.financeiro_lancamentos) {
      const tratamento = mov.financeiro_lancamentos.financeiro_tratamentos;
      const cliente = mov.financeiro_lancamentos.cliente;
      return `Venda: ${tratamento?.nome || "Tratamento"} - ${cliente || "Cliente"}`;
    }
    return mov.origem;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Data Inicial</Label>
          <Input
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data Final</Label>
          <Input
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Produto</Label>
          <Select value={produtoId} onValueChange={setProdutoId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {produtos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovimentacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState icon={ArrowLeftRight} title="Nenhuma movimentação encontrada" description="Ajuste os filtros para ver outras movimentações." size="sm" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovimentacoes.map((mov: any) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {new Date(mov.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{mov.estoque_produtos?.nome || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={mov.tipo === "entrada" ? "default" : "destructive"}>
                        {mov.tipo === "entrada" ? "Entrada" : "Saída"}
                      </Badge>
                    </TableCell>
                    <TableCell>{Number(mov.quantidade).toFixed(2)}</TableCell>
                    <TableCell>{getOrigemDisplay(mov)}</TableCell>
                    <TableCell>{mov.observacoes || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
