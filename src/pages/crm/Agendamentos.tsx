import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { Calendar, Phone, Clock, User, X, ChevronLeft, ChevronRight, Plus, List, CalendarDays } from "lucide-react";
import {
  useCRMAgendamentos,
  useTratamentos,
  useAgendamentoMutations,
  CRMAgendamento,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ICONS,
  AgendamentoStatus,
} from "@/components/crm/hooks/useCRMAgendamentos";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { AgendamentoForm } from "@/components/crm/AgendamentoForm";
import { toast } from "@/hooks/use-toast";
import { FilterBar } from "@/components/ui/FilterBar";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Agendamentos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTratamento, setSelectedTratamento] = useState<string>("all");
  const [activeView, setActiveView] = useState<"lista" | "calendario">("lista");
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<CRMAgendamento | null>(null);
  const [defaultFormDate, setDefaultFormDate] = useState<Date | undefined>();

  // Status que representam agendamentos
  const agendamentoStatuses: AgendamentoStatus[] = ["agendado", "confirmado"];

  const { data: allAgendamentos = [], isLoading } = useCRMAgendamentos();
  const { data: tratamentos = [] } = useTratamentos();
  const { createAgendamento, updateAgendamento } = useAgendamentoMutations();

  // Filtrar apenas agendamentos (status agendado ou confirmado)
  const agendamentos = allAgendamentos.filter((a) => {
    const matchesStatus = selectedStatus === "all" 
      ? agendamentoStatuses.includes(a.status as AgendamentoStatus)
      : a.status === selectedStatus;
    const matchesTratamento = selectedTratamento === "all" || a.tratamento_id === selectedTratamento;
    const matchesSearch = searchTerm === "" || 
      a.paciente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tratamento?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesTratamento && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedTratamento("all");
  };

  const hasActiveFilters = searchTerm || selectedStatus !== "all" || selectedTratamento !== "all";

  // KPIs
  const totalAgendados = allAgendamentos.filter(a => a.status === "agendado").length;
  const totalConfirmados = allAgendamentos.filter(a => a.status === "confirmado").length;
  const agendamentosHoje = allAgendamentos.filter(a => {
    if (!a.data_agendamento) return false;
    const hoje = new Date().toDateString();
    return new Date(a.data_agendamento).toDateString() === hoje;
  }).length;
  const valorTotal = agendamentos.reduce((sum, a) => sum + Number(a.valor_previsto || 0), 0);

  // Calendar functions
  const selectedDayAgendamentos = useMemo(() => {
    return allAgendamentos.filter((a) =>
      a.data_agendamento && 
      isSameDay(new Date(a.data_agendamento), selectedDate) &&
      agendamentoStatuses.includes(a.status as AgendamentoStatus)
    ).sort((a, b) => {
      const dateA = a.data_agendamento ? new Date(a.data_agendamento).getTime() : 0;
      const dateB = b.data_agendamento ? new Date(b.data_agendamento).getTime() : 0;
      return dateA - dateB;
    });
  }, [allAgendamentos, selectedDate]);

  const datesWithAppointments = useMemo(() => {
    return allAgendamentos
      .filter((a) => a.data_agendamento && agendamentoStatuses.includes(a.status as AgendamentoStatus))
      .map((a) => new Date(a.data_agendamento!));
  }, [allAgendamentos]);

  const handleNewAgendamento = (date?: Date) => {
    setSelectedAgendamento(null);
    setDefaultFormDate(date || selectedDate);
    setFormOpen(true);
  };

  const handleAgendamentoClick = (agendamento: CRMAgendamento) => {
    if (agendamento.paciente_id) {
      navigate(`/crm/pacientes/${agendamento.paciente_id}`);
    }
  };

  const handleSaveAgendamento = async (data: any) => {
    try {
      const payload = {
        ...data,
        tratamento_id: data.tratamento_id || null,
        data_agendamento: data.data_agendamento ? new Date(data.data_agendamento).toISOString() : null,
      };

      if (selectedAgendamento) {
        await updateAgendamento.mutateAsync({ id: selectedAgendamento.id, ...payload });
        toast({ title: "Agendamento atualizado!" });
      } else {
        await createAgendamento.mutateAsync(payload);
        toast({ title: "Agendamento criado!" });
      }
      setFormOpen(false);
      setSelectedAgendamento(null);
      setDefaultFormDate(undefined);
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "HH:mm");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agendamentos"
        description="Gerencie todos os agendamentos de procedimentos"
        icon={<Calendar className="h-6 w-6 text-primary" />}
        actions={
          <Button onClick={() => handleNewAgendamento()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAgendados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              ✅ Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{totalConfirmados}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{agendamentosHoje}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              💰 Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(valorTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para alternar visualização */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "lista" | "calendario")}>
        <TabsList>
          <TabsTrigger value="lista" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendario" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendário
          </TabsTrigger>
        </TabsList>

        {/* Vista de Lista */}
        <TabsContent value="lista" className="space-y-4">
          <FilterBar
            search={{
              value: searchTerm,
              onChange: setSearchTerm,
              placeholder: "Buscar por paciente ou tratamento...",
            }}
            filters={
              <>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
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
              </>
            }
          />

          {/* Tabela */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <LoadingState />
              ) : agendamentos.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Nenhum agendamento encontrado"
                  description="Ajuste os filtros ou crie um novo agendamento."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tratamento</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendamentos.map((agendamento) => (
                      <TableRow 
                        key={agendamento.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => agendamento.paciente_id && navigate(`/crm/pacientes/${agendamento.paciente_id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{agendamento.paciente?.nome || "—"}</p>
                              {agendamento.paciente?.telefone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {agendamento.paciente.telefone}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{agendamento.tratamento?.nome || "—"}</TableCell>
                        <TableCell>
                          {agendamento.data_agendamento ? (
                            <div>
                              <p className="font-medium">
                                {format(new Date(agendamento.data_agendamento), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(agendamento.data_agendamento), "HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[agendamento.status as AgendamentoStatus]}>
                            {STATUS_ICONS[agendamento.status as AgendamentoStatus]} {STATUS_LABELS[agendamento.status as AgendamentoStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-600">
                          {formatCurrency(Number(agendamento.valor_previsto || 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (agendamento.paciente_id) {
                                navigate(`/crm/pacientes/${agendamento.paciente_id}`);
                              }
                            }}
                          >
                            Ver Ficha
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista de Calendário */}
        <TabsContent value="calendario">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base">
                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={currentMonth}
                  onMonthChange={setCurrentMonth}
                  className="rounded-md pointer-events-auto"
                  modifiers={{
                    hasAppointment: datesWithAppointments,
                  }}
                  modifiersClassNames={{
                    hasAppointment: "bg-primary/20 font-bold",
                  }}
                />
              </CardContent>
            </Card>

            {/* Day Appointments */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </CardTitle>
                  <Badge variant="secondary">
                    {selectedDayAgendamentos.length} agendamento(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <LoadingState />
                ) : selectedDayAgendamentos.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>Nenhum agendamento para este dia</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleNewAgendamento(selectedDate)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agendar consulta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDayAgendamentos.map((agendamento) => (
                      <Card
                        key={agendamento.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleAgendamentoClick(agendamento)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Time Column */}
                            <div className="flex flex-col items-center text-center min-w-[60px]">
                              <span className="text-lg font-bold">
                                {agendamento.data_agendamento
                                  ? formatTime(agendamento.data_agendamento)
                                  : "--:--"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {agendamento.duracao_minutos}min
                              </span>
                            </div>

                            {/* Divider */}
                            <div className="w-px h-12 bg-border" />

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium truncate">
                                  {agendamento.paciente?.nome || "Paciente"}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {agendamento.tratamento && (
                                  <Badge variant="outline" className="text-xs">
                                    {agendamento.tratamento.nome}
                                  </Badge>
                                )}
                                <Badge
                                  className={cn(
                                    "text-xs",
                                    STATUS_COLORS[agendamento.status as AgendamentoStatus]
                                  )}
                                >
                                  {STATUS_LABELS[agendamento.status as AgendamentoStatus]}
                                </Badge>
                              </div>

                              {agendamento.observacoes && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {agendamento.observacoes}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <AgendamentoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        agendamento={selectedAgendamento}
        defaultDate={defaultFormDate}
        onSave={handleSaveAgendamento}
        isLoading={createAgendamento.isPending || updateAgendamento.isPending}
      />
    </div>
  );
}
