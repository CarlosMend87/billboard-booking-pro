import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X, MapPin, Camera } from "lucide-react";
import { useBillboards, Billboard } from "@/hooks/useBillboards";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const billboardSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  tipo: z.enum(['espectacular', 'muro', 'valla', 'parabus', 'digital']),
  status: z.enum(['disponible', 'ocupada', 'mantenimiento']),
  // Medidas
  ancho_m: z.number().optional(), 
  alto_m: z.number().optional(),
  base_m: z.number().optional(),
  caras: z.number().min(1).max(4),
  modulos: z.number().optional(),
  // Digital
  loop_seg: z.number().optional(),
  slot_seg: z.number().optional(),
  // Computer Vision / AdMobilize
  has_computer_vision: z.boolean().optional(),
  admobilize_device_id: z.string().optional(),
  // Contratación
  mensual: z.boolean().optional(),
  catorcenal: z.boolean().optional(),
  semanal: z.boolean().optional(),
  spot: z.boolean().optional(),
  hora: z.boolean().optional(),
  dia: z.boolean().optional(),
  cpm: z.boolean().optional(),
  // Campos adicionales para "Por Spot"
  duracion_spot_seg: z.number().optional(),
  total_spots_pantalla: z.number().optional(),
  spots_disponibles: z.number().optional(),
  // Precios
  precio_mensual: z.number().optional(),
  precio_spot: z.number().optional(),
  precio_hora: z.number().optional(),
  precio_dia: z.number().optional(),
  precio_cpm: z.number().optional(),
  descuento_volumen: z.number().optional(),
});

type BillboardFormData = z.infer<typeof billboardSchema>;

interface BillboardFormProps {
  billboard?: Billboard | null;
  onClose: () => void;
}

export function BillboardForm({ billboard, onClose }: BillboardFormProps) {
  const { createBillboard, updateBillboard, uploadBillboardImage } = useBillboards();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(billboard?.fotos || []);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<BillboardFormData>({
    resolver: zodResolver(billboardSchema),
    defaultValues: {
      nombre: billboard?.nombre || "",
      direccion: billboard?.direccion || "",
      lat: Number(billboard?.lat) || 19.4326,
      lng: Number(billboard?.lng) || -99.1332,
      tipo: (billboard?.tipo as any) || 'espectacular',
      status: (billboard?.status as any) || 'disponible',
      caras: (billboard?.medidas as any)?.caras || 1,
      ancho_m: (billboard?.medidas as any)?.ancho_m,
      alto_m: (billboard?.medidas as any)?.alto_m,
      base_m: (billboard?.medidas as any)?.base_m,
      modulos: (billboard?.medidas as any)?.modulos,
      loop_seg: (billboard?.digital as any)?.loop_seg,
      slot_seg: (billboard?.digital as any)?.slot_seg,
      has_computer_vision: (billboard as any)?.has_computer_vision || false,
      admobilize_device_id: (billboard as any)?.admobilize_config?.device_id || "",
      mensual: (billboard?.contratacion as any)?.mensual ?? true,
      catorcenal: (billboard?.contratacion as any)?.catorcenal ?? true,
      semanal: (billboard?.contratacion as any)?.semanal ?? true,
      spot: (billboard?.contratacion as any)?.spot ?? true,
      hora: (billboard?.contratacion as any)?.hora ?? true,
      dia: (billboard?.contratacion as any)?.dia ?? true,
      cpm: (billboard?.contratacion as any)?.cpm ?? true,
      duracion_spot_seg: (billboard?.contratacion as any)?.duracion_spot_seg,
      total_spots_pantalla: (billboard?.contratacion as any)?.total_spots_pantalla,
      spots_disponibles: (billboard?.contratacion as any)?.spots_disponibles,
      precio_mensual: (billboard?.precio as any)?.mensual,
      precio_spot: (billboard?.precio as any)?.spot,
      precio_hora: (billboard?.precio as any)?.hora,
      precio_dia: (billboard?.precio as any)?.dia,
      precio_cpm: (billboard?.precio as any)?.cpm,
      descuento_volumen: (billboard?.precio as any)?.descuento_volumen,
    }
  });

  const selectedTipo = form.watch("tipo");
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const tempId = billboard?.id || 'temp-' + Date.now();
    
    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadBillboardImage(file, tempId)
      );
      
      const urls = await Promise.all(uploadPromises);
      const validUrls = urls.filter(url => url !== null) as string[];
      
      setUploadedImages(prev => [...prev, ...validUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: BillboardFormData) => {
    setIsSubmitting(true);
    
    console.log('Datos del formulario:', data);
    console.log('Coordenadas a guardar:', { lat: data.lat, lng: data.lng });
    
    try {
      const billboardData = {
        nombre: data.nombre,
        direccion: data.direccion,
        lat: data.lat,
        lng: data.lng,
        tipo: data.tipo,
        status: data.status,
        medidas: {
          ancho_m: data.ancho_m,
          alto_m: data.alto_m,
          base_m: data.base_m,
          caras: data.caras,
          modulos: data.modulos,
        },
        digital: selectedTipo === 'digital' ? {
          loop_seg: data.loop_seg,
          slot_seg: data.slot_seg,
        } : null,
        has_computer_vision: data.has_computer_vision || false,
        admobilize_config: data.has_computer_vision && data.admobilize_device_id ? {
          device_id: data.admobilize_device_id
        } : null,
        contratacion: {
          mensual: data.mensual,
          catorcenal: data.catorcenal,
          semanal: data.semanal,
          spot: data.spot,
          hora: data.hora,
          dia: data.dia,
          cpm: data.cpm,
          duracion_spot_seg: data.duracion_spot_seg,
          total_spots_pantalla: data.total_spots_pantalla,
          spots_disponibles: data.spots_disponibles,
        },
        precio: {
          mensual: data.precio_mensual,
          spot: data.precio_spot,
          hora: data.precio_hora,
          dia: data.precio_dia,
          cpm: data.precio_cpm,
          descuento_volumen: data.descuento_volumen,
        },
        fotos: uploadedImages,
      };

      if (billboard) {
        console.log('Actualizando billboard con datos:', billboardData);
        const updated = await updateBillboard(billboard.id, billboardData);
        console.log('Billboard actualizado exitosamente:', updated);
      } else {
        console.log('Creando nuevo billboard:', billboardData);
        await createBillboard(billboardData);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving billboard:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="specs">Especificaciones</TabsTrigger>
            <TabsTrigger value="cv">IA/Vision</TabsTrigger>
            <TabsTrigger value="pricing">Precios</TabsTrigger>
            <TabsTrigger value="images">Imágenes</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Pantalla</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Pantalla Centro Comercial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Dirección completa de la pantalla" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitud</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            placeholder="19.4326"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lng"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitud</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            placeholder="-99.1332"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Pantalla</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="espectacular">Espectacular</SelectItem>
                            <SelectItem value="muro">Muro</SelectItem>
                            <SelectItem value="valla">Valla</SelectItem>
                            <SelectItem value="parabus">Parabús</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="disponible">Disponible</SelectItem>
                            <SelectItem value="ocupada">Ocupada</SelectItem>
                            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones Técnicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ancho_m"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolución (ancho en píxeles)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1" 
                            placeholder="1920"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alto_m"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolución (alto en píxeles)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1" 
                            placeholder="1080"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caras"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caras</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="4" 
                            placeholder="2"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {selectedTipo === 'digital' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="loop_seg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loop (segundos)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="60"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slot_seg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slot (segundos)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div>
                  <Label className="text-base font-medium mb-4 block">Modalidades de Contratación</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="mensual"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Mensual</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="catorcenal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Catorcenal</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="semanal"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Semanal</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="spot"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel>Por Spot</FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dia"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox 
                              checked={field.value} 
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                if (checked) {
                                  form.setValue('tipo', 'digital');
                                }
                              }} 
                            />
                          </FormControl>
                          <FormLabel>Por Día</FormLabel>
                        </FormItem>
                      )}
                    />

                    {selectedTipo === 'digital' && (
                      <FormField
                        control={form.control}
                        name="hora"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>Por Hora</FormLabel>
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedTipo === 'digital' && !form.watch("dia") && (
                      <FormField
                        control={form.control}
                        name="cpm"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel>CPM</FormLabel>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {form.watch("spot") && (
                    <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                      <Label className="text-sm font-medium mb-4 block">Configuración de Spots</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="duracion_spot_seg"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duración del spot (segundos)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="10"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="total_spots_pantalla"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total de spots por pantalla</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="100"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="spots_disponibles"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spots disponibles</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="85"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cv" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Computer Vision / AdMobilize</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>AdMobilize</strong> permite detectar y contabilizar vehículos y personas que pasan frente a la pantalla utilizando tecnología de Computer Vision.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="has_computer_vision"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Esta pantalla cuenta con tecnología de Computer Vision (IA)
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Activa esta opción si tu pantalla utiliza AdMobilize para el conteo de audiencia
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("has_computer_vision") && (
                  <FormField
                    control={form.control}
                    name="admobilize_device_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID del Dispositivo AdMobilize</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: ADM-12345"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Ingresa el identificador único del dispositivo AdMobilize instalado en esta pantalla
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Precios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {form.watch("mensual") && (
                    <FormField
                      control={form.control}
                      name="precio_mensual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio Mensual ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="25000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("spot") && (
                    <FormField
                      control={form.control}
                      name="precio_spot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio por Spot ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="15"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("hora") && (
                    <FormField
                      control={form.control}
                      name="precio_hora"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio por Hora ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="600"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("dia") && (
                    <FormField
                      control={form.control}
                      name="precio_dia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio por Día ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="4000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("cpm") && (
                    <FormField
                      control={form.control}
                      name="precio_cpm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Precio CPM ($)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="80"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="descuento_volumen"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descuento por Volumen (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="8"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Imágenes de la Pantalla</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <div className="text-lg font-medium text-gray-900 mb-2">
                    Subir imágenes
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Selecciona múltiples imágenes de tu pantalla
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Subiendo...' : 'Seleccionar Imágenes'}
                  </Button>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((url, index) => (
                      <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={url} 
                          alt={`Billboard ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (billboard ? 'Actualizar' : 'Crear')}
          </Button>
        </div>
      </form>
    </Form>
  );
}