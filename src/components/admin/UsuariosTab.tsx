import { useState, useMemo } from "react";
import { Users, Shield, Mail, Phone, Edit, Check, X, Search, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAdminData, ROLE_LABELS, AppRole, Profile } from "./hooks/useAdminData";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SolicitacoesAcessoSection } from "./SolicitacoesAcessoSection";

export function UsuariosTab() {
  const {
    profiles,
    userRoles,
    loadingProfiles,
    loadingRoles,
    updateProfile,
    addUserRole,
    removeUserRole,
  } = useAdminData();

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [confirmRemoveRole, setConfirmRemoveRole] = useState<{ id: string; label: string } | null>(null);

  const getUserRoles = (userId: string) => {
    return userRoles.filter((r) => r.user_id === userId);
  };

  const filteredProfiles = useMemo(() => {
    return profiles.filter((profile) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        profile.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchQuery.toLowerCase());

      // Role filter
      const userRolesList = getUserRoles(profile.id);
      const matchesRole =
        filterRole === "all" ||
        userRolesList.some((r) => r.role === filterRole);

      // Status filter
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && profile.ativo) ||
        (filterStatus === "inactive" && !profile.ativo);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [profiles, searchQuery, filterRole, filterStatus, userRoles]);

  const handleUpdateProfile = () => {
    if (!editingProfile) return;
    updateProfile.mutate(editingProfile);
    setEditingProfile(null);
  };

  const handleAddRole = () => {
    if (!selectedUserId || !newRole) return;
    addUserRole.mutate({ user_id: selectedUserId, role: newRole as AppRole });
    setNewRole("");
    setSelectedUserId(null);
  };

  const handleRemoveRole = () => {
    if (!confirmRemoveRole) return;
    removeUserRole.mutate(confirmRemoveRole.id);
    setConfirmRemoveRole(null);
  };

  if (loadingProfiles || loadingRoles) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const activeCount = profiles.filter((p) => p.ativo).length;
  const adminCount = userRoles.filter((r) => r.role === "admin").length;
  const medicoCount = userRoles.filter((r) => r.role === "medico").length;

  return (
    <div className="space-y-6">
      {/* Solicitações de Acesso */}
      <SolicitacoesAcessoSection />
      
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Usuários</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Médicos</p>
                <p className="text-2xl font-bold">{medicoCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários do Sistema
              </CardTitle>
              <CardDescription>
                {filteredProfiles.length} de {profiles.length} usuários
              </CardDescription>
            </div>
            <Button disabled className="gap-2">
              <UserPlus className="h-4 w-4" />
              Convidar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filtrar por papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table or Empty State */}
          {filteredProfiles.length === 0 ? (
            <EmptyState
              icon={Users}
              title={profiles.length === 0 ? "Nenhum usuário cadastrado" : "Nenhum resultado encontrado"}
              description={
                profiles.length === 0
                  ? "Os usuários aparecerão aqui quando se cadastrarem no sistema."
                  : "Tente ajustar os filtros ou termo de busca."
              }
            />
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                    <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.nome}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {profile.email || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {profile.telefone || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{profile.cargo || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getUserRoles(profile.id).map((role) => (
                            <Badge
                              key={role.id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive/10 transition-colors"
                              onClick={() =>
                                setConfirmRemoveRole({ id: role.id, label: ROLE_LABELS[role.role] })
                              }
                            >
                              {ROLE_LABELS[role.role]}
                              <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setSelectedUserId(profile.id)}
                          >
                            + Papel
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={profile.ativo ? "default" : "secondary"}>
                          {profile.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProfile(profile)}
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Dialog para adicionar papel */}
      <Dialog open={!!selectedUserId} onOpenChange={() => setSelectedUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Papel</DialogTitle>
            <DialogDescription>
              Selecione o papel que deseja atribuir a este usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Papel</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedUserId(null)}>
                Cancelar
              </Button>
              <Button onClick={handleAddRole} disabled={!newRole}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar perfil */}
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário.
            </DialogDescription>
          </DialogHeader>
          {editingProfile && (
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingProfile.nome}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, nome: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editingProfile.telefone || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, telefone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={editingProfile.cargo || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, cargo: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Especialidade</Label>
                <Input
                  value={editingProfile.especialidade || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, especialidade: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>CRM</Label>
                <Input
                  value={editingProfile.crm || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, crm: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingProfile.ativo}
                  onCheckedChange={(checked) =>
                    setEditingProfile({ ...editingProfile, ativo: checked })
                  }
                />
                <Label>Usuário ativo</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingProfile(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog para remover papel */}
      <ConfirmDialog
        open={!!confirmRemoveRole}
        onOpenChange={() => setConfirmRemoveRole(null)}
        title="Remover Papel"
        description={`Tem certeza que deseja remover o papel "${confirmRemoveRole?.label}" deste usuário?`}
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={handleRemoveRole}
      />
    </div>
  );
}
