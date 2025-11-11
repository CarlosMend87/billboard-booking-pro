import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption = 
  | "nombre-asc" 
  | "nombre-desc" 
  | "precio-asc" 
  | "precio-desc"
  | "detecciones-desc"
  | "detecciones-asc";

interface SortOptionsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortOptions({ value, onChange }: SortOptionsProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Ordenar por..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nombre-asc">Nombre (A-Z)</SelectItem>
          <SelectItem value="nombre-desc">Nombre (Z-A)</SelectItem>
          <SelectItem value="precio-asc">Precio (Menor a Mayor)</SelectItem>
          <SelectItem value="precio-desc">Precio (Mayor a Menor)</SelectItem>
          <SelectItem value="detecciones-desc">Más Impacto (Audiencia)</SelectItem>
          <SelectItem value="detecciones-asc">Menos Impacto (Audiencia)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
