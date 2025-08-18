import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Grid3X3, TableProperties, Download, Plus } from 'lucide-react'
import { mockInventoryAssets, InventoryAsset } from '@/lib/mockInventory'
import { Link } from 'react-router-dom'

interface FilterState {
  search: string
  status: 'disponible' | 'reservado' | 'ocupado' | 'en_revision' | 'aceptado' | 'all'
  type: 'espectacular' | 'muro' | 'valla' | 'parabus' | 'digital' | 'all'
  location: string
  priceRange: [number, number]
}

export function EnhancedInventoryManager() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    type: 'all', 
    location: '',
    priceRange: [0, 50000]
  })

  // Use the new inventory assets
  const allAssets = useMemo(() => mockInventoryAssets, [])

  // Filter and search logic
  const filteredAssets = useMemo(() => {
    return allAssets.filter(asset => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        if (!asset.id.toLowerCase().includes(searchTerm) && 
            !asset.nombre.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all' && asset.estado !== filters.status) {
        return false
      }

      // Type filter
      if (filters.type !== 'all' && asset.tipo !== filters.type) {
        return false
      }

      // Location filter
      if (filters.location && !asset.nombre.toLowerCase().includes(filters.location.toLowerCase())) {
        return false
      }

      // Price range filter
      const price = asset.precio.mensual || 0
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false
      }

      return true
    })
  }, [allAssets, filters])

  const stats = {
    total: allAssets.length,
    available: allAssets.filter(a => a.estado === 'disponible').length,
    occupied: allAssets.filter(a => a.estado === 'ocupado').length,
    reserved: allAssets.filter(a => a.estado === 'reservado').length,
    enRevision: allAssets.filter(a => a.estado === 'en_revision').length,
    aceptados: allAssets.filter(a => a.estado === 'aceptado').length
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reservados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ocupados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Gestión de Inventario</CardTitle>
              <p className="text-muted-foreground">
                {filteredAssets.length} de {allAssets.length} anuncios
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button asChild>
                <Link to="/add-billboard">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Anuncio
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por ID o nombre..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponibles</SelectItem>
                <SelectItem value="reservado">Reservados</SelectItem>
                <SelectItem value="ocupado">Ocupados</SelectItem>
                <SelectItem value="en_revision">En Revisión</SelectItem>
                <SelectItem value="aceptado">Aceptados</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="espectacular">Espectacular</SelectItem>
                <SelectItem value="muro">Muro</SelectItem>
                <SelectItem value="valla">Valla</SelectItem>
                <SelectItem value="parabus">Parabús</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <TableProperties className="h-4 w-4" />
                  Tabla
                </TabsTrigger>
                <TabsTrigger value="grid" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Cuadrícula
                </TabsTrigger>
              </TabsList>
              
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredAssets.length} de {allAssets.length} anuncios
              </p>
            </div>
            
            <TabsContent value="table" className="mt-0">
              <div className="rounded-md border">
                <div className="p-8 text-center text-muted-foreground">
                  <TableProperties className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Vista de tabla en desarrollo</p>
                  <p className="text-sm">Por ahora usa la vista de cuadrícula</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="grid" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssets.map((asset) => (
                  <Card key={asset.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{asset.nombre}</CardTitle>
                          <p className="text-sm text-muted-foreground">ID: {asset.id}</p>
                        </div>
                        <Badge 
                          variant={
                            asset.estado === 'disponible' ? 'default' : 
                            asset.estado === 'reservado' ? 'secondary' : 
                            asset.estado === 'ocupado' ? 'destructive' :
                            asset.estado === 'en_revision' ? 'outline' :
                            'default'
                          }
                        >
                          {asset.estado === 'en_revision' ? 'En Revisión' : 
                           asset.estado === 'aceptado' ? 'Aceptado' : 
                           asset.estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span className="capitalize font-medium">{asset.tipo}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Dimensiones:</span>
                          <span>
                            {asset.medidas.ancho_m || asset.medidas.base_m}m × {asset.medidas.alto_m}m
                            {asset.medidas.caras > 1 && ` (${asset.medidas.caras} caras)`}
                          </span>
                        </div>
                        {asset.precio.mensual && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Precio:</span>
                            <span className="font-semibold text-primary">
                              ${asset.precio.mensual.toLocaleString()}/mes
                            </span>
                          </div>
                        )}
                        {asset.propietario && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Propietario:</span>
                            <span>{asset.propietario}</span>
                          </div>
                        )}
                        
                        <div className="pt-2 border-t">
                          <Button variant="outline" size="sm" className="w-full">
                            Ver Detalles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {filteredAssets.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron anuncios</h3>
                  <p className="text-muted-foreground">
                    Intenta ajustar los filtros para encontrar más opciones.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}