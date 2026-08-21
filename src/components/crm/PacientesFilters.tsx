import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterBar } from "@/components/ui/FilterBar";

interface PacientesFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
}

export function PacientesFilters({
  search,
  setSearch,
  status,
  setStatus,
}: PacientesFiltersProps) {
  return (
    <FilterBar
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Buscar por nome, CPF, email ou telefone...",
      }}
      filters={
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
      }
    />
  );
}
