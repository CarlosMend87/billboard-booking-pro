import { Calendar } from "@/components/ui/calendar";
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            !hasDateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {hasDateRange ? (
            <>
              Fechas
              <Badge variant="secondary" className="ml-1">
                {format(dateRange.startDate!, "dd MMM", { locale: es })} - {format(dateRange.endDate!, "dd MMM", { locale: es })}
              </Badge>
            </>
          ) : (
            "Fechas"
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-3">
          <Calendar
            mode="single"
            selected={dateRange.startDate || undefined}
            onSelect={handleDateSelect}
            disabled={(date) => date < new Date()}
            initialFocus
            locale={es}
            className="pointer-events-auto"
          />

          {hasDateRange && (
            <div className="space-y-2 border-t pt-3">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}