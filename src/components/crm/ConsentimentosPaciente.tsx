import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lock, CheckCircle, XCircle, FileText, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConsentimentosPacienteProps {
  pacienteId: string;
}

interface Termo {
  id: string;
  titulo: string;
  tipo: string;
  conteudo: string;
  versao: string;
}

interface Consentimento {
  id: string;
  termo_id: string;
  aceito: boolean;
  data_aceite: string | null;
  data_revogacao: string | null;
  termo: Termo;
}

const TERMO_TIPO_LABELS: Record<string, string> = {
  privacidade: "Privacidade",
  consentimento: "Consentimento",
  tratamento_dados: "Tratamento de Dados",
};

export function ConsentimentosPaciente({ pacienteId }: ConsentimentosPacienteProps) {
  const queryClient = useQueryClient();
  const [selectedTermo, setSelectedTermo] = useState<Termo | null>(null);
  const [aceito, setAceito] = useState(false);
  const [revogandoId, setRevogandoId] = useState<string | null>(null);

  // Buscar termos vigentes
  const { data: termosVigentes = [] } = useQuery({
    queryKey: ["lgpd_termos_vigentes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_termos")
        .select("*")
        .eq("vigente", true)
        .order("titulo");
      if (error) throw error;
      return data as Termo[];
    },
  });

  // Buscar consentimentos do paciente
  const { data: consentimentos = [], isLoading } = useQuery({
    queryKey: ["lgpd_consentimentos_paciente", pacienteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lgpd_consentimentos")
        .select(`
          *,
          termo:lgpd_termos(id, titulo, tipo, conteudo, versao)
        `)
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Consentimento[];
    },
  });

  // Registrar consentimento
  const registrarConsentimento = useMutation({
    mutationFn: async ({ termoId, aceito }: { termoId: string; aceito: boolean }) => {
      const { error } = await supabase.from("lgpd_consentimentos").insert({
        paciente_id: pacienteId,
        termo_id: termoId,
        aceito,
        data_aceite: aceito ? new Date().toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd_consentimentos_paciente", pacienteId] });
      toast.success("Consentimento registrado com sucesso");
      setSelectedTermo(null);
      setAceito(false);
    },
    onError: () => {
      toast.error("Erro ao registrar consentimento");
    },
  });

  // Revogar consentimento
  const revogarConsentimento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lgpd_consentimentos")
        .update({ data_revogacao: new Date().toISOString(), aceito: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lgpd_consentimentos_paciente", pacienteId] });
      toast.success("Consentimento revogado");
    },
    onError: () => {
      toast.error("Erro ao revogar consentimento");
    },
  });

  // Verificar quais termos o paciente já consentiu
  const getTermoStatus = (termoId: string) => {
    const cons = consentimentos.find(
      (c) => c.termo_id === termoId && c.aceito && !c.data_revogacao
    );
    return cons;
  };

  const termosPendentes = termosVigentes.filter((t) => !getTermoStatus(t.id));
  const termosAceitos = consentimentos.filter((c) => c.aceito && !c.data_revogacao);
  const termosRevogados = consentimentos.filter((c) => c.data_revogacao);

  const handleRegistrar = () => {
    if (!selectedTermo) return;
    registrarConsentimento.mutate({ termoId: selectedTermo.id, aceito });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Consentimentos LGPD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">{termosAceitos.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Aceitos</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{termosPendentes.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">{termosRevogados.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Revogados</p>
          </div>
        </div>

        {/* Termos Pendentes */}
        {termosPendentes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Termos Pendentes</h4>
            {termosPendentes.map((termo) => (
              <div
                key={termo.id}
                className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-medium">{termo.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {TERMO_TIPO_LABELS[termo.tipo]} • v{termo.versao}
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setSelectedTermo(termo)}>
                  Registrar
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Termos Aceitos */}
        {termosAceitos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Termos Aceitos</h4>
            {termosAceitos.map((cons) => (
              <div
                key={cons.id}
                className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{cons.termo?.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      Aceito em{" "}
                      {cons.data_aceite &&
                        format(new Date(cons.data_aceite), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRevogandoId(cons.id)}
                >
                  Revogar
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Histórico de Revogações */}
        {termosRevogados.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Histórico de Revogações</h4>
            {termosRevogados.map((cons) => (
              <div
                key={cons.id}
                className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30"
              >
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">{cons.termo?.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Revogado em{" "}
                    {cons.data_revogacao &&
                      format(new Date(cons.data_revogacao), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog para registrar consentimento */}
        <Dialog open={!!selectedTermo} onOpenChange={() => setSelectedTermo(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTermo?.titulo}</DialogTitle>
              <DialogDescription>
                {TERMO_TIPO_LABELS[selectedTermo?.tipo || ""]} • Versão {selectedTermo?.versao}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[400px] rounded-md border p-4">
              <div className="whitespace-pre-wrap text-sm">{selectedTermo?.conteudo}</div>
            </ScrollArea>
            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="aceite"
                checked={aceito}
                onCheckedChange={(checked) => setAceito(checked === true)}
              />
              <Label htmlFor="aceite" className="text-sm">
                Li e concordo com os termos acima
              </Label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTermo(null)}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrar} disabled={!aceito}>
                Registrar Consentimento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!revogandoId}
          onOpenChange={(open) => !open && setRevogandoId(null)}
          title="Revogar consentimento"
          description="Deseja revogar este consentimento? O paciente precisará aceitar o termo novamente."
          confirmLabel="Revogar"
          variant="destructive"
          onConfirm={() => {
            if (revogandoId) revogarConsentimento.mutate(revogandoId);
            setRevogandoId(null);
          }}
        />
      </CardContent>
    </Card>
  );
}
