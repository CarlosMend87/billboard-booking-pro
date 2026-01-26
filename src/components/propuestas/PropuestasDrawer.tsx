import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Trash2, 
  Upload, 
  Calendar, 
  MapPin, 
  Loader2,
  Eye,
  Clock,
  Package
} from "lucide-react";
import { Propuesta } from "@/hooks/usePropuestas";
import { FloatingCartItem } from "@/components/cart/FloatingCart";
import { PropuestaPDFExport } from "./PropuestaPDFExport";
import { PropuestasComparador } from "./PropuestasComparador";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface PropuestasDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propuestas: Propuesta[];
  isLoading: boolean;
  onLoadPropuesta: (items: FloatingCartItem[], dates: { startDate: Date; endDate: Date } | null) => void;
  onDeletePropuesta: (id: string) => Promise<boolean>;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
};

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function PropuestasDrawer({
  open,
  onOpenChange,
  propuestas,
  isLoading,
  onLoadPropuesta,
  onDeletePropuesta,
}: PropuestasDrawerProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    
    setIsDeleting(true);
    await onDeletePropuesta(deleteConfirmId);
    setDeleteConfirmId(null);
    setIsDeleting(false);
  };

  const handleLoad = (propuesta: Propuesta) => {
    const dates = propuesta.active_dates
      ? {
          startDate: new Date(propuesta.active_dates.startDate),
          endDate: new Date(propuesta.active_dates.endDate),
        }
      : null;
    
    onLoadPropuesta(propuesta.items, dates);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Mis Propuestas
            </SheetTitle>
            <SheetDescription>
              Propuestas guardadas para comparar antes de reservar
            </SheetDescription>
          </SheetHeader>

          {/* Comparison button */}
          {propuestas.length >= 2 && (
            <div className="mt-4">
              <PropuestasComparador
                propuestas={propuestas}
                onLoadPropuesta={onLoadPropuesta}
              />
            </div>
          )}

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : propuestas.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No tienes propuestas guardadas
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Guarda tu carrito actual como propuesta para comparar después
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-180px)]">
                <div className="space-y-4 pr-4">
                  {propuestas.map((propuesta) => (
                    <Collapsible
                      key={propuesta.id}
                      open={expandedId === propuesta.id}
                      onOpenChange={(isOpen) => 
                        setExpandedId(isOpen ? propuesta.id : null)
                      }
                    >
                      <div className="border rounded-xl overflow-hidden transition-shadow hover:shadow-md">
                        {/* Header - Always visible */}
                        <CollapsibleTrigger asChild>
                          <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate">
                                  {propuesta.nombre}
                                </h3>
                                {propuesta.descripcion && (
                                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                    {propuesta.descripcion}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="shrink-0">
                                {propuesta.item_count} pantalla{propuesta.item_count !== 1 ? 's' : ''}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatDateTime(propuesta.created_at)}</span>
                              </div>
                              <span className="font-bold text-primary">
                                {formatPrice(propuesta.total_estimado)}
                              </span>
                            </div>

                            <div className="flex items-center justify-center mt-2">
                              <Eye className={cn(
                                "h-4 w-4 transition-transform",
                                expandedId === propuesta.id && "rotate-180"
                              )} />
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        {/* Expanded content */}
                        <CollapsibleContent>
                          <Separator />
                          <div className="p-4 bg-muted/20 space-y-3">
                            {/* Items preview */}
                            <div className="space-y-2">
                              {propuesta.items.slice(0, 3).map((item, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="truncate">{item.nombre}</span>
                                  <span className="text-muted-foreground ml-auto shrink-0">
                                    {formatPrice(item.precio)}
                                  </span>
                                </div>
                              ))}
                              {propuesta.items.length > 3 && (
                                <p className="text-xs text-muted-foreground pl-5">
                                  +{propuesta.items.length - 3} más...
                                </p>
                              )}
                            </div>

                            {/* Dates if available */}
                            {propuesta.active_dates && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(propuesta.active_dates.startDate)} - {formatDate(propuesta.active_dates.endDate)}
                                </span>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                              <PropuestaPDFExport propuesta={propuesta} />
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(propuesta.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoad(propuesta);
                                }}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Cargar
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propuesta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La propuesta será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
