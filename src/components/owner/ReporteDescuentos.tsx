import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, Percent } from "lucide-react";

interface ReservaConDescuento {
  id: string;
  asset_name: string;
  fecha_inicio: string;
  fecha_fin: string;
  tarifa_publicada: number | null;
  tarifa_final: number | null;
  descuento_aplicado: number | null;
  codigo_descuento_id: string | null;
  cliente_nombre: string | null;
  cliente_email: string | null;
  status: string;
}

interface CodigoDescuento {
  id: string;
  codigo: string;
  tipo_descuento: string;
  valor_descuento: number;
  anunciante_id: string | null;
}

interface Anunciante {
  id: string;
  nombre: string;
  empresa: string | null;
}

export function ReporteDescuentos() {
  const { user } = useAuth();

  // Fetch reservas con descuentos
  const { data: reservas, isLoading: loadingReservas } = useQuery({
    queryKey: ["reservas-con-descuento", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("*")
        .eq("owner_id", user!.id)
        .not("codigo_descuento_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ReservaConDescuento[];
    },
    enabled: !!user,
  });

  // Fetch códigos de descuento
  const { data: codigos } = useQuery({
    queryKey: ["codigos-descuento-reporte", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("codigos_descuento")
        .select("*")
        .eq("owner_id", user!.id);

      if (error) throw error;
      return data as CodigoDescuento[];
    },
    enabled: !!user,
  });

  // Fetch anunciantes
  const { data: anunciantes } = useQuery({
    queryKey: ["anunciantes-reporte", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anunciantes")
        .select("id, nombre, empresa")
        .eq("owner_id", user!.id);

      if (error) throw error;
      return data as Anunciante[];
    },
    enabled: !!user,
  });

  // Calcular estadísticas por anunciante
  const estadisticasPorAnunciante = () => {
    if (!reservas || !codigos || !anunciantes) return [];

    const stats: Record<string, {
      anunciante: Anunciante | null;
      totalReservas: number;
      totalDescuento: number;
      totalOriginal: number;
      totalFinal: number;
    }> = {};

    // Inicializar con "Sin anunciante"
    stats['sin_anunciante'] = {
      anunciante: null,
      totalReservas: 0,
      totalDescuento: 0,
      totalOriginal: 0,
      totalFinal: 0,
    };

    // Inicializar por anunciante
    anunciantes.forEach(a => {
      stats[a.id] = {
        anunciante: a,
        totalReservas: 0,
        totalDescuento: 0,
        totalOriginal: 0,
        totalFinal: 0,
      };
    });

    reservas.forEach(reserva => {
      const codigo = codigos.find(c => c.id === reserva.codigo_descuento_id);
      const anuncianteId = codigo?.anunciante_id || 'sin_anunciante';
      
      if (!stats[anuncianteId]) {
        stats[anuncianteId] = {
          anunciante: null,
          totalReservas: 0,
          totalDescuento: 0,
          totalOriginal: 0,
          totalFinal: 0,
        };
      }

      stats[anuncianteId].totalReservas += 1;
      stats[anuncianteId].totalOriginal += reserva.tarifa_publicada || 0;
      stats[anuncianteId].totalFinal += reserva.tarifa_final || 0;
      stats[anuncianteId].totalDescuento += reserva.descuento_aplicado || 0;
    });

    return Object.values(stats).filter(s => s.totalReservas > 0);
  };

  const stats = estadisticasPorAnunciante();
  const totalAhorrado = stats.reduce((sum, s) => sum + s.totalDescuento, 0);
  const totalReservas = stats.reduce((sum, s) => sum + s.totalReservas, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const getCodigoInfo = (codigoId: string | null) => {
    if (!codigoId) return null;
    return codigos?.find(c => c.id === codigoId);
  };

  if (loadingReservas) {
    return <div className="text-center py-8 text-muted-foreground">Cargando reporte...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Reporte de Uso de Descuentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Reservas con Descuento</p>
                  <p className="text-2xl font-bold">{totalReservas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Descuentos Otorgados</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAhorrado)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Códigos Activos</p>
                  <p className="text-2xl font-bold">{codigos?.filter(c => c.anunciante_id).length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas por anunciante */}
        {stats.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Ahorro por Anunciante</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anunciante</TableHead>
                  <TableHead className="text-center">Reservas</TableHead>
                  <TableHead className="text-right">Total Original</TableHead>
                  <TableHead className="text-right">Total Final</TableHead>
                  <TableHead className="text-right">Ahorro Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {stat.anunciante 
                        ? `${stat.anunciante.nombre}${stat.anunciante.empresa ? ` (${stat.anunciante.empresa})` : ''}`
                        : 'Sin anunciante asignado'}
                    </TableCell>
                    <TableCell className="text-center">{stat.totalReservas}</TableCell>
                    <TableCell className="text-right">{formatCurrency(stat.totalOriginal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(stat.totalFinal)}</TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {formatCurrency(stat.totalDescuento)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Detalle de reservas con descuento */}
        {reservas && reservas.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Detalle de Reservas con Descuento</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead className="text-right">Original</TableHead>
                  <TableHead className="text-right">Final</TableHead>
                  <TableHead className="text-right">Descuento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservas.slice(0, 20).map((reserva) => {
                  const codigo = getCodigoInfo(reserva.codigo_descuento_id);
                  return (
                    <TableRow key={reserva.id}>
                      <TableCell className="font-medium">{reserva.asset_name}</TableCell>
                      <TableCell>
                        {reserva.cliente_nombre || reserva.cliente_email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {codigo && (
                          <Badge variant="outline" className="font-mono">
                            {codigo.codigo}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {reserva.fecha_inicio} - {reserva.fecha_fin}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reserva.tarifa_publicada || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(reserva.tarifa_final || 0)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(reserva.descuento_aplicado || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reserva.status === 'accepted' ? 'default' : 'secondary'}>
                          {reserva.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {reservas.length > 20 && (
              <p className="text-sm text-muted-foreground mt-2">
                Mostrando 20 de {reservas.length} reservas
              </p>
            )}
          </div>
        )}

        {(!reservas || reservas.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            No hay reservas con descuentos aplicados aún
          </div>
        )}
      </CardContent>
    </Card>
  );
}
