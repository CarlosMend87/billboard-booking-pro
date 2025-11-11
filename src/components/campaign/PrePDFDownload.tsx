import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Campaign {
  id: string;
  nombre: string;
  presupuesto_total: number;
  dias_totales: number;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  duracion_dias?: number;
  reserva?: {
    asset_name: string;
    asset_type: string;
    modalidad: string;
    ubicacion?: string;
    precio_total?: number;
  };
  reservas?: {
    asset_name: string;
    asset_type: string;
    modalidad: string;
    ubicacion?: string;
  };
}

interface PrePDFDownloadProps {
  campaign: Campaign;
}

export function PrePDFDownload({ campaign }: PrePDFDownloadProps) {
  const generatePrePDF = () => {
    const doc = new jsPDF();
    
    // Colors
    const primaryColor: [number, number, number] = [139, 92, 246]; // Purple
    const secondaryColor: [number, number, number] = [34, 34, 34]; // Dark gray
    const accentColor: [number, number, number] = [245, 158, 11]; // Orange
    
    // Header background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Platform name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont("helvetica", "bold");
    doc.text("Adavailable", 20, 25);
    
    // Subtitle
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Propuesta de Campaña Aprobada", 20, 33);
    
    // Reset text color
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    // Document info
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, 140, 50);
    doc.text(`Folio: ${campaign.id.substring(0, 8).toUpperCase()}`, 140, 55);
    
    // Campaign title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Detalles de la Campaña", 20, 65);
    
    // Divider line
    doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 68, 190, 68);
    
    // Campaign details in a structured format
    let yPosition = 80;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Left column
    doc.setFont("helvetica", "bold");
    doc.text("Nombre de Campaña:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(campaign.nombre, 70, yPosition);
    
    yPosition += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Estado:", 20, yPosition);
    doc.setFillColor(34, 197, 94); // Green for accepted
    doc.roundedRect(70, yPosition - 4, 25, 6, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text("APROBADA", 72, yPosition);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Inversión Total:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`$${campaign.presupuesto_total?.toLocaleString('es-MX')} MXN`, 70, yPosition);
    doc.setFontSize(10);
    
    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Periodo de Campaña:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    const fechaInicio = campaign.fecha_inicio ? format(new Date(campaign.fecha_inicio), "dd/MM/yyyy") : 'N/A';
    const fechaFin = campaign.fecha_fin ? format(new Date(campaign.fecha_fin), "dd/MM/yyyy") : 'N/A';
    doc.text(`${fechaInicio} - ${fechaFin}`, 70, yPosition);
    
    yPosition += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Duración:", 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(`${campaign.duracion_dias || campaign.dias_totales || 0} días`, 70, yPosition);
    
    // Reservation details section
    const reservaData = campaign.reserva || campaign.reservas;
    if (reservaData) {
      yPosition += 20;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Espacio Publicitario", 20, yPosition);
      
      doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition + 2, 190, yPosition + 2);
      
      yPosition += 12;
      doc.setFontSize(10);
      
      doc.setFont("helvetica", "bold");
      doc.text("Activo:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(reservaData.asset_name || 'N/A', 70, yPosition);
      
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Tipo de Medio:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(reservaData.asset_type || 'N/A', 70, yPosition);
      
      yPosition += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Modalidad:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(reservaData.modalidad || 'N/A', 70, yPosition);
      
      if (reservaData.ubicacion) {
        yPosition += 10;
        doc.setFont("helvetica", "bold");
        doc.text("Ubicación:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(reservaData.ubicacion, 70, yPosition);
      }
    }
    
    // Footer
    yPosition = 270;
    doc.setFillColor(248, 248, 248);
    doc.rect(0, yPosition - 5, 210, 30, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Adavailable - Plataforma de Gestión de Publicidad Digital", 105, yPosition + 5, { align: 'center' });
    doc.text("Este documento constituye una propuesta aprobada y será complementado", 105, yPosition + 10, { align: 'center' });
    doc.text("con el contrato oficial una vez confirmado por el dueño de medios.", 105, yPosition + 15, { align: 'center' });
    
    // Save
    doc.save(`propuesta-${campaign.nombre.replace(/\s+/g, '-')}-${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  return (
    <Button
      onClick={generatePrePDF}
      variant="default"
      size="sm"
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Descargar Propuesta Aprobada
    </Button>
  );
}
