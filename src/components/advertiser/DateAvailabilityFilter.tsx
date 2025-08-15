import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateAvailabilityFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (dateRange: DateRange) => void;
}

export function DateAvailabilityFilter({ dateRange, onDateRangeChange }: DateAvailabilityFilterProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Start new selection
      onDateRangeChange({ startDate: date, endDate: null });
    } else if (dateRange.startDate && !dateRange.endDate) {
      // Complete the range
      if (date >= dateRange.startDate) {
        onDateRangeChange({ ...dateRange, endDate: date });
      } else {
        onDateRangeChange({ startDate: date, endDate: dateRange.startDate });
      }
    }
  };

  const clearDates = () => {
    onDateRangeChange({ startDate: null, endDate: null });
  };

  const hasDateRange = dateRange.startDate && dateRange.endDate;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4" />
        <h3 className="font-medium">Disponibilidad</h3>
        {hasDateRange && (
          <Badge variant="secondary" className="text-xs">
            Rango seleccionado
          </Badge>
        )}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !hasDateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {hasDateRange ? (
              `${format(dateRange.startDate!, "dd MMM", { locale: es })} - ${format(dateRange.endDate!, "dd MMM yyyy", { locale: es })}`
            ) : (
              "Seleccionar fechas"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateRange.startDate || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            initialFocus
            locale={es}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {hasDateRange && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Inicio:</strong> {format(dateRange.startDate!, "PPP", { locale: es })}</div>
            <div><strong>Fin:</strong> {format(dateRange.endDate!, "PPP", { locale: es })}</div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDates}
            className="w-full text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar fechas
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
        <p className="font-medium mb-1">Períodos de contratación:</p>
        <ul className="space-y-1">
          <li>• <strong>Anuncios/Muros:</strong> Mensual</li>
          <li>• <strong>Espectaculares:</strong> Catorcenal</li>
          <li>• <strong>Digital:</strong> Hora/Día/Mes/Spot</li>
        </ul>
      </div>
    </div>
  );
}