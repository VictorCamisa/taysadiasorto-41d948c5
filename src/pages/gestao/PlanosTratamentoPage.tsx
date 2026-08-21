import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { FilterBar } from "@/components/ui/FilterBar";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { FileText, ExternalLink, Download, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PlanosTratamentoPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: planos, isLoading } = useQuery({
    queryKey: ["gestao-planos-tratamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos_tratamento")
        .select(`
          *,
          pacientes:paciente_id (id, nome, telefone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const filteredPlanos = planos?.filter((plano) => {
    const matchesSearch =
      plano.pacientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      plano.titulo?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || plano.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pendente: { label: "Pendente", variant: "secondary" },
    aprovado: { label: "Aprovado", variant: "default" },
    recusado: { label: "Recusado", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/gestao">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <PageHeader
          title="Planos de Tratamento"
          description="Gerencie todos os planos e propostas de tratamento"
        />
      </div>

      <FilterBar
        search={{ value: search, onChange: setSearch, placeholder: "Buscar por paciente ou título..." }}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="recusado">Recusado</SelectItem>
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
                <TableHead>Título</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><LoadingState /></TableCell></TableRow>
              ) : filteredPlanos?.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState icon={FileText} title="Nenhum plano encontrado" description="Ajuste os filtros ou aguarde novos registros." size="sm" /></TableCell></TableRow>
              ) : (
                filteredPlanos?.map((plano) => (
                  <TableRow key={plano.id}>
                    <TableCell>
                      <Link
                        to={`/crm/pacientes/${plano.paciente_id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {plano.pacientes?.nome || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plano.titulo || "Plano de Tratamento"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(plano.valor_total || 0)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[plano.status]?.variant || "secondary"}>
                        {statusConfig[plano.status]?.label || plano.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plano.created_at
                        ? format(new Date(plano.created_at), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableRowActions
                        className="justify-end"
                        statusActions={[
                          { icon: ExternalLink, label: "Ver paciente", onClick: () => navigate(`/crm/pacientes/${plano.paciente_id}`) },
                          ...(plano.pdf_url
                            ? [{ icon: Download, label: "Baixar", onClick: () => window.open(plano.pdf_url, "_blank", "noopener,noreferrer") }]
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
