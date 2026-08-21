import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart } from "lucide-react";
import { CompraForm } from "./CompraForm";
import { EmptyState } from "@/components/ui/EmptyState";

interface ComprasTabProps {
  compras: any[];
  fornecedores: any[];
  formasPagamento: any[];
  contasFinanceiras: any[];
  produtos: any[];
  onSaveCompra: (compra: any) => void;
}

export const ComprasTab = ({
  compras,
  fornecedores,
  formasPagamento,
  contasFinanceiras,
  produtos,
  onSaveCompra,
}: ComprasTabProps) => {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Compra
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº NF</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Forma Pagamento</TableHead>
                <TableHead>Conta Financeira</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Qtd Itens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {compras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState icon={ShoppingCart} title="Nenhuma compra cadastrada" description="Registre a primeira compra de fornecedor." size="sm" />
                  </TableCell>
                </TableRow>
              ) : (
                compras.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell>{compra.numero_nf || "-"}</TableCell>
                    <TableCell>
                      {new Date(compra.data_compra).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{compra.fornecedor?.nome || "-"}</TableCell>
                    <TableCell>{compra.forma_pagamento?.nome || "-"}</TableCell>
                    <TableCell>{compra.conta_financeira?.nome || "-"}</TableCell>
                    <TableCell>
                      {Number(compra.valor_total).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell>{compra.itens?.length || 0}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CompraForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={onSaveCompra}
        fornecedores={fornecedores}
        formasPagamento={formasPagamento}
        contasFinanceiras={contasFinanceiras}
        produtos={produtos}
      />
    </div>
  );
};
