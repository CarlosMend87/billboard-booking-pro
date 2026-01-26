import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Camera, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface AdvancedFiltersState {
  billboardTypes: string[];
  modalidades: string[];
  proximityFilters: string[];
  priceRange: [number, number];
  hasComputerVision: boolean | null;
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: Partial<AdvancedFiltersState>) => void;
  onClearFilters: () => void;
}

const MODALIDADES = [
  { value: "mensual", label: "Mensual" },
  { value: "catorcenal", label: "Catorcenal" },
  { value: "semanal", label: "Semanal" },
  { value: "dia", label: "Por Día" },
  { value: "spot", label: "Por Spot" }
];

const MAX_PRICE = 1000000;

export function AdvancedFilters({ filters, onFiltersChange, onClearFilters }: AdvancedFiltersProps) {
  const handleModalidadToggle = (modalidad: string) => {
    const newModalidades = filters.modalidades.includes(modalidad)
      ? filters.modalidades.filter(m => m !== modalidad)
      : [...filters.modalidades, modalidad];
    onFiltersChange({ modalidades: newModalidades });
  };

  const activeFiltersCount = 
    filters.modalidades.length +
    (filters.hasComputerVision !== null ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < MAX_PRICE ? 1 : 0);

  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtros Avanzados
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros Avanzados</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Modalidad de Contratación */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Modalidad de Contratación</Label>
              <div className="space-y-2">
                {MODALIDADES.map((modalidad) => (
                  <div key={modalidad.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`modalidad-${modalidad.value}`}
                      checked={filters.modalidades.includes(modalidad.value)}
                      onCheckedChange={() => handleModalidadToggle(modalidad.value)}
                    />
                    <Label
                      htmlFor={`modalidad-${modalidad.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {modalidad.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Rango de Precio */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Rango de Precio Mensual
              </Label>
              <div className="space-y-2">
                <Slider
                  value={filters.priceRange}
                  min={0}
                  max={MAX_PRICE}
                  step={10000}
                  onValueChange={(value) => onFiltersChange({ priceRange: value as [number, number] })}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>${filters.priceRange[0].toLocaleString()}</span>
                  <span>${filters.priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tecnología de Detección */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Tecnología de Detección</Label>
              <Select
                value={filters.hasComputerVision === null ? "all" : filters.hasComputerVision ? "yes" : "no"}
                onValueChange={(value) => 
                  onFiltersChange({ 
                    hasComputerVision: value === "all" ? null : value === "yes" 
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las pantallas</SelectItem>
                  <SelectItem value="yes">
                    <div className="flex items-center gap-2">
                      <Camera className="h-3 w-3" />
                      Con Computer Vision
                    </div>
                  </SelectItem>
                  <SelectItem value="no">Sin Computer Vision</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
