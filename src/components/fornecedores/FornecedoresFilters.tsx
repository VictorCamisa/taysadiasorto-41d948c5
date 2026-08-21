import { FilterBar } from "@/components/ui/FilterBar";

interface FornecedoresFiltersProps {
  search: string;
  setSearch: (value: string) => void;
}

export const FornecedoresFilters = ({ search, setSearch }: FornecedoresFiltersProps) => {
  return (
    <FilterBar
      search={{
        value: search,
        onChange: setSearch,
        placeholder: "Buscar por nome ou CPF/CNPJ...",
      }}
    />
  );
};
