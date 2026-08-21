import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Users,
  Target,
  Calendar,
  TrendingUp,
  DollarSign,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
  X,
  Clock,
} from "lucide-react";
import {
  useCRMAgendamentos,
  useTratamentos,
  useOrigens,
  CRMAgendamento,
  PIPELINE_COLUMNS,
  PRIORIDADE_LABELS,
  STATUS_LABELS,
  Prioridade,
} from "@/components/crm/hooks/useCRMAgendamentos";
import { OportunidadeForm } from "@/components/crm/OportunidadeForm";
import { useAgendamentoMutations } from "@/components/crm/hooks/useCRMAgendamentos";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { modules } from "@/config/navigation";

// Same items shown in the desktop sidebar's CRM section — kept in sync via the shared config.
const crmNavItems = modules.find((m) => m.id === "crm")!.items;

const prioridadeConfig: Record<string, { emoji: string; color: string; bg: string }> = {
  alto: { emoji: "🔥", color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  medio: { emoji: "🌡️", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  baixo: { emoji: "❄️", color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20" },
};

const statusConfig: Record<string, { color: string; bg: string }> = {
  lead: { color: "text-sky-500", bg: "bg-sky-500" },
  contatado: { color: "text-violet-500", bg: "bg-violet-500" },
  agendado: { color: "text-amber-500", bg: "bg-amber-500" },
  avaliacao: { color: "text-cyan-500", bg: "bg-cyan-500" },
  em_negociacao: { color: "text-orange-500", bg: "bg-orange-500" },
  fechado: { color: "text-emerald-500", bg: "bg-emerald-500" },
  realizado: { color: "text-emerald-600", bg: "bg-emerald-600" },
};

interface LeadCardProps {
  agendamento: CRMAgendamento;
  onTap: () => void;
}

function LeadCard({ agendamento, onTap }: LeadCardProps) {
  const prioridade = agendamento.prioridade || "medio";
  const config = prioridadeConfig[prioridade] || prioridadeConfig.medio;
  const paciente = agendamento.paciente as any;
  const tratamento = agendamento.tratamento as any;
  const origem = agendamento.origem as any;
  
  const lastContact = agendamento.data_ultimo_contato 
    ? formatDistanceToNow(new Date(agendamento.data_ultimo_contato), { addSuffix: true, locale: ptBR })
    : null;
  
  return (
    <div
      onClick={onTap}
      className={cn(
        "p-4 rounded-2xl bg-card/80 backdrop-blur-sm",
        "border border-border/30",
        "active:scale-[0.98] transition-all duration-200 cursor-pointer"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar/Emoji */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center text-lg shrink-0",
          config.bg, "border"
        )}>
          {config.emoji}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {paciente?.nome || "Sem nome"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {tratamento?.nome || "Interesse não definido"}
              </p>
            </div>
            <p className="text-lg font-bold text-primary shrink-0">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              }).format(agendamento.valor_previsto || 0)}
            </p>
          </div>
          
          {/* Meta info */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={cn("text-xs", config.bg)}>
              {PRIORIDADE_LABELS[prioridade as Prioridade]}
            </Badge>
            {origem?.nome && (
              <Badge variant="secondary" className="text-xs bg-muted/50">
                {origem.nome}
              </Badge>
            )}
            {lastContact && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastContact}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-border/20">
        {paciente?.telefone && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-3 rounded-lg text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`tel:${paciente.telefone}`, "_blank");
            }}
          >
            <Phone className="h-3.5 w-3.5" />
            Ligar
          </Button>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 px-3 rounded-lg text-xs gap-1.5"
          onClick={(e) => {
            e.stopPropagation();
            // Navigate to WhatsApp
          }}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Mensagem
        </Button>
      </div>
    </div>
  );
}

interface ColumnTabProps {
  status: string;
  label: string;
  count: number;
  active: boolean;
  onSelect: () => void;
}

function ColumnTab({ status, label, count, active, onSelect }: ColumnTabProps) {
  const config = statusConfig[status] || { bg: "bg-muted" };
  
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap",
        "transition-all duration-200 active:scale-95 shrink-0",
        active
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "bg-card/80 text-muted-foreground border border-border/30"
      )}
    >
      {!active && <div className={cn("w-2 h-2 rounded-full", config.bg)} />}
      <span className="font-medium text-sm">{label}</span>
      <span className={cn(
        "px-1.5 py-0.5 rounded-md text-xs font-semibold min-w-[20px] text-center",
        active ? "bg-primary-foreground/20" : "bg-muted/80"
      )}>
        {count}
      </span>
    </button>
  );
}

export function MobilePipeline() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<string>("lead");
  const [filterOpen, setFilterOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<CRMAgendamento | null>(null);
  const [selectedTratamento, setSelectedTratamento] = useState<string>("all");
  const [selectedOrigem, setSelectedOrigem] = useState<string>("all");
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>("all");
  const [activeNav, setActiveNav] = useState("/crm/pipeline");

  const { data: tratamentos = [] } = useTratamentos();
  const { data: origens = [] } = useOrigens();
  const { data: agendamentos = [], isLoading } = useCRMAgendamentos({
    tratamentoId: selectedTratamento !== "all" ? selectedTratamento : undefined,
    origemId: selectedOrigem !== "all" ? selectedOrigem : undefined,
    prioridade: selectedPrioridade !== "all" ? selectedPrioridade as Prioridade : undefined,
  });
  const { createAgendamento, updateAgendamento } = useAgendamentoMutations();

  // Filter by search
  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((a) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const paciente = a.paciente as any;
      const tratamento = a.tratamento as any;
      const origem = a.origem as any;
      return (
        paciente?.nome?.toLowerCase().includes(searchLower) ||
        tratamento?.nome?.toLowerCase().includes(searchLower) ||
        origem?.nome?.toLowerCase().includes(searchLower)
      );
    });
  }, [agendamentos, search]);

  // Group by status
  const byStatus = useMemo(() => {
    return PIPELINE_COLUMNS.reduce((acc, status) => {
      acc[status] = filteredAgendamentos.filter((a) => a.status === status);
      return acc;
    }, {} as Record<string, CRMAgendamento[]>);
  }, [filteredAgendamentos]);

  // KPIs
  const kpis = useMemo(() => {
    const totalLeads = agendamentos.filter((a) => a.status === "lead").length;
    const totalEmNegociacao = agendamentos.filter((a) => a.status === "em_negociacao").length;
    const totalRealizados = agendamentos.filter((a) => a.status === "realizado").length;
    const totalPerdidos = agendamentos.filter((a) => a.status === "perdido" || a.status === "cancelado").length;
    const taxaConversao = totalRealizados + totalPerdidos > 0
      ? Math.round((totalRealizados / (totalRealizados + totalPerdidos)) * 100)
      : 0;
    const pipelineValue = filteredAgendamentos
      .filter((a) => PIPELINE_COLUMNS.includes(a.status as typeof PIPELINE_COLUMNS[number]))
      .reduce((sum, a) => sum + Number(a.valor_previsto || 0), 0);
    
    return { totalLeads, totalEmNegociacao, taxaConversao, pipelineValue };
  }, [agendamentos, filteredAgendamentos]);

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
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
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  }, [selectedAgendamento, updateAgendamento, createAgendamento]);

  const handleCardTap = useCallback((agendamento: CRMAgendamento) => {
    navigate(`/crm/pacientes/${agendamento.paciente_id}`);
  }, [navigate]);

  const hasActiveFilters = selectedTratamento !== "all" || selectedOrigem !== "all" || selectedPrioridade !== "all";

  const clearFilters = useCallback(() => {
    setSelectedTratamento("all");
    setSelectedOrigem("all");
    setSelectedPrioridade("all");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/40">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-xl shrink-0"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar leads..."
                className="h-10 rounded-xl bg-muted/50 border-0"
                autoFocus
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl shrink-0"
                onClick={() => {
                  setSearch("");
                  setSearchOpen(false);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1">
                <h1 className="text-lg font-semibold text-foreground">Pipeline</h1>
                <p className="text-xs text-muted-foreground">
                  {kpis.totalLeads} leads • {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(kpis.pipelineValue)} no funil
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-10 w-10 rounded-xl relative", hasActiveFilters && "text-primary")}
                onClick={() => setFilterOpen(true)}
              >
                <Filter className="h-5 w-5" />
                {hasActiveFilters && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                )}
              </Button>
            </>
          )}
        </div>

        {/* Module Nav */}
        <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {crmNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  "active:scale-95",
                  activeNav === item.to
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground"
                )}
                onClick={() => setActiveNav(item.to)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Column Tabs */}
      <div className="sticky top-[108px] z-40 bg-background/95 backdrop-blur-lg px-4 py-3 border-b border-border/20">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {PIPELINE_COLUMNS.map((status) => (
            <ColumnTab
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              count={byStatus[status]?.length || 0}
              active={activeColumn === status}
              onSelect={() => setActiveColumn(status)}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-28 space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 rounded-2xl bg-card/80 border border-border/30">
                <div className="flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : byStatus[activeColumn]?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Nenhum lead aqui</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Não há leads na etapa "{STATUS_LABELS[activeColumn]}"
            </p>
            <Button
              onClick={() => {
                setSelectedAgendamento(null);
                setFormOpen(true);
              }}
              className="rounded-xl gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Lead
            </Button>
          </div>
        ) : (
          byStatus[activeColumn]?.map((agendamento) => (
            <LeadCard
              key={agendamento.id}
              agendamento={agendamento}
              onTap={() => handleCardTap(agendamento)}
            />
          ))
        )}
      </main>

      {/* FAB */}
      <Button
        size="lg"
        className={cn(
          "fixed bottom-24 right-4 z-50",
          "h-14 w-14 rounded-2xl shadow-xl shadow-primary/30",
          "active:scale-95 transition-all"
        )}
        onClick={() => {
          setSelectedAgendamento(null);
          setFormOpen(true);
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh]">
          <SheetHeader className="pb-4">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 pb-6">
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Origem</label>
              <Select value={selectedOrigem} onValueChange={setSelectedOrigem}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todas origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas origens</SelectItem>
                  {origens.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Tratamento</label>
              <Select value={selectedTratamento} onValueChange={setSelectedTratamento}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todos tratamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tratamentos</SelectItem>
                  {tratamentos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block text-foreground">Temperatura</label>
              <Select value={selectedPrioridade} onValueChange={setSelectedPrioridade}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="alto">🔥 Quente</SelectItem>
                  <SelectItem value="medio">🌡️ Morno</SelectItem>
                  <SelectItem value="baixo">❄️ Frio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              {hasActiveFilters && (
                <Button variant="outline" className="flex-1 rounded-xl" onClick={clearFilters}>
                  Limpar
                </Button>
              )}
              <Button className="flex-1 rounded-xl" onClick={() => setFilterOpen(false)}>
                Aplicar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Form Modal */}
      <OportunidadeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        oportunidade={selectedAgendamento}
        onSave={handleSave}
        isLoading={createAgendamento.isPending || updateAgendamento.isPending}
      />
    </div>
  );
}