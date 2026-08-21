import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import type { Paciente } from "./hooks/usePacientesData";

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const SEXO_OPTIONS = ["Masculino", "Feminino", "Outro"];
const ESTADO_CIVIL_OPTIONS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável"];

const pacienteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  telefone: z.string().trim().min(1, "Telefone é obrigatório").max(20, "Telefone muito longo"),
  cpf: z.string().trim().max(14, "CPF inválido").optional(),
  rg: z.string().trim().max(20).optional(),
  rg_orgao_expedidor: z.string().trim().max(50).optional(),
  email: z.string().trim().email("Email inválido").max(255).optional().or(z.literal("")),
  data_nascimento: z.string().optional(),
  sexo: z.string().max(20).optional(),
  estado_civil: z.string().max(30).optional(),
  nacionalidade: z.string().max(50).optional(),
  naturalidade: z.string().max(50).optional(),
  profissao: z.string().max(100).optional(),
  instagram: z.string().max(100).optional(),
  contato_emergencia_telefone: z.string().max(20).optional(),
  contato_emergencia_parentesco: z.string().max(50).optional(),
  endereco: z.string().trim().max(500, "Endereço muito longo").optional(),
  cidade: z.string().trim().max(100, "Cidade muito longa").optional(),
  estado: z.string().max(2).optional(),
  cep: z.string().trim().max(10, "CEP inválido").optional(),
  endereco_profissional: z.string().max(500).optional(),
  indicado_por: z.string().max(255).optional(),
  primeiro_atendimento: z.string().optional(),
  // Responsável pelo tratamento
  responsavel_nome: z.string().max(255).optional(),
  responsavel_rg: z.string().max(20).optional(),
  responsavel_rg_orgao: z.string().max(50).optional(),
  responsavel_cpf: z.string().max(14).optional(),
  responsavel_data_nascimento: z.string().optional(),
  responsavel_sexo: z.string().max(20).optional(),
  responsavel_estado_civil: z.string().max(30).optional(),
  responsavel_nacionalidade: z.string().max(50).optional(),
  responsavel_naturalidade: z.string().max(50).optional(),
  responsavel_profissao: z.string().max(100).optional(),
  responsavel_telefone: z.string().max(20).optional(),
  responsavel_email: z.string().email().max(255).optional().or(z.literal("")),
  responsavel_endereco: z.string().max(500).optional(),
  responsavel_cep: z.string().max(10).optional(),
  responsavel_parentesco: z.string().max(50).optional(),
  observacoes: z.string().trim().max(2000, "Observações muito longas").optional(),
  ativo: z.boolean().default(true),
});

type PacienteFormData = z.infer<typeof pacienteSchema>;

const defaultValues: PacienteFormData = {
  nome: "",
  telefone: "",
  cpf: "",
  rg: "",
  rg_orgao_expedidor: "",
  email: "",
  data_nascimento: "",
  sexo: "",
  estado_civil: "",
  nacionalidade: "",
  naturalidade: "",
  profissao: "",
  instagram: "",
  contato_emergencia_telefone: "",
  contato_emergencia_parentesco: "",
  endereco: "",
  cidade: "",
  estado: "",
  cep: "",
  endereco_profissional: "",
  indicado_por: "",
  primeiro_atendimento: "",
  responsavel_nome: "",
  responsavel_rg: "",
  responsavel_rg_orgao: "",
  responsavel_cpf: "",
  responsavel_data_nascimento: "",
  responsavel_sexo: "",
  responsavel_estado_civil: "",
  responsavel_nacionalidade: "",
  responsavel_naturalidade: "",
  responsavel_profissao: "",
  responsavel_telefone: "",
  responsavel_email: "",
  responsavel_endereco: "",
  responsavel_cep: "",
  responsavel_parentesco: "",
  observacoes: "",
  ativo: true,
};

interface PacienteFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Paciente>) => void;
  paciente: Paciente | null;
}

const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const formatCEP = (value: string) => {
  const numbers = value.replace(/\D/g, "").slice(0, 8);
  return numbers.replace(/(\d{5})(\d)/, "$1-$2");
};

export function PacienteForm({ open, onClose, onSave, paciente }: PacienteFormProps) {
  const form = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues,
  });

  useEffect(() => {
    if (paciente) {
      form.reset({
        nome: paciente.nome || "",
        telefone: paciente.telefone || "",
        cpf: paciente.cpf || "",
        rg: (paciente as any).rg || "",
        rg_orgao_expedidor: (paciente as any).rg_orgao_expedidor || "",
        email: paciente.email || "",
        data_nascimento: paciente.data_nascimento || "",
        sexo: (paciente as any).sexo || "",
        estado_civil: (paciente as any).estado_civil || "",
        nacionalidade: (paciente as any).nacionalidade || "",
        naturalidade: (paciente as any).naturalidade || "",
        profissao: (paciente as any).profissao || "",
        instagram: (paciente as any).instagram || "",
        contato_emergencia_telefone: (paciente as any).contato_emergencia_telefone || "",
        contato_emergencia_parentesco: (paciente as any).contato_emergencia_parentesco || "",
        endereco: paciente.endereco || "",
        cidade: paciente.cidade || "",
        estado: paciente.estado || "",
        cep: paciente.cep || "",
        endereco_profissional: (paciente as any).endereco_profissional || "",
        indicado_por: (paciente as any).indicado_por || "",
        primeiro_atendimento: (paciente as any).primeiro_atendimento || "",
        responsavel_nome: (paciente as any).responsavel_nome || "",
        responsavel_rg: (paciente as any).responsavel_rg || "",
        responsavel_rg_orgao: (paciente as any).responsavel_rg_orgao || "",
        responsavel_cpf: (paciente as any).responsavel_cpf || "",
        responsavel_data_nascimento: (paciente as any).responsavel_data_nascimento || "",
        responsavel_sexo: (paciente as any).responsavel_sexo || "",
        responsavel_estado_civil: (paciente as any).responsavel_estado_civil || "",
        responsavel_nacionalidade: (paciente as any).responsavel_nacionalidade || "",
        responsavel_naturalidade: (paciente as any).responsavel_naturalidade || "",
        responsavel_profissao: (paciente as any).responsavel_profissao || "",
        responsavel_telefone: (paciente as any).responsavel_telefone || "",
        responsavel_email: (paciente as any).responsavel_email || "",
        responsavel_endereco: (paciente as any).responsavel_endereco || "",
        responsavel_cep: (paciente as any).responsavel_cep || "",
        responsavel_parentesco: (paciente as any).responsavel_parentesco || "",
        observacoes: paciente.observacoes || "",
        ativo: paciente.ativo !== false,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [paciente, open, form]);

  const handleSubmit = (data: PacienteFormData) => {
    const toNull = (val: string | undefined) => val?.trim() || null;

    onSave({
      nome: data.nome,
      telefone: data.telefone || null,
      cpf: toNull(data.cpf),
      rg: toNull(data.rg),
      rg_orgao_expedidor: toNull(data.rg_orgao_expedidor),
      email: toNull(data.email),
      data_nascimento: toNull(data.data_nascimento),
      sexo: toNull(data.sexo),
      estado_civil: toNull(data.estado_civil),
      nacionalidade: toNull(data.nacionalidade),
      naturalidade: toNull(data.naturalidade),
      profissao: toNull(data.profissao),
      instagram: toNull(data.instagram),
      contato_emergencia_telefone: toNull(data.contato_emergencia_telefone),
      contato_emergencia_parentesco: toNull(data.contato_emergencia_parentesco),
      endereco: toNull(data.endereco),
      cidade: toNull(data.cidade),
      estado: toNull(data.estado),
      cep: toNull(data.cep),
      endereco_profissional: toNull(data.endereco_profissional),
      indicado_por: toNull(data.indicado_por),
      primeiro_atendimento: toNull(data.primeiro_atendimento),
      responsavel_nome: toNull(data.responsavel_nome),
      responsavel_rg: toNull(data.responsavel_rg),
      responsavel_rg_orgao: toNull(data.responsavel_rg_orgao),
      responsavel_cpf: toNull(data.responsavel_cpf),
      responsavel_data_nascimento: toNull(data.responsavel_data_nascimento),
      responsavel_sexo: toNull(data.responsavel_sexo),
      responsavel_estado_civil: toNull(data.responsavel_estado_civil),
      responsavel_nacionalidade: toNull(data.responsavel_nacionalidade),
      responsavel_naturalidade: toNull(data.responsavel_naturalidade),
      responsavel_profissao: toNull(data.responsavel_profissao),
      responsavel_telefone: toNull(data.responsavel_telefone),
      responsavel_email: toNull(data.responsavel_email),
      responsavel_endereco: toNull(data.responsavel_endereco),
      responsavel_cep: toNull(data.responsavel_cep),
      responsavel_parentesco: toNull(data.responsavel_parentesco),
      observacoes: toNull(data.observacoes),
      ativo: data.ativo,
    } as Partial<Paciente>);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{paciente ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="endereco">Endereços</TabsTrigger>
                <TabsTrigger value="responsavel">Responsável</TabsTrigger>
              </TabsList>

              <TabsContent value="dados" className="space-y-4 mt-4">
                {/* Dados Obrigatórios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone Celular *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={15}
                            placeholder="(00) 00000-0000"
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Documentos */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={20} placeholder="00.000.000-0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rg_orgao_expedidor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Expedidor</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SSP/SP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={14}
                            placeholder="000.000.000-00"
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dados Pessoais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEXO_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado_civil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ESTADO_CIVIL_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nacionalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nacionalidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Brasileira" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="naturalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naturalidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="São Paulo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contato e Profissão */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="profissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Profissão" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="@usuario" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contato de Emergência */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contato_emergencia_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contato de Emergência</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={15}
                            placeholder="(00) 00000-0000"
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contato_emergencia_parentesco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parentesco</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Mãe, Pai, Cônjuge..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Indicação e Primeiro Atendimento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="indicado_por"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Indicado por</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome de quem indicou" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="primeiro_atendimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primeiro Atendimento em</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Paciente ativo</FormLabel>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="endereco" className="space-y-4 mt-4">
                {/* Endereço Residencial */}
                <h3 className="text-sm font-medium text-muted-foreground">Endereço Residencial</h3>
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rua, número, complemento, bairro" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Cidade" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ESTADOS_BR.map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={9}
                            placeholder="00000-000"
                            onChange={(e) => field.onChange(formatCEP(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Endereço Profissional */}
                <h3 className="text-sm font-medium text-muted-foreground mt-6">Endereço Profissional</h3>
                <FormField
                  control={form.control}
                  name="endereco_profissional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Profissional</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rua, número, complemento, bairro, cidade/UF" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Observações */}
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Observações gerais sobre o paciente" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="responsavel" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Preencha os dados do responsável pelo tratamento (para menores de idade ou quando necessário).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome completo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_parentesco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parentesco/Relação</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Pai, Mãe, Tutor..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={20} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_rg_orgao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão Expedidor</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="SSP/SP" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={14}
                            placeholder="000.000.000-00"
                            onChange={(e) => field.onChange(formatCPF(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SEXO_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_estado_civil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado Civil</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ESTADO_CIVIL_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_nacionalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nacionalidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Brasileira" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_naturalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Naturalidade</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="São Paulo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_profissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Profissão" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={15}
                            placeholder="(00) 00000-0000"
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsavel_endereco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Rua, número, complemento, bairro, cidade/UF" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsavel_cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            maxLength={9}
                            placeholder="00000-000"
                            onChange={(e) => field.onChange(formatCEP(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
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
}
