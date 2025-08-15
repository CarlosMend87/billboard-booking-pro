import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Header } from "@/components/layout/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Upload, MapPin, Camera, Calculator } from "lucide-react"
import { toast } from "sonner"

const billboardSchema = z.object({
  type: z.enum(["fixed", "digital"]),
  // Medidas
  width_meters: z.number().min(1, "Ancho debe ser mayor a 0"),
  height_meters: z.number().min(1, "Alto debe ser mayor a 0"),
  width_pixels: z.number().optional(),
  height_pixels: z.number().optional(),
  // Ubicación
  commercial_address: z.string().min(1, "Dirección comercial es obligatoria"),
  official_address: z.string().min(1, "Dirección oficial es obligatoria"),
  latitude: z.number().min(-90).max(90, "Latitud inválida"),
  longitude: z.number().min(-180).max(180, "Longitud inválida"),
  // Precios
  published_rate: z.number().min(0, "Tarifa debe ser mayor a 0"),
  max_discount: z.number().min(0).max(100, "Descuento máximo entre 0-100%"),
  // Fotografía
  photo: z.any().refine((files) => files?.length > 0, "Fotografía es obligatoria"),
})

type BillboardFormData = z.infer<typeof billboardSchema>

const AddBillboard = () => {
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [billboardType, setBillboardType] = useState<"fixed" | "digital">("fixed")
  const [bulkCount, setBulkCount] = useState(1)

  const form = useForm<BillboardFormData>({
    resolver: zodResolver(billboardSchema),
    defaultValues: {
      type: "fixed",
      width_meters: 0,
      height_meters: 0,
      width_pixels: undefined,
      height_pixels: undefined,
      commercial_address: "",
      official_address: "",
      latitude: 0,
      longitude: 0,
      published_rate: 0,
      max_discount: 0,
    },
  })

  const onSubmit = (data: BillboardFormData) => {
    if (isBulkMode) {
      // Lógica para crear múltiples vallas
      toast.success(`${bulkCount} vallas agregadas exitosamente`)
    } else {
      // Lógica para crear una valla
      toast.success("Valla agregada exitosamente")
    }
    console.log("Form data:", data)
  }

  const watchedType = form.watch("type")

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Agregar Nueva Valla</h1>
                <p className="text-muted-foreground">
                  Registra nuevas vallas publicitarias en tu inventario
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Modo Unitario</span>
                  <Switch
                    checked={isBulkMode}
                    onCheckedChange={setIsBulkMode}
                  />
                  <span className="text-sm font-medium">Modo Bulk</span>
                </div>
                
                {isBulkMode && (
                  <Badge variant="secondary" className="text-sm">
                    {bulkCount} vallas
                  </Badge>
                )}
              </div>
            </div>

            {isBulkMode && (
              <Card className="bg-gradient-card border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Configuración Bulk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cantidad de vallas</label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={bulkCount}
                        onChange={(e) => setBulkCount(Number(e.target.value))}
                        className="w-24"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Se crearán {bulkCount} vallas con la misma configuración base.
                      Podrás editar individualmente después.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Form Section */}
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Información de la Valla
              </CardTitle>
              <CardDescription>
                Completa todos los campos requeridos para registrar la valla
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  
                  {/* Tipo de Valla */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tipo de Valla</h3>
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                setBillboardType(value as "fixed" | "digital")
                              }}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fixed">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-status-available"></div>
                                    Valla Fija
                                  </div>
                                </SelectItem>
                                <SelectItem value="digital">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    Valla Digital
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Medidas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Medidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="width_meters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ancho (metros)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="height_meters"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alto (metros)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchedType === "digital" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <FormField
                          control={form.control}
                          name="width_pixels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ancho (píxeles)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>Resolución horizontal de la pantalla</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="height_pixels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alto (píxeles)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>Resolución vertical de la pantalla</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Fotografía */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      Fotografía
                    </h3>
                    <FormField
                      control={form.control}
                      name="photo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imagen de la valla *</FormLabel>
                          <FormControl>
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Click para subir fotografía</p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG hasta 10MB
                                </p>
                              </div>
                              <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => field.onChange(e.target.files)}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Ubicación */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Ubicación
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="commercial_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección Comercial</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Av. Reforma esquina con Insurgentes" {...field} />
                          </FormControl>
                          <FormDescription>Dirección corta para uso comercial</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="official_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección Oficial Completa</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Calle, número, colonia, delegación, ciudad, país, código postal"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Dirección completa y oficial</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitud</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="19.432608"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitud</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="any"
                                placeholder="-99.133209"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Precios */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tarifas</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="published_rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tarifa Publicada ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>Precio base por mes</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="max_discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descuento Máximo (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>Descuento máximo aplicable</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button variant="outline" type="button">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-gradient-primary">
                      {isBulkMode ? `Crear ${bulkCount} Vallas` : "Crear Valla"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default AddBillboard