import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, FileText, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePacientesData, type Paciente } from "@/components/crm/hooks/usePacientesData";
import { PacientesKPIs } from "@/components/crm/PacientesKPIs";
import { PacientesFilters } from "@/components/crm/PacientesFilters";
import { PacienteForm } from "@/components/crm/PacienteForm";
import { AnamneseForm } from "@/components/crm/AnamneseForm";
import { PageHeader } from "@/components/PageHeader";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users, UserX, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tables } from "@/integrations/supabase/types";

type Anamnese = Tables<"anamneses">;

export default function Pacientes() {
  const navigate = useNavigate();
  const { pacientes, refetch, isLoading, kpis } = usePacientesData();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pacienteToToggle, setPacienteToToggle] = useState<Paciente | null>(null);
  
  // Anamnese states
  const [anamneseFormOpen, setAnamneseFormOpen] = useState(false);
  const [anamneseListOpen, setAnamneseListOpen] = useState(false);
  const [selectedAnamnese, setSelectedAnamnese] = useState<Anamnese | null>(null);
  const [pacienteAnamnese, setPacienteAnamnese] = useState<Paciente | null>(null);

  // Fetch anamneses for selected patient
  const { data: anamneses = [], refetch: refetchAnamneses } = useQuery({
    queryKey: ["anamneses", pacienteAnamnese?.id],
    queryFn: async () => {
      if (!pacienteAnamnese?.id) return [];
      const { data, error } = await supabase
        .from("anamneses")
        .select("*")
        .eq("paciente_id", pacienteAnamnese.id)
        .order("data_anamnese", { ascending: false });
      if (error) throw error;
      return data as Anamnese[];
    },
    enabled: !!pacienteAnamnese?.id,
  });

  const filteredPacientes = useMemo(() => {
    return pacientes.filter((p) => {
      // Filtro de busca
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesNome = p.nome.toLowerCase().includes(searchLower);
        const matchesCpf = p.cpf?.toLowerCase().includes(searchLower);
        const matchesEmail = p.email?.toLowerCase().includes(searchLower);
        const matchesTelefone = p.telefone?.toLowerCase().includes(searchLower);
        if (!matchesNome && !matchesCpf && !matchesEmail && !matchesTelefone) return false;
      }

      // Filtro de status
      if (status === "ativos" && p.ativo === false) return false;
      if (status === "inativos" && p.ativo !== false) return false;

      return true;
    });
  }, [pacientes, search, status]);

  const savePacienteMutation = useMutation({
    mutationFn: async (paciente: Partial<Paciente> & { id?: string }) => {
      const { id, created_at, updated_at, ...payload } = paciente;
      if (id) {
        const { error } = await supabase
          .from("pacientes")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("pacientes")
          .insert({ nome: payload.nome!, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetch();
      setFormOpen(false);
      setSelectedPaciente(null);
      toast({ title: "Paciente salvo com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async (paciente: Paciente) => {
      const { error } = await supabase
        .from("pacientes")
        .update({ ativo: !paciente.ativo })
        .eq("id", paciente.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setDeleteDialogOpen(false);
      setPacienteToToggle(null);
      toast({ title: "Status do paciente atualizado!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveAnamnese = useMutation({
    mutationFn: async (anamnese: Partial<Anamnese> & { paciente_id: string }) => {
      if (selectedAnamnese?.id) {
        const { id, created_at, updated_at, ...payload } = anamnese as Anamnese;
        const { error } = await supabase
          .from("anamneses")
          .update(payload)
          .eq("id", selectedAnamnese.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("anamneses")
          .insert(anamnese);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchAnamneses();
      setAnamneseFormOpen(false);
      setSelectedAnamnese(null);
      toast({ title: "Anamnese salva com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar anamnese",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setFormOpen(true);
  };

  const handleNew = () => {
    setSelectedPaciente(null);
    setFormOpen(true);
  };

  const handleToggleAtivo = (paciente: Paciente) => {
    setPacienteToToggle(paciente);
    setDeleteDialogOpen(true);
  };

  const confirmToggleAtivo = () => {
    if (pacienteToToggle) {
      toggleAtivoMutation.mutate(pacienteToToggle);
    }
  };

  const handleOpenAnamneses = (paciente: Paciente) => {
    setPacienteAnamnese(paciente);
    setAnamneseListOpen(true);
  };

  const handleNewAnamnese = () => {
    setSelectedAnamnese(null);
    setAnamneseFormOpen(true);
  };

  const handleEditAnamnese = (anamnese: Anamnese) => {
    setSelectedAnamnese(anamnese);
    setAnamneseFormOpen(true);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description="Gerencie os pacientes e clientes da clínica"
        icon={<Users className="h-6 w-6 text-primary" />}
        actions={
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Paciente
          </Button>
        }
      />

      <PacientesKPIs
        totalPacientes={kpis.totalPacientes}
        pacientesAtivos={kpis.pacientesAtivos}
        pacientesInativos={kpis.pacientesInativos}
        novosEsteMes={kpis.novosEsteMes}
      />

      <PacientesFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPacientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState icon={Users} title="Nenhum paciente encontrado" description="Ajuste os filtros ou cadastre um novo paciente." size="sm" />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPacientes.map((paciente) => (
                    <TableRow key={paciente.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/crm/pacientes/${paciente.id}`)}>
                      <TableCell className="font-medium text-primary">{paciente.nome}</TableCell>
                      <TableCell>{paciente.cpf || "-"}</TableCell>
                      <TableCell>{paciente.telefone || "-"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {paciente.email || "-"}
                      </TableCell>
                      <TableCell>
                        {paciente.cidade && paciente.estado
                          ? `${paciente.cidade}/${paciente.estado}`
                          : paciente.cidade || paciente.estado || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={paciente.ativo !== false ? "default" : "secondary"}
                          className={
                            paciente.ativo !== false
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                              : ""
                          }
                        >
                          {paciente.ativo !== false ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DataTableRowActions
                          onView={() => navigate(`/crm/pacientes/${paciente.id}`)}
                          viewLabel="Ficha 360°"
                          onEdit={() => handleEdit(paciente)}
                          statusActions={[
                            { icon: ClipboardList, label: "Anamneses", onClick: () => handleOpenAnamneses(paciente) },
                            {
                              icon: paciente.ativo !== false ? UserX : UserCheck,
                              label: paciente.ativo !== false ? "Desativar" : "Ativar",
                              onClick: () => handleToggleAtivo(paciente),
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PacienteForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedPaciente(null);
        }}
        onSave={(paciente) => {
          if (selectedPaciente) {
            savePacienteMutation.mutate({ ...paciente, id: selectedPaciente.id });
          } else {
            savePacienteMutation.mutate(paciente);
          }
        }}
        paciente={selectedPaciente}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={pacienteToToggle?.ativo !== false ? "Desativar paciente" : "Ativar paciente"}
        description={
          pacienteToToggle?.ativo !== false
            ? "O paciente será marcado como inativo. Você pode reativá-lo a qualquer momento."
            : "O paciente será reativado e aparecerá na lista de pacientes ativos."
        }
        confirmLabel={pacienteToToggle?.ativo !== false ? "Desativar" : "Ativar"}
        variant={pacienteToToggle?.ativo !== false ? "destructive" : "default"}
        onConfirm={confirmToggleAtivo}
      />

      {/* Modal de lista de anamneses */}
      <Dialog open={anamneseListOpen} onOpenChange={setAnamneseListOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Anamneses - {pacienteAnamnese?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleNewAnamnese}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Anamnese
              </Button>
            </div>
            {anamneses.length === 0 ? (
              <EmptyState icon={FileText} title="Nenhuma anamnese registrada" description="Registre a primeira anamnese deste paciente." size="sm" />
            ) : (
              <div className="space-y-2">
                {anamneses.map((anamnese) => (
                  <Card key={anamnese.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleEditAnamnese(anamnese)}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              Anamnese de {formatDate(anamnese.data_anamnese)}
                            </p>
                            {anamnese.queixa_principal && (
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {anamnese.queixa_principal}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulário de anamnese */}
      {pacienteAnamnese && (
        <AnamneseForm
          open={anamneseFormOpen}
          onOpenChange={setAnamneseFormOpen}
          anamnese={selectedAnamnese}
          pacienteId={pacienteAnamnese.id}
          pacienteNome={pacienteAnamnese.nome}
          onSave={saveAnamnese.mutate}
          isLoading={saveAnamnese.isPending}
        />
      )}
    </div>
  );
}
