import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeftRight,
  MapPin,
  Calendar,
  TrendingUp,
  DollarSign,
  Monitor,
  ChevronRight,
  X,
} from "lucide-react";
import { Propuesta } from "@/hooks/usePropuestas";
import { PropuestaPDFExport } from "./PropuestaPDFExport";
import { FloatingCartItem } from "@/components/cart/FloatingCart";
import { cn } from "@/lib/utils";

interface PropuestasComparadorProps {
  propuestas: Propuesta[];
  onLoadPropuesta: (items: FloatingCartItem[], dates: { startDate: Date; endDate: Date } | null) => void;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(price);

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
};

export function PropuestasComparador({ propuestas, onLoadPropuesta }: PropuestasComparadorProps) {
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedPropuestas = propuestas.filter((p) => selectedIds.includes(p.id));

  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      }
      if (prev.length >= 4) {
        return prev; // Max 4 selections
      }
      return [...prev, id];
    });
  };

  const handleStartComparison = () => {
    if (selectedIds.length >= 2) {
      setSelectionOpen(false);
      setComparisonOpen(true);
    }
  };

  const handleLoadPropuesta = (propuesta: Propuesta) => {
    const dates = propuesta.active_dates
      ? {
          startDate: new Date(propuesta.active_dates.startDate),
          endDate: new Date(propuesta.active_dates.endDate),
        }
      : null;
    onLoadPropuesta(propuesta.items, dates);
    setComparisonOpen(false);
  };

  // Calculate comparison metrics
  const getMetrics = (propuesta: Propuesta) => {
    const totalImpacts = propuesta.items.reduce((sum, item) => sum + ((item as any).impactos || 0), 0);
    const avgPrice = propuesta.total_estimado / (propuesta.item_count || 1);
    const cpm = totalImpacts > 0 ? (propuesta.total_estimado / totalImpacts) * 1000 : 0;
    return { totalImpacts, avgPrice, cpm };
  };

  // Find best values for highlighting
  const getBestValues = () => {
    if (selectedPropuestas.length === 0) return { lowestPrice: "", highestImpacts: "", lowestCPM: "" };
    
    let lowestPrice = selectedPropuestas[0].id;
    let highestImpacts = selectedPropuestas[0].id;
    let lowestCPM = selectedPropuestas[0].id;
    
    selectedPropuestas.forEach((p) => {
      const metrics = getMetrics(p);
      const currentLowestMetrics = getMetrics(selectedPropuestas.find((sp) => sp.id === lowestPrice)!);
      const currentHighestMetrics = getMetrics(selectedPropuestas.find((sp) => sp.id === highestImpacts)!);
      const currentLowestCPMMetrics = getMetrics(selectedPropuestas.find((sp) => sp.id === lowestCPM)!);
      
      if (p.total_estimado < currentLowestMetrics.totalImpacts) lowestPrice = p.id;
      if (metrics.totalImpacts > currentHighestMetrics.totalImpacts) highestImpacts = p.id;
      if (metrics.cpm > 0 && (currentLowestCPMMetrics.cpm === 0 || metrics.cpm < currentLowestCPMMetrics.cpm)) lowestCPM = p.id;
    });
    
    return { lowestPrice, highestImpacts, lowestCPM };
  };

  if (propuestas.length < 2) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSelectionOpen(true)}
        className="gap-2"
      >
        <ArrowLeftRight className="h-4 w-4" />
        Comparar
      </Button>

      {/* Selection Dialog */}
      <Dialog open={selectionOpen} onOpenChange={setSelectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Comparar Propuestas
            </DialogTitle>
            <DialogDescription>
              Selecciona 2-4 propuestas para comparar lado a lado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {propuestas.map((propuesta) => (
              <div
                key={propuesta.id}
                className={cn(
                  "flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer",
                  selectedIds.includes(propuesta.id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
                onClick={() => handleToggleSelection(propuesta.id)}
              >
                <Checkbox
                  checked={selectedIds.includes(propuesta.id)}
                  disabled={!selectedIds.includes(propuesta.id) && selectedIds.length >= 4}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{propuesta.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {propuesta.item_count} pantallas • {formatPrice(propuesta.total_estimado)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} de 4 seleccionadas
            </p>
            <Button
              onClick={handleStartComparison}
              disabled={selectedIds.length < 2}
            >
              Comparar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comparison Dialog */}
      <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-primary" />
                  Comparación de Propuestas
                </DialogTitle>
                <DialogDescription className="mt-1">
                  Compara las pantallas y métricas de cada propuesta
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="p-6 pt-4">
              {/* Comparison Grid */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${selectedPropuestas.length}, minmax(200px, 1fr))`,
                }}
              >
                {selectedPropuestas.map((propuesta) => {
                  const metrics = getMetrics(propuesta);
                  const bestValues = getBestValues();

                  return (
                    <div
                      key={propuesta.id}
                      className="border rounded-xl overflow-hidden"
                    >
                      {/* Header */}
                      <div className="bg-primary/10 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-lg leading-tight line-clamp-2">
                            {propuesta.nombre}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() =>
                              setSelectedIds((prev) =>
                                prev.filter((id) => id !== propuesta.id)
                              )
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {propuesta.descripcion && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {propuesta.descripcion}
                          </p>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="p-4 space-y-3 border-b bg-muted/20">
                        {/* Total Price */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Total
                          </span>
                          <span
                            className={cn(
                              "font-bold",
                              bestValues.lowestPrice === propuesta.id &&
                                "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {formatPrice(propuesta.total_estimado)}
                          </span>
                        </div>

                        {/* Screens */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Monitor className="h-4 w-4" />
                            Pantallas
                          </span>
                          <Badge variant="secondary">{propuesta.item_count}</Badge>
                        </div>

                        {/* Impacts */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Impactos
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              bestValues.highestImpacts === propuesta.id &&
                                "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {formatNumber(metrics.totalImpacts)}
                          </span>
                        </div>

                        {/* CPM */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">CPM</span>
                          <span
                            className={cn(
                              "font-medium",
                              bestValues.lowestCPM === propuesta.id &&
                                metrics.cpm > 0 &&
                                "text-emerald-600 dark:text-emerald-400"
                            )}
                          >
                            {metrics.cpm > 0 ? `$${metrics.cpm.toFixed(2)}` : "N/A"}
                          </span>
                        </div>

                        {/* Dates */}
                        {propuesta.active_dates && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground pt-1 border-t">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {formatDate(propuesta.active_dates.startDate)} -{" "}
                              {formatDate(propuesta.active_dates.endDate)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Screens List */}
                      <div className="p-4">
                        <h4 className="text-sm font-semibold mb-3">Pantallas</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {propuesta.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/30"
                            >
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.nombre}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.tipo} • {formatPrice(item.precio)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 pt-0 flex gap-2">
                        <PropuestaPDFExport propuesta={propuesta} size="sm" />
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleLoadPropuesta(propuesta)}
                        >
                          Cargar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPropuestas.length < 2 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecciona al menos 2 propuestas para comparar</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
