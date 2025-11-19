import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface BulkBillboardUploadProps {
  onSuccess: () => void;
  ownerId: string;
}

interface BillboardRow {
  nombre: string;
  direccion: string;
  tipo: string;
  lat: string;
  lng: string;
  ancho: string;
  alto: string;
  unidad: string;
  es_digital: string;
  precio_fijo_dia?: string;
  precio_fijo_semana?: string;
  precio_fijo_mes?: string;
  precio_spot?: string;
  precio_programatico_cpm?: string;
  status?: string;
}

export function BulkBillboardUpload({ onSuccess, ownerId }: BulkBillboardUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        nombre: "Ejemplo Pantalla 1",
        direccion: "Av. Reforma 123, Col. Centro",
        tipo: "espectacular",
        lat: "19.432608",
        lng: "-99.133209",
        ancho: "12",
        alto: "6",
        unidad: "metros",
        es_digital: "no",
        precio_fijo_dia: "5000",
        precio_fijo_semana: "30000",
        precio_fijo_mes: "100000",
        precio_spot: "",
        precio_programatico_cpm: "",
        status: "disponible"
      },
      {
        nombre: "Ejemplo Pantalla Digital",
        direccion: "Av. Insurgentes 456, Col. Roma",
        tipo: "digital",
        lat: "19.421234",
        lng: "-99.162345",
        ancho: "8",
        alto: "4",
        unidad: "metros",
        es_digital: "si",
        precio_fijo_dia: "",
        precio_fijo_semana: "",
        precio_fijo_mes: "",
        precio_spot: "150",
        precio_programatico_cpm: "50",
        status: "disponible"
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_pantallas.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Plantilla descargada",
      description: "La plantilla CSV ha sido descargada exitosamente.",
    });
  };

  const validateRow = (row: BillboardRow, index: number): string | null => {
    if (!row.nombre?.trim()) return `Fila ${index + 2}: El nombre es requerido`;
    if (!row.direccion?.trim()) return `Fila ${index + 2}: La dirección es requerida`;
    if (!row.tipo?.trim()) return `Fila ${index + 2}: El tipo es requerido`;
    if (!row.lat || isNaN(parseFloat(row.lat))) return `Fila ${index + 2}: Latitud inválida`;
    if (!row.lng || isNaN(parseFloat(row.lng))) return `Fila ${index + 2}: Longitud inválida`;
    if (!row.ancho || isNaN(parseFloat(row.ancho))) return `Fila ${index + 2}: Ancho inválido`;
    if (!row.alto || isNaN(parseFloat(row.alto))) return `Fila ${index + 2}: Alto inválido`;
    if (!row.unidad?.trim()) return `Fila ${index + 2}: Unidad es requerida`;
    if (!row.es_digital || !["si", "no"].includes(row.es_digital.toLowerCase())) {
      return `Fila ${index + 2}: es_digital debe ser "si" o "no"`;
    }
    return null;
  };

  const processBillboard = (row: BillboardRow) => {
    const esDigital = row.es_digital.toLowerCase() === "si";
    
    const contratacion: any = {
      fijo: false,
      programatico: false,
      spots: false
    };

    const precio: any = {};

    if (row.precio_fijo_dia || row.precio_fijo_semana || row.precio_fijo_mes) {
      contratacion.fijo = true;
      precio.fijo = {
        dia: row.precio_fijo_dia ? parseFloat(row.precio_fijo_dia) : undefined,
        semana: row.precio_fijo_semana ? parseFloat(row.precio_fijo_semana) : undefined,
        mensual: row.precio_fijo_mes ? parseFloat(row.precio_fijo_mes) : undefined
      };
    }

    if (row.precio_spot) {
      contratacion.spots = true;
      precio.spot = parseFloat(row.precio_spot);
    }

    if (row.precio_programatico_cpm) {
      contratacion.programatico = true;
      precio.programatico = {
        cpm: parseFloat(row.precio_programatico_cpm)
      };
    }

    return {
      nombre: row.nombre.trim(),
      direccion: row.direccion.trim(),
      tipo: row.tipo.trim(),
      lat: parseFloat(row.lat),
      lng: parseFloat(row.lng),
      medidas: {
        ancho: parseFloat(row.ancho),
        alto: parseFloat(row.alto),
        unidad: row.unidad.trim()
      },
      digital: esDigital ? {
        resolucion: "HD",
        slots_por_hora: 6,
        duracion_spot: 10
      } : null,
      contratacion,
      precio,
      status: row.status?.trim() || "disponible",
      owner_id: ownerId
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrors([]);
    setProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as BillboardRow[];
        const validationErrors: string[] = [];
        const validBillboards: any[] = [];

        // Validate all rows first
        rows.forEach((row, index) => {
          const error = validateRow(row, index);
          if (error) {
            validationErrors.push(error);
          } else {
            try {
              validBillboards.push(processBillboard(row));
            } catch (err) {
              validationErrors.push(`Fila ${index + 2}: Error al procesar datos - ${err}`);
            }
          }
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          setUploading(false);
          return;
        }

        // Insert billboards
        let successCount = 0;
        const insertErrors: string[] = [];

        for (let i = 0; i < validBillboards.length; i++) {
          try {
            const { error } = await supabase
              .from("billboards")
              .insert(validBillboards[i]);

            if (error) throw error;
            successCount++;
          } catch (err: any) {
            insertErrors.push(`${validBillboards[i].nombre}: ${err.message}`);
          }
          setProgress(((i + 1) / validBillboards.length) * 100);
        }

        setUploading(false);

        if (insertErrors.length > 0) {
          setErrors(insertErrors);
          toast({
            title: "Carga parcial",
            description: `${successCount} pantallas creadas. ${insertErrors.length} con errores.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Éxito!",
            description: `${successCount} pantallas creadas exitosamente.`,
          });
          setIsOpen(false);
          onSuccess();
        }

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        setErrors([`Error al leer el archivo: ${error.message}`]);
        setUploading(false);
      }
    });
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={downloadTemplate}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Descargar Plantilla
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <Button
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Cargar Pantallas
        </Button>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carga Masiva de Pantallas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                Sube un archivo CSV con tus pantallas. Asegúrate de usar la plantilla proporcionada.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Arrastra un archivo CSV o haz clic para seleccionar
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="secondary"
                    disabled={uploading}
                    asChild
                  >
                    <span>Seleccionar Archivo</span>
                  </Button>
                </label>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Procesando...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">Errores encontrados:</p>
                    <ul className="list-disc list-inside text-sm max-h-40 overflow-y-auto">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
