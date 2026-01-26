import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, GanttChart } from "lucide-react";
import { format, addMonths, subMonths, differenceInDays, eachMonthOfInterval, startOfMonth, endOfMonth, isSameMonth, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CampaignDateVisualizerProps {
  fechaInicio: string;
  fechaFin: string;
  duracionDias?: number;
  duracionLabel?: string;
}

export function CampaignDateVisualizer({ 
  fechaInicio, 
  fechaFin, 
  duracionDias,
  duracionLabel 
}: CampaignDateVisualizerProps) {
  const rangeStart = new Date(fechaInicio);
  const rangeEnd = new Date(fechaFin);
  
  const [calendarMonth, setCalendarMonth] = useState(rangeStart);
  
  // Calculate if range spans multiple months
  const spansMultipleMonths = useMemo(() => {
    return !isSameMonth(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd]);
  
  // Get months in range for timeline
  const monthsInRange = useMemo(() => {
    return eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
  }, [rangeStart, rangeEnd]);
  
  // Calculate timeline segments
  const timelineSegments = useMemo(() => {
    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
    
    return monthsInRange.map((monthDate, index) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Calculate the actual start and end within this month
      const segmentStart = index === 0 ? rangeStart : monthStart;
      const segmentEnd = index === monthsInRange.length - 1 ? rangeEnd : monthEnd;
      
      const daysInSegment = differenceInDays(segmentEnd, segmentStart) + 1;
      const percentage = (daysInSegment / totalDays) * 100;
      
      return {
        month: monthDate,
        label: format(monthDate, "MMM yyyy", { locale: es }),
        percentage,
        daysInSegment,
        isFirst: index === 0,
        isLast: index === monthsInRange.length - 1,
        startDay: format(segmentStart, "d", { locale: es }),
        endDay: format(segmentEnd, "d", { locale: es }),
      };
    });
  }, [monthsInRange, rangeStart, rangeEnd]);
  
  const handlePrevMonth = () => {
    setCalendarMonth(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCalendarMonth(prev => addMonths(prev, 1));
  };
  
  // Check if current month is within range
  const isMonthInRange = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return isWithinInterval(rangeStart, { start: monthStart, end: monthEnd }) ||
           isWithinInterval(rangeEnd, { start: monthStart, end: monthEnd }) ||
           isWithinInterval(monthStart, { start: rangeStart, end: rangeEnd });
  };

  return (
    <div className="space-y-4">
      {/* Date summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-background rounded-lg border">
          <Label className="text-xs text-muted-foreground">Fecha de inicio</Label>
          <p className="font-semibold text-sm mt-1">
            {format(rangeStart, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="p-3 bg-background rounded-lg border">
          <Label className="text-xs text-muted-foreground">Fecha de fin</Label>
          <p className="font-semibold text-sm mt-1">
            {format(rangeEnd, "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
      </div>
      
      {/* Duration badge */}
      {(duracionDias || duracionLabel) && (
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Duración total</span>
            <Badge variant="default" className="font-semibold">
              {duracionLabel || `${duracionDias} día${duracionDias && duracionDias > 1 ? 's' : ''}`}
            </Badge>
          </div>
        </div>
      )}
      
      {/* Visual tabs: Calendar vs Timeline */}
      <Tabs defaultValue={spansMultipleMonths ? "timeline" : "calendar"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <GanttChart className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Calendar view with navigation */}
        <TabsContent value="calendar" className="mt-4">
          <div className="border rounded-lg bg-background overflow-hidden">
            {/* Month navigation header */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium text-sm capitalize">
                {format(calendarMonth, "MMMM yyyy", { locale: es })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Range indicator */}
            {!isMonthInRange(calendarMonth) && (
              <div className="px-4 py-2 text-xs text-muted-foreground text-center bg-muted/20">
                El rango seleccionado no incluye este mes
              </div>
            )}
            
            <Calendar
              mode="range"
              selected={{ from: rangeStart, to: rangeEnd }}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className="pointer-events-none"
              classNames={{
                nav: "hidden", // Hide default nav since we have custom
                day_range_middle: "bg-primary/20 text-foreground",
                day_range_start: "bg-primary text-primary-foreground rounded-l-md",
                day_range_end: "bg-primary text-primary-foreground rounded-r-md",
              }}
            />
            
            {/* Quick navigation to range */}
            {spansMultipleMonths && (
              <div className="flex gap-2 px-4 py-3 border-t bg-muted/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarMonth(rangeStart)}
                  className={cn(
                    "flex-1 text-xs",
                    isSameMonth(calendarMonth, rangeStart) && "bg-primary/10 border-primary"
                  )}
                >
                  Ir a inicio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalendarMonth(rangeEnd)}
                  className={cn(
                    "flex-1 text-xs",
                    isSameMonth(calendarMonth, rangeEnd) && "bg-primary/10 border-primary"
                  )}
                >
                  Ir a fin
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Timeline view */}
        <TabsContent value="timeline" className="mt-4">
          <div className="border rounded-lg bg-background p-4 space-y-4">
            {/* Timeline bar */}
            <div className="relative">
              {/* Progress bar container */}
              <div className="h-10 rounded-lg overflow-hidden flex bg-muted/50">
                {timelineSegments.map((segment, index) => (
                  <div
                    key={segment.label}
                    className={cn(
                      "h-full flex items-center justify-center text-xs font-medium transition-all",
                      "bg-primary/80 text-primary-foreground",
                      segment.isFirst && "rounded-l-lg",
                      segment.isLast && "rounded-r-lg",
                      index > 0 && "border-l border-primary-foreground/20"
                    )}
                    style={{ width: `${segment.percentage}%` }}
                  >
                    {segment.percentage > 15 && (
                      <span className="truncate px-1">{segment.label}</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Start/End markers */}
              <div className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                {format(rangeStart, "d MMM", { locale: es })}
              </div>
              <div className="absolute -bottom-6 right-0 text-xs text-muted-foreground">
                {format(rangeEnd, "d MMM", { locale: es })}
              </div>
            </div>
            
            {/* Month breakdown */}
            <div className="pt-6 space-y-2">
              <Label className="text-xs text-muted-foreground">Desglose por mes</Label>
              <div className="grid gap-2">
                {timelineSegments.map((segment) => (
                  <div
                    key={segment.label}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-primary" />
                      <span className="font-medium capitalize">{segment.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>
                        {segment.isFirst && segment.isLast
                          ? `Días ${segment.startDay} - ${segment.endDay}`
                          : segment.isFirst
                          ? `Desde día ${segment.startDay}`
                          : segment.isLast
                          ? `Hasta día ${segment.endDay}`
                          : "Mes completo"
                        }
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {segment.daysInSegment} días
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}