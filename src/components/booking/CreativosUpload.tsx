import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Image as ImageIcon, CheckCircle2 } from "lucide-react";
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
  
  const isDigital = item.asset.tipo.toLowerCase().includes('digital') || !!item.asset.digital;
  const medidas = item.asset.medidas as any;
  
  // Obtener resoluciones requeridas para pantallas digitales
  const getRequiredResolutions = (): string[] => {
    const digital = item.asset.digital as any;
    if (!digital || !digital.dimension_pixel) return [];
    return [digital.dimension_pixel];
  };

  const requiredResolutions = isDigital ? getRequiredResolutions() : [];

  const handleFileChange = (resolucion: string, file: File | null) => {
    const newArchivos = { ...config.archivos, [resolucion]: file };
    const newConfig = { ...config, archivos: newArchivos };
    setConfig(newConfig);
    onCreativosChange(item.id, newConfig);
  };

  // Para pantallas digitales sin información de resolución
  if (isDigital && requiredResolutions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium">Carga de Creativos</h4>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{item.asset.tipo}</Badge>
            <span className="text-sm font-medium">
              Medidas: {medidas?.ancho || 0}m × {medidas?.alto || 0}m
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="file-default" className="flex items-center gap-2">
            Subir creativo (imagen o video)
          </Label>
          <div className="flex gap-2">
            <Input
              id="file-default"
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFileChange('default', e.target.files?.[0] || null)}
              className="flex-1"
            />
            {config.archivos?.['default'] && (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Cargado
              </Badge>
            )}
          </div>
          {config.archivos?.['default'] && (
            <p className="text-xs text-muted-foreground">
              Archivo: {config.archivos['default']?.name}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Para pantallas digitales con resolución especificada
  if (isDigital) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium">Carga de Creativos</h4>
        </div>
        
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{item.asset.tipo}</Badge>
            <span className="text-sm font-medium">
              Medidas: {medidas?.ancho || 0}m × {medidas?.alto || 0}m
            </span>
          </div>
        </div>

        <Alert className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Por favor, sube tus creativos en las resoluciones requeridas para garantizar la mejor calidad.
          </AlertDescription>
        </Alert>

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
    );
  }

  // Para pantallas estáticas/tradicionales - solo subir archivo de diseño
  // La pregunta de quién imprime está en UnifiedBookingConfig
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">Archivo de Diseño</h4>
      </div>
      
      <div className="p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{item.asset.tipo}</Badge>
          <span className="text-sm font-medium">
            Medidas: {medidas?.ancho || 0}m × {medidas?.alto || 0}m
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="creativo">Subir archivo de diseño</Label>
        <div className="flex gap-2">
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
        <p className="text-xs text-muted-foreground">
          Formatos aceptados: JPG, PNG, PDF, AI, PSD
        </p>
        {config.archivos?.['design'] && (
          <p className="text-xs text-muted-foreground mt-1">
            Archivo: {config.archivos['design']?.name}
          </p>
        )}
      </div>
    </div>
  );
}
