import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Users, Calendar, DollarSign, Target, Clock, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { PipelineKanban } from "@/components/crm/PipelineKanban";
import { OportunidadeForm } from "@/components/crm/OportunidadeForm";
import {
  useCRMAgendamentos,
  useTratamentos,
  useOrigens,
  useAgendamentoMutations,
  CRMAgendamento,
  PIPELINE_COLUMNS,
  PRIORIDADE_LABELS,
  Prioridade,
} from "@/components/crm/hooks/useCRMAgendamentos";
import { toast } from "@/hooks/use-toast";
import { FilterBar } from "@/components/ui/FilterBar";
import { LoadingState } from "@/components/ui/LoadingState";

export default function Pipeline() {
  const navigate = useNavigate();
  const [selectedTratamento, setSelectedTratamento] = useState<string>("all");
  const [selectedOrigem, setSelectedOrigem] = useState<string>("all");
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<CRMAgendamento | null>(null);

  const { data: tratamentos = [] } = useTratamentos();
  const { data: origens = [] } = useOrigens();
  const { data: agendamentos = [], isLoading } = useCRMAgendamentos({
    tratamentoId: selectedTratamento !== "all" ? selectedTratamento : undefined,
    origemId: selectedOrigem !== "all" ? selectedOrigem : undefined,
    prioridade: selectedPrioridade !== "all" ? selectedPrioridade as Prioridade : undefined,
  });
  const { createAgendamento, updateAgendamento } = useAgendamentoMutations();

  const handleSaveOportunidade = async (data: Record<string, unknown>) => {
    try {
      const payload = {
        paciente_id: data.paciente_id as string,
        tratamento_id: (data.tratamento_id as string) || null,
        origem_id: (data.origem_id as string) || null,
        prioridade: (data.prioridade as string) || "medio",
        valor_previsto: (data.valor_previsto as number) || 0,
        duracao_minutos: (data.duracao_minutos as number) || 60,
        data_previsao_fechamento: (data.data_previsao_fechamento as string) || null,
        observacoes: (data.observacoes as string) || null,
        status: selectedAgendamento?.status || "lead",
      };

      if (selectedAgendamento) {
        await updateAgendamento.mutateAsync({ id: selectedAgendamento.id, ...payload });
        toast({ title: "Oportunidade atualizada!" });
      } else {
        await createAgendamento.mutateAsync(payload);
        toast({ title: "Oportunidade criada!" });
      }
      setFormOpen(false);
      setSelectedAgendamento(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "Erro ao salvar", description: errorMessage, variant: "destructive" });
    }
  };

  const handleEditAgendamento = (agendamento: CRMAgendamento) => {
    setSelectedAgendamento(agendamento);
    setFormOpen(true);
  };

  const handleNewAgendamento = () => {
    setSelectedAgendamento(null);
    setFormOpen(true);
  };

  // Calculate KPIs
  const pipelineAgendamentos = agendamentos.filter(
    (a) => PIPELINE_COLUMNS.includes(a.status as typeof PIPELINE_COLUMNS[number])
  );

  const totalLeads = agendamentos.filter((a) => a.status === "lead").length;
  const totalEmNegociacao = agendamentos.filter((a) => a.status === "em_negociacao").length;
  const totalAgendados = agendamentos.filter((a) => a.status === "agendado" || a.status === "confirmado").length;
  const totalRealizados = agendamentos.filter((a) => a.status === "realizado").length;
  
  const totalValorFunil = pipelineAgendamentos.reduce(
    (sum, a) => sum + Number(a.valor_previsto || 0),
    0
  );

  const valorRealizados = agendamentos
    .filter((a) => a.status === "realizado")
    .reduce((sum, a) => sum + Number(a.valor_previsto || 0), 0);

  // Taxa de conversão: realizados / (realizados + perdidos)
  const totalPerdidos = agendamentos.filter((a) => a.status === "perdido" || a.status === "cancelado").length;
  const taxaConversao = totalRealizados + totalPerdidos > 0
    ? Math.round((totalRealizados / (totalRealizados + totalPerdidos)) * 100)
    : 0;

  // Ticket médio
  const ticketMedio = totalRealizados > 0 ? valorRealizados / totalRealizados : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const hasActiveFilters = selectedTratamento !== "all" || selectedOrigem !== "all" || selectedPrioridade !== "all";

  const clearFilters = () => {
    setSelectedTratamento("all");
    setSelectedOrigem("all");
    setSelectedPrioridade("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline de Vendas"
        description="Gerencie suas oportunidades e acompanhe o funil comercial"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/crm/whatsapp")}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Visualização WhatsApp
            </Button>
            <Button onClick={handleNewAgendamento}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Oportunidade
            </Button>
          </>
        }
      />

      {/* KPIs Comerciais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Leads</span>
            </div>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs">Em Negociação</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalEmNegociacao}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Agendados</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{totalAgendados}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Taxa Conversão</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{taxaConversao}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Ticket Médio</span>
            </div>
            <div className="text-xl font-bold">{formatCurrency(ticketMedio)}</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Previsão no Funil</span>
            </div>
            <div className="text-xl font-bold text-primary">{formatCurrency(totalValorFunil)}</div>
          </CardContent>
        </Card>
      </div>

      <FilterBar
        filters={
          <>
            <Select value={selectedOrigem} onValueChange={setSelectedOrigem}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                {origens.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTratamento} onValueChange={setSelectedTratamento}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tratamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tratamentos</SelectItem>
                {tratamentos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPrioridade} onValueChange={setSelectedPrioridade}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Temperatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="alto">🔥 {PRIORIDADE_LABELS.alto}</SelectItem>
                <SelectItem value="medio">🌡️ {PRIORIDADE_LABELS.medio}</SelectItem>
                <SelectItem value="baixo">❄️ {PRIORIDADE_LABELS.baixo}</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                Limpar
              </Button>
            )}

            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs self-center">
                {agendamentos.length} resultados
              </Badge>
            )}
          </>
        }
      />

      {/* Kanban Board */}
      {isLoading ? (
        <LoadingState />
      ) : (
        <PipelineKanban
          agendamentos={agendamentos}
          onEditAgendamento={handleEditAgendamento}
          onNewAgendamento={handleNewAgendamento}
        />
      )}

      {/* Form Modal */}
      <OportunidadeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        oportunidade={selectedAgendamento}
        onSave={handleSaveOportunidade}
        isLoading={createAgendamento.isPending || updateAgendamento.isPending}
      />
    </div>
  );
}
