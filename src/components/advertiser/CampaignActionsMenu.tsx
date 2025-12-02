import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreVertical, Play, Pause, Copy, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CampaignStatus } from "@/context/CampaignContext";

interface CampaignActionsMenuProps {
  campaignId: string;
  campaignName: string;
  currentStatus: CampaignStatus;
  onStatusChange: () => void;
}

export function CampaignActionsMenu({
  campaignId,
  campaignName,
  currentStatus,
  onStatusChange,
}: CampaignActionsMenuProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleActivate = async () => {
    try {
      const { error } = await supabase
        .from("campañas")
        .update({ status: "active" })
        .eq("id", campaignId);

      if (error) throw error;
      toast.success("Campaña activada");
      onStatusChange();
    } catch (error) {
      console.error("Error activating campaign:", error);
      toast.error("Error al activar la campaña");
    }
  };

  const handlePause = async () => {
    try {
      const { error } = await supabase
        .from("campañas")
        .update({ status: "paused" })
        .eq("id", campaignId);

      if (error) throw error;
      toast.success("Campaña pausada");
      onStatusChange();
    } catch (error) {
      console.error("Error pausing campaign:", error);
      toast.error("Error al pausar la campaña");
    }
  };

  const handleDuplicate = async () => {
    try {
      // Obtener campaña original
      const { data: originalCampaign, error: fetchError } = await supabase
        .from("campañas")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (fetchError) throw fetchError;

      // Crear duplicado
      const { error: insertError } = await supabase
        .from("campañas")
        .insert({
          advertiser_id: originalCampaign.advertiser_id,
          nombre: `${originalCampaign.nombre} (Copia)`,
          propuesta: originalCampaign.propuesta,
          presupuesto_total: originalCampaign.presupuesto_total,
          metodo_busqueda: originalCampaign.metodo_busqueda,
          status: "draft",
        });

      if (insertError) throw insertError;
      toast.success("Campaña duplicada como borrador");
      onStatusChange();
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast.error("Error al duplicar la campaña");
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("campañas")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
      toast.success("Campaña eliminada");
      onStatusChange();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Error al eliminar la campaña");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentStatus === "draft" && (
            <DropdownMenuItem onClick={handleActivate}>
              <Play className="mr-2 h-4 w-4" />
              Activar campaña
            </DropdownMenuItem>
          )}
          {currentStatus === "active" && (
            <DropdownMenuItem onClick={handlePause}>
              <Pause className="mr-2 h-4 w-4" />
              Pausar campaña
            </DropdownMenuItem>
          )}
          {(currentStatus === "paused" || currentStatus === "inactive") && (
            <DropdownMenuItem onClick={handleActivate}>
              <Play className="mr-2 h-4 w-4" />
              Reactivar campaña
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar campaña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la campaña "{campaignName}"?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
