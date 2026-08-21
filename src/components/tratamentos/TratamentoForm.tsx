import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FichaTecnicaEditor } from "./FichaTecnicaEditor";
import { useTratamentoCalculations } from "./hooks/useTratamentoCalculations";

const tratamentoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  preco_padrao: z.coerce.number().min(0.01, "Informe o preço de venda"),
  custo_estimado: z.coerce.number().min(0).default(0),
  descricao: z.string().optional(),
});

type TratamentoFormData = z.infer<typeof tratamentoSchema>;

const defaultValues: TratamentoFormData = {
  nome: "",
  preco_padrao: 0,
  custo_estimado: 0,
  descricao: "",
};

interface TratamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tratamento?: any;
  produtos: any[];
  onSave: (data: any) => void;
}

export const TratamentoForm = ({ open, onOpenChange, tratamento, produtos, onSave }: TratamentoFormProps) => {
  const { calcularCustos, getMargemColor } = useTratamentoCalculations();

  const form = useForm<TratamentoFormData>({
    resolver: zodResolver(tratamentoSchema),
    defaultValues,
  });

  const [fichaTecnicaItems, setFichaTecnicaItems] = useState<any[]>([]);

  useEffect(() => {
    if (tratamento) {
      form.reset({
        nome: tratamento.nome || "",
        preco_padrao: tratamento.preco_padrao || tratamento.preco || 0,
        custo_estimado: tratamento.custo_estimado || 0,
        descricao: tratamento.descricao || "",
      });
      setFichaTecnicaItems(tratamento.fichaTecnica || []);
    } else {
      form.reset(defaultValues);
      setFichaTecnicaItems([]);
    }
  }, [tratamento, open, form]);

  const precoPadrao = form.watch("preco_padrao");
  const custoEstimado = form.watch("custo_estimado");

  const calculations = calcularCustos(precoPadrao, custoEstimado, fichaTecnicaItems);

  const handleSubmit = (data: TratamentoFormData) => {
    onSave({
      ...data,
      custo_estimado: calculations.custo_total,
      fichaTecnica: fichaTecnicaItems,
    });
  };

  const handleAddItem = (item: any) => {
    const produto = produtos.find((p) => p.id === item.produto_id);
    setFichaTecnicaItems([...fichaTecnicaItems, { ...item, produto }]);
  };

  const handleRemoveItem = (index: number) => {
    setFichaTecnicaItems(fichaTecnicaItems.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tratamento ? "Editar Tratamento" : "Novo Tratamento"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="custos">Custos</TabsTrigger>
                <TabsTrigger value="ficha">Ficha Técnica</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-4">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Tratamento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Limpeza de Pele" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preco_padrao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Descrição do tratamento..." rows={4} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="custos" className="space-y-4">
                <FormField
                  control={form.control}
                  name="custo_estimado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custo Operacional</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Custo Total</p>
                        <p className="text-2xl font-bold">
                          {calculations.custo_total.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Operacional + Ficha Técnica
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Lucro por Sessão</p>
                        <p className="text-2xl font-bold">
                          {calculations.lucro_sessao.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Preço - Custo Total
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Margem Bruta</p>
                        <p className="text-2xl font-bold">
                          {calculations.margem_bruta.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Margem de Contribuição</p>
                        <p className={`text-2xl font-bold ${getMargemColor(calculations.margem_contribuicao)}`}>
                          {calculations.margem_contribuicao.toFixed(1)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="ficha" className="space-y-4">
                <FichaTecnicaEditor
                  items={fichaTecnicaItems}
                  produtos={produtos}
                  onAddItem={handleAddItem}
                  onRemoveItem={handleRemoveItem}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {tratamento ? "Salvar Alterações" : "Criar Tratamento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
