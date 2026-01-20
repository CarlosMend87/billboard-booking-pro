import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePOI, RADIUS_OPTIONS, POIType } from "@/hooks/usePOI";

export interface POIFilterState {
  poiType: string | null;
  radius: number;
  billboardIds: string[] | null; // null = no filter, [] = no results
}

interface POIProximityFilterProps {
  filter: POIFilterState;
  onFilterChange: (filter: POIFilterState) => void;
  className?: string;
}

export function POIProximityFilter({
  filter,
  onFilterChange,
  className,
}: POIProximityFilterProps) {
  const { poiTypes, loading: loadingTypes, getBillboardsNearPOI } = usePOI();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(filter.poiType);
  const [selectedRadius, setSelectedRadius] = useState<number>(filter.radius);

  // Apply the filter
  const applyFilter = async () => {
    if (!selectedType) {
      onFilterChange({ poiType: null, radius: 1000, billboardIds: null });
      setOpen(false);
      return;
    }

    setSearching(true);
    try {
      const billboardIds = await getBillboardsNearPOI(selectedType, selectedRadius);
      onFilterChange({
        poiType: selectedType,
        radius: selectedRadius,
        billboardIds,
      });
    } catch (err) {
      console.error("Error applying POI filter:", err);
    } finally {
      setSearching(false);
      setOpen(false);
    }
  };

  // Clear filter
  const clearFilter = () => {
    setSelectedType(null);
    setSelectedRadius(1000);
    onFilterChange({ poiType: null, radius: 1000, billboardIds: null });
    setOpen(false);
  };

  // Update local state when filter prop changes
  useEffect(() => {
    setSelectedType(filter.poiType);
    setSelectedRadius(filter.radius);
  }, [filter]);

  const hasActiveFilter = filter.poiType !== null;
  const selectedTypeInfo = poiTypes.find((t) => t.value === filter.poiType);
  const selectedRadiusInfo = RADIUS_OPTIONS.find((r) => r.value === filter.radius);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActiveFilter ? "default" : "outline"}
          size="sm"
          className={cn("gap-2", className)}
        >
          <Navigation className="h-4 w-4" />
          {hasActiveFilter ? (
            <>
              {selectedTypeInfo?.icon} {selectedTypeInfo?.label} ({selectedRadiusInfo?.label})
              <Badge variant="secondary" className="ml-1 bg-white/20">
                {filter.billboardIds?.length || 0}
              </Badge>
            </>
          ) : (
            "Cerca de..."
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Proximidad a Puntos de Interés
            </h4>
            {hasActiveFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilter}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <Separator />

          {/* POI Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Tipo de Lugar</Label>
            {loadingTypes ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : poiTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No hay puntos de interés disponibles
              </p>
            ) : (
              <RadioGroup
                value={selectedType || ""}
                onValueChange={(value) => setSelectedType(value || null)}
                className="space-y-2"
              >
                {poiTypes.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors",
                      selectedType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted"
                    )}
                    onClick={() => setSelectedType(type.value)}
                  >
                    <RadioGroupItem value={type.value} id={type.value} />
                    <span className="text-lg">{type.icon}</span>
                    <Label
                      htmlFor={type.value}
                      className="flex-1 cursor-pointer text-sm font-normal"
                    >
                      {type.label}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {type.count}
                    </Badge>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <Separator />

          {/* Radius Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Radio de Búsqueda</Label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedRadius === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRadius(option.value)}
                  className="flex-1 min-w-[70px]"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Apply Button */}
          <Button
            onClick={applyFilter}
            disabled={searching || !selectedType}
            className="w-full"
          >
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Aplicar Filtro
              </>
            )}
          </Button>

          {filter.billboardIds !== null && filter.billboardIds.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              No hay pantallas cerca de este tipo de lugar
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
