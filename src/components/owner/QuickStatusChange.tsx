import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Billboard, UpdateBillboard } from "@/hooks/useBillboards";

interface QuickStatusChangeProps {
  billboard: Billboard;
  updateBillboard: (id: string, updates: UpdateBillboard) => Promise<Billboard | undefined>;
}

export function QuickStatusChange({ billboard, updateBillboard }: QuickStatusChangeProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateBillboard(billboard.id, { status: newStatus });
    } finally {
      setIsUpdating(false);
    }
  };

  const statusOptions = [
    { value: 'disponible', label: 'Disponible', color: 'text-green-600' },
    { value: 'ocupada', label: 'Ocupada', color: 'text-red-600' },
    { value: 'mantenimiento', label: 'Mantenimiento', color: 'text-yellow-600' }
  ];

  const currentStatus = statusOptions.find(option => option.value === billboard.status);

  return (
    <div className="flex items-center gap-2">
      <Select value={billboard.status} onValueChange={handleStatusChange} disabled={isUpdating}>
        <SelectTrigger className="w-40">
          <SelectValue>
            <span className={currentStatus?.color}>
              {currentStatus?.label || billboard.status}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className={option.color}>{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isUpdating && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      )}
    </div>
  );
}