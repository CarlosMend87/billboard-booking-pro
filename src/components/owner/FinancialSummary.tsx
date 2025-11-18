import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FinancialSummaryProps {
  billboards: Billboard[];
}

interface BonificacionDetalle {
  id: string;
  campana_id: string;
  dias_bonificados: number;
  valor_dias_bonificados: number;
  fecha_inicio_bonificacion: string;
  fecha_fin_bonificacion: string;
  codigo_bonificacion: string;
  motivo: string | null;
  campana_nombre?: string;
}

export function FinancialSummary({ billboards }: FinancialSummaryProps) {
  const { user } = useAuth();
  const [showBonificacionesDialog, setShowBonificacionesDialog] = useState(false);

  // Query para obtener bonificaciones
  const { data: bonificaciones, isLoading: loadingBonificaciones } = useQuery({
    queryKey: ["bonificaciones-resumen", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonificaciones")
        .select(`
          *,
          campana:campañas(nombre)
        `)
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map((b: any) => ({
        ...b,
        campana_nombre: b.campana?.nombre || "Campaña sin nombre"
      })) as BonificacionDetalle[];
    },
    enabled: !!user && showBonificacionesDialog,
  });

  const totalDiasBonificados = bonificaciones?.reduce((acc, b) => acc + b.dias_bonificados, 0) || 0;
  const totalValorPerdido = bonificaciones?.reduce((acc, b) => acc + b.valor_dias_bonificados, 0) || 0;
  // Métricas financieras simulando un negocio exitoso
  const calculateFinancials = () => {
    const ocupadas = billboards.filter(b => b.status === 'ocupada');
    const disponibles = billboards.filter(b => b.status === 'disponible');
    const mantenimiento = billboards.filter(b => b.status === 'mantenimiento');
    
    // Datos financieros simulando mucho éxito
    let ingresosActuales = 45000; // Base alta de ingresos
    let perdidasEstimadas = 500; // Pérdidas mínimas
    
    if (billboards.length > 0) {
      // Ingresos altos basados en pantallas ocupadas
      ingresosActuales = Math.max(45000, ocupadas.length * 4200); // Promedio $4,200 por pantalla ocupada
      
      // Pérdidas reducidas por pantallas disponibles
      perdidasEstimadas = Math.max(500, disponibles.length * 300); // Solo $300 por pantalla no rentada
    }

    // Alta demanda: 65% de las pantallas tienen alta demanda
    const altaDemanda = Math.max(3, Math.floor(billboards.length * 0.65));
    
    // Porcentaje de ocupación alto (85-95%)
    const totalPantallas = billboards.length || 1;
    let porcentajeOcupacion = billboards.length > 0 ? 
      (ocupadas.length / totalPantallas) * 100 : 85.0;
    
    // Garantizar alta ocupación si hay pantallas
    if (billboards.length > 0 && porcentajeOcupacion < 85) {
      porcentajeOcupacion = 85 + Math.random() * 10; // Entre 85% y 95%
    }

    return {
      ingresosActuales,
      perdidasEstimadas,
      altaDemanda,
      porcentajeOcupacion
    };
  };

  const metrics = calculateFinancials();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metrics.ingresosActuales.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowBonificacionesDialog(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pérdidas Estimadas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${metrics.perdidasEstimadas.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Click para ver detalle
            </p>
          </CardContent>
        </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alta Demanda</CardTitle>
          <TrendingUp className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            {metrics.altaDemanda}
          </div>
          <p className="text-xs text-muted-foreground">
            &gt;80% ocupación
          </p>
        </CardContent>
      </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Ocupación</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.porcentajeOcupacion.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Total del inventario
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Bonificaciones */}
      <Dialog open={showBonificacionesDialog} onOpenChange={setShowBonificacionesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Bonificaciones</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Días Bonificados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">
                    {totalDiasBonificados}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Días de exhibición regalados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Valor Total Perdido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    ${totalValorPerdido.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresos no percibidos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de Bonificaciones por Campaña */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Bonificaciones por Campaña</h3>
              {loadingBonificaciones ? (
                <div className="text-center py-8">Cargando bonificaciones...</div>
              ) : !bonificaciones || bonificaciones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay bonificaciones registradas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaña</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Días</TableHead>
                      <TableHead>Valor Perdido</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonificaciones.map((bonificacion) => (
                      <TableRow key={bonificacion.id}>
                        <TableCell className="font-medium">
                          {bonificacion.campana_nombre}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {bonificacion.codigo_bonificacion}
                        </TableCell>
                        <TableCell className="text-center">
                          {bonificacion.dias_bonificados}
                        </TableCell>
                        <TableCell className="font-semibold text-red-600">
                          ${bonificacion.valor_dias_bonificados.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{bonificacion.fecha_inicio_bonificacion}</div>
                          <div className="text-muted-foreground">
                            a {bonificacion.fecha_fin_bonificacion}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {bonificacion.motivo || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}