import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/pricing";
import { Link } from "react-router-dom";

type WizardStep = 1 | 2 | 3 | 4;

export default function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const { cart, updateQuantity, removeItem } = useCart();
  
  const steps = [
    { number: 1, title: "Inventario Seleccionado", description: "Revisa y edita tu selección" },
    { number: 2, title: "Modalidad por Ítem", description: "Configura cada anuncio" },
    { number: 3, title: "Programación", description: "Selecciona fechas y horarios" },
    { number: 4, title: "Resumen", description: "Confirma tu reserva" }
  ];

  const progress = (currentStep / 4) * 100;

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Inventario Seleccionado</h2>
      <p className="text-muted-foreground">Revisa los anuncios que agregaste a tu carrito</p>
      
      {cart.items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No hay anuncios en tu carrito</p>
            <Button asChild>
              <Link to="/disponibilidad-anuncios">Agregar Anuncios</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cart.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{item.asset.nombre}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{item.asset.tipo}</Badge>
                      <Badge variant="secondary">{item.modalidad}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                    <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-primary">{formatPrice(cart.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Modalidad por Ítem</h2>
      <p className="text-muted-foreground">Configura los detalles de cada anuncio seleccionado</p>
      
      <div className="space-y-4">
        {cart.items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-lg">{item.asset.nombre}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Modalidad</label>
                  <Badge variant="secondary" className="mt-1">{item.modalidad}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">Precio</label>
                  <p className="font-semibold">{formatPrice(item.precioUnitario)}</p>
                </div>
              </div>
              
              {item.modalidad === 'spot' && (
                <div>
                  <label className="text-sm font-medium">Spots por día</label>
                  <p>{item.config.spotsDia || 1}</p>
                </div>
              )}
              
              {item.modalidad === 'hora' && (
                <div>
                  <label className="text-sm font-medium">Horas por día</label>
                  <p>{item.config.horas || 1}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Programación</h2>
      <p className="text-muted-foreground">Selecciona las fechas y horarios para tu campaña</p>
      
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Funcionalidad de programación en desarrollo
            </p>
            <p className="text-sm text-muted-foreground">
              Por ahora puedes continuar al resumen
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Resumen Final</h2>
      <p className="text-muted-foreground">Revisa todos los detalles antes de confirmar</p>
      
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Desglose de Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2 border-b">
                <div>
                  <p className="font-medium">{item.asset.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.modalidad} • Cantidad: {item.quantity}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.subtotal)}</p>
              </div>
            ))}
            
            <div className="flex justify-between items-center text-lg font-bold pt-4">
              <span>Total Final:</span>
              <span className="text-primary">{formatPrice(cart.total)}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-primary">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-primary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">¿Listo para confirmar?</h3>
                <p className="text-muted-foreground">
                  Al confirmar, tu reserva quedará en estado HOLD por 48 horas
                </p>
              </div>
              <Button size="lg" className="w-full">
                Confirmar Reserva
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Wizard de Reserva
          </h1>
          
          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              {steps.map((step) => (
                <div key={step.number} className={`text-center ${currentStep >= step.number ? 'text-primary font-medium' : ''}`}>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {renderCurrentStep()}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as WizardStep)}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            
            <Button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1) as WizardStep)}
              disabled={currentStep === 4 || cart.items.length === 0}
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}