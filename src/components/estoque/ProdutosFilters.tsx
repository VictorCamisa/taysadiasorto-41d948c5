import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FilterBar } from "@/components/ui/FilterBar";

interface ProdutosFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  categoria: string;
  setCategoria: (value: string) => void;
  fornecedorId: string;
  setFornecedorId: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  somenteEstoqueCritico: boolean;
  setSomenteEstoqueCritico: (value: boolean) => void;
  categorias: string[];
  fornecedores: Array<{ id: string; nome: string }>;
}

export const ProdutosFilters = ({
  search,
  setSearch,
  categoria,
  setCategoria,
  fornecedorId,
  setFornecedorId,
  status,
  setStatus,
  somenteEstoqueCritico,
  setSomenteEstoqueCritico,
  categorias,
  fornecedores,
}: ProdutosFiltersProps) => {
  return (
    <FilterBar
      search={{ value: search, onChange: setSearch, placeholder: "Buscar por nome..." }}
      filters={
        <>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={fornecedorId} onValueChange={setFornecedorId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {fornecedores.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2 h-10">
            <Checkbox
              id="critico"
              checked={somenteEstoqueCritico}
              onCheckedChange={(checked) => setSomenteEstoqueCritico(checked === true)}
            />
            <Label htmlFor="critico" className="text-sm cursor-pointer">
              Estoque Crítico
            </Label>
          </div>
        </>
      }
    />
  );
};
