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
import { FileSignature, ExternalLink, Download, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ContratosPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: contratos, isLoading } = useQuery({
    queryKey: ["gestao-contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos_paciente")
        .select(`
          *,
          pacientes:paciente_id (id, nome, telefone)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const filteredContratos = contratos?.filter((contrato) => {
    const matchesSearch =
      contrato.pacientes?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      contrato.titulo?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || contrato.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pendente: { label: "Pendente", variant: "secondary" },
    assinado: { label: "Assinado", variant: "default" },
    cancelado: { label: "Cancelado", variant: "destructive" },
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
          title="Contratos"
          description="Gerencie todos os contratos e termos de serviço"
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
              <SelectItem value="assinado">Assinado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
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
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Assinatura</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6}><LoadingState /></TableCell></TableRow>
              ) : filteredContratos?.length === 0 ? (
                <TableRow><TableCell colSpan={6}><EmptyState icon={FileSignature} title="Nenhum contrato encontrado" description="Ajuste os filtros ou aguarde novos registros." size="sm" /></TableCell></TableRow>
              ) : (
                filteredContratos?.map((contrato) => (
                  <TableRow key={contrato.id}>
                    <TableCell>
                      <Link
                        to={`/crm/pacientes/${contrato.paciente_id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {contrato.pacientes?.nome || "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contrato.titulo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contrato.tipo}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[contrato.status]?.variant || "secondary"}>
                        {statusConfig[contrato.status]?.label || contrato.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contrato.data_assinatura
                        ? format(new Date(contrato.data_assinatura), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DataTableRowActions
                        className="justify-end"
                        statusActions={[
                          { icon: ExternalLink, label: "Ver paciente", onClick: () => navigate(`/crm/pacientes/${contrato.paciente_id}`) },
                          ...(contrato.arquivo_url
                            ? [{ icon: Download, label: "Baixar", onClick: () => window.open(contrato.arquivo_url, "_blank", "noopener,noreferrer") }]
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
