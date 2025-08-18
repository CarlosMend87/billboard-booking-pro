import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { CartItem } from "@/types/cart";
import { catorcenas2024 } from "@/lib/mockInventory";
import { formatPrice } from "@/lib/pricing";
import { Calendar as CalendarIcon, Clock, Zap } from "lucide-react";

interface ProgramacionStepProps {
  items: CartItem[];
  onUpdate: (itemId: string, fechas: { fechaInicio?: string; fechaFin?: string; periodo?: string }) => void;
}

export function ProgramacionStep({ items, onUpdate }: ProgramacionStepProps) {
  const [selectedDates, setSelectedDates] = useState<{[key: string]: { inicio?: Date; fin?: Date; periodo?: string }}>({});

  const handleDateChange = (itemId: string, type: 'inicio' | 'fin', date: Date | undefined) => {
    if (!date) return;
    
    const currentDates = selectedDates[itemId] || {};
    const newDates = { ...currentDates, [type]: date };
    
    setSelectedDates(prev => ({ ...prev, [itemId]: newDates }));
    
    onUpdate(itemId, {
      fechaInicio: newDates.inicio?.toISOString().split('T')[0],
      fechaFin: newDates.fin?.toISOString().split('T')[0]
    });
  };

  const handleCatorcenaChange = (itemId: string, periodo: string) => {
    const catorcena = catorcenas2024.find(c => c.periodo === periodo);
    if (!catorcena) return;
    
    setSelectedDates(prev => ({ 
      ...prev, 
      [itemId]: { periodo } 
    }));
    
    onUpdate(itemId, {
      fechaInicio: catorcena.inicio,
      fechaFin: catorcena.fin,
      periodo
    });
  };

  const getTipoLabel = (tipo: string) => {
    const labels = {
      'espectacular': 'Espectacular',
      'muro': 'Muro', 
      'valla': 'Valla',
      'parabus': 'Parabús',
      'digital': 'Digital'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  };

  const renderTradicionalProgramacion = (item: CartItem) => (
    <div className="space-y-4">
      {item.modalidad === 'catorcenal' ? (
        <div>
          <Label>Selecciona catorcenas</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {catorcenas2024.slice(0, 6).map((catorcena) => (
              <Button
                key={catorcena.periodo}
                variant={selectedDates[item.id]?.periodo === catorcena.periodo ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCatorcenaChange(item.id, catorcena.periodo)}
                className="justify-start"
              >
                <Badge variant="secondary" className="mr-2 text-xs">
                  C{catorcena.numero.toString().padStart(2, '0')}
                </Badge>
                <span className="text-xs">
                  {catorcena.inicio} al {catorcena.fin}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fecha de inicio</Label>
            <Calendar
              mode="single"
              selected={selectedDates[item.id]?.inicio}
              onSelect={(date) => handleDateChange(item.id, 'inicio', date)}
              className="rounded-md border mt-2"
              disabled={(date) => date < new Date()}
            />
          </div>
          <div>
            <Label>Fecha de fin</Label>
            <Calendar
              mode="single"  
              selected={selectedDates[item.id]?.fin}
              onSelect={(date) => handleDateChange(item.id, 'fin', date)}
              className="rounded-md border mt-2"
              disabled={(date) => {
                const inicio = selectedDates[item.id]?.inicio;
                return date < new Date() || (inicio && date <= inicio);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderDigitalProgramacion = (item: CartItem) => (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-4 w-4 text-primary" />
          <span className="font-medium">Configuración Digital</span>
        </div>
        
        {item.modalidad === 'spot' && (
          <div className="text-sm space-y-1">
            <p><strong>Spots por día:</strong> {item.config.spotsDia}</p>
            <p><strong>Duración:</strong> {item.config.dias} días</p>
            <p><strong>Total spots:</strong> {(item.config.spotsDia || 1) * (item.config.dias || 1)}</p>
          </div>
        )}
        
        {item.modalidad === 'hora' && (
          <div className="text-sm space-y-1">
            <p><strong>Horas por día:</strong> {item.config.horas}</p>
            <p><strong>Duración:</strong> {item.config.dias} días</p>
            <p><strong>Total horas:</strong> {(item.config.horas || 1) * (item.config.dias || 1)}</p>
          </div>
        )}
        
        {item.modalidad === 'dia' && (
          <div className="text-sm">
            <p><strong>Duración:</strong> {item.config.dias} días completos</p>
          </div>
        )}
        
        {item.modalidad === 'cpm' && (
          <div className="text-sm">
            <p><strong>Impresiones objetivo:</strong> {item.config.impresiones?.toLocaleString()}</p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Fecha de inicio de campaña</Label>
          <Calendar
            mode="single"
            selected={selectedDates[item.id]?.inicio}
            onSelect={(date) => handleDateChange(item.id, 'inicio', date)}
            className="rounded-md border mt-2"
            disabled={(date) => date < new Date()}
          />
        </div>
        <div>
          <Label>Fecha de fin de campaña</Label>
          <Calendar
            mode="single"
            selected={selectedDates[item.id]?.fin}
            onSelect={(date) => handleDateChange(item.id, 'fin', date)}
            className="rounded-md border mt-2"
            disabled={(date) => {
              const inicio = selectedDates[item.id]?.inicio;
              return date < new Date() || (inicio && date <= inicio);
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{item.asset.nombre}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{getTipoLabel(item.asset.tipo)}</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {item.modalidad}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="font-semibold">{formatPrice(item.subtotal)}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {item.asset.tipo === 'digital' ? 
              renderDigitalProgramacion(item) : 
              renderTradicionalProgramacion(item)
            }
          </CardContent>
        </Card>
      ))}
    </div>
  );
}