import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export function BookingHeader() {
  return (
    <header className="bg-gradient-primary text-white sticky top-0 z-50 shadow-medium">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OOH</span>
              </div>
              <h1 className="text-xl font-bold">Booking Anuncios</h1>
            </Link>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <MapPin className="h-3 w-3 mr-1" />
              Portal Cliente
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-white/80">
              <Calendar className="h-4 w-4" />
              <span>Reservas 24/7</span>
            </div>
            <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al CRM
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}