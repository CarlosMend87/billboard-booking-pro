import { useState } from "react";
import { BookingHeader } from "@/components/booking/BookingHeader";
import { DateSelector } from "@/components/booking/DateSelector";
import { BillboardMap } from "@/components/booking/BillboardMap";
import { BillboardList } from "@/components/booking/BillboardList";
import { BookingCart } from "@/components/booking/BookingCart";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { BookingDates, SelectedBillboard } from "@/types/booking";

const Booking = () => {
  const [step, setStep] = useState<"selection" | "confirmation">("selection");
  const [selectedDates, setSelectedDates] = useState<BookingDates | null>(null);
  const [selectedBillboards, setSelectedBillboards] = useState<SelectedBillboard[]>([]);
  const [mapView, setMapView] = useState(true);

  const handleAddBillboard = (billboard: any) => {
    const existingIndex = selectedBillboards.findIndex(
      item => item.billboard.id === billboard.id
    );

    if (existingIndex >= 0) {
      const updated = [...selectedBillboards];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = 
        billboard.type === "fixed" 
          ? billboard.monthlyPrice * updated[existingIndex].quantity
          : (billboard.pricePerMonth || 0) * updated[existingIndex].quantity;
      setSelectedBillboards(updated);
    } else {
      const newItem: SelectedBillboard = {
        billboard,
        quantity: 1,
        totalPrice: billboard.type === "fixed" ? billboard.monthlyPrice : (billboard.pricePerMonth || 0)
      };
      setSelectedBillboards([...selectedBillboards, newItem]);
    }
  };

  const handleRemoveBillboard = (billboardId: string) => {
    setSelectedBillboards(prev => prev.filter(item => item.billboard.id !== billboardId));
  };

  const handleUpdateQuantity = (billboardId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      handleRemoveBillboard(billboardId);
      return;
    }

    setSelectedBillboards(prev => prev.map(item => {
      if (item.billboard.id === billboardId) {
        const unitPrice = item.billboard.type === "fixed" 
          ? item.billboard.monthlyPrice 
          : (item.billboard.pricePerMonth || 0);
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: unitPrice * newQuantity
        };
      }
      return item;
    }));
  };

  const totalCost = selectedBillboards.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalBillboards = selectedBillboards.reduce((sum, item) => sum + item.quantity, 0);

  if (step === "confirmation") {
    return (
      <BookingConfirmation
        selectedDates={selectedDates!}
        selectedBillboards={selectedBillboards}
        totalCost={totalCost}
        onBack={() => setStep("selection")}
        onSubmit={(bookingData) => {
          console.log("Booking submitted:", bookingData);
          // Aquí se enviará la reserva al backend
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BookingHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Reserva tu Espacio Publicitario</h1>
          <p className="text-muted-foreground text-lg">
            Selecciona las fechas de tu campaña y explora los anuncios disponibles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filtros y Carrito */}
          <div className="lg:col-span-1 space-y-6">
            <DateSelector
              selectedDates={selectedDates}
              onDatesChange={setSelectedDates}
            />
            
            {selectedBillboards.length > 0 && (
              <BookingCart
                selectedBillboards={selectedBillboards}
                totalCost={totalCost}
                totalBillboards={totalBillboards}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveBillboard}
                onProceedToCheckout={() => setStep("confirmation")}
              />
            )}
          </div>

          {/* Main Content - Map/List */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => setMapView(true)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    mapView 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  Vista Mapa
                </button>
                <button
                  onClick={() => setMapView(false)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    !mapView 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  Vista Lista
                </button>
              </div>
              
              {!selectedDates && (
                <div className="text-muted-foreground">
                  Selecciona fechas para ver disponibilidad
                </div>
              )}
            </div>

            {mapView ? (
              <BillboardMap
                selectedDates={selectedDates}
                onBillboardSelect={handleAddBillboard}
                selectedBillboards={selectedBillboards}
              />
            ) : (
              <BillboardList
                selectedDates={selectedDates}
                onBillboardSelect={handleAddBillboard}
                selectedBillboards={selectedBillboards}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;