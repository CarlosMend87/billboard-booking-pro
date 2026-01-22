import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { ScreenCardProps } from "./ScreenCard";
import jsPDF from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ScreenProposalPDFProps {
  screens: ScreenCardProps[];
  campaignName?: string;
  className?: string;
}

export function ScreenProposalPDF({ 
  screens, 
  campaignName = "Propuesta de Campaña",
  className 
}: ScreenProposalPDFProps) {
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();

  const formatPrice = (price: number | null) => {
    if (price === null) return "Consultar";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return "N/A";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toString();
  };

  const generatePDF = async () => {
    if (screens.length === 0) {
      toast.error("No hay pantallas seleccionadas para exportar");
      return;
    }

    setExporting(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header
      doc.setFillColor(59, 130, 246); // primary blue
      doc.rect(0, 0, pageWidth, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(campaignName, margin, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generado: ${new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`, margin, 35);

      if (user?.email) {
        doc.text(`Por: ${user.email}`, pageWidth - margin - 60, 35);
      }

      yPos = 55;

      // Summary section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumen de la Propuesta", margin, yPos);
      yPos += 10;

      const totalPrice = screens.reduce((sum, s) => sum + (s.precio || 0), 0);
      const totalImpacts = screens.reduce((sum, s) => sum + (s.impactos || 0), 0);
      const cities = [...new Set(screens.map(s => s.ciudad))];

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const summaryData = [
        `Pantallas seleccionadas: ${screens.length}`,
        `Inversión mensual estimada: ${formatPrice(totalPrice)}`,
        `Impactos mensuales totales: ${formatNumber(totalImpacts)}`,
        `Ciudades: ${cities.join(", ")}`,
        `CPM promedio: ${totalImpacts > 0 ? `$${((totalPrice / totalImpacts) * 1000).toFixed(2)}` : "N/A"}`,
      ];

      summaryData.forEach((line) => {
        doc.text(line, margin, yPos);
        yPos += 6;
      });

      yPos += 10;

      // Screens table header
      doc.setFillColor(243, 244, 246);
      doc.rect(margin - 2, yPos - 5, pageWidth - (margin * 2) + 4, 10, "F");
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Pantalla", margin, yPos);
      doc.text("Ubicación", margin + 55, yPos);
      doc.text("Tipo", margin + 95, yPos);
      doc.text("Impactos", margin + 120, yPos);
      doc.text("Precio/mes", margin + 145, yPos);

      yPos += 8;

      // Screens table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      screens.forEach((screen, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(margin - 2, yPos - 4, pageWidth - (margin * 2) + 4, 8, "F");
        }

        // Truncate long names
        const name = screen.nombre.length > 25 
          ? screen.nombre.substring(0, 22) + "..." 
          : screen.nombre;
        const ubicacion = `${screen.ubicacion.substring(0, 15)}, ${screen.ciudad}`;

        doc.setTextColor(0, 0, 0);
        doc.text(name, margin, yPos);
        doc.text(ubicacion.substring(0, 20), margin + 55, yPos);
        doc.text(screen.tipo || "N/A", margin + 95, yPos);
        doc.text(formatNumber(screen.impactos), margin + 120, yPos);
        doc.text(formatPrice(screen.precio), margin + 145, yPos);

        yPos += 8;
      });

      // Footer on each page
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${pageCount} | Adavailable - Plataforma DOOH`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Total section on last page
      doc.setPage(pageCount);
      yPos = Math.min(yPos + 10, pageHeight - 40);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("TOTAL MENSUAL:", margin, yPos);
      doc.text(formatPrice(totalPrice), pageWidth - margin, yPos, { align: "right" });

      // Save
      const fileName = `propuesta-${campaignName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
      
      toast.success("PDF exportado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setExporting(false);
    }
  };

  if (screens.length === 0) return null;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={generatePDF}
      disabled={exporting}
      className={className}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4 mr-2" />
      )}
      Exportar PDF
    </Button>
  );
}
