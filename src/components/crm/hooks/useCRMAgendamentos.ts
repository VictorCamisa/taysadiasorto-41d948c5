import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

export type CRMAgendamento = Tables<"crm_agendamentos"> & {
  paciente?: Tables<"pacientes"> | null;
  tratamento?: Tables<"tratamentos"> | null;
  origem?: Tables<"origens"> | null;
};

export type CRMInteracao = {
  id: string;
  agendamento_id: string;
  tipo: string;
  observacao: string | null;
  data_contato: string | null;
  created_at: string | null;
};

// Status do funil comercial completo
export type AgendamentoStatus = 
  | "lead" 
  | "em_negociacao" 
  | "orcamento_enviado" 
  | "agendado" 
  | "confirmado" 
  | "realizado" 
  | "cancelado" 
  | "no_show"
  | "perdido"
  | "reativacao";

export type Prioridade = "alto" | "medio" | "baixo";

export type InteracaoTipo = "whatsapp" | "ligacao" | "email" | "reuniao" | "nota" | "status_change" | "orcamento" | "agendamento";

export const STATUS_LABELS: Record<AgendamentoStatus, string> = {
  lead: "Lead",
  em_negociacao: "Em Negociação",
  orcamento_enviado: "Orçamento Enviado",
  agendado: "Agendado",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
  no_show: "No-show",
  perdido: "Perdido",
  reativacao: "Reativação",
};

export const STATUS_COLORS: Record<AgendamentoStatus, string> = {
  lead: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  em_negociacao: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  orcamento_enviado: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  agendado: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  confirmado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  realizado: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  cancelado: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  no_show: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  perdido: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  reativacao: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

export const STATUS_ICONS: Record<AgendamentoStatus, string> = {
  lead: "📥",
  em_negociacao: "💬",
  orcamento_enviado: "📋",
  agendado: "📅",
  confirmado: "✅",
  realizado: "🏆",
  cancelado: "❌",
  no_show: "🚫",
  perdido: "❌",
  reativacao: "♻️",
};

export const PRIORIDADE_LABELS: Record<Prioridade, string> = {
  alto: "Quente",
  medio: "Morno",
  baixo: "Frio",
};

export const PRIORIDADE_COLORS: Record<Prioridade, string> = {
  alto: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  medio: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  baixo: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

export const PRIORIDADE_ICONS: Record<Prioridade, string> = {
  alto: "🔥",
  medio: "🌡️",
  baixo: "❄️",
};

export const INTERACAO_LABELS: Record<InteracaoTipo, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
  reuniao: "Reunião",
  nota: "Nota",
  status_change: "Mudança de Status",
  orcamento: "Orçamento",
  agendamento: "Agendamento",
};

export const INTERACAO_ICONS: Record<InteracaoTipo, string> = {
  whatsapp: "📱",
  ligacao: "📞",
  email: "✉️",
  reuniao: "🤝",
  nota: "📝",
  status_change: "🔄",
  orcamento: "💰",
  agendamento: "📅",
};

// Pipeline columns - fluxo principal
export const PIPELINE_COLUMNS: AgendamentoStatus[] = [
  "lead",
  "em_negociacao",
  "orcamento_enviado",
  "agendado",
  "confirmado",
  "realizado",
];

// Colunas auxiliares
export const AUXILIARY_COLUMNS: AgendamentoStatus[] = [
  "perdido",
  "reativacao",
];

export function useCRMAgendamentos(filters?: {
  tratamentoId?: string;
  status?: AgendamentoStatus[];
  startDate?: Date;
  endDate?: Date;
  origemId?: string;
  prioridade?: Prioridade;
}) {
  return useQuery({
    queryKey: ["crm-agendamentos", filters],
    queryFn: async () => {
      let query = supabase
        .from("crm_agendamentos")
        .select("*, paciente:pacientes(*), tratamento:tratamentos(*), origem:origens(*)")
        .order("created_at", { ascending: false });

      if (filters?.tratamentoId) {
        query = query.eq("tratamento_id", filters.tratamentoId);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in("status", filters.status);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      if (filters?.origemId) {
        query = query.eq("origem_id", filters.origemId);
      }

      if (filters?.prioridade) {
        query = query.eq("prioridade", filters.prioridade);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CRMAgendamento[];
    },
  });
}

export function useTratamentos() {
  return useQuery({
    queryKey: ["tratamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tratamentos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function usePacientes() {
  return useQuery({
    queryKey: ["pacientes-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, telefone, email")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useOrigens() {
  return useQuery({
    queryKey: ["origens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("origens")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

export function useCRMInteracoes(agendamentoId?: string) {
  return useQuery({
    queryKey: ["crm-interacoes", agendamentoId],
    enabled: !!agendamentoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_interacoes")
        .select("*")
        .eq("agendamento_id", agendamentoId!)
        .order("data_contato", { ascending: false });
      if (error) throw error;
      return data as CRMInteracao[];
    },
  });
}

export function useAgendamentoMutations() {
  const queryClient = useQueryClient();

  const createAgendamento = useMutation({
    mutationFn: async (data: Partial<Tables<"crm_agendamentos">> & { paciente_id: string }) => {
      const { error } = await supabase.from("crm_agendamentos").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-agendamentos"] });
    },
  });

  const updateAgendamento = useMutation({
    mutationFn: async (updateData: { id: string; status?: string; motivo_cancelamento?: string; valor_previsto?: number; data_agendamento?: string; observacoes?: string; data_ultimo_contato?: string; proxima_acao?: string; data_proxima_acao?: string; responsavel?: string }) => {
      const { id, ...data } = updateData;
      const { error } = await supabase
        .from("crm_agendamentos")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-agendamentos"] });
    },
  });

  const deleteAgendamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_agendamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-agendamentos"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, data_ultimo_contato }: { id: string; status: AgendamentoStatus; data_ultimo_contato?: string }) => {
      const updateData: { status: AgendamentoStatus; data_ultimo_contato?: string } = { status };
      if (data_ultimo_contato) {
        updateData.data_ultimo_contato = data_ultimo_contato;
      }
      const { error } = await supabase
        .from("crm_agendamentos")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-agendamentos"] });
    },
  });

  return { createAgendamento, updateAgendamento, deleteAgendamento, updateStatus };
}

export function useInteracaoMutations() {
  const queryClient = useQueryClient();

  const createInteracao = useMutation({
    mutationFn: async (data: { agendamento_id: string; tipo: InteracaoTipo; observacao?: string }) => {
      const { error } = await supabase.from("crm_interacoes").insert([{
        ...data,
        data_contato: new Date().toISOString(),
      }]);
      if (error) throw error;

      // Também atualiza o último contato no agendamento
      await supabase
        .from("crm_agendamentos")
        .update({ data_ultimo_contato: new Date().toISOString() })
        .eq("id", data.agendamento_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-interacoes"] });
      queryClient.invalidateQueries({ queryKey: ["crm-agendamentos"] });
    },
  });

  return { createInteracao };
}

// Mutation to create a new patient inline
export function useCreatePacienteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; telefone?: string; email?: string }) => {
      const { data: newPaciente, error } = await supabase
        .from("pacientes")
        .insert([{ ...data, ativo: true }])
        .select()
        .single();
      if (error) throw error;
      return newPaciente;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pacientes-list"] });
    },
  });
}
