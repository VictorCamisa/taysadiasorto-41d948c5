import { History, User, Database, Eye, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminData, AuditLog } from "./hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const ACAO_COLORS: Record<string, string> = {
  INSERT: "bg-green-500/10 text-green-700 dark:text-green-400",
  UPDATE: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  DELETE: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const ACAO_LABELS: Record<string, string> = {
  INSERT: "Inserção",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
};

export function AuditoriaTab() {
  const { auditLogs, loadingAuditLogs, profiles } = useAdminData();
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAcao, setFilterAcao] = useState<string>("all");
  const [filterTabela, setFilterTabela] = useState<string>("all");

  const getUserName = (userId: string | null) => {
    if (!userId) return "Sistema";
    const profile = profiles.find((p) => p.id === userId);
    return profile?.nome || "Usuário desconhecido";
  };

  const uniqueTables = useMemo(() => {
    return [...new Set(auditLogs.map((l) => l.tabela))].sort();
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchQuery === "" ||
        log.tabela.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getUserName(log.user_id).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAcao = filterAcao === "all" || log.acao === filterAcao;
      const matchesTabela = filterTabela === "all" || log.tabela === filterTabela;

      return matchesSearch && matchesAcao && matchesTabela;
    });
  }, [auditLogs, searchQuery, filterAcao, filterTabela, profiles]);

  if (loadingAuditLogs) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const logsByAction = {
    INSERT: auditLogs.filter((l) => l.acao === "INSERT").length,
    UPDATE: auditLogs.filter((l) => l.acao === "UPDATE").length,
    DELETE: auditLogs.filter((l) => l.acao === "DELETE").length,
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inserções</p>
                <p className="text-2xl font-bold">{logsByAction.INSERT}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Database className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atualizações</p>
                <p className="text-2xl font-bold">{logsByAction.UPDATE}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <Database className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exclusões</p>
                <p className="text-2xl font-bold">{logsByAction.DELETE}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas mais afetadas */}
      {uniqueTables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Tabelas Monitoradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {uniqueTables.map((table) => (
                <Badge
                  key={table}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setFilterTabela(table)}
                >
                  {table} ({auditLogs.filter((l) => l.tabela === table).length})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Logs de Auditoria</CardTitle>
              <CardDescription>
                {filteredLogs.length} de {auditLogs.length} registros
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por tabela ou usuário..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterAcao} onValueChange={setFilterAcao}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ações</SelectItem>
                <SelectItem value="INSERT">Inserção</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTabela} onValueChange={setFilterTabela}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas tabelas</SelectItem>
                {uniqueTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={History}
              title={auditLogs.length === 0 ? "Nenhum log registrado" : "Nenhum resultado encontrado"}
              description={
                auditLogs.length === 0
                  ? "Os logs de auditoria aparecerão aqui quando houver operações no banco de dados."
                  : "Tente ajustar os filtros ou termo de busca."
              }
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Tabela</TableHead>
                    <TableHead className="hidden lg:table-cell">IP</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{getUserName(log.user_id)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={ACAO_COLORS[log.acao] || "bg-muted"}
                          variant="secondary"
                        >
                          {ACAO_LABELS[log.acao] || log.acao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {log.tabela}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden lg:table-cell">
                        {log.ip_address || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          disabled={!log.dados_anteriores && !log.dados_novos}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para ver detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              Visualize os dados antes e depois da operação.
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Ação</p>
                  <Badge
                    className={ACAO_COLORS[selectedLog.acao] || "bg-muted"}
                    variant="secondary"
                  >
                    {ACAO_LABELS[selectedLog.acao] || selectedLog.acao}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tabela</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{selectedLog.tabela}</code>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Usuário</p>
                  <p>{getUserName(selectedLog.user_id)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Data/Hora</p>
                  <p>
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {selectedLog.dados_anteriores && (
                <div>
                  <p className="text-sm font-medium mb-2">Dados Anteriores</p>
                  <ScrollArea className="h-40 rounded-md border p-3 bg-muted/50">
                    <pre className="text-xs">
                      {JSON.stringify(selectedLog.dados_anteriores, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.dados_novos && (
                <div>
                  <p className="text-sm font-medium mb-2">Dados Novos</p>
                  <ScrollArea className="h-40 rounded-md border p-3 bg-muted/50">
                    <pre className="text-xs">
                      {JSON.stringify(selectedLog.dados_novos, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
