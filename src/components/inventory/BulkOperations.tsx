import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Edit,
  Trash2,
  Copy,
  FileText
} from 'lucide-react'
import { BillboardStatus } from '@/types/billboard'
import { cn } from '@/lib/utils'

interface BulkOperationsProps {
  selectedCount: number
  onBulkAction: (action: string, value?: any) => void
  className?: string
}

export function BulkOperations({ selectedCount, onBulkAction, className }: BulkOperationsProps) {
  const [bulkStatus, setBulkStatus] = useState<BillboardStatus | ''>('')
  const [bulkPriceAdjustment, setBulkPriceAdjustment] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage')

  const handleStatusChange = () => {
    if (bulkStatus) {
      onBulkAction('updateStatus', bulkStatus)
      setBulkStatus('')
    }
  }

  const handlePriceAdjustment = () => {
    if (bulkPriceAdjustment) {
      onBulkAction('adjustPrice', {
        type: adjustmentType,
        value: parseFloat(bulkPriceAdjustment)
      })
      setBulkPriceAdjustment('')
    }
  }

  return (
    <Card className={cn("border-l-4 border-l-primary", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-sm">
              {selectedCount} seleccionadas
            </Badge>
            <span className="text-sm text-muted-foreground">
              Acciones en lote disponibles
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onBulkAction('clearSelection')}
          >
            Limpiar Selección
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Updates */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Cambiar Estado
            </h4>
            <div className="flex gap-2">
              <Select value={bulkStatus} onValueChange={(value: any) => setBulkStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Nuevo estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="reserved">Reservada</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="occupied">Ocupada</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                onClick={handleStatusChange}
                disabled={!bulkStatus}
              >
                Aplicar
              </Button>
            </div>
          </div>

          {/* Price Adjustments */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ajustar Precios
            </h4>
            <div className="flex gap-2">
              <Select value={adjustmentType} onValueChange={(value: any) => setAdjustmentType(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">%</SelectItem>
                  <SelectItem value="fixed">€</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder={adjustmentType === 'percentage' ? "±10" : "±100"}
                value={bulkPriceAdjustment}
                onChange={(e) => setBulkPriceAdjustment(e.target.value)}
                className="flex-1"
              />
              <Button 
                size="sm" 
                onClick={handlePriceAdjustment}
                disabled={!bulkPriceAdjustment}
              >
                Aplicar
              </Button>
            </div>
          </div>

          {/* Other Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Otras Acciones
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onBulkAction('duplicate')}
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onBulkAction('export')}
              >
                <FileText className="w-4 h-4 mr-1" />
                Exportar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onBulkAction('delete')}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onBulkAction('markAvailable')}
            className="text-status-available"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Marcar Disponibles
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onBulkAction('markOccupied')}
            className="text-status-occupied"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Marcar Ocupadas
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onBulkAction('increasePrices')}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            +10% Precios
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onBulkAction('decreasePrices')}
          >
            <DollarSign className="w-4 h-4 mr-1" />
            -10% Precios
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
