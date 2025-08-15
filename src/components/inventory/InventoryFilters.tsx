import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { BillboardStatus, BillboardType } from '@/types/billboard'

interface FilterState {
  search: string
  status: BillboardStatus | 'all'
  type: BillboardType | 'all'
  location: string
  priceRange: [number, number]
}

interface InventoryFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onReset: () => void
}

const commonLocations = [
  'Centro Comercial',
  'Autopista',
  'Metro',
  'Aeropuerto',
  'Plaza',
  'Estación',
  'Hospital',
  'Universidad'
]

export function InventoryFilters({ filters, onFiltersChange, onReset }: InventoryFiltersProps) {
  const handlePriceRangeChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      priceRange: [values[0], values[1]]
    })
  }

  const handleLocationSelect = (location: string) => {
    onFiltersChange({
      ...filters,
      location: location === filters.location ? '' : location
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status !== 'all') count++
    if (filters.type !== 'all') count++
    if (filters.location) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Filtros Avanzados</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Location Search */}
          <div className="space-y-2">
            <Label>Ubicación Específica</Label>
            <Input
              placeholder="Ej. Centro, Norte..."
              value={filters.location}
              onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
            />
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label>Rango de Precio ($/mes)</Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                max={10000}
                min={0}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Capacity (for digital) */}
          <div className="space-y-2">
            <Label>Capacidad de Clientes</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="low">1-5 clientes</SelectItem>
                <SelectItem value="medium">6-10 clientes</SelectItem>
                <SelectItem value="high">11-15 clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Revenue Performance */}
          <div className="space-y-2">
            <Label>Rendimiento</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cualquiera</SelectItem>
                <SelectItem value="high">Alto rendimiento</SelectItem>
                <SelectItem value="medium">Rendimiento medio</SelectItem>
                <SelectItem value="low">Bajo rendimiento</SelectItem>
                <SelectItem value="vacant">Sin ocupar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Location Filters */}
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">Ubicaciones Populares</Label>
          <div className="flex flex-wrap gap-2">
            {commonLocations.map((location) => (
              <Badge
                key={location}
                variant={filters.location.includes(location.toLowerCase()) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleLocationSelect(location.toLowerCase())}
              >
                {location}
              </Badge>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Filtros Activos:</span>
              <Button variant="ghost" size="sm" onClick={onReset}>
                Limpiar Todo
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.search && (
                <Badge variant="secondary">
                  Búsqueda: "{filters.search}"
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, search: '' })}
                  />
                </Badge>
              )}
              {filters.status !== 'all' && (
                <Badge variant="secondary">
                  Estado: {filters.status}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, status: 'all' })}
                  />
                </Badge>
              )}
              {filters.type !== 'all' && (
                <Badge variant="secondary">
                  Tipo: {filters.type === 'fixed' ? 'Fija' : 'Digital'}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, type: 'all' })}
                  />
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary">
                  Ubicación: {filters.location}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => onFiltersChange({ ...filters, location: '' })}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}