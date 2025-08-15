import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Grid3X3, TableProperties, Download, Plus, Filter } from 'lucide-react'
import { Billboard, BillboardStatus, BillboardType } from '@/types/billboard'
import { InventoryFilters } from './InventoryFilters'
import { InventoryTable } from './InventoryTable'
import { BillboardGrid } from '../billboard/BillboardGrid'
import { BulkOperations } from './BulkOperations'
import { InventoryStats } from './InventoryStats'
import { generateMockBillboards } from '@/lib/mockData'

interface FilterState {
  search: string
  status: BillboardStatus | 'all'
  type: BillboardType | 'all'
  location: string
  priceRange: [number, number]
}

const ITEMS_PER_PAGE = 20

export function EnhancedInventoryManager() {
  const [view, setView] = useState<'grid' | 'table'>('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBillboards, setSelectedBillboards] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    type: 'all',
    location: '',
    priceRange: [0, 10000]
  })

  // Generate large mock dataset for demo
  const allBillboards = useMemo(() => generateMockBillboards(1200), [])

  // Filter and search logic
  const filteredBillboards = useMemo(() => {
    return allBillboards.filter(billboard => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        if (!billboard.id.toLowerCase().includes(searchTerm) && 
            !billboard.location.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Status filter
      if (filters.status !== 'all' && billboard.status !== filters.status) {
        return false
      }

      // Type filter
      if (filters.type !== 'all' && billboard.type !== filters.type) {
        return false
      }

      // Location filter
      if (filters.location && !billboard.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false
      }

      // Price range filter
      const price = billboard.type === 'fixed' ? billboard.monthlyPrice : billboard.pricePerMonth || 0
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false
      }

      return true
    })
  }, [allBillboards, filters])

  // Pagination
  const totalPages = Math.ceil(filteredBillboards.length / ITEMS_PER_PAGE)
  const paginatedBillboards = filteredBillboards.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBillboards(paginatedBillboards.map(b => b.id))
    } else {
      setSelectedBillboards([])
    }
  }

  const handleSelectBillboard = (billboardId: string, checked: boolean) => {
    if (checked) {
      setSelectedBillboards(prev => [...prev, billboardId])
    } else {
      setSelectedBillboards(prev => prev.filter(id => id !== billboardId))
    }
  }

  const handleBulkAction = (action: string, value?: any) => {
    // Implement bulk actions here
    console.log('Bulk action:', action, 'for billboards:', selectedBillboards, 'with value:', value)
    setSelectedBillboards([])
  }

  const handleExport = () => {
    // Implement export functionality
    const csvContent = filteredBillboards.map(billboard => ({
      ID: billboard.id,
      Tipo: billboard.type === 'fixed' ? 'Fija' : 'Digital',
      Ubicación: billboard.location,
      Estado: billboard.status,
      Precio: billboard.type === 'fixed' ? billboard.monthlyPrice : billboard.pricePerMonth
    }))
    
    const csv = [
      Object.keys(csvContent[0]).join(','),
      ...csvContent.map(row => Object.values(row).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventario-vallas.csv'
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats */}
      <InventoryStats billboards={allBillboards} />

      {/* Main Inventory Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Gestión de Inventario</CardTitle>
              <p className="text-muted-foreground">
                {filteredBillboards.length} de {allBillboards.length} vallas
                {selectedBillboards.length > 0 && ` • ${selectedBillboards.length} seleccionadas`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Valla
              </Button>
            </div>
          </div>

          {/* Search and Quick Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o ubicación..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value: any) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="available">Disponible</SelectItem>
                <SelectItem value="reserved">Reservada</SelectItem>
                <SelectItem value="confirmed">Confirmada</SelectItem>
                <SelectItem value="occupied">Ocupada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="fixed">Fija</SelectItem>
                <SelectItem value="digital">Digital</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>

            <div className="flex border rounded-lg">
              <Button
                variant={view === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('table')}
              >
                <TableProperties className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <InventoryFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={() => setFilters({
                search: '',
                status: 'all',
                type: 'all',
                location: '',
                priceRange: [0, 10000]
              })}
            />
          )}
        </CardHeader>

        <CardContent>
          {/* Bulk Operations */}
          {selectedBillboards.length > 0 && (
            <BulkOperations
              selectedCount={selectedBillboards.length}
              onBulkAction={handleBulkAction}
              className="mb-4"
            />
          )}

          {/* Content */}
          {view === 'table' ? (
            <InventoryTable
              billboards={paginatedBillboards}
              selectedBillboards={selectedBillboards}
              onSelectAll={handleSelectAll}
              onSelectBillboard={handleSelectBillboard}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paginatedBillboards.map((billboard) => (
                <div key={billboard.id} className="relative">
                  <input
                    type="checkbox"
                    checked={selectedBillboards.includes(billboard.id)}
                    onChange={(e) => handleSelectBillboard(billboard.id, e.target.checked)}
                    className="absolute top-2 left-2 z-10"
                  />
                  {billboard.type === 'fixed' ? (
                    <div>Fixed Billboard Card Placeholder</div>
                  ) : (
                    <div>Digital Billboard Card Placeholder</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredBillboards.length)} de {filteredBillboards.length} resultados
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  
                  {totalPages > 5 && (
                    <>
                      <span className="text-muted-foreground">...</span>
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}