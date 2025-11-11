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
  reservas?: {
    asset_name: string;
    asset_type: string;
    modalidad: string;
  };
}

interface PrePDFDownloadProps {
  campaign: Campaign;
}

export function PrePDFDownload({ campaign }: PrePDFDownloadProps) {
  const generatePrePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text("Comprobante de Campaña", 20, 20);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text("Pre-autorización - Pendiente de confirmación", 20, 30);
    
    // Campaign details
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Detalles de la Campaña", 20, 45);
    
    doc.setFontSize(11);
    const details = [
      `Nombre: ${campaign.nombre}`,
      `ID: ${campaign.id}`,
      `Estado: ${campaign.status === 'active' ? 'Activa' : 'Pendiente'}`,
      ``,
      `Activo Publicitario: ${campaign.reservas?.asset_name || 'N/A'}`,
      `Tipo: ${campaign.reservas?.asset_type || 'N/A'}`,
      `Modalidad: ${campaign.reservas?.modalidad || 'N/A'}`,
      ``,
      `Presupuesto Total: $${campaign.presupuesto_total.toLocaleString('es-MX')} MXN`,
      `Duración: ${campaign.dias_totales} días`,
      `Fecha Inicio: ${new Date(campaign.fecha_inicio).toLocaleDateString('es-MX')}`,
      `Fecha Fin: ${new Date(campaign.fecha_fin).toLocaleDateString('es-MX')}`,
    ];
    
    let yPosition = 55;
    details.forEach(line => {
      doc.text(line, 20, yPosition);
      yPosition += 7;
    });
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    yPosition += 20;
    doc.text("Este es un comprobante preliminar.", 20, yPosition);
    doc.text("El reporte oficial será generado una vez que el dueño", 20, yPosition + 7);
    doc.text("de medios acepte la campaña.", 20, yPosition + 14);
    
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 20, yPosition + 28);
    
    // Save the PDF
    doc.save(`pre-comprobante-${campaign.nombre.replace(/\s+/g, '-')}.pdf`);
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
