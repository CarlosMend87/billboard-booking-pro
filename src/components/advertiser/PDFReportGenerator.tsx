import { jsPDF } from "jspdf";
import { InventoryAsset } from "@/lib/mockInventory";
import { formatPrice } from "@/lib/pricing";
import { formatDistance } from "@/lib/geoUtils";

export interface PDFReportData {
  filteredAssets: Array<InventoryAsset & { 
    distance?: number;
    nearestPOI?: string;
  }>;
  appliedFilters: {
    billboardTypes: string[];
    modalidades: string[];
    proximityFilters: string[];
    priceRange: [number, number];
    hasComputerVision: boolean | null;
  };
  totalCount: number;
}

export function generatePDFReport(data: PDFReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Reporte de Búsqueda de Pantallas", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 15;

  // Applied Filters Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Filtros Aplicados", margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Billboard Types
  if (data.appliedFilters.billboardTypes.length > 0) {
    doc.text(`Tipos de Pantalla: ${data.appliedFilters.billboardTypes.join(", ")}`, margin, yPosition);
    yPosition += 6;
  }

  // Modalidades
  if (data.appliedFilters.modalidades.length > 0) {
    doc.text(`Modalidades: ${data.appliedFilters.modalidades.join(", ")}`, margin, yPosition);
    yPosition += 6;
  }

  // Proximity Filters
  if (data.appliedFilters.proximityFilters.length > 0) {
    doc.text(`Puntos de Interés: ${data.appliedFilters.proximityFilters.join(", ")}`, margin, yPosition);
    yPosition += 6;
  }

  // Price Range
  if (data.appliedFilters.priceRange[0] > 0 || data.appliedFilters.priceRange[1] < 100000) {
    doc.text(
      `Rango de Precio: ${formatPrice(data.appliedFilters.priceRange[0])} - ${formatPrice(data.appliedFilters.priceRange[1])}`,
      margin,
      yPosition
    );
    yPosition += 6;
  }

  // Computer Vision
  if (data.appliedFilters.hasComputerVision !== null) {
    doc.text(
      `Detección AI: ${data.appliedFilters.hasComputerVision ? "Con visión por computadora" : "Sin visión por computadora"}`,
      margin,
      yPosition
    );
    yPosition += 6;
  }

  yPosition += 10;

  // Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total de Pantallas Encontradas: ${data.totalCount}`, margin, yPosition);
  yPosition += 15;

  // Results Table Header
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Nombre", margin, yPosition);
  doc.text("Tipo", margin + 70, yPosition);
  doc.text("Precio/Mes", margin + 110, yPosition);
  if (data.appliedFilters.proximityFilters.length > 0) {
    doc.text("Distancia", margin + 150, yPosition);
  }
  yPosition += 8;

  // Draw line
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // Results
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  data.filteredAssets.forEach((asset, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    const typeLabels: Record<string, string> = {
      'espectacular': 'Espectacular Fijo',
      'muro': 'Muro',
      'valla': 'Valla',
      'parabus': 'Parabús',
      'digital': 'Espectacular Digital'
    };

    const name = asset.nombre.length > 25 ? asset.nombre.substring(0, 22) + "..." : asset.nombre;
    doc.text(name, margin, yPosition);
    doc.text(typeLabels[asset.tipo] || asset.tipo, margin + 70, yPosition);
    doc.text(formatPrice(asset.precio.mensual || 0), margin + 110, yPosition);
    
    if (asset.distance !== undefined && asset.nearestPOI) {
      doc.text(`${formatDistance(asset.distance)} - ${asset.nearestPOI}`, margin + 150, yPosition);
    }

    yPosition += 7;
  });

  // Footer
  yPosition = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Este reporte fue generado automáticamente desde la plataforma",
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  // Save PDF
  const filename = `reporte-pantallas-${new Date().getTime()}.pdf`;
  doc.save(filename);
}
