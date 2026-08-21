import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FilterBar } from "@/components/ui/FilterBar";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { Pill, ExternalLink, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ReceituariosPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: receituarios, isLoading } = useQuery({
    queryKey: ["gestao-receituarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receituario_digital")
        .select(`
          *,
          pacientes:paciente_id (id, nome, telefone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const filteredReceituarios = receituarios?.filter((receituario) => {
    return receituario.pacientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      receituario.medicamento?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/gestao">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader
          title="Receituários"
          description="Gerencie todas as prescrições médicas"
        />
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por paciente ou medicamento..." }}
      />

      {/* Table */}
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Medicamento</TableHead>
                <TableHead>Dosagem</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><LoadingState /></TableCell></TableRow>
              ) : filteredReceituarios?.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState icon={Pill} title="Nenhum receituário encontrado" description="Ajuste os filtros ou aguarde novos registros." size="sm" /></TableCell></TableRow>
              ) : (
                filteredReceituarios?.map((receituario) => (
                  <TableRow key={receituario.id}>
                    <TableCell>
                      <Link
                        to={`/crm/pacientes/${receituario.paciente_id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {receituario.pacientes?.nome || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receituario.medicamento}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receituario.dosagem}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receituario.duracao}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {receituario.data_prescricao
                        ? format(new Date(receituario.data_prescricao), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableRowActions
                        className="justify-end"
                        statusActions={[
                          { icon: ExternalLink, label: "Ver paciente", onClick: () => navigate(`/crm/pacientes/${receituario.paciente_id}`) },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
