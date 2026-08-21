import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTableRowActions } from "@/components/ui/DataTableRowActions";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useAllChecklistItems,
  useChecklistItemsMutations,
  ChecklistItem,
} from "@/components/crm/hooks/usePipelineChecklist";
import { STATUS_LABELS, AgendamentoStatus, PIPELINE_COLUMNS } from "@/components/crm/hooks/useCRMAgendamentos";

interface ChecklistFormData {
  etapa: string;
  titulo: string;
  descricao: string;
  ordem: number;
  obrigatorio: boolean;
  ativo: boolean;
}

const defaultFormData: ChecklistFormData = {
  etapa: "lead",
  titulo: "",
  descricao: "",
  ordem: 0,
  obrigatorio: true,
  ativo: true,
};

export function ChecklistsTab() {
  const { data: items = [], isLoading } = useAllChecklistItems();
  const { createItem, updateItem, deleteItem } = useChecklistItemsMutations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [formData, setFormData] = useState<ChecklistFormData>(defaultFormData);
  const [selectedEtapa, setSelectedEtapa] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredItems = selectedEtapa === "all" 
    ? items 
    : items.filter(item => item.etapa === selectedEtapa);

  const groupedItems = PIPELINE_COLUMNS.reduce((acc, etapa) => {
    acc[etapa] = filteredItems.filter(item => item.etapa === etapa);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormData({
      etapa: item.etapa,
      titulo: item.titulo,
      descricao: item.descricao || "",
      ordem: item.ordem,
      obrigatorio: item.obrigatorio,
      ativo: item.ativo,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }

    try {
      if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id,
          ...formData,
        });
        toast({ title: "Item atualizado com sucesso!" });
      } else {
        await createItem.mutateAsync(formData);
        toast({ title: "Item criado com sucesso!" });
      }
      setIsDialogOpen(false);
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast({ title: "Item excluído com sucesso!" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (item: ChecklistItem) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        ativo: !item.ativo,
      });
      toast({ title: item.ativo ? "Item desativado" : "Item ativado" });
    } catch {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Checklists do Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Configure os itens de checklist para cada etapa do funil
          </p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Label>Filtrar por etapa:</Label>
        <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as etapas</SelectItem>
            {PIPELINE_COLUMNS.map((etapa) => (
              <SelectItem key={etapa} value={etapa}>
                {STATUS_LABELS[etapa]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items by Stage */}
      {selectedEtapa === "all" ? (
        PIPELINE_COLUMNS.map((etapa) => {
          const etapaItems = groupedItems[etapa] || [];
          if (etapaItems.length === 0) return null;
          
          return (
            <Card key={etapa}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {STATUS_LABELS[etapa]}
                  <Badge variant="secondary">{etapaItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChecklistTable
                  items={etapaItems}
                  onEdit={handleOpenEdit}
                  onDelete={setDeletingId}
                  onToggleActive={handleToggleActive}
                />
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {STATUS_LABELS[selectedEtapa as AgendamentoStatus]}
              <Badge variant="secondary">{filteredItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChecklistTable 
              items={filteredItems} 
              onEdit={handleOpenEdit} 
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Novo Item de Checklist"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Etapa do Pipeline</Label>
              <Select 
                value={formData.etapa} 
                onValueChange={(v) => setFormData({ ...formData, etapa: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_COLUMNS.map((etapa) => (
                    <SelectItem key={etapa} value={etapa}>
                      {STATUS_LABELS[etapa]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Contato inicial realizado"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição detalhada do item..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Obrigatório para avançar</Label>
              <Switch
                checked={formData.obrigatorio}
                onCheckedChange={(v) => setFormData({ ...formData, obrigatorio: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch
                checked={formData.ativo}
                onCheckedChange={(v) => setFormData({ ...formData, ativo: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={createItem.isPending || updateItem.isPending}>
              {editingItem ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Excluir item"
        description="Tem certeza que deseja excluir este item de checklist?"
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => deletingId && handleDelete(deletingId)}
      />
    </div>
  );
}

// Sub-component for the table
function ChecklistTable({
  items,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  items: ChecklistItem[];
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (item: ChecklistItem) => void;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Nenhum item de checklist cadastrado"
        description="Adicione o primeiro item para esta etapa."
        size="sm"
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead className="w-24">Obrigatório</TableHead>
          <TableHead className="w-20">Status</TableHead>
          <TableHead className="w-24 text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className={!item.ativo ? "opacity-50" : ""}>
            <TableCell className="text-muted-foreground">{item.ordem}</TableCell>
            <TableCell className="font-medium">{item.titulo}</TableCell>
            <TableCell className="text-muted-foreground max-w-xs truncate">
              {item.descricao || "—"}
            </TableCell>
            <TableCell>
              {item.obrigatorio ? (
                <Badge variant="default" className="bg-primary/10 text-primary">Sim</Badge>
              ) : (
                <Badge variant="secondary">Não</Badge>
              )}
            </TableCell>
            <TableCell>
              <Switch
                checked={item.ativo}
                onCheckedChange={() => onToggleActive(item)}
              />
            </TableCell>
            <TableCell className="text-right">
              <DataTableRowActions
                className="justify-end"
                onEdit={() => onEdit(item)}
                onDelete={() => onDelete(item.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
