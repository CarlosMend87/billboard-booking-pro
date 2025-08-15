import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Billboard, BillboardStatus } from '@/types/billboard'
import { Edit, MoreHorizontal, Eye, MapPin } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InventoryTableProps {
  billboards: Billboard[]
  selectedBillboards: string[]
  onSelectAll: (checked: boolean) => void
  onSelectBillboard: (billboardId: string, checked: boolean) => void
}

export function InventoryTable({ 
  billboards, 
  selectedBillboards, 
  onSelectAll, 
  onSelectBillboard 
}: InventoryTableProps) {
  const allSelected = billboards.length > 0 && selectedBillboards.length === billboards.length
  const someSelected = selectedBillboards.length > 0 && selectedBillboards.length < billboards.length

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(price)
  }

  const getRevenue = (billboard: Billboard) => {
    if (billboard.type === 'fixed') {
      return billboard.client ? billboard.monthlyPrice : 0
    } else {
      // Calculate digital billboard revenue based on current clients
      return billboard.currentClients.reduce((total, client) => {
        return total + client.price
      }, 0)
    }
  }

  const getOccupancy = (billboard: Billboard) => {
    if (billboard.type === 'fixed') {
      return billboard.status === 'available' ? '0%' : '100%'
    } else {
      const occupiedSlots = billboard.maxClients - billboard.availableSlots
      return `${Math.round((occupiedSlots / billboard.maxClients) * 100)}%`
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Dimensiones</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Ocupación</TableHead>
            <TableHead>Precio Base</TableHead>
            <TableHead>Ingresos Actuales</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {billboards.map((billboard) => (
            <TableRow key={billboard.id}>
              <TableCell>
                <Checkbox
                  checked={selectedBillboards.includes(billboard.id)}
                  onCheckedChange={(checked) => onSelectBillboard(billboard.id, !!checked)}
                />
              </TableCell>
              
              <TableCell className="font-medium">{billboard.id}</TableCell>
              
              <TableCell>
                <Badge variant={billboard.type === 'fixed' ? 'secondary' : 'default'}>
                  {billboard.type === 'fixed' ? 'Fija' : 'Digital'}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate max-w-[200px]" title={billboard.location}>
                    {billboard.location}
                  </span>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  {billboard.size.width_meters}m × {billboard.size.height_meters}m
                  {billboard.size.width_pixels && (
                    <div className="text-xs text-muted-foreground">
                      {billboard.size.width_pixels} × {billboard.size.height_pixels}px
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <StatusBadge variant={billboard.status as any}>
                  {billboard.status === 'available' && 'Disponible'}
                  {billboard.status === 'reserved' && 'Reservada'}
                  {billboard.status === 'confirmed' && 'Confirmada'}
                  {billboard.status === 'occupied' && 'Ocupada'}
                </StatusBadge>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        getOccupancy(billboard) === '100%' ? 'bg-status-occupied' :
                        getOccupancy(billboard) === '0%' ? 'bg-status-available' :
                        'bg-status-reserved'
                      }`}
                      style={{ width: getOccupancy(billboard) }}
                    />
                  </div>
                  <span className="text-sm font-medium">{getOccupancy(billboard)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                {billboard.type === 'fixed' 
                  ? formatPrice(billboard.monthlyPrice)
                  : formatPrice(billboard.pricePerMonth || 0)
                }
              </TableCell>
              
              <TableCell>
                <div className="font-medium text-success">
                  {formatPrice(getRevenue(billboard))}
                </div>
                {billboard.type === 'digital' && (
                  <div className="text-xs text-muted-foreground">
                    {billboard.currentClients.length}/{billboard.maxClients} clientes
                  </div>
                )}
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <MapPin className="w-4 h-4 mr-2" />
                      Ver en Mapa
                    </DropdownMenuItem>
                    {billboard.type === 'digital' && (
                      <DropdownMenuItem>
                        Gestionar Clientes
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {billboards.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron vallas que coincidan con los filtros aplicados.
        </div>
      )}
    </div>
  )
}
