// Pricing calculation functions as specified in requirements

export function precioCatorcenal(precioMensual: number): number {
  return precioMensual / 2;
}

export function precioSemanal(precioMensual: number): number {
  return precioMensual / 4;
}

export function precioRotativo(precioPeriodo: number): number {
  return precioPeriodo * 0.5; // no más descuentos
}

export function aplicarDescuentoVolumen(precio: number, meses: number): number {
  if (meses >= 12) return precio * 0.8; // -20%
  if (meses >= 6) return precio * 0.85;  // -15%
  if (meses >= 3) return precio * 0.9;   // -10%
  return precio;
}

interface TotalTradicionalParams {
  tipoPeriodo: 'mensual' | 'catorcenal' | 'semanal';
  precioMensual: number;
  meses?: number;
  catorcenas?: number;
  esRotativo?: boolean;
}

export function totalTradicional({
  tipoPeriodo,
  precioMensual,
  meses = 1,
  catorcenas = 1,
  esRotativo = false
}: TotalTradicionalParams): number {
  let base = 0;
  
  if (tipoPeriodo === 'mensual') base = precioMensual * meses;
  if (tipoPeriodo === 'catorcenal') base = precioCatorcenal(precioMensual) * catorcenas;
  if (tipoPeriodo === 'semanal') base = precioSemanal(precioMensual);

  if (esRotativo) return precioRotativo(base); // sin volumen
  if (tipoPeriodo === 'mensual') return aplicarDescuentoVolumen(base, meses);
  return base;
}

export function totalDigitalSpot({
  tarifaSpot,
  spotsDia,
  dias
}: {
  tarifaSpot: number;
  spotsDia: number;
  dias: number;
}): number {
  return tarifaSpot * spotsDia * dias;
}

export function totalDigitalHora({
  tarifaHora,
  horas,
  dias
}: {
  tarifaHora: number;
  horas: number;
  dias: number;
}): number {
  return tarifaHora * horas * dias;
}

export function totalDigitalDia({
  tarifaDia,
  dias
}: {
  tarifaDia: number;
  dias: number;
}): number {
  return tarifaDia * dias;
}

export function totalDigitalCPM({
  impresiones,
  cpm
}: {
  impresiones: number;
  cpm: number;
}): number {
  return (impresiones / 1000) * cpm;
}

// Reglas de disponibilidad para mostrar/ocultar Rotativo
export function esElegibleRotativo({
  estadoPeriodo,
  diasParaInicio
}: {
  estadoPeriodo: 'vacante' | 'ocupado';
  diasParaInicio: number;
}): boolean {
  return estadoPeriodo === 'vacante' && diasParaInicio <= 5; // ventana de liberación
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);
}