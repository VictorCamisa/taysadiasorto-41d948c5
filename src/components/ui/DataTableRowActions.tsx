import { Eye, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RowStatusAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "default" | "success" | "warning" | "destructive";
}

interface DataTableRowActionsProps {
  onView?: () => void;
  viewLabel?: string;
  onEdit?: () => void;
  editLabel?: string;
  /** Domain/status actions (Marcar Pago, Aprovar, Ativar/Desativar, ...) — rendered between Edit and Delete. */
  statusActions?: RowStatusAction[];
  onDelete?: () => void;
  deleteLabel?: string;
  className?: string;
}

const toneClass: Record<NonNullable<RowStatusAction["tone"]>, string> = {
  default: "text-foreground hover:bg-muted",
  success: "text-success hover:bg-success/10",
  warning: "text-warning hover:bg-warning/10",
  destructive: "text-destructive hover:bg-destructive/10",
};

/**
 * Standard row-action order: View -> Edit -> status actions -> Delete.
 * Delete always renders last and should be wired to a ConfirmDialog by the caller.
 */
export function DataTableRowActions({
  onView,
  viewLabel = "Ver",
  onEdit,
  editLabel = "Editar",
  statusActions,
  onDelete,
  deleteLabel = "Excluir",
  className,
}: DataTableRowActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {onView && (
        <Button variant="ghost" size="icon" onClick={onView} title={viewLabel}>
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onEdit && (
        <Button variant="ghost" size="icon" onClick={onEdit} title={editLabel}>
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {statusActions?.map((action) => (
        <Button
          key={action.label}
          variant="ghost"
          size="icon"
          onClick={action.onClick}
          title={action.label}
          className={toneClass[action.tone ?? "default"]}
        >
          <action.icon className="h-4 w-4" />
        </Button>
      ))}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          title={deleteLabel}
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
