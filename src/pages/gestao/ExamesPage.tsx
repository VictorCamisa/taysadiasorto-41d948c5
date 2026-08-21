import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/ui/FilterBar";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { FlaskConical, ExternalLink, Download, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ExamesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("all");

  const { data: exames, isLoading } = useQuery({
    queryKey: ["gestao-exames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exames_paciente")
        .select(`
          *,
          pacientes:paciente_id (id, nome, telefone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const tipos = [...new Set(exames?.map((e) => e.tipo) || [])];

  const filteredExames = exames?.filter((exame) => {
    const matchesSearch =
      exame.pacientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      exame.nome?.toLowerCase().includes(search.toLowerCase());
    const matchesTipo = tipoFilter === "all" || exame.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
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
          title="Exames"
          description="Gerencie todos os exames laboratoriais"
        />
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por paciente ou exame..." }}
        filters={
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {tipos.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>
                  {tipo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Table */}
      <Card className="bg-card/60 border-border/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Exame</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Laboratório</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><LoadingState /></TableCell></TableRow>
              ) : filteredExames?.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState icon={FlaskConical} title="Nenhum exame encontrado" description="Ajuste os filtros ou aguarde novos registros." size="sm" /></TableCell></TableRow>
              ) : (
                filteredExames?.map((exame) => (
                  <TableRow key={exame.id}>
                    <TableCell>
                      <Link
                        to={`/crm/pacientes/${exame.paciente_id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {exame.pacientes?.nome || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {exame.nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{exame.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {exame.laboratorio || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {exame.data_exame
                        ? format(new Date(exame.data_exame), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableRowActions
                        className="justify-end"
                        statusActions={[
                          { icon: ExternalLink, label: "Ver paciente", onClick: () => navigate(`/crm/pacientes/${exame.paciente_id}`) },
                          ...(exame.arquivo_url
                            ? [{ icon: Download, label: "Baixar", onClick: () => window.open(exame.arquivo_url, "_blank", "noopener,noreferrer") }]
                            : []),
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
