import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Check, X, UserPlus, Mail, Phone, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Solicitacao {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  status: string;
  motivo_rejeicao: string | null;
  created_at: string;
}

export function SolicitacoesAcessoSection() {
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<Solicitacao | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  const { data: solicitacoes = [], isLoading } = useQuery({
    queryKey: ["solicitacoes_acesso"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_acesso")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Solicitacao[];
    },
  });

  const processarSolicitacao = useMutation({
    mutationFn: async ({ solicitacao_id, acao, motivo_rejeicao }: { 
      solicitacao_id: string; 
      acao: "aprovar" | "rejeitar";
      motivo_rejeicao?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("aprovar-usuario", {
        body: { solicitacao_id, acao, motivo_rejeicao },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes_acesso"] });
      queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
      toast.success(
        variables.acao === "aprovar" 
          ? "Usuário aprovado com sucesso!" 
          : "Solicitação rejeitada"
      );
      setRejectDialog(null);
      setMotivoRejeicao("");
    },
    onError: (error: Error) => {
      toast.error("Erro: " + error.message);
    },
  });

  const pendentes = solicitacoes.filter((s) => s.status === "pendente");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Solicitações de Acesso
              </CardTitle>
              <CardDescription>
                {pendentes.length} solicitação(ões) pendente(s)
              </CardDescription>
            </div>
            {pendentes.length > 0 && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                <Clock className="h-3 w-3 mr-1" />
                {pendentes.length} pendente(s)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {solicitacoes.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title="Nenhuma solicitação de acesso"
              description="As solicitações de novos usuários aparecerão aqui para aprovação."
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitacoes.map((solicitacao) => (
                    <TableRow key={solicitacao.id}>
                      <TableCell className="font-medium">{solicitacao.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {solicitacao.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {solicitacao.telefone || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(solicitacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            solicitacao.status === "aprovado"
                              ? "default"
                              : solicitacao.status === "rejeitado"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {solicitacao.status === "aprovado" && <Check className="h-3 w-3 mr-1" />}
                          {solicitacao.status === "rejeitado" && <X className="h-3 w-3 mr-1" />}
                          {solicitacao.status === "pendente" && <Clock className="h-3 w-3 mr-1" />}
                          {solicitacao.status.charAt(0).toUpperCase() + solicitacao.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {solicitacao.status === "pendente" && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              disabled={processarSolicitacao.isPending}
                              onClick={() =>
                                processarSolicitacao.mutate({
                                  solicitacao_id: solicitacao.id,
                                  acao: "aprovar",
                                })
                              }
                            >
                              {processarSolicitacao.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              disabled={processarSolicitacao.isPending}
                              onClick={() => setRejectDialog(solicitacao)}
                            >
                              <X className="h-3 w-3" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                        {solicitacao.status === "rejeitado" && solicitacao.motivo_rejeicao && (
                          <span className="text-xs text-muted-foreground">
                            {solicitacao.motivo_rejeicao}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para rejeitar */}
      <Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {rejectDialog?.nome}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição</Label>
              <Textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: Usuário não autorizado, email inválido, etc."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialog(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={processarSolicitacao.isPending}
                onClick={() =>
                  rejectDialog &&
                  processarSolicitacao.mutate({
                    solicitacao_id: rejectDialog.id,
                    acao: "rejeitar",
                    motivo_rejeicao: motivoRejeicao,
                  })
                }
              >
                {processarSolicitacao.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Rejeitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
