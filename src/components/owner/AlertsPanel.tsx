import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, TrendingUp, Calendar, DollarSign, Package } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, parseISO, subDays, addDays, format } from "date-fns";

interface AlertsPanelProps {
  billboards: Billboard[];
}

interface SmartAlert {
  tipo: string;
  titulo: string;
  descripcion: string;
  urgencia: "alta" | "media" | "baja";
  icono: typeof AlertTriangle;
  accion?: string;
}

export function AlertsPanel({ billboards }: AlertsPanelProps) {
  const { user } = useAuth();

  // Fetch real reservations data
  const { data: reservations } = useQuery({
    queryKey: ["owner-reservations-alerts", user?.id],
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
          precio_total,
          created_at,
          config
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch campaigns for renewal tracking
  const { data: campaigns } = useQuery({
    queryKey: ["owner-campaigns-alerts", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("campañas")
        .select(`
          id,
          nombre,
          fecha_inicio,
          fecha_fin,
          status,
          reserva_id
        `)
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Generate alerts based on real data
  const alerts = useMemo((): SmartAlert[] => {
    const generatedAlerts: SmartAlert[] = [];
    const today = new Date();

    if (!billboards.length) return generatedAlerts;

    // 1. Pantallas sin reservas recientes (últimos 60 días)
    const recentReservations = reservations?.filter(
      r => r.status === "accepted" && 
      differenceInDays(today, parseISO(r.created_at)) <= 60
    ) || [];

    const billboardsWithRecentReservations = new Set(
      recentReservations.map(r => r.asset_name)
    );

    const billboardsWithoutRecentActivity = billboards.filter(
      b => b.status === "disponible" && !billboardsWithRecentReservations.has(b.nombre)
    );

    billboardsWithoutRecentActivity.slice(0, 3).forEach(billboard => {
      generatedAlerts.push({
        tipo: "sin_renta",
        titulo: "Pantalla sin actividad reciente",
        descripcion: `"${billboard.nombre}" no tiene reservas en los últimos 60 días. Considera ajustar el precio o promocionarla.`,
        urgencia: "alta",
        icono: AlertTriangle,
        accion: "Revisar precio",
      });
    });

    // 2. Contratos próximos a vencer (próximos 15 días)
    const acceptedReservations = reservations?.filter(r => r.status === "accepted") || [];
    const expiringContracts = acceptedReservations.filter(r => {
      const endDate = parseISO(r.fecha_fin);
      const daysUntilEnd = differenceInDays(endDate, today);
      return daysUntilEnd >= 0 && daysUntilEnd <= 15;
    });

    expiringContracts.slice(0, 3).forEach(reservation => {
      const endDate = parseISO(reservation.fecha_fin);
      const daysRemaining = differenceInDays(endDate, today);
      
      generatedAlerts.push({
        tipo: "vencimiento",
        titulo: "Contrato próximo a vencer",
        descripcion: `"${reservation.asset_name}" vence en ${daysRemaining} días (${format(endDate, "dd/MM/yyyy")}). Contacta al anunciante para renovación.`,
        urgencia: daysRemaining <= 5 ? "alta" : "media",
        icono: Calendar,
        accion: "Gestionar renovación",
      });
    });

    // 3. Reservas pendientes de aprobar (más de 24 horas)
    const pendingReservations = reservations?.filter(r => r.status === "pending") || [];
    const oldPendingReservations = pendingReservations.filter(r => {
      const createdAt = parseISO(r.created_at);
      return differenceInDays(today, createdAt) >= 1;
    });

    if (oldPendingReservations.length > 0) {
      generatedAlerts.push({
        tipo: "pendiente",
        titulo: `${oldPendingReservations.length} reserva(s) pendientes`,
        descripcion: `Tienes reservas esperando aprobación por más de 24 horas. Los anunciantes podrían perder interés.`,
        urgencia: "alta",
        icono: Clock,
        accion: "Ver reservas",
      });
    }

    // 4. Oportunidades de ajuste de precio (alta ocupación)
    const highDemandBillboards = billboards.filter(b => {
      const billboardReservations = acceptedReservations.filter(
        r => r.asset_name === b.nombre
      );
      // Si tiene más de 3 reservas en los últimos 90 días, es alta demanda
      const recentOnes = billboardReservations.filter(
        r => differenceInDays(today, parseISO(r.created_at)) <= 90
      );
      return recentOnes.length >= 3;
    });

    highDemandBillboards.slice(0, 2).forEach(billboard => {
      const precio = (billboard.precio as any)?.mensual || 0;
      const sugerido = Math.round(precio * 1.15); // Sugerir 15% más
      
      generatedAlerts.push({
        tipo: "oportunidad",
        titulo: "Oportunidad de ajuste de precio",
        descripcion: `"${billboard.nombre}" tiene alta demanda. Precio actual: $${precio.toLocaleString()}. Considera aumentar a $${sugerido.toLocaleString()}.`,
        urgencia: "baja",
        icono: TrendingUp,
        accion: "Ajustar precio",
      });
    });

    // 5. Pantallas en mantenimiento por mucho tiempo
    const maintenanceBillboards = billboards.filter(b => b.status === "mantenimiento");
    maintenanceBillboards.slice(0, 2).forEach(billboard => {
      generatedAlerts.push({
        tipo: "mantenimiento",
        titulo: "Pantalla en mantenimiento",
        descripcion: `"${billboard.nombre}" está marcada como en mantenimiento. Recuerda actualizarla cuando esté disponible.`,
        urgencia: "media",
        icono: Package,
        accion: "Revisar estado",
      });
    });

    // 6. Ingresos potenciales perdidos (pantallas disponibles de alto valor)
    const availableHighValueBillboards = billboards
      .filter(b => b.status === "disponible")
      .filter(b => {
        const precio = (b.precio as any)?.mensual || 0;
        return precio > 10000; // Pantallas de más de $10k mensuales
      })
      .slice(0, 2);

    if (availableHighValueBillboards.length > 0) {
      const totalPotential = availableHighValueBillboards.reduce((sum, b) => {
        return sum + ((b.precio as any)?.mensual || 0);
      }, 0);

      generatedAlerts.push({
        tipo: "ingresos",
        titulo: "Ingresos potenciales",
        descripcion: `${availableHighValueBillboards.length} pantalla(s) de alto valor disponibles. Potencial mensual: $${totalPotential.toLocaleString()}.`,
        urgencia: "baja",
        icono: DollarSign,
        accion: "Promocionar",
      });
    }

    return generatedAlerts;
  }, [billboards, reservations, campaigns]);

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case "alta":
        return "destructive";
      case "media":
        return "default";
      case "baja":
        return "secondary";
      default:
        return "default";
    }
  };

  const getUrgencyBgColor = (urgencia: string) => {
    switch (urgencia) {
      case "alta":
        return "border-destructive/50 bg-destructive/5";
      case "media":
        return "border-yellow-500/50 bg-yellow-500/5";
      case "baja":
        return "border-muted bg-muted/30";
      default:
        return "";
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas Inteligentes
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              ¡Excelente! No hay alertas pendientes
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Tu inventario está funcionando de manera óptima
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => {
              const IconComponent = alert.icono;
              return (
                <Alert key={index} className={getUrgencyBgColor(alert.urgencia)}>
                  <IconComponent className="h-4 w-4" />
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.titulo}</h4>
                      <AlertDescription className="text-sm">
                        {alert.descripcion}
                      </AlertDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getUrgencyColor(alert.urgencia)}>
                        {alert.urgencia}
                      </Badge>
                    </div>
                  </div>
                </Alert>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
