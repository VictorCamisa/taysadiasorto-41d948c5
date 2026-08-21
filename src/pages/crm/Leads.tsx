import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { 
  Users, 
  Search, 
  Phone, 
  User, 
  RefreshCw, 
  X, 
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  UserPlus
} from "lucide-react";
import {
  useCRMAgendamentos,
  useTratamentos,
  useOrigens,
  useAgendamentoMutations,
  useInteracaoMutations,
  STATUS_LABELS,
  STATUS_COLORS,
  type AgendamentoStatus,
} from "@/components/crm/hooks/useCRMAgendamentos";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

type LeadTab = "ativos" | "ganhos" | "perdidos";

const STATUS_BY_TAB: Record<LeadTab, AgendamentoStatus[]> = {
  ativos: ["lead", "em_negociacao", "orcamento_enviado", "agendado", "confirmado", "reativacao"],
  ganhos: ["realizado"],
  perdidos: ["perdido", "cancelado", "no_show"],
};

export default function Leads() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LeadTab>("ativos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTratamento, setSelectedTratamento] = useState<string>("all");
  const [selectedOrigem, setSelectedOrigem] = useState<string>("all");
  const [reativarModal, setReativarModal] = useState<{ open: boolean; id: string; nome: string } | null>(null);

  // Buscar todos os agendamentos
  const { data: allAgendamentos = [], isLoading } = useCRMAgendamentos({});
  const { data: tratamentos = [] } = useTratamentos();
  const { data: origens = [] } = useOrigens();
  const { updateAgendamento } = useAgendamentoMutations();
  const { createInteracao } = useInteracaoMutations();

  // Filtrar leads por aba e filtros
  const leads = useMemo(() => {
    const statusList = STATUS_BY_TAB[activeTab];
    return allAgendamentos.filter((a) => {
      const matchesStatus = statusList.includes(a.status as AgendamentoStatus);
      const matchesTratamento = selectedTratamento === "all" || a.tratamento_id === selectedTratamento;
      const matchesOrigem = selectedOrigem === "all" || a.origem_id === selectedOrigem;
      const matchesSearch = searchTerm === "" || 
        a.paciente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tratamento?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.motivo_cancelamento?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesTratamento && matchesOrigem && matchesSearch;
    });
  }, [allAgendamentos, activeTab, selectedTratamento, selectedOrigem, searchTerm]);

  // KPIs por aba
  const kpis = useMemo(() => {
    const ativos = allAgendamentos.filter(a => STATUS_BY_TAB.ativos.includes(a.status as AgendamentoStatus));
    const ganhos = allAgendamentos.filter(a => STATUS_BY_TAB.ganhos.includes(a.status as AgendamentoStatus));
    const perdidos = allAgendamentos.filter(a => STATUS_BY_TAB.perdidos.includes(a.status as AgendamentoStatus));

    return {
      totalAtivos: ativos.length,
      totalGanhos: ganhos.length,
      totalPerdidos: perdidos.length,
      valorAtivos: ativos.reduce((sum, a) => sum + Number(a.valor_previsto || 0), 0),
      valorGanhos: ganhos.reduce((sum, a) => sum + Number(a.valor_realizado || a.valor_previsto || 0), 0),
      valorPerdidos: perdidos.reduce((sum, a) => sum + Number(a.valor_previsto || 0), 0),
      taxaConversao: ativos.length + ganhos.length + perdidos.length > 0 
        ? (ganhos.length / (ativos.length + ganhos.length + perdidos.length)) * 100 
        : 0,
    };
  }, [allAgendamentos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTratamento("all");
    setSelectedOrigem("all");
  };

  const hasActiveFilters = searchTerm || selectedTratamento !== "all" || selectedOrigem !== "all";

  const handleReativar = async () => {
    if (!reativarModal) return;

    try {
      await updateAgendamento.mutateAsync({
        id: reativarModal.id,
        status: "em_negociacao",
      });
      await createInteracao.mutateAsync({
        agendamento_id: reativarModal.id,
        tipo: "nota",
        observacao: "Lead reativado para nova tentativa de negociação",
      });
      toast({
        title: "Lead reativado!",
        description: "O lead foi movido para Em Negociação.",
      });
      setReativarModal(null);
    } catch {
      toast({
        title: "Erro ao reativar",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const label = STATUS_LABELS[status as AgendamentoStatus] || status;
    const colorClass = STATUS_COLORS[status as AgendamentoStatus] || "bg-muted text-muted-foreground";
    return (
      <Badge className={`${colorClass} text-xs`}>
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Leads"
        description="Gerencie todos os leads da empresa: ativos, convertidos e perdidos"
        icon={<Users className="h-6 w-6 text-primary" />}
      />

      {/* KPIs Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Leads Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{kpis.totalAtivos}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(kpis.valorAtivos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Convertidos (Clientes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{kpis.totalGanhos}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(kpis.valorGanhos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Perdidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">{kpis.totalPerdidos}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(kpis.valorPerdidos)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{kpis.taxaConversao.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">do total de leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Status */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeadTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="ativos" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ativos ({kpis.totalAtivos})
          </TabsTrigger>
          <TabsTrigger value="ganhos" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Clientes ({kpis.totalGanhos})
          </TabsTrigger>
          <TabsTrigger value="perdidos" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Perdidos ({kpis.totalPerdidos})
          </TabsTrigger>
        </TabsList>

        {/* Filtros */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por paciente, tratamento..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedOrigem} onValueChange={setSelectedOrigem}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas origens</SelectItem>
                  {origens.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedTratamento} onValueChange={setSelectedTratamento}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Tratamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos tratamentos</SelectItem>
                  {tratamentos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo das Tabs */}
        <TabsContent value="ativos" className="mt-4">
          <LeadsTable 
            leads={leads} 
            isLoading={isLoading} 
            onRowClick={(lead) => lead.paciente_id && navigate(`/crm/pacientes/${lead.paciente_id}`)}
            showStatus
            emptyMessage="Nenhum lead ativo encontrado"
            formatCurrency={formatCurrency}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="ganhos" className="mt-4">
          <LeadsTable 
            leads={leads} 
            isLoading={isLoading} 
            onRowClick={(lead) => lead.paciente_id && navigate(`/crm/pacientes/${lead.paciente_id}`)}
            showValorRealizado
            emptyMessage="Nenhum cliente convertido encontrado"
            formatCurrency={formatCurrency}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="perdidos" className="mt-4">
          <LeadsTable 
            leads={leads} 
            isLoading={isLoading} 
            onRowClick={(lead) => lead.paciente_id && navigate(`/crm/pacientes/${lead.paciente_id}`)}
            showMotivo
            showReativar
            onReativar={(lead) => setReativarModal({ open: true, id: lead.id, nome: lead.paciente?.nome || "Lead" })}
            emptyMessage="Nenhum lead perdido encontrado"
            formatCurrency={formatCurrency}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Reativação */}
      <ConfirmDialog
        open={!!reativarModal?.open}
        onOpenChange={(open) => !open && setReativarModal(null)}
        title="Reativar Lead"
        description={`Deseja reativar o lead ${reativarModal?.nome}? Ele será movido para "Em Negociação" para uma nova tentativa de conversão.`}
        confirmLabel="Reativar Lead"
        onConfirm={handleReativar}
      />
    </div>
  );
}

// Componente de Tabela reutilizável
interface LeadsTableProps {
  leads: any[];
  isLoading: boolean;
  onRowClick: (lead: any) => void;
  showStatus?: boolean;
  showMotivo?: boolean;
  showReativar?: boolean;
  showValorRealizado?: boolean;
  onReativar?: (lead: any) => void;
  emptyMessage: string;
  formatCurrency: (value: number) => string;
  getStatusBadge: (status: string) => JSX.Element;
}

function LeadsTable({
  leads,
  isLoading,
  onRowClick,
  showStatus,
  showMotivo,
  showReativar,
  showValorRealizado,
  onReativar,
  emptyMessage,
  formatCurrency,
  getStatusBadge,
}: LeadsTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Carregando...</p>
        ) : leads.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{emptyMessage}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Tratamento</TableHead>
                <TableHead>Origem</TableHead>
                {showStatus && <TableHead>Status</TableHead>}
                {showMotivo && <TableHead>Motivo</TableHead>}
                <TableHead>Última atualização</TableHead>
                <TableHead>{showValorRealizado ? "Valor Realizado" : "Valor Previsto"}</TableHead>
                {showReativar && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow 
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick(lead)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{lead.paciente?.nome || "—"}</p>
                        {lead.paciente?.telefone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.paciente.telefone}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {lead.tratamento?.nome || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.origem?.nome || "—"}</TableCell>
                  {showStatus && (
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                  )}
                  {showMotivo && (
                    <TableCell>
                      <p className="text-sm max-w-[200px] truncate" title={lead.motivo_cancelamento || ""}>
                        {lead.motivo_cancelamento || "Não informado"}
                      </p>
                    </TableCell>
                  )}
                  <TableCell>
                    {lead.updated_at && (
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.updated_at), { locale: ptBR, addSuffix: true })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className={showValorRealizado ? "font-medium text-emerald-600" : "font-medium"}>
                    {formatCurrency(Number(showValorRealizado ? (lead.valor_realizado || lead.valor_previsto || 0) : (lead.valor_previsto || 0)))}
                  </TableCell>
                  {showReativar && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReativar?.(lead);
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reativar
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
