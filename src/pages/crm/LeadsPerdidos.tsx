import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { XCircle, Search, Phone, User, RefreshCw, X, TrendingDown } from "lucide-react";
import {
  useCRMAgendamentos,
  useTratamentos,
  useOrigens,
  useAgendamentoMutations,
  useInteracaoMutations,
} from "@/components/crm/hooks/useCRMAgendamentos";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function LeadsPerdidos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTratamento, setSelectedTratamento] = useState<string>("all");
  const [selectedOrigem, setSelectedOrigem] = useState<string>("all");
  const [reativarModal, setReativarModal] = useState<{ open: boolean; id: string; nome: string } | null>(null);

  const { data: allAgendamentos = [], isLoading } = useCRMAgendamentos({
    status: ["perdido", "reativacao"],
  });
  const { data: tratamentos = [] } = useTratamentos();
  const { data: origens = [] } = useOrigens();
  const { updateAgendamento } = useAgendamentoMutations();
  const { createInteracao } = useInteracaoMutations();

  // Filtrar leads perdidos
  const leads = allAgendamentos.filter((a) => {
    const matchesTratamento = selectedTratamento === "all" || a.tratamento_id === selectedTratamento;
    const matchesOrigem = selectedOrigem === "all" || a.origem_id === selectedOrigem;
    const matchesSearch = searchTerm === "" || 
      a.paciente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tratamento?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.motivo_cancelamento?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTratamento && matchesOrigem && matchesSearch;
  });

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

  // KPIs
  const totalPerdidos = leads.filter(l => l.status === "perdido").length;
  const totalReativacao = leads.filter(l => l.status === "reativacao").length;
  const valorPerdido = leads.filter(l => l.status === "perdido")
    .reduce((sum, a) => sum + Number(a.valor_previsto || 0), 0);

  // Motivos mais comuns
  const motivosCounts = leads
    .filter(l => l.motivo_cancelamento)
    .reduce((acc, l) => {
      const motivo = l.motivo_cancelamento || "Não informado";
      acc[motivo] = (acc[motivo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads Perdidos"
        description="Gerencie e reative oportunidades que foram perdidas"
        icon={<XCircle className="h-6 w-6 text-primary" />}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Leads Perdidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">{totalPerdidos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Em Reativação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{totalReativacao}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Valor Perdido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">{formatCurrency(valorPerdido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Principal Motivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium truncate">
              {Object.entries(motivosCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, tratamento ou motivo..."
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

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : leads.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum lead perdido encontrado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Tratamento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Motivo da Perda</TableHead>
                  <TableHead>Perdido há</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow 
                    key={lead.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => lead.paciente_id && navigate(`/crm/pacientes/${lead.paciente_id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{lead.paciente?.nome || "—"}</p>
                            {lead.status === "reativacao" && (
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-xs">
                                Reativação
                              </Badge>
                            )}
                          </div>
                          {lead.paciente?.telefone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.paciente.telefone}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{lead.tratamento?.nome || "—"}</TableCell>
                    <TableCell>{lead.origem?.nome || "—"}</TableCell>
                    <TableCell>
                      <p className="text-sm max-w-[200px] truncate" title={lead.motivo_cancelamento || ""}>
                        {lead.motivo_cancelamento || "Não informado"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {lead.updated_at && (
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.updated_at), { locale: ptBR, addSuffix: true })}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-rose-600">
                      {formatCurrency(Number(lead.valor_previsto || 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReativarModal({
                            open: true,
                            id: lead.id,
                            nome: lead.paciente?.nome || "Lead",
                          });
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reativar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
