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
import { ClipboardList, ExternalLink, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AnamnesesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: anamneses, isLoading } = useQuery({
    queryKey: ["gestao-anamneses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anamneses")
        .select(`
          *,
          pacientes:paciente_id (id, nome, telefone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const filteredAnamneses = anamneses?.filter((anamnese) => {
    return anamnese.pacientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      anamnese.queixa_principal?.toLowerCase().includes(search.toLowerCase());
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
          title="Anamneses"
          description="Gerencie todas as fichas de anamnese"
        />
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por paciente ou queixa..." }}
      />

      {/* Table */}
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Queixa Principal</TableHead>
                <TableHead>Alergias</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5}><LoadingState /></TableCell></TableRow>
              ) : filteredAnamneses?.length === 0 ? (
                <TableRow><TableCell colSpan={5}><EmptyState icon={ClipboardList} title="Nenhuma anamnese encontrada" description="Ajuste os filtros ou aguarde novos registros." size="sm" /></TableCell></TableRow>
              ) : (
                filteredAnamneses?.map((anamnese) => (
                  <TableRow key={anamnese.id}>
                    <TableCell>
                      <Link
                        to={`/crm/pacientes/${anamnese.paciente_id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {anamnese.pacientes?.nome || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {anamnese.queixa_principal || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {anamnese.alergias || "Nenhuma"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {anamnese.data_anamnese
                        ? format(new Date(anamnese.data_anamnese), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableRowActions
                        className="justify-end"
                        statusActions={[
                          { icon: ExternalLink, label: "Ver paciente", onClick: () => navigate(`/crm/pacientes/${anamnese.paciente_id}`) },
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
