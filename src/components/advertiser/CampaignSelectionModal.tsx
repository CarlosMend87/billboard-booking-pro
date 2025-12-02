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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Eye, Play, FileEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCampaign, CampaignStatus } from "@/context/CampaignContext";
import { CampaignActionsMenu } from "./CampaignActionsMenu";

interface Campaign {
  id: string;
  nombre: string;
  status: CampaignStatus;
  presupuesto_total: number;
  dias_totales: number | null;
  dias_transcurridos: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  propuesta: string | null;
  metodo_busqueda: string | null;
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
  const { setCurrentCampaign } = useCampaign();
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
      setCampaigns((data || []) as Campaign[]);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Error al cargar campañas");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCampaign = (campaignId: string, status: CampaignStatus) => {
    if (status === 'draft') {
      // Para borradores, seleccionar como campaña actual
      setCurrentCampaign(campaignId);
      toast.success("Borrador seleccionado. Continúa agregando inventario.");
      onClose();
    } else {
      // Para campañas activas/completadas, ver progreso
      navigate(`/progreso-campana?id=${campaignId}`);
      onClose();
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const variants = {
      draft: { label: "Borrador", variant: "secondary" as const },
      active: { label: "Activa", variant: "default" as const },
      paused: { label: "Pausada", variant: "outline" as const },
      inactive: { label: "Inactiva", variant: "destructive" as const },
      completed: { label: "Completada", variant: "secondary" as const },
    };
    
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const drafts = campaigns.filter(c => c.status === 'draft');
  const activeCampaigns = campaigns.filter(c => c.status === 'active');
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused' || c.status === 'inactive');
  const completedCampaigns = campaigns.filter(c => c.status === 'completed');

  const renderCampaignCard = (campaign: Campaign) => (
    <div
      key={campaign.id}
      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold">{campaign.nombre}</h3>
            {getStatusBadge(campaign.status)}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Presupuesto: ${campaign.presupuesto_total.toLocaleString('es-MX')}</div>
            {campaign.dias_totales && (
              <div>
                Días: {campaign.dias_transcurridos || 0} / {campaign.dias_totales}
              </div>
            )}
            {campaign.fecha_inicio && campaign.fecha_fin && (
              <div>
                {new Date(campaign.fecha_inicio).toLocaleDateString('es-MX')} - {' '}
                {new Date(campaign.fecha_fin).toLocaleDateString('es-MX')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={campaign.status === 'draft' ? 'default' : 'outline'}
            onClick={() => handleViewCampaign(campaign.id, campaign.status)}
          >
            {campaign.status === 'draft' ? (
              <>
                <FileEdit className="h-4 w-4 mr-1" />
                Continuar
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Ver
              </>
            )}
          </Button>
          <CampaignActionsMenu
            campaignId={campaign.id}
            campaignName={campaign.nombre}
            currentStatus={campaign.status}
            onStatusChange={fetchCampaigns}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Mis Campañas</span>
            <div className="flex gap-2 text-sm font-normal">
              <Badge variant="secondary">Activas: {activeCampaigns.length}</Badge>
              <Badge variant="outline">Pausadas: {pausedCampaigns.length}</Badge>
              <Badge variant="secondary">Borradores: {drafts.length}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>
            Selecciona una campaña para continuar o ver su progreso
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
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                Todas ({campaigns.length})
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Borradores ({drafts.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Activas ({activeCampaigns.length})
              </TabsTrigger>
              <TabsTrigger value="other">
                Otras ({pausedCampaigns.length + completedCampaigns.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {campaigns.map(renderCampaignCard)}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-3 mt-4">
              {drafts.length > 0 ? (
                drafts.map(renderCampaignCard)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tienes borradores
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-3 mt-4">
              {activeCampaigns.length > 0 ? (
                activeCampaigns.map(renderCampaignCard)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tienes campañas activas
                </div>
              )}
            </TabsContent>

            <TabsContent value="other" className="space-y-3 mt-4">
              {[...pausedCampaigns, ...completedCampaigns].length > 0 ? (
                [...pausedCampaigns, ...completedCampaigns].map(renderCampaignCard)
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No tienes campañas pausadas o completadas
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}