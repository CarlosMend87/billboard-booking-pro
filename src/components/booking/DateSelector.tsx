import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CheckCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { BookingDates } from "@/types/booking";

interface DateSelectorProps {
  selectedDates: BookingDates | null;
  onDatesChange: (dates: BookingDates | null) => void;
}

export function DateSelector({ selectedDates, onDatesChange }: DateSelectorProps) {
  const [from, setFrom] = useState<Date>();
  const [to, setTo] = useState<Date>();

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from) {
      setFrom(range.from);
      if (range.to) {
        setTo(range.to);
        onDatesChange({
          startDate: range.from,
          endDate: range.to
        });
      } else {
        setTo(undefined);
        onDatesChange(null);
      }
    } else {
      setFrom(undefined);
      setTo(undefined);
      onDatesChange(null);
    }
  };

  const campaignDays = selectedDates 
    ? differenceInDays(selectedDates.endDate, selectedDates.startDate) + 1
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Fechas de Campaña
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="range"
          selected={{ from, to }}
          onSelect={handleSelect}
          disabled={(date) => date < new Date()}
          initialFocus
          locale={es}
          className="rounded-md border pointer-events-auto"
        />
        
        {selectedDates && (
          <div className="space-y-3 p-4 bg-accent/50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-status-confirmed" />
              <span className="font-medium">Fechas Seleccionadas</span>
            </div>
            
            <div className="text-sm space-y-1">
              <div>
                <strong>Inicio:</strong> {format(selectedDates.startDate, 'PPP', { locale: es })}
              </div>
              <div>
                <strong>Fin:</strong> {format(selectedDates.endDate, 'PPP', { locale: es })}
              </div>
            </div>
            
            <Badge variant="secondary" className="w-fit">
              {campaignDays} {campaignDays === 1 ? 'día' : 'días'} de campaña
            </Badge>
          </div>
        )}
        
        {!selectedDates && (
          <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
            Selecciona la fecha de inicio y fin de tu campaña publicitaria
          </div>
        )}
      </CardContent>
    </Card>
  );
}