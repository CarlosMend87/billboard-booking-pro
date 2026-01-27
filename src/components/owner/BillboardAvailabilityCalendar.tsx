import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface BillboardAvailabilityCalendarProps {
  billboards: Billboard[];
}

interface Reservation {
  id: string;
  billboard_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  asset_name: string;
  advertiser: {
    name: string;
    email: string;
  } | null;
}

export function BillboardAvailabilityCalendar({ billboards }: BillboardAvailabilityCalendarProps) {
  const { user } = useAuth();
  const [selectedBillboard, setSelectedBillboard] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch reservations for all owner's billboards
  const { data: reservations, isLoading } = useQuery({
    queryKey: ["owner-reservations-calendar", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("reservas")
        .select(`
          id,
          fecha_inicio,
          fecha_fin,
          status,
          asset_name,
          config,
          advertiser:profiles!advertiser_id (
            name,
            email
          )
        `)
        .eq("owner_id", user.id)
        .in("status", ["accepted", "pending"])
        .order("fecha_inicio", { ascending: true });

      if (error) throw error;

      // Extract billboard_id from config or asset_name
      return (data || []).map((r: any) => ({
        ...r,
        billboard_id: r.config?.billboard_id || null,
      })) as Reservation[];
    },
    enabled: !!user,
  });

  // Get days for the current month view
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Filter reservations by selected billboard
  const filteredReservations = useMemo(() => {
    if (!reservations) return [];
    if (selectedBillboard === "all") return reservations;
    
    return reservations.filter(r => {
      // Match by billboard_id or asset_name
      const billboard = billboards.find(b => b.id === selectedBillboard);
      if (!billboard) return false;
      return r.asset_name === billboard.nombre || r.billboard_id === selectedBillboard;
    });
  }, [reservations, selectedBillboard, billboards]);

  // Check if a day has reservations
  const getReservationsForDay = (day: Date) => {
    return filteredReservations.filter(r => {
      const start = parseISO(r.fecha_inicio);
      const end = parseISO(r.fecha_fin);
      return isWithinInterval(day, { start, end });
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-muted";
    }
  };

  // Calculate occupancy stats
  const occupancyStats = useMemo(() => {
    const daysInMonth = monthDays.length;
    let occupiedDays = 0;
    let pendingDays = 0;

    monthDays.forEach(day => {
      const dayReservations = getReservationsForDay(day);
      if (dayReservations.some(r => r.status === "accepted")) {
        occupiedDays++;
      } else if (dayReservations.some(r => r.status === "pending")) {
        pendingDays++;
      }
    });

    const freeDays = daysInMonth - occupiedDays - pendingDays;
    const occupancyRate = ((occupiedDays / daysInMonth) * 100).toFixed(1);

    return { occupiedDays, pendingDays, freeDays, occupancyRate };
  }, [monthDays, filteredReservations]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendario de Disponibilidad
            </CardTitle>
            <CardDescription>
              Visualiza las reservas confirmadas y periodos libres de tu inventario
            </CardDescription>
          </div>
          
          <Select value={selectedBillboard} onValueChange={setSelectedBillboard}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Seleccionar pantalla" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las pantallas</SelectItem>
              {billboards.map((billboard) => (
                <SelectItem key={billboard.id} value={billboard.id}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {billboard.nombre}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{occupancyStats.occupiedDays}</div>
            <div className="text-xs text-muted-foreground">Días ocupados</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{occupancyStats.pendingDays}</div>
            <div className="text-xs text-muted-foreground">Días pendientes</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">{occupancyStats.freeDays}</div>
            <div className="text-xs text-muted-foreground">Días libres</div>
          </div>
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <div className="text-2xl font-bold text-primary">{occupancyStats.occupancyRate}%</div>
            <div className="text-xs text-muted-foreground">Ocupación</div>
          </div>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando calendario...
          </div>
        ) : (
          <>
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                <div key={day} className="py-2">{day}</div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {monthDays.map((day) => {
                const dayReservations = getReservationsForDay(day);
                const hasAccepted = dayReservations.some(r => r.status === "accepted");
                const hasPending = dayReservations.some(r => r.status === "pending");
                const isFree = dayReservations.length === 0;

                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      aspect-square p-1 rounded-md border text-center relative
                      ${isToday(day) ? "ring-2 ring-primary" : ""}
                      ${hasAccepted ? "bg-green-100 dark:bg-green-900/30 border-green-300" : ""}
                      ${hasPending && !hasAccepted ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300" : ""}
                      ${isFree ? "bg-background border-border hover:bg-muted/50" : ""}
                    `}
                  >
                    <span className={`text-sm ${isToday(day) ? "font-bold" : ""}`}>
                      {format(day, "d")}
                    </span>
                    
                    {dayReservations.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayReservations.slice(0, 3).map((r, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${getStatusColor(r.status)}`}
                            title={`${r.asset_name} - ${r.status}`}
                          />
                        ))}
                        {dayReservations.length > 3 && (
                          <span className="text-[8px] text-muted-foreground">+{dayReservations.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span>Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500" />
            <span>Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-border bg-background" />
            <span>Libre</span>
          </div>
        </div>

        {/* Upcoming Reservations List */}
        {filteredReservations.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Próximas Reservas</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredReservations
                .filter(r => parseISO(r.fecha_fin) >= new Date())
                .slice(0, 5)
                .map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{reservation.asset_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(reservation.fecha_inicio), "dd MMM", { locale: es })} - {format(parseISO(reservation.fecha_fin), "dd MMM yyyy", { locale: es })}
                      </p>
                      {reservation.advertiser && (
                        <p className="text-xs text-muted-foreground">
                          {reservation.advertiser.name}
                        </p>
                      )}
                    </div>
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status === "accepted" ? "Confirmada" : "Pendiente"}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
