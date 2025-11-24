import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, FileText, AlertCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { precioCatorcenal, precioSemanal } from "@/lib/pricing";

interface BulkBillboardUploadProps {
  onSuccess: () => void;
  ownerId: string;
}

interface ColumnMapping {
  [key: string]: string;
}

const REQUIRED_COLUMNS = [
  { key: "frame_id", label: "Frame_ID", required: false },
  { key: "venue_type", label: "Venue type", required: true },
  { key: "address", label: "Address", required: true },
  { key: "floor", label: "Floor", required: false },
  { key: "public_price", label: "Public price / Rate card", required: true },
  { key: "district", label: "District", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "country", label: "Country", required: false },
  { key: "zipcode", label: "Zipcode", required: false },
  { key: "latitude", label: "Latitude", required: true },
  { key: "longitude", label: "Longitude", required: true },
  { key: "frame_category", label: "Frame_Category", required: true },
  { key: "indoor_outdoor", label: "Indoor_Outdoor", required: false },
  { key: "frame_format", label: "Frame_Format", required: false },
  { key: "width", label: "Width (m)", required: true },
  { key: "height", label: "Height (m)", required: true },
  { key: "visual_area", label: "Visual Area (m²)", required: false },
  { key: "monitor_inches", label: "Monitor (inches)", required: false },
  { key: "max_time_secs", label: "max_time_secs", required: false },
  { key: "min_time_secs", label: "min_time_secs", required: false },
  { key: "allow_video", label: "allow_video", required: false },
  { key: "slots_quantity", label: "Slots quantity", required: false },
  { key: "dimension_pixel", label: "dimension_pixel", required: false },
  { key: "backlighted", label: "Backlighted?", required: false },
];

export function BulkBillboardUpload({ onSuccess, ownerId }: BulkBillboardUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedEncoding, setSelectedEncoding] = useState<string>("UTF-8");
  const [detectedEncoding, setDetectedEncoding] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [duplicateFrameIds, setDuplicateFrameIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        "Frame_ID": "FRAME-001",
        "Venue type": "espectacular",
        "Address": "Av. Reforma 123, Col. Centro",
        "Floor": "0",
        "Public price / Rate card": "100000",
        "District": "Centro",
        "City": "Ciudad de México",
        "State": "CDMX",
        "Country": "México",
        "Zipcode": "06000",
        "Latitude": "19.432608",
        "Longitude": "-99.133209",
        "Frame_Category": "static",
        "Indoor_Outdoor": "outdoor",
        "Frame_Format": "landscape",
        "Width (m)": "12",
        "Height (m)": "6",
        "Visual Area (m²)": "72",
        "Monitor (inches)": "",
        "max_time_secs": "",
        "min_time_secs": "",
        "allow_video": "",
        "Slots quantity": "",
        "dimension_pixel": "",
        "Backlighted?": "yes"
      },
      {
        "Frame_ID": "FRAME-002",
        "Venue type": "digital",
        "Address": "Av. Insurgentes 456, Col. Roma",
        "Floor": "1",
        "Public price / Rate card": "50000",
        "District": "Roma Norte",
        "City": "Ciudad de México",
        "State": "CDMX",
        "Country": "México",
        "Zipcode": "06700",
        "Latitude": "19.421234",
        "Longitude": "-99.162345",
        "Frame_Category": "digital",
        "Indoor_Outdoor": "indoor",
        "Frame_Format": "portrait",
        "Width (m)": "3",
        "Height (m)": "4",
        "Visual Area (m²)": "12",
        "Monitor (inches)": "55",
        "max_time_secs": "15",
        "min_time_secs": "5",
        "allow_video": "yes",
        "Slots quantity": "12",
        "dimension_pixel": "1920x1080",
        "Backlighted?": "yes"
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_inventario.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Plantilla descargada",
      description: "La plantilla CSV ha sido descargada exitosamente.",
    });
  };

  const calculatePrices = (publicPrice: number, isDigital: boolean) => {
    if (isDigital) {
      // Para digital: calcular desde el precio mensual
      const precioSemanalCalc = precioSemanal(publicPrice);
      const precioDiario = precioSemanalCalc / 7;
      const precioSpot = precioDiario / 12; // Asumiendo 12 spots por día
      
      return {
        mensual: publicPrice,
        semanal: precioSemanalCalc,
        diario: precioDiario,
        spot: precioSpot
      };
    } else {
      // Para estático: calcular catorcenal y semanal
      return {
        mensual: publicPrice,
        catorcenal: precioCatorcenal(publicPrice),
        semanal: precioSemanal(publicPrice)
      };
    }
  };

  // Función para limpiar y normalizar encabezados
  const cleanHeader = (header: string): string => {
    return header
      .trim() // Eliminar espacios al inicio y final
      .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
      .replace(/[^\w\s\-_()\/]/gi, '') // Eliminar caracteres especiales excepto guiones, guiones bajos, paréntesis y barras
      .trim();
  };

  // Función para normalizar texto para matching (sin acentos, lowercase)
  const normalizeForMatching = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^\w\s]/gi, '') // Eliminar caracteres especiales
      .replace(/\s+/g, ''); // Eliminar espacios
  };

  const processBillboard = (row: any, mapping: ColumnMapping) => {
    const getValue = (key: string) => {
      const mappedColumn = mapping[key];
      return mappedColumn ? row[mappedColumn] : "";
    };

    const isDigital = getValue("frame_category")?.toLowerCase() === "digital";
    const publicPrice = parseFloat(getValue("public_price") || "0");
    const calculatedPrices = calculatePrices(publicPrice, isDigital);

    const width = parseFloat(getValue("width") || "0");
    const height = parseFloat(getValue("height") || "0");

    const frameId = getValue("frame_id");
    
    return {
      nombre: frameId ? `${frameId} - ${getValue("venue_type")}` : `${getValue("venue_type")} - ${getValue("address")}`,
      direccion: getValue("address"),
      tipo: getValue("venue_type") || "espectacular",
      lat: parseFloat(getValue("latitude")),
      lng: parseFloat(getValue("longitude")),
      medidas: {
        ancho: width,
        alto: height,
        unidad: "metros",
        area_visual: parseFloat(getValue("visual_area") || (width * height).toString())
      },
      digital: isDigital ? {
        pulgadas_monitor: getValue("monitor_inches") || "",
        tiempo_max_seg: parseInt(getValue("max_time_secs") || "15"),
        tiempo_min_seg: parseInt(getValue("min_time_secs") || "5"),
        permite_video: getValue("allow_video")?.toLowerCase() === "yes",
        cantidad_slots: parseInt(getValue("slots_quantity") || "12"),
        dimension_pixel: getValue("dimension_pixel") || "",
        resolucion: "HD",
        slots_por_hora: parseInt(getValue("slots_quantity") || "12"),
        duracion_spot: parseInt(getValue("min_time_secs") || "10")
      } : null,
      contratacion: {
        fijo: true,
        programatico: isDigital,
        spots: isDigital
      },
      precio: isDigital ? {
        mensual: calculatedPrices.mensual,
        semanal: calculatedPrices.semanal,
        diario: calculatedPrices.diario,
        spot: calculatedPrices.spot
      } : {
        mensual: calculatedPrices.mensual,
        catorcenal: calculatedPrices.catorcenal,
        semanal: calculatedPrices.semanal
      },
      status: "disponible",
      owner_id: ownerId,
      // Campos adicionales
      metadata: {
        frame_id: getValue("frame_id"),
        piso: getValue("floor"),
        distrito: getValue("district"),
        ciudad: getValue("city"),
        estado: getValue("state"),
        pais: getValue("country"),
        codigo_postal: getValue("zipcode"),
        categoria_marco: getValue("frame_category"),
        interior_exterior: getValue("indoor_outdoor"),
        formato_marco: getValue("frame_format"),
        retroiluminado: getValue("backlighted")?.toLowerCase() === "yes"
      }
    };
  };

  const tryParseWithEncoding = (file: File, encoding: string): Promise<{ success: boolean; results?: any; encoding?: string }> => {
    return new Promise((resolve) => {
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

      if (isExcel) {
        // Procesar archivos Excel
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Leer la primera hoja
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertir a JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length < 2) {
              resolve({ success: false });
              return;
            }
            
            // Primera fila como encabezados, limpiarlos automáticamente
            const rawHeaders = jsonData[0].map(h => String(h || ''));
            const cleanedHeaders = rawHeaders.map(h => cleanHeader(h));
            
            // Resto de filas como datos
            const rows = jsonData.slice(1).map(row => {
              const rowObj: any = {};
              cleanedHeaders.forEach((header, index) => {
                if (header) {
                  rowObj[header] = row[index] !== undefined ? row[index] : '';
                }
              });
              return rowObj;
            });
            
            const results = {
              data: rows.filter(row => Object.values(row).some(v => v !== '')), // Filtrar filas vacías
              meta: { fields: cleanedHeaders }
            };
            
            resolve({ success: true, results, encoding: 'Excel' });
          } catch (error) {
            console.error("Error parsing Excel:", error);
            resolve({ success: false });
          }
        };
        
        reader.onerror = () => {
          resolve({ success: false });
        };
        
        reader.readAsArrayBuffer(file);
      } else {
        // Procesar archivos CSV
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const text = e.target?.result as string;
          
          // Detectar si hay caracteres corruptos comunes en codificaciones incorrectas
          const hasCorruptedChars = /[�\uFFFD]/.test(text) || 
                                    /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text);
          
          if (hasCorruptedChars && encoding !== "ISO-8859-1") {
            resolve({ success: false });
            return;
          }

          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => cleanHeader(header), // Limpiar encabezados automáticamente
            complete: (results) => {
              const headers = results.meta.fields || [];
              const hasValidHeaders = headers.length > 0 && headers.some(h => h && h.trim().length > 0);
              
              if (hasValidHeaders && !hasCorruptedChars) {
                resolve({ success: true, results, encoding });
              } else {
                resolve({ success: false });
              }
            },
            error: () => {
              resolve({ success: false });
            }
          });
        };
        
        reader.onerror = () => {
          resolve({ success: false });
        };
        
        reader.readAsText(file, encoding);
      }
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrors([]);
    setCurrentFile(file);
    await processFileWithEncoding(file, selectedEncoding);
  };

  const processFileWithEncoding = async (file: File, encoding: string) => {
    const encodingsToTry = [encoding, "UTF-8", "ISO-8859-1", "Windows-1252"].filter(
      (e, i, arr) => arr.indexOf(e) === i // Remover duplicados
    );

    let successfulParse = null;

    // Intentar con la codificación seleccionada primero, luego las demás
    for (const enc of encodingsToTry) {
      const result = await tryParseWithEncoding(file, enc);
      if (result.success) {
        successfulParse = result;
        break;
      }
    }

    if (!successfulParse) {
      setErrors(["No se pudo leer el archivo con ninguna codificación. Verifica que sea un CSV válido."]);
      return;
    }

    const { results, encoding: usedEncoding } = successfulParse;
    const headers = results.meta.fields || [];
    
    setDetectedEncoding(usedEncoding || encoding);
    setCsvHeaders(headers);
    setCsvData(results.data);
    
    // Auto-mapping inteligente con normalización
    const autoMapping: ColumnMapping = {};
    
    REQUIRED_COLUMNS.forEach(col => {
      // 1. Intentar coincidencia exacta
      const exactMatch = headers.find((h: string) => 
        normalizeForMatching(h) === normalizeForMatching(col.label)
      );
      
      if (exactMatch) {
        autoMapping[col.key] = exactMatch;
        return;
      }
      
      // 2. Intentar coincidencia con el key
      const keyMatch = headers.find((h: string) => 
        normalizeForMatching(h) === normalizeForMatching(col.key)
      );
      
      if (keyMatch) {
        autoMapping[col.key] = keyMatch;
        return;
      }
      
      // 3. Intentar coincidencias parciales por palabras clave
      const normalizedLabel = normalizeForMatching(col.label);
      const normalizedKey = normalizeForMatching(col.key);
      
      const partialMatch = headers.find((h: string) => {
        const normalizedHeader = normalizeForMatching(h);
        
        // Si el header contiene el label o el key
        if (normalizedHeader.includes(normalizedLabel) || normalizedHeader.includes(normalizedKey)) {
          return true;
        }
        
        // Si el label o key contiene el header (para headers cortos)
        if (normalizedLabel.includes(normalizedHeader) || normalizedKey.includes(normalizedHeader)) {
          return true;
        }
        
        return false;
      });
      
      if (partialMatch) {
        autoMapping[col.key] = partialMatch;
      }
    });
    
    setColumnMapping(autoMapping);
    setShowMapping(true);

    if (usedEncoding !== encoding) {
      toast({
        title: "Codificación detectada automáticamente",
        description: `El archivo se leyó correctamente usando ${usedEncoding}.`,
      });
    }
  };

  const checkDuplicateFrameIds = async (frameIds: string[]): Promise<string[]> => {
    const validFrameIds = frameIds.filter(id => id && id.trim().length > 0);
    
    if (validFrameIds.length === 0) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('billboards')
        .select('nombre')
        .eq('owner_id', ownerId);

      if (error) {
        console.error("Error checking duplicates:", error);
        return [];
      }

      const duplicates = new Set<string>();
      
      data?.forEach(billboard => {
        validFrameIds.forEach(frameId => {
          // Buscar en el nombre (formato: "FRAME-XXX - Tipo")
          if (billboard.nombre.toLowerCase().includes(frameId.toLowerCase())) {
            duplicates.add(frameId);
          }
        });
      });

      return Array.from(duplicates);
    } catch (error) {
      console.error("Error checking duplicates:", error);
      return [];
    }
  };

  const handleGeneratePreview = async () => {
    const validationErrors: string[] = [];
    const preview: any[] = [];

    // Validar mapeo de columnas requeridas
    const missingRequired = REQUIRED_COLUMNS
      .filter(col => col.required && !columnMapping[col.key])
      .map(col => col.label);

    if (missingRequired.length > 0) {
      setErrors([`Columnas requeridas sin mapear: ${missingRequired.join(", ")}`]);
      return;
    }

    // Extraer Frame_IDs del archivo para verificar duplicados
    const frameIdsInFile = csvData
      .map(row => {
        const mappedColumn = columnMapping["frame_id"];
        return mappedColumn ? row[mappedColumn] : "";
      })
      .filter(id => id && id.toString().trim().length > 0)
      .map(id => id.toString().trim());

    // Verificar duplicados en la base de datos
    const duplicates = await checkDuplicateFrameIds(frameIdsInFile);
    setDuplicateFrameIds(duplicates);

    // Procesar primeras 10 filas para vista previa
    const previewRows = csvData.slice(0, 10);
    
    previewRows.forEach((row, index) => {
      try {
        const billboard = processBillboard(row, columnMapping);
        
        if (!billboard.lat || !billboard.lng) {
          validationErrors.push(`Fila ${index + 2}: Coordenadas inválidas`);
          return;
        }
        
        preview.push(billboard);
      } catch (err: any) {
        validationErrors.push(`Fila ${index + 2}: ${err.message}`);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setPreviewData(preview);
    setShowMapping(false);
    setShowPreview(true);
    setErrors([]);
  };

  const handleProcessUpload = async () => {
    setUploading(true);
    setErrors([]);
    setProgress(0);

    const validationErrors: string[] = [];
    const validBillboards: any[] = [];

    // Procesar cada fila
    csvData.forEach((row, index) => {
      try {
        const billboard = processBillboard(row, columnMapping);
        
        // Validaciones básicas
        if (!billboard.lat || !billboard.lng) {
          validationErrors.push(`Fila ${index + 2}: Coordenadas inválidas`);
          return;
        }
        
        validBillboards.push(billboard);
      } catch (err: any) {
        validationErrors.push(`Fila ${index + 2}: ${err.message}`);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setUploading(false);
      return;
    }

    // Insertar en la base de datos
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
        description: `${successCount} pantallas creadas con precios calculados automáticamente.`,
      });
      setIsOpen(false);
      setShowMapping(false);
      onSuccess();
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setShowMapping(false);
          setShowPreview(false);
          setCsvData([]);
          setCsvHeaders([]);
          setColumnMapping({});
          setPreviewData([]);
          setDetectedEncoding(null);
          setCurrentFile(null);
          setErrors([]);
          setDuplicateFrameIds([]);
        }
      }}>
        <Button
          onClick={() => setIsOpen(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Cargar Inventario
        </Button>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showPreview ? "Vista Previa de Carga" : showMapping ? "Mapear Columnas del CSV" : "Carga Masiva de Inventario"}
            </DialogTitle>
          </DialogHeader>

          {showPreview ? (
            <div className="space-y-4">
              {duplicateFrameIds.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">Frame_IDs duplicados detectados:</p>
                    <p className="text-sm mb-2">Los siguientes Frame_IDs ya existen en tu inventario:</p>
                    <ul className="list-disc list-inside text-sm max-h-32 overflow-y-auto">
                      {duplicateFrameIds.map((id, idx) => (
                        <li key={idx}>{id}</li>
                      ))}
                    </ul>
                    <p className="text-sm mt-2 font-semibold">
                      No se recomienda continuar con la carga. Elimina o modifica estos Frame_IDs duplicados en tu archivo.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Vista previa de las primeras {previewData.length} filas con precios calculados automáticamente. Revisa los datos antes de confirmar la carga.
                </AlertDescription>
              </Alert>

              <div className="overflow-x-auto max-h-96 border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Nombre</th>
                      <th className="p-2 text-left">Tipo</th>
                      <th className="p-2 text-left">Dirección</th>
                      <th className="p-2 text-right">Precio Mensual</th>
                      <th className="p-2 text-right">Precio Semanal</th>
                      <th className="p-2 text-right">Otros Precios</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((billboard, index) => {
                      const isDigital = billboard.digital !== null;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2">{billboard.nombre}</td>
                          <td className="p-2">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10">
                              {isDigital ? 'Digital' : 'Estático'}
                            </span>
                          </td>
                          <td className="p-2 text-muted-foreground">{billboard.direccion}</td>
                          <td className="p-2 text-right font-medium">
                            ${billboard.precio.mensual?.toLocaleString()}
                          </td>
                          <td className="p-2 text-right">
                            ${billboard.precio.semanal?.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-xs text-muted-foreground">
                            {isDigital ? (
                              <>
                                Diario: ${billboard.precio.diario?.toLocaleString()}<br />
                                Spot: ${billboard.precio.spot?.toLocaleString()}
                              </>
                            ) : (
                              <>Catorcenal: ${billboard.precio.catorcenal?.toLocaleString()}</>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Se procesarán <strong>{csvData.length} pantallas</strong> en total. 
                  {csvData.length > 10 && ` Mostrando solo las primeras ${previewData.length} para vista previa.`}
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setShowMapping(true);
                  }}
                >
                  Volver al Mapeo
                </Button>
                <Button
                  onClick={handleProcessUpload}
                  disabled={uploading || duplicateFrameIds.length > 0}
                  className="gap-2"
                  variant={duplicateFrameIds.length > 0 ? "destructive" : "default"}
                >
                  {duplicateFrameIds.length > 0 ? "No se puede cargar (Duplicados)" : "Confirmar y Cargar Todo"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : !showMapping ? (
            <div className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Sube un archivo CSV o Excel con tu inventario. El sistema te permitirá mapear las columnas de tu archivo con los campos requeridos.
                  <br /><br />
                  <strong>El sistema limpia automáticamente los encabezados</strong>, eliminando espacios y caracteres innecesarios para aceptar cualquier archivo sin problemas.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Label htmlFor="encoding-select" className="text-sm font-medium whitespace-nowrap">
                    Codificación del archivo:
                  </Label>
                  <Select value={selectedEncoding} onValueChange={setSelectedEncoding}>
                    <SelectTrigger id="encoding-select" className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8 (Universal)</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1 (Latin-1)</SelectItem>
                      <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  El sistema intentará detectar automáticamente la codificación correcta si la seleccionada no funciona.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Arrastra un archivo CSV o haz clic para seleccionar
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="secondary" asChild>
                      <span>Seleccionar Archivo</span>
                    </Button>
                  </label>
                </div>
              </div>

              {detectedEncoding && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Codificación detectada: <strong>{detectedEncoding}</strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {detectedEncoding && detectedEncoding !== selectedEncoding && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Se detectó y utilizó la codificación <strong>{detectedEncoding}</strong> para leer el archivo correctamente.
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Relaciona las columnas de tu archivo con los campos de la plataforma. Los campos marcados con * son obligatorios.
                </AlertDescription>
              </Alert>

              {currentFile && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">¿Los caracteres no se ven bien?</p>
                    <p className="text-xs text-muted-foreground">Prueba cambiar la codificación:</p>
                  </div>
                  <Select 
                    value={detectedEncoding || selectedEncoding} 
                    onValueChange={async (newEncoding) => {
                      setSelectedEncoding(newEncoding);
                      await processFileWithEncoding(currentFile, newEncoding);
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTF-8">UTF-8</SelectItem>
                      <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                      <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                {REQUIRED_COLUMNS.map((col) => (
                  <div key={col.key} className="space-y-2">
                    <Label>
                      {col.label} {col.required && <span className="text-destructive">*</span>}
                    </Label>
                    <Select
                      value={columnMapping[col.key] || "unmapped"}
                      onValueChange={(value) => 
                        setColumnMapping(prev => ({ 
                          ...prev, 
                          [col.key]: value === "unmapped" ? "" : value 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar columna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">-- Sin mapear --</SelectItem>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Cálculos automáticos:</strong><br />
                  • Inventario estático: se calculará precio catorcenal y semanal<br />
                  • Inventario digital: se calculará precio semanal, diario y por spot
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMapping(false);
                    setCsvData([]);
                    setCsvHeaders([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGeneratePreview}
                  className="gap-2"
                >
                  Ver Vista Previa
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando y calculando precios...</span>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
