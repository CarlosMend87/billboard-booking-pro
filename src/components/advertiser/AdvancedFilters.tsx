import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Filter, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AdvancedFiltersState {
  billboardTypes: string[];
  modalidades: string[];
  priceRange: [number, number];
  hasComputerVision: boolean | null;
}

interface AdvancedFiltersProps {
  filters: AdvancedFiltersState;
  onFiltersChange: (filters: Partial<AdvancedFiltersState>) => void;
  onClearFilters: () => void;
}

const BILLBOARD_TYPES = [
  { value: "digital", label: "Espectacular Digital" },
  { value: "espectacular", label: "Espectacular Fijo" },
  { value: "muro", label: "Muro" },
  { value: "valla", label: "Valla" },
  { value: "parabus", label: "Parabús" }
];

const MODALIDADES = [
  { value: "mensual", label: "Mensual" },
  { value: "catorcenal", label: "Catorcenal" },
  { value: "semanal", label: "Semanal" },
  { value: "spot", label: "Por Spot" },
  { value: "hora", label: "Por Hora" },
  { value: "dia", label: "Por Día" },
  { value: "cpm", label: "CPM" }
];

const MAX_PRICE = 100000;

export function AdvancedFilters({ filters, onFiltersChange, onClearFilters }: AdvancedFiltersProps) {
  const handleTypeToggle = (type: string) => {
    const newTypes = filters.billboardTypes.includes(type)
      ? filters.billboardTypes.filter(t => t !== type)
      : [...filters.billboardTypes, type];
    onFiltersChange({ billboardTypes: newTypes });
  };

  const handleModalidadToggle = (modalidad: string) => {
    const newModalidades = filters.modalidades.includes(modalidad)
      ? filters.modalidades.filter(m => m !== modalidad)
      : [...filters.modalidades, modalidad];
    onFiltersChange({ modalidades: newModalidades });
  };

  const activeFiltersCount = 
    filters.billboardTypes.length +
    filters.modalidades.length +
    (filters.hasComputerVision !== null ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < MAX_PRICE ? 1 : 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros Avanzados
          </CardTitle>
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
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="w-fit text-xs">
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Pantalla */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Tipo de Pantalla</Label>
          <div className="space-y-2">
            {BILLBOARD_TYPES.map((type) => (
              <div key={type.value} className="flex items-center gap-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.billboardTypes.includes(type.value)}
                  onCheckedChange={() => handleTypeToggle(type.value)}
                />
                <Label
                  htmlFor={`type-${type.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

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
              step={1000}
              onValueChange={(value) => onFiltersChange({ priceRange: value as [number, number] })}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>${filters.priceRange[0].toLocaleString()}</span>
              <span>${filters.priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Computer Vision */}
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
      </CardContent>
    </Card>
  );
}
