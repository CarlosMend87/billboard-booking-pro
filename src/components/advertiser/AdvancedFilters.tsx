import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Filter, Camera, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const BILLBOARD_TYPES = [
  { value: "digital", label: "Espectacular Digital" },
  { value: "espectacular", label: "Espectacular Fijo" },
  { value: "muro", label: "Muro" },
  { value: "valla", label: "Valla" },
  { value: "parabus", label: "Parabús" }
];

const PROXIMIDAD_FILTROS = [
  { value: "restaurantes", label: "Restaurantes" },
  { value: "mcdonalds", label: "McDonald's" },
  { value: "starbucks", label: "Starbucks" },
  { value: "hospitales", label: "Hospitales" },
  { value: "concesionarios", label: "Concesionarios de Autos" },
  { value: "tiendas_conveniencia", label: "Tiendas de Conveniencia" },
  { value: "supermercados", label: "Supermercados" },
  { value: "centros_comerciales", label: "Centros Comerciales" },
  { value: "universidades", label: "Universidades" },
  { value: "bancos", label: "Bancos" },
  { value: "gasolineras", label: "Gasolineras" },
  { value: "farmacias", label: "Farmacias" },
  { value: "gimnasios", label: "Gimnasios" },
  { value: "cines", label: "Cines" }
];

const MODALIDADES = [
  { value: "mensual", label: "Mensual" },
  { value: "catorcenal", label: "Catorcenal" },
  { value: "semanal", label: "Semanal" },
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

  const handleProximityToggle = (proximity: string) => {
    const newProximity = filters.proximityFilters.includes(proximity)
      ? filters.proximityFilters.filter(p => p !== proximity)
      : [...filters.proximityFilters, proximity];
    onFiltersChange({ proximityFilters: newProximity });
  };

  const activeFiltersCount = 
    filters.billboardTypes.length +
    filters.modalidades.length +
    filters.proximityFilters.length +
    (filters.hasComputerVision !== null ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < MAX_PRICE ? 1 : 0);

  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtros Avanzados
          </CardTitle>
          <div className="flex items-center gap-2">
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
        </div>
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="w-fit text-xs">
            {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </CardHeader>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full flex items-center justify-between mb-2 px-6">
            <span className="text-sm text-muted-foreground">
              {isOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
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

        {/* Proximidad a Puntos de Interés */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Proximidad a Puntos de Interés</Label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {PROXIMIDAD_FILTROS.map((proximity) => (
              <div key={proximity.value} className="flex items-center gap-2">
                <Checkbox
                  id={`proximity-${proximity.value}`}
                  checked={filters.proximityFilters.includes(proximity.value)}
                  onCheckedChange={() => handleProximityToggle(proximity.value)}
                />
                <Label
                  htmlFor={`proximity-${proximity.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {proximity.label}
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
