import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import { Propuesta } from "@/hooks/usePropuestas";
import { toast } from "sonner";

interface PropuestaPDFExportProps {
  propuesta: Propuesta;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "icon";
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export function PropuestaPDFExport({ 
  propuesta, 
  variant = "outline",
  size = "sm" 
}: PropuestaPDFExportProps) {
  const [exporting, setExporting] = useState(false);

  const generatePDF = async () => {
    setExporting(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header with gradient-like effect
      doc.setFillColor(139, 92, 246); // Primary purple
      doc.rect(0, 0, pageWidth, 50, "F");
      
      // Platform name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Adavailable", margin, 28);
      
      // Proposal title
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Propuesta de Campaña DOOH", margin, 40);

      // Date on header right
      doc.setFontSize(9);
      doc.text(
        `Generado: ${new Date().toLocaleDateString("es-MX", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
        pageWidth - margin,
        28,
        { align: "right" }
      );

      yPos = 65;

      // Proposal name section
      doc.setTextColor(34, 34, 34);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(propuesta.nombre, margin, yPos);
      yPos += 8;

      // Description if exists
      if (propuesta.descripcion) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(propuesta.descripcion, pageWidth - margin * 2);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 5 + 5;
      }

      // Divider
      yPos += 5;
      doc.setDrawColor(245, 158, 11); // Orange accent
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 15;

      // Summary section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 34, 34);
      doc.text("Resumen de la Propuesta", margin, yPos);
      yPos += 12;

      // Summary grid
      doc.setFontSize(10);
      const totalPrice = propuesta.total_estimado;
      const totalScreens = propuesta.item_count;
      const totalImpacts = propuesta.items.reduce((sum, item) => sum + ((item as any).impactos || 0), 0);
      const avgCPM = totalImpacts > 0 ? (totalPrice / totalImpacts) * 1000 : 0;

      // Summary boxes
      const boxWidth = (pageWidth - margin * 2 - 15) / 4;
      const summaryData = [
        { label: "Pantallas", value: totalScreens.toString() },
        { label: "Inversión", value: formatPrice(totalPrice) },
        { label: "Impactos Est.", value: totalImpacts >= 1000000 ? `${(totalImpacts / 1000000).toFixed(1)}M` : totalImpacts >= 1000 ? `${(totalImpacts / 1000).toFixed(0)}K` : totalImpacts.toString() },
        { label: "CPM Prom.", value: avgCPM > 0 ? `$${avgCPM.toFixed(2)}` : "N/A" },
      ];

      summaryData.forEach((item, idx) => {
        const xPos = margin + idx * (boxWidth + 5);
        
        // Box background
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(xPos, yPos, boxWidth, 25, 3, 3, "F");
        
        // Label
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(item.label, xPos + boxWidth / 2, yPos + 8, { align: "center" });
        
        // Value
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 34, 34);
        doc.text(item.value, xPos + boxWidth / 2, yPos + 18, { align: "center" });
      });

      yPos += 40;

      // Campaign dates if available
      if (propuesta.active_dates) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(34, 34, 34);
        doc.text("Período de Campaña:", margin, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(
          `${formatDate(propuesta.active_dates.startDate)} - ${formatDate(propuesta.active_dates.endDate)}`,
          margin + 45,
          yPos
        );
        yPos += 15;
      }

      // Screens table header
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Detalle de Pantallas", margin, yPos);
      yPos += 10;

      // Table header
      doc.setFillColor(139, 92, 246);
      doc.rect(margin, yPos, pageWidth - margin * 2, 10, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Pantalla", margin + 3, yPos + 7);
      doc.text("Tipo", margin + 60, yPos + 7);
      doc.text("Modalidad", margin + 90, yPos + 7);
      doc.text("Impactos", margin + 125, yPos + 7);
      doc.text("Precio", pageWidth - margin - 3, yPos + 7, { align: "right" });
      
      yPos += 12;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);

      propuesta.items.forEach((item, idx) => {
        // Check for new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = margin;
        }

        // Alternate row background
        if (idx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, yPos - 3, pageWidth - margin * 2, 10, "F");
        }

        doc.setTextColor(34, 34, 34);
        
        // Truncate long names
        const name = item.nombre.length > 28 ? item.nombre.substring(0, 25) + "..." : item.nombre;
        doc.text(name, margin + 3, yPos + 4);
        
        const typeLabels: Record<string, string> = {
          'espectacular': 'Espectacular',
          'muro': 'Muro',
          'valla': 'Valla',
          'parabus': 'Parabús',
          'digital': 'Digital'
        };
        doc.text(typeLabels[item.tipo] || item.tipo, margin + 60, yPos + 4);
        doc.text((item as any).modalidad || "Mensual", margin + 90, yPos + 4);
        
        const impacts = (item as any).impactos || 0;
        const impactStr = impacts >= 1000000
          ? `${(impacts / 1000000).toFixed(1)}M` 
          : impacts >= 1000 
            ? `${(impacts / 1000).toFixed(0)}K` 
            : impacts.toString();
        doc.text(impactStr, margin + 125, yPos + 4);
        
        doc.text(formatPrice(item.precio), pageWidth - margin - 3, yPos + 4, { align: "right" });

        yPos += 10;
      });

      // Total row
      yPos += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 34, 34);
      doc.text("TOTAL:", margin + 3, yPos);
      doc.setTextColor(139, 92, 246);
      doc.text(formatPrice(totalPrice), pageWidth - margin - 3, yPos, { align: "right" });

      // Footer on all pages
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer background
        doc.setFillColor(248, 248, 248);
        doc.rect(0, pageHeight - 20, pageWidth, 20, "F");
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Adavailable - Plataforma DOOH | Página ${i} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      // Save
      const fileName = `propuesta-${propuesta.nombre
        .toLowerCase()
        .replace(/\s+/g, "-")
        .substring(0, 30)}-${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast.success("PDF exportado exitosamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={(e) => {
        e.stopPropagation();
        generatePDF();
      }}
      disabled={exporting}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {size !== "icon" && <span className="ml-1">PDF</span>}
    </Button>
  );
}
