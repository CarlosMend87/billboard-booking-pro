import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, Send, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookingDates, SelectedBillboard, BookingRequest } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";

interface BookingConfirmationProps {
  selectedDates: BookingDates;
  selectedBillboards: SelectedBillboard[];
  totalCost: number;
  onBack: () => void;
  onSubmit: (booking: BookingRequest) => void;
}

export function BookingConfirmation({
  selectedDates,
  selectedBillboards,
  totalCost,
  onBack,
  onSubmit
}: BookingConfirmationProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    company: "",
    message: ""
  });

  const totalWithTax = totalCost * 1.16;
  const totalBillboards = selectedBillboards.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientEmail || !formData.clientPhone) {
      toast({
        title: "Información requerida",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    const bookingRequest: BookingRequest = {
      ...formData,
      dates: selectedDates,
      selectedBillboards,
      totalCost: totalWithTax
    };

    try {
      // Simular envío
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSubmit(bookingRequest);
      
      toast({
        title: "¡Reserva enviada exitosamente!",
        description: "Recibirás una confirmación por email en breve",
      });
    } catch (error) {
      toast({
        title: "Error al enviar reserva",
        description: "Por favor intenta nuevamente",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la selección
          </Button>
          <h1 className="text-3xl font-bold mb-2">Confirmación de Reserva</h1>
          <p className="text-muted-foreground">
            Revisa tu selección y completa la información para enviar tu solicitud
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Nombre Completo *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                        placeholder="Tu nombre completo"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Empresa</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        placeholder="Nombre de tu empresa (opcional)"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientEmail">Email *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientPhone">Teléfono *</Label>
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                        placeholder="+52 55 1234 5678"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message">Mensaje Adicional</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Comparte detalles adicionales sobre tu campaña, requisitos especiales, etc."
                      rows={4}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:bg-primary-hover" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando Reserva...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Solicitud de Reserva
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumen */}
          <div className="space-y-6">
            {/* Fechas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas de Campaña
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Inicio:</span>
                    <p className="font-medium">
                      {format(selectedDates.startDate, 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Fin:</span>
                    <p className="font-medium">
                      {format(selectedDates.endDate, 'PPP', { locale: es })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anuncios seleccionados */}
            <Card>
              <CardHeader>
                <CardTitle>Anuncios Seleccionados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedBillboards.map((item) => (
                  <div key={item.billboard.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Badge 
                          variant={item.billboard.type === "fixed" ? "secondary" : "default"}
                          className="text-xs mb-1"
                        >
                          {item.billboard.type === "fixed" ? "Fijo" : "Digital"}
                        </Badge>
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-1" />
                          <p className="text-sm font-medium">
                            {item.billboard.location}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span>Cantidad: {item.quantity}</span>
                      <span className="font-medium">
                        ${item.totalPrice.toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                    
                    <Separator />
                  </div>
                ))}

                {/* Total */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${totalCost.toLocaleString('es-MX')} MXN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA (16%):</span>
                    <span>${(totalCost * 0.16).toLocaleString('es-MX')} MXN</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Total Mensual:</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">
                        ${totalWithTax.toLocaleString('es-MX')}
                      </div>
                      <div className="text-xs text-muted-foreground">MXN</div>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-status-confirmed" />
                    <span className="text-sm font-medium">Resumen</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {totalBillboards} anuncio{totalBillboards > 1 ? 's' : ''} seleccionado{totalBillboards > 1 ? 's' : ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}