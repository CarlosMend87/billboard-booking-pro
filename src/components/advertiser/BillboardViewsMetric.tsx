import { Eye } from "lucide-react";
import { useBillboardViews } from "@/hooks/useBillboardViews";
import { Badge } from "@/components/ui/badge";

interface BillboardViewsMetricProps {
  billboardId: string;
  className?: string;
}

export function BillboardViewsMetric({ billboardId, className = "" }: BillboardViewsMetricProps) {
  const { viewersCount } = useBillboardViews(billboardId);

  if (viewersCount === 0) return null;

  return (
    <Badge variant="secondary" className={`flex items-center gap-2 ${className}`}>
      <Eye className="h-4 w-4" />
      <span>
        {viewersCount} {viewersCount === 1 ? 'usuario viendo' : 'usuarios viendo'} este espacio
      </span>
    </Badge>
  );
}
