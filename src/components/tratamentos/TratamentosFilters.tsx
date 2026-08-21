import { FilterBar } from "@/components/ui/FilterBar";

interface TratamentosFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export const TratamentosFilters = ({ search, onSearchChange }: TratamentosFiltersProps) => {
  return (
    <FilterBar
      search={{ value: search, onChange: onSearchChange, placeholder: "Buscar tratamento..." }}
    />
  );
};
