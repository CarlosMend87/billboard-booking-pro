import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Maximize2 } from "lucide-react";
import { Billboard } from "@/hooks/useBillboards";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BillboardMapProps {
  billboards: Billboard[];
}

export function BillboardMap({ billboards }: BillboardMapProps) {
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponible': return 'text-green-600';
      case 'ocupada': return 'text-red-600';
      case 'mantenimiento': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Simulamos coordenadas para mostrar las pantallas en un "mapa"
  const billboardsWithCoords = billboards.map((billboard, index) => ({
    ...billboard,
    x: 20 + (index % 5) * 15 + Math.random() * 10,
    y: 20 + Math.floor(index / 5) * 15 + Math.random() * 10
  }));

  return (
    <>
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Mapa de Pantallas
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4 mr-1" />
                Vista Completa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Mapa Interactivo de Pantallas</DialogTitle>
              </DialogHeader>
              <MapFullView billboards={billboardsWithCoords} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="relative bg-muted/30 rounded-lg p-4 h-64 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50"></div>
            
            {billboardsWithCoords.slice(0, 10).map((billboard) => (
              <div
                key={billboard.id}
                className="absolute cursor-pointer group"
                style={{ left: `${billboard.x}%`, top: `${billboard.y}%` }}
                onClick={() => setSelectedBillboard(billboard)}
              >
                <MapPin className={`h-6 w-6 ${getStatusColor(billboard.status)} group-hover:scale-110 transition-transform`} />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {billboard.nombre}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-3 text-xs">
              <h4 className="font-medium mb-2">Estado de Pantallas</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-green-600" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-red-600" />
                  <span>Ocupada</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-yellow-600" />
                  <span>Mantenimiento</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedBillboard && (
        <Card className="mb-4 border-primary">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{selectedBillboard.nombre}</h3>
                <p className="text-sm text-muted-foreground">{selectedBillboard.direccion}</p>
                <p className="text-sm">Estado: <span className={getStatusColor(selectedBillboard.status)}>
                  {selectedBillboard.status}
                </span></p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedBillboard(null)}>
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function MapFullView({ billboards }: { billboards: any[] }) {
  return (
    <div className="relative bg-muted/30 rounded-lg p-4 h-96 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 opacity-50"></div>
      
      {billboards.map((billboard) => (
        <div
          key={billboard.id}
          className="absolute cursor-pointer group"
          style={{ left: `${billboard.x}%`, top: `${billboard.y}%` }}
        >
          <MapPin className={`h-8 w-8 ${
            billboard.status === 'disponible' ? 'text-green-600' :
            billboard.status === 'ocupada' ? 'text-red-600' : 'text-yellow-600'
          } group-hover:scale-110 transition-transform`} />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              <div className="font-medium">{billboard.nombre}</div>
              <div>{billboard.direccion}</div>
              <div className="capitalize">{billboard.status}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}