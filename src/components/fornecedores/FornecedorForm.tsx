import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schema simplificado para a nova tabela clientes_fornecedores
const fornecedorSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  cpf_cnpj: z.string().trim().max(18, "CPF/CNPJ muito longo").optional(),
});

type FornecedorFormData = z.infer<typeof fornecedorSchema>;

const defaultValues: FornecedorFormData = { nome: "", cpf_cnpj: "" };

interface FornecedorFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  fornecedor: any | null;
}

const formatCNPJCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "");

  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
};

export const FornecedorForm = ({ open, onClose, onSave, fornecedor }: FornecedorFormProps) => {
  const form = useForm<FornecedorFormData>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues,
  });

  useEffect(() => {
    if (fornecedor) {
      form.reset({
        nome: fornecedor.nome || "",
        cpf_cnpj: fornecedor.cpf_cnpj || "",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [fornecedor, open, form]);

  const handleSubmit = (data: FornecedorFormData) => {
    onSave({
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{fornecedor ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={18}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        onChange={(e) => field.onChange(formatCNPJCPF(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
