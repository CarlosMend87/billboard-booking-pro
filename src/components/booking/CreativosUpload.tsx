import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Image as ImageIcon, AlertTriangle, CheckCircle2 } from "lucide-react";
import { CartItem } from "@/types/cart";

interface CreativosUploadProps {
  item: CartItem;
  onCreativosChange: (itemId: string, creativos: CreativosConfig) => void;
}

export interface CreativosConfig {
  // Para digital
  archivos?: { [resolucion: string]: File | null };
  // Para tradicional
  quienImprime?: 'cliente' | 'propietario';
  fechaEnvioMaterial?: string;
}

export function CreativosUpload({ item, onCreativosChange }: CreativosUploadProps) {
  const [config, setConfig] = useState<CreativosConfig>({});
  
  const isDigital = item.asset.tipo.toLowerCase().includes('digital');
  const medidas = item.asset.medidas as any;
  
  // Obtener resoluciones requeridas para pantallas digitales
  const getRequiredResolutions = (): string[] => {
    const digital = item.asset.digital as any;
    if (!digital || !digital.dimension_pixel) return [];
    
    // Si hay dimension_pixel, usarla
    return [digital.dimension_pixel];
  };

  const requiredResolutions = isDigital ? getRequiredResolutions() : [];

  const handleFileChange = (resolucion: string, file: File | null) => {
    const newArchivos = { ...config.archivos, [resolucion]: file };
    const newConfig = { ...config, archivos: newArchivos };
    setConfig(newConfig);
    onCreativosChange(item.id, newConfig);
  };

  const handleQuienImprimeChange = (value: 'cliente' | 'propietario') => {
    const newConfig = { ...config, quienImprime: value };
    setConfig(newConfig);
    onCreativosChange(item.id, newConfig);
  };

  const handleFechaEnvioChange = (fecha: string) => {
    const newConfig = { ...config, fechaEnvioMaterial: fecha };
    setConfig(newConfig);
    onCreativosChange(item.id, newConfig);
  };

  if (isDigital && requiredResolutions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Carga de Creativos - {item.asset.nombre}</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No se encontró información de resolución para esta pantalla digital.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Carga de Creativos - {item.asset.nombre}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Información de medidas de la pantalla */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{item.asset.tipo}</Badge>
            <span className="text-sm font-medium">
              Medidas: {medidas?.ancho || 0}m × {medidas?.alto || 0}m
            </span>
          </div>
        </div>

        {isDigital ? (
          /* Pantallas Digitales */
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Resoluciones Requeridas</h4>
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Por favor, sube tus creativos en las siguientes resoluciones exactas para garantizar la mejor calidad de visualización.
                </AlertDescription>
              </Alert>
            </div>

            {requiredResolutions.map((resolucion) => (
              <div key={resolucion} className="space-y-2">
                <Label htmlFor={`file-${resolucion}`} className="flex items-center gap-2">
                  Resolución: <Badge variant="secondary">{resolucion}</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`file-${resolucion}`}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileChange(resolucion, e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {config.archivos?.[resolucion] && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Cargado
                    </Badge>
                  )}
                </div>
                {config.archivos?.[resolucion] && (
                  <p className="text-xs text-muted-foreground">
                    Archivo: {config.archivos[resolucion]?.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Formato Tradicional / Estático */
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">¿Quién imprimirá el material?</h4>
              <RadioGroup 
                value={config.quienImprime} 
                onValueChange={handleQuienImprimeChange}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cliente" id="cliente" />
                  <Label htmlFor="cliente" className="cursor-pointer">
                    Yo imprimo material
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="propietario" id="propietario" />
                  <Label htmlFor="propietario" className="cursor-pointer">
                    El dueño del medio imprimirá el material
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {config.quienImprime === 'cliente' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fechaEnvio">Fecha en que enviará el material</Label>
                  <Input
                    id="fechaEnvio"
                    type="date"
                    value={config.fechaEnvioMaterial || ''}
                    onChange={(e) => handleFechaEnvioChange(e.target.value)}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>IMPORTANTE:</strong> El material debe enviarse 10 días antes del inicio de la campaña para evitar retrasos en la instalación.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {config.quienImprime === 'propietario' && (
              <div>
                <Label htmlFor="creativo">Subir archivo de diseño</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="creativo"
                    type="file"
                    accept="image/*,.pdf,.ai,.psd"
                    onChange={(e) => handleFileChange('design', e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {config.archivos?.['design'] && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Cargado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceptados: JPG, PNG, PDF, AI, PSD
                </p>
                {config.archivos?.['design'] && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Archivo: {config.archivos['design']?.name}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
