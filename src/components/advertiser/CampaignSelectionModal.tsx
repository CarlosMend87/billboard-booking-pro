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
import { Loader2, Eye, Play, Pause, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Campaign {
  id: string;
  nombre: string;
  status: string;
  presupuesto_total: number;
  propuesta: string;
  metodo_busqueda: string;
  dias_totales: number;
  dias_transcurridos: number;
  fecha_inicio: string;
  fecha_fin: string;
}

interface CampaignSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCampaign?: (campaign: Campaign) => void;
}

export function CampaignSelectionModal({
  open,
  onClose,
  onSelectCampaign,
}: CampaignSelectionModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const handleSelectDraft = (campaign: Campaign) => {
    if (onSelectCampaign) {
      onSelectCampaign(campaign);
      onClose();
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    setActionLoading(campaignId);
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from("campañas")
        .update({ status: newStatus })
        .eq("id", campaignId);

      if (error) throw error;

      toast.success(`Campaña ${newStatus === 'active' ? 'activada' : 'desactivada'}`);
      fetchCampaigns();
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Error al actualizar la campaña");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setActionLoading(deleteId);
    try {
      const { error } = await supabase
        .from("campañas")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Campaña eliminada");
      fetchCampaigns();
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Error al eliminar la campaña");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      draft: { label: "Borrador", variant: "outline" },
      active: { label: "Activa", variant: "default" },
      inactive: { label: "Pausada", variant: "secondary" },
    };

    const config = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const draftCampaigns = campaigns.filter(c => c.status === 'draft').length;
  const inactiveCampaigns = campaigns.filter(c => c.status === 'inactive').length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mis Campañas</DialogTitle>
          <DialogDescription>
            Gestiona tus campañas, continúa borradores o consulta el progreso
          </DialogDescription>
          {campaigns.length > 0 && (
            <div className="flex gap-2 pt-2">
              <Badge variant="default">Activas: {activeCampaigns}</Badge>
              <Badge variant="outline">Borradores: {draftCampaigns}</Badge>
              <Badge variant="secondary">Pausadas: {inactiveCampaigns}</Badge>
            </div>
          )}
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
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{campaign.nombre}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Presupuesto: ${campaign.presupuesto_total.toLocaleString('es-MX')}</div>
                      {campaign.status === 'draft' ? (
                        <>
                          {campaign.propuesta && <div>Propuesta: {campaign.propuesta}</div>}
                          {campaign.metodo_busqueda && (
                            <div>Método: {campaign.metodo_busqueda}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <div>
                            Días: {campaign.dias_transcurridos || 0} / {campaign.dias_totales || 0}
                          </div>
                          {campaign.fecha_inicio && campaign.fecha_fin && (
                            <div>
                              {new Date(campaign.fecha_inicio).toLocaleDateString('es-MX')} - {' '}
                              {new Date(campaign.fecha_fin).toLocaleDateString('es-MX')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {campaign.status === 'draft' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleSelectDraft(campaign)}
                          disabled={actionLoading === campaign.id}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Continuar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteId(campaign.id)}
                          disabled={actionLoading === campaign.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleViewCampaign(campaign.id)}
                          disabled={actionLoading === campaign.id}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                          disabled={actionLoading === campaign.id}
                        >
                          {actionLoading === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : campaign.status === 'active' ? (
                            <>
                              <Pause className="h-4 w-4 mr-1" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Activar
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar borrador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El borrador será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}