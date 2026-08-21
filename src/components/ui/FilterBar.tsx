import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
  };
  /** Additional filter controls (Select, Checkbox, etc.) composed by the caller. */
  filters?: React.ReactNode;
  className?: string;
}

/**
 * Layout shell for a page's filter row — it owns no state, callers keep their
 * own `useState`/query-param logic and just render inside it instead of a
 * bespoke div per page.
 */
export function FilterBar({ search, filters, className }: FilterBarProps) {
  return (
    <div className={cn("surface-card p-4 flex flex-col sm:flex-row sm:items-end gap-3", className)}>
      {search && (
        <div className="flex-1 min-w-0 sm:max-w-sm space-y-1.5">
          {search.label && <Label>{search.label}</Label>}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder}
              className="pl-9"
            />
          </div>
        </div>
      )}
      {filters && <div className="flex flex-col sm:flex-row flex-wrap gap-3">{filters}</div>}
    </div>
  );
}
