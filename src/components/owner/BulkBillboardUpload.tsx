import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Download, FileText, AlertCircle, ArrowRight, AlertTriangle, FileDown, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { precioCatorcenal, precioSemanal } from "@/lib/pricing";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BulkBillboardUploadProps {
  onSuccess: () => void;
  ownerId: string;
  onNewBillboard?: () => void;
}

interface ColumnMapping {
  [key: string]: string;
}

interface UploadError {
  row: number;
  frameId: string;
  field: string;
  message: string;
  value: string;
}

const REQUIRED_COLUMNS = [
  { key: "frame_id", label: "Frame_ID", required: false },
  { key: "venue_type", label: "Venue type", required: true },
  { key: "address", label: "Address", required: true },
  { key: "number", label: "Number", required: false },
  { key: "floor", label: "Floor", required: false },
  { key: "public_price", label: "public price ó rate card", required: true, aliases: ["Public price / Rate card", "public price o rate card", "rate card", "precio"] },
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
  { key: "foto_link_1", label: "Foto_Link_1", required: false, aliases: ["foto link 1", "foto1", "link1", "imagen1"] },
  { key: "foto_link_2", label: "Foto_Link_2", required: false, aliases: ["foto link 2", "foto2", "link2", "imagen2"] },
  { key: "foto_link_3", label: "Foto_Link_3", required: false, aliases: ["foto link 3", "foto3", "link3", "imagen3"] },
];

export function BulkBillboardUpload({ onSuccess, ownerId, onNewBillboard }: BulkBillboardUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [detailedErrors, setDetailedErrors] = useState<UploadError[]>([]);
  const [showMapping, setShowMapping] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showErrorReport, setShowErrorReport] = useState(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedEncoding, setSelectedEncoding] = useState<string>("UTF-8");
  const [detectedEncoding, setDetectedEncoding] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [duplicateFrameIds, setDuplicateFrameIds] = useState<string[]>([]);
  const [defaultPrecioImpresion, setDefaultPrecioImpresion] = useState<number>(65);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      {
        "Frame_ID": "FRAME-001",
        "Venue type": "espectacular",
        "Address": "Av. Reforma 123, Col. Centro",
        "Number": "123",
        "Floor": "0",
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
        "Backlighted?": "yes",
        "public price ó rate card": "100000",
        "DISPO": "Disponible",
        "Foto_Link_1": "https://drive.google.com/uc?id=XXXXX",
        "Foto_Link_2": "https://drive.google.com/uc?id=YYYYY",
        "Foto_Link_3": ""
      },
      {
        "Frame_ID": "FRAME-002",
        "Venue type": "digital",
        "Address": "Av. Insurgentes 456, Col. Roma",
        "Number": "456",
        "Floor": "1",
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
        "Backlighted?": "yes",
        "public price ó rate card": "50000",
        "DISPO": "Disponible",
        "Foto_Link_1": "https://drive.google.com/uc?id=ZZZZZ",
        "Foto_Link_2": "",
        "Foto_Link_3": ""
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
  const normalizeForMatching = (text: string | undefined | null): string => {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
      .replace(/[^\w\s]/gi, '') // Eliminar caracteres especiales
      .replace(/\s+/g, ''); // Eliminar espacios
  };

  // Función para convertir links de Google Drive a formato directo
  const convertDriveLink = (link: string): string => {
    if (!link || typeof link !== 'string') return '';
    const trimmed = link.trim();
    if (!trimmed) return '';
    
    // Si ya es un link directo de uc?id=, devolverlo tal cual
    if (trimmed.includes('drive.google.com/uc?id=')) {
      return trimmed;
    }
    
    // Convertir formato /file/d/ID/view a formato directo
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      return `https://drive.google.com/uc?id=${fileIdMatch[1]}`;
    }
    
    // Convertir formato open?id=ID
    const openIdMatch = trimmed.match(/open\?id=([a-zA-Z0-9_-]+)/);
    if (openIdMatch) {
      return `https://drive.google.com/uc?id=${openIdMatch[1]}`;
    }
    
    // Si no es un link de Drive pero es una URL válida, devolverla tal cual
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    return '';
  };

  const processBillboard = (row: any, mapping: ColumnMapping, spotsDisponibles: number = 1) => {
    const getValue = (key: string) => {
      const mappedColumn = mapping[key];
      return mappedColumn ? row[mappedColumn] : "";
    };

    // Función para limpiar valores numéricos
    const cleanNumericValue = (value: string | number): number => {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      
      // Convertir a string y limpiar
      const cleaned = String(value)
        .replace(/[$,\s]/g, '') // Eliminar $, comas y espacios
        .replace(/[^\d.-]/g, '') // Mantener solo dígitos, punto y signo menos
        .trim();
      
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Frame_Category determina el comportamiento: digital = spots, static = tradicional
    const frameCategory = getValue("frame_category")?.toLowerCase() || "static";
    const isDigital = frameCategory === "digital";
    const publicPrice = cleanNumericValue(getValue("public_price"));
    const calculatedPrices = calculatePrices(publicPrice, isDigital);

    const width = cleanNumericValue(getValue("width"));
    const height = cleanNumericValue(getValue("height"));

    const frameId = getValue("frame_id");
    
    // Venue_Type es el tipo visual/categoría de la pantalla (digital, espectacular, vallas, etc.)
    const venueType = getValue("venue_type")?.toLowerCase() || "espectacular";

    // Procesar links de fotos
    const fotoLinks: string[] = [];
    const foto1 = convertDriveLink(getValue("foto_link_1"));
    const foto2 = convertDriveLink(getValue("foto_link_2"));
    const foto3 = convertDriveLink(getValue("foto_link_3"));
    
    if (foto1) fotoLinks.push(foto1);
    if (foto2) fotoLinks.push(foto2);
    if (foto3) fotoLinks.push(foto3);
    
    return {
      nombre: frameId ? `${frameId} - ${getValue("venue_type")}` : `${getValue("venue_type")} - ${getValue("address")}`,
      direccion: getValue("address"),
      tipo: venueType, // Esto es lo que aparece en el filtro del propietario
      lat: cleanNumericValue(getValue("latitude")),
      lng: cleanNumericValue(getValue("longitude")),
      fotos: fotoLinks.length > 0 ? fotoLinks : null,
      medidas: {
        ancho: width,
        alto: height,
        unidad: "metros",
        area_visual: cleanNumericValue(getValue("visual_area") || (width * height).toString())
      },
      digital: isDigital ? {
        pulgadas_monitor: getValue("monitor_inches") || "",
        tiempo_max_seg: parseInt(getValue("max_time_secs") || "15"),
        tiempo_min_seg: parseInt(getValue("min_time_secs") || "5"),
        permite_video: getValue("allow_video")?.toLowerCase() === "yes",
        cantidad_slots: parseInt(getValue("slots_quantity") || "12"),
        dimension_pixel: getValue("dimension_pixel") || "1920x1080",
        resolucion: "HD",
        slots_por_hora: parseInt(getValue("slots_quantity") || "12"),
        duracion_spot: parseInt(getValue("min_time_secs") || "10")
      } : null,
      contratacion: {
        fijo: true,
        programatico: isDigital,
        spots: isDigital,
        spot: isDigital,
        // Campos de spots (solo para digitales)
        duracion_spot_seg: isDigital ? 20 : null,
        total_spots_pantalla: isDigital ? 12 : null,
        spots_disponibles: isDigital ? spotsDisponibles : null,
        // Para pantallas estáticas: indicar que necesita impresión
        requiere_impresion: !isDigital
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
      // Precio de impresión por m² (solo para estáticas, usar valor configurado)
      precio_impresion_m2: !isDigital ? defaultPrecioImpresion : null,
      status: "disponible",
      owner_id: ownerId,
      // Campos adicionales
      metadata: {
        frame_id: getValue("frame_id"),
        frame_category: frameCategory, // Guardamos frame_category en metadata
        numero: getValue("number"),
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
            // Mantener mapeo de índices para manejar columnas vacías intermedias
            const headerMapping = jsonData[0].map((h, idx) => ({
              originalIndex: idx,
              original: h !== undefined && h !== null ? String(h) : '',
              cleaned: h !== undefined && h !== null ? cleanHeader(String(h)) : ''
            })).filter(h => h.cleaned.trim().length > 0); // Solo filtrar para el mapeo final
            
            const cleanedHeaders = headerMapping.map(h => h.cleaned);
            
            // Resto de filas como datos
            const rows = jsonData.slice(1).map(row => {
              const rowObj: any = {};
              headerMapping.forEach(({ originalIndex, cleaned }) => {
                if (cleaned) {
                  rowObj[cleaned] = row[originalIndex] !== undefined ? row[originalIndex] : '';
                }
              });
              return rowObj;
            });
            
            const results = {
              data: rows.filter(row => Object.values(row).some(v => v !== '')), // Filtrar filas vacías
              meta: { fields: cleanedHeaders.filter(h => h && h.trim().length > 0) }
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
    const headers = (results.meta.fields || []).filter((h: string) => h && h.trim().length > 0);
    
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
      
      // 2. Intentar coincidencia con aliases si existen
      if ('aliases' in col && Array.isArray((col as any).aliases)) {
        const aliasMatch = headers.find((h: string) => 
          (col as any).aliases.some((alias: string) => 
            normalizeForMatching(h) === normalizeForMatching(alias)
          )
        );
        
        if (aliasMatch) {
          autoMapping[col.key] = aliasMatch;
          return;
        }
      }
      
      // 3. Intentar coincidencia con el key
      const keyMatch = headers.find((h: string) => 
        normalizeForMatching(h) === normalizeForMatching(col.key)
      );
      
      if (keyMatch) {
        autoMapping[col.key] = keyMatch;
        return;
      }
      
      // 4. Intentar coincidencias parciales por palabras clave
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

    // Agrupar filas por Frame_ID para contar spots disponibles
    const frameIdGroups = new Map<string, any[]>();
    
    csvData.forEach(row => {
      const mappedColumn = columnMapping["frame_id"];
      const frameId = mappedColumn ? String(row[mappedColumn] || "").trim() : "";
      
      if (frameId) {
        if (!frameIdGroups.has(frameId)) {
          frameIdGroups.set(frameId, []);
        }
        frameIdGroups.get(frameId)!.push(row);
      }
    });

    // Extraer Frame_IDs únicos del archivo para verificar duplicados
    const uniqueFrameIds = Array.from(frameIdGroups.keys()).filter(id => id.length > 0);

    // Verificar duplicados en la base de datos
    const duplicates = await checkDuplicateFrameIds(uniqueFrameIds);
    setDuplicateFrameIds(duplicates);

    // Procesar primeras 10 pantallas únicas para vista previa
    const previewFrameIds = Array.from(frameIdGroups.entries()).slice(0, 10);
    
    previewFrameIds.forEach(([frameId, rows], index) => {
      try {
        // Usar la primera fila del grupo para los datos base
        const firstRow = rows[0];
        // El número de filas en el grupo = spots disponibles
        const spotsDisponibles = rows.length;
        
        const billboard = processBillboard(firstRow, columnMapping, spotsDisponibles);
        
        if (!billboard.lat || !billboard.lng) {
          validationErrors.push(`Frame_ID ${frameId}: Coordenadas inválidas`);
          return;
        }
        
        preview.push(billboard);
      } catch (err: any) {
        validationErrors.push(`Frame_ID ${frameId}: ${err.message}`);
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

  // Download error report as CSV
  const downloadErrorReport = () => {
    if (detailedErrors.length === 0) return;
    
    const reportData = detailedErrors.map(err => ({
      "Fila": err.row,
      "Frame_ID": err.frameId,
      "Campo": err.field,
      "Valor": err.value,
      "Error": err.message
    }));
    
    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte-errores-carga-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Reporte descargado",
      description: "El reporte de errores ha sido descargado.",
    });
  };

  const handleProcessUpload = async () => {
    setUploading(true);
    setErrors([]);
    setDetailedErrors([]);
    setProgress(0);

    const validationErrors: UploadError[] = [];
    const validBillboards: any[] = [];

    // Agrupar filas por Frame_ID
    const frameIdGroups = new Map<string, any[]>();
    
    csvData.forEach((row, index) => {
      const mappedColumn = columnMapping["frame_id"];
      const frameId = mappedColumn ? String(row[mappedColumn] || "").trim() : "";
      
      if (frameId) {
        if (!frameIdGroups.has(frameId)) {
          frameIdGroups.set(frameId, []);
        }
        frameIdGroups.get(frameId)!.push({ row, originalIndex: index });
      } else {
        // Row without Frame_ID
        validationErrors.push({
          row: index + 2, // +2 because: +1 for header, +1 for 0-based index
          frameId: "N/A",
          field: "Frame_ID",
          message: "Fila sin identificador Frame_ID",
          value: ""
        });
      }
    });

    // Procesar cada grupo (una pantalla por Frame_ID)
    frameIdGroups.forEach((rows, frameId) => {
      const firstRowData = rows[0].row;
      const rowNumber = rows[0].originalIndex + 2;
      const spotsDisponibles = rows.length;
      
      const getValue = (key: string) => {
        const mappedColumn = columnMapping[key];
        return mappedColumn ? String(firstRowData[mappedColumn] || "").trim() : "";
      };
      
      // Validate required fields
      const lat = parseFloat(getValue("latitude"));
      const lng = parseFloat(getValue("longitude"));
      const venueType = getValue("venue_type");
      const frameCategory = getValue("frame_category");
      const address = getValue("address");
      const price = getValue("public_price");
      const width = getValue("width");
      const height = getValue("height");
      
      if (!lat || isNaN(lat)) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Latitude",
          message: "Latitud inválida o vacía",
          value: getValue("latitude")
        });
      }
      
      if (!lng || isNaN(lng)) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Longitude",
          message: "Longitud inválida o vacía",
          value: getValue("longitude")
        });
      }
      
      if (!venueType) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Venue_Type",
          message: "Tipo de venue requerido",
          value: ""
        });
      }
      
      if (!frameCategory || !["digital", "static"].includes(frameCategory.toLowerCase())) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Frame_Category",
          message: "Frame_Category debe ser 'digital' o 'static'",
          value: frameCategory
        });
      }
      
      if (!address) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Address",
          message: "Dirección requerida",
          value: ""
        });
      }
      
      if (!price || parseFloat(price.replace(/[$,\s]/g, '')) <= 0) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Public Price",
          message: "Precio inválido o vacío",
          value: price
        });
      }
      
      if (!width || parseFloat(width) <= 0) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Width",
          message: "Ancho inválido o vacío",
          value: width
        });
      }
      
      if (!height || parseFloat(height) <= 0) {
        validationErrors.push({
          row: rowNumber,
          frameId,
          field: "Height",
          message: "Alto inválido o vacío",
          value: height
        });
      }
      
      // If no validation errors for this row, add to valid billboards
      const hasErrorsForThisFrame = validationErrors.some(e => e.frameId === frameId);
      if (!hasErrorsForThisFrame) {
        try {
          const billboard = processBillboard(firstRowData, columnMapping, spotsDisponibles);
          validBillboards.push({ ...billboard, _rowNumber: rowNumber, _frameId: frameId });
        } catch (err: any) {
          validationErrors.push({
            row: rowNumber,
            frameId,
            field: "General",
            message: err.message,
            value: ""
          });
        }
      }
    });

    if (validationErrors.length > 0) {
      setDetailedErrors(validationErrors);
      setShowErrorReport(true);
      setUploading(false);
      return;
    }

    // Insertar en la base de datos
    let successCount = 0;
    const insertErrors: UploadError[] = [];

    for (let i = 0; i < validBillboards.length; i++) {
      const { _rowNumber, _frameId, ...billboardData } = validBillboards[i];
      
      try {
        const { error } = await supabase
          .from("billboards")
          .insert(billboardData);

        if (error) {
          insertErrors.push({
            row: _rowNumber,
            frameId: _frameId,
            field: "Database",
            message: error.message,
            value: ""
          });
        } else {
          successCount++;
        }
      } catch (err: any) {
        insertErrors.push({
          row: _rowNumber,
          frameId: _frameId,
          field: "Database",
          message: err.message,
          value: ""
        });
      }
      setProgress(((i + 1) / validBillboards.length) * 100);
    }

    setUploading(false);

    if (insertErrors.length > 0) {
      setDetailedErrors(insertErrors);
      setShowErrorReport(true);
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
                      <th className="p-2 text-center">Spots</th>
                      <th className="p-2 text-left">Dirección</th>
                      <th className="p-2 text-right">Precio Mensual</th>
                      <th className="p-2 text-right">Precio Spot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((billboard, index) => {
                      const isDigital = billboard.digital !== null;
                      const spotsDisponibles = billboard.contratacion?.spots_disponibles || 0;
                      const totalSpots = billboard.contratacion?.total_spots_pantalla || 12;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-2">{billboard.nombre}</td>
                          <td className="p-2">
                            <span className="text-xs px-2 py-1 rounded bg-primary/10">
                              {isDigital ? 'Digital' : 'Estático'}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className="text-xs font-medium">
                              {spotsDisponibles}/{totalSpots}
                            </span>
                          </td>
                          <td className="p-2 text-muted-foreground text-xs">{billboard.direccion}</td>
                          <td className="p-2 text-right font-medium">
                            ${billboard.precio.mensual?.toLocaleString()}
                          </td>
                          <td className="p-2 text-right text-xs">
                            {billboard.precio.spot ? `$${billboard.precio.spot?.toLocaleString()}` : '-'}
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
                  Se procesarán <strong>{previewData.length} pantallas únicas</strong> de <strong>{csvData.length} filas</strong> en el archivo.
                  {previewData.length < csvData.length && (
                    <>
                      <br />
                      <span className="text-xs">
                        Nota: Filas con el mismo Frame_ID se agrupan en una sola pantalla, contando spots disponibles.
                      </span>
                    </>
                  )}
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
              {/* Nueva Pantalla - Individual */}
              {onNewBillboard && (
                <div className="flex items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">¿Solo una pantalla?</p>
                    <p className="text-xs text-muted-foreground">Agrégala manualmente con el formulario</p>
                  </div>
                  <Button 
                    onClick={() => {
                      setIsOpen(false);
                      onNewBillboard();
                    }}
                    className="gap-2 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Pantalla
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">¿Primera vez cargando inventario?</p>
                  <p className="text-xs text-muted-foreground">Descarga la plantilla con el formato correcto</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={downloadTemplate}
                  className="gap-2 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  Descargar Plantilla
                </Button>
              </div>

              {/* Precio por m² por defecto */}
              <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">Precio de impresión por m² (pantallas estáticas)</p>
                  <p className="text-xs text-muted-foreground">Este valor se aplicará a todas las pantallas estáticas</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={defaultPrecioImpresion}
                    onChange={(e) => setDefaultPrecioImpresion(Number(e.target.value) || 0)}
                    className="w-24"
                    min={0}
                    step={0.01}
                  />
                  <span className="text-sm text-muted-foreground">/m²</span>
                </div>
              </div>
              
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

          {/* Detailed Error Report View */}
          {showErrorReport && detailedErrors.length > 0 && (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-2">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-base">⚠️ Reporte de Errores ({detailedErrors.length} errores encontrados)</p>
                      <p className="text-sm mt-1">
                        Los siguientes problemas impidieron la carga. Corrige tu archivo y vuelve a intentar.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadErrorReport}
                      className="gap-2 shrink-0"
                    >
                      <FileDown className="h-4 w-4" />
                      Descargar Reporte
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-16">Fila</TableHead>
                        <TableHead className="w-32">Frame_ID</TableHead>
                        <TableHead className="w-32">Campo</TableHead>
                        <TableHead className="w-32">Valor</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedErrors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">
                            <Badge variant="outline">{error.row}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{error.frameId}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{error.field}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground max-w-32 truncate">
                            {error.value || "-"}
                          </TableCell>
                          <TableCell className="text-destructive text-sm">{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                💡 Tip: Los números de fila corresponden a las filas en tu archivo Excel/CSV (incluyendo el encabezado en fila 1)
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowErrorReport(false);
                    setDetailedErrors([]);
                    setShowMapping(true);
                  }}
                >
                  Volver al Mapeo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setShowErrorReport(false);
                    setDetailedErrors([]);
                    setCsvData([]);
                    setCsvHeaders([]);
                    setShowMapping(false);
                    setShowPreview(false);
                  }}
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {errors.length > 0 && !showErrorReport && (
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-bold text-base">⚠️ Errores ({errors.length})</p>
                  <div className="bg-destructive/10 rounded-md p-3 max-h-64 overflow-y-auto">
                    <ul className="space-y-1 text-sm font-mono">
                      {errors.map((error, index) => (
                        <li key={index} className="border-b border-destructive/20 last:border-0 pb-1 mb-1">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
