import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Campaign {
  id: string;
  nombre: string;
  status: string;
  presupuesto_total: number;
  dias_totales: number;
  dias_transcurridos: number;
  fecha_inicio: string;
  fecha_fin: string;
}

interface CampaignSelectionModalProps {
  open: boolean;
  onClose: () => void;
}

export function CampaignSelectionModal({
  open,
  onClose,
}: CampaignSelectionModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && user) {
      fetchCampaigns();
    }
  }, [open, user]);

  const fetchCampaigns = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campañas")
        .select("*")
        .eq("advertiser_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Error al cargar campañas");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/progreso-campana?id=${campaignId}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tus Campañas</DialogTitle>
          <DialogDescription>
            Selecciona una campaña para ver su progreso
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tienes campañas creadas aún
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{campaign.nombre}</h3>
                      <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                        {campaign.status === 'active' ? 'Activa' : campaign.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Presupuesto: ${campaign.presupuesto_total.toLocaleString('es-MX')}</div>
                      <div>
                        Días: {campaign.dias_transcurridos || 0} / {campaign.dias_totales}
                      </div>
                      <div>
                        {new Date(campaign.fecha_inicio).toLocaleDateString('es-MX')} - {' '}
                        {new Date(campaign.fecha_fin).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleViewCampaign(campaign.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}