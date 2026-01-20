import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, AlertCircle, Check } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useBillboardAvailability } from "@/hooks/useBillboardAvailability";

interface DatePickerWithAvailabilityProps {
  billboardId: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onAvailabilityChange?: (isAvailable: boolean) => void;
  className?: string;
}

export function DatePickerWithAvailability({
  billboardId,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onAvailabilityChange,
  className,
}: DatePickerWithAvailabilityProps) {
  const [activeField, setActiveField] = useState<"start" | "end" | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const { 
    loading, 
    checkAvailability, 
    isDateBlocked, 
    getBlockedDateRanges 
  } = useBillboardAvailability(billboardId);

  const blockedRanges = getBlockedDateRanges();

  // Check availability when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const result = checkAvailability(startDate, endDate);

      if (result.isAvailable) {
        const days = differenceInDays(endDate, startDate) + 1;
        setAvailabilityMessage({
          type: "success",
          message: `¡Disponible! ${days} día${days !== 1 ? 's' : ''} seleccionado${days !== 1 ? 's' : ''}`,
        });
        onAvailabilityChange?.(true);
      } else {
        const nextDate = result.nextAvailableDate
          ? format(result.nextAvailableDate, "d 'de' MMMM", { locale: es })
          : null;
        setAvailabilityMessage({
          type: "error",
          message: nextDate
            ? `La pantalla no está disponible en las fechas seleccionadas. Próxima disponibilidad: ${nextDate}`
            : "La pantalla no está disponible en las fechas seleccionadas.",
        });
        onAvailabilityChange?.(false);
      }
    } else if (startDate) {
      const isBlocked = isDateBlocked(startDate);
      if (isBlocked) {
        setAvailabilityMessage({
          type: "warning",
          message: "La fecha de inicio seleccionada tiene reservas activas",
        });
        onAvailabilityChange?.(false);
      } else {
        setAvailabilityMessage({
          type: "warning",
          message: "Selecciona la fecha de fin para verificar disponibilidad",
        });
      }
    } else {
      setAvailabilityMessage(null);
      onAvailabilityChange?.(false);
    }
  }, [startDate, endDate, checkAvailability, isDateBlocked, onAvailabilityChange]);

  // Disable past dates and blocked dates
  const disabledDates = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Disable past dates
    if (date < today) return true;

    // Disable blocked dates
    return isDateBlocked(date);
  };

  // Modifiers for calendar styling
  const modifiers = {
    blocked: blockedRanges.flatMap((range) => {
      const dates: Date[] = [];
      const current = new Date(range.from);
      while (current <= range.to) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }),
  };

  const modifiersStyles = {
    blocked: {
      backgroundColor: "hsl(var(--destructive) / 0.1)",
      color: "hsl(var(--destructive))",
      textDecoration: "line-through",
    },
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Date Selection */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Start Date */}
          <Popover 
            open={activeField === "start"} 
            onOpenChange={(open) => setActiveField(open ? "start" : null)}
          >
            <PopoverTrigger asChild>
              <button className="p-3 text-left border-r border-b border-border hover:bg-muted/50 transition-colors">
                <label className="text-xs font-medium text-muted-foreground block">
                  INICIO
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {startDate 
                      ? format(startDate, "d MMM yyyy", { locale: es })
                      : "Seleccionar"
                    }
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  onStartDateChange(date);
                  setActiveField("end");
                }}
                disabled={disabledDates}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-lg"
              />
              {blockedRanges.length > 0 && (
                <div className="p-2 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" />
                    <span>Fechas no disponibles</span>
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* End Date */}
          <Popover 
            open={activeField === "end"} 
            onOpenChange={(open) => setActiveField(open ? "end" : null)}
          >
            <PopoverTrigger asChild>
              <button className="p-3 text-left border-b border-border hover:bg-muted/50 transition-colors">
                <label className="text-xs font-medium text-muted-foreground block">
                  FIN
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {endDate 
                      ? format(endDate, "d MMM yyyy", { locale: es })
                      : "Seleccionar"
                    }
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  onEndDateChange(date);
                  setActiveField(null);
                }}
                disabled={(date) => {
                  if (disabledDates(date)) return true;
                  if (startDate && date < startDate) return true;
                  return false;
                }}
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
                className="rounded-lg"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Availability Status */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          Verificando disponibilidad...
        </div>
      ) : availabilityMessage ? (
        <Alert 
          variant={availabilityMessage.type === "error" ? "destructive" : "default"}
          className={cn(
            "py-2",
            availabilityMessage.type === "success" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
            availabilityMessage.type === "warning" && "border-amber-500 bg-amber-50 dark:bg-amber-950/20"
          )}
        >
          {availabilityMessage.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : availabilityMessage.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <CalendarIcon className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription className={cn(
            "text-sm",
            availabilityMessage.type === "success" && "text-emerald-700 dark:text-emerald-400",
            availabilityMessage.type === "warning" && "text-amber-700 dark:text-amber-400"
          )}>
            {availabilityMessage.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Legend for blocked dates */}
      {blockedRanges.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            {blockedRanges.length} período{blockedRanges.length !== 1 ? 's' : ''} reservado{blockedRanges.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
}
