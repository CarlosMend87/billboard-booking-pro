import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AddBillboard from "./pages/AddBillboard";
import BookingWizard from "./pages/BookingWizard";
import DisponibilidadAnuncios from "./pages/DisponibilidadAnuncios";
import ProgresoCampaña from "./pages/ProgresoCampaña";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/add-billboard" element={
                <ProtectedRoute>
                  <AddBillboard />
                </ProtectedRoute>
              } />
              <Route path="/booking-wizard" element={
                <ProtectedRoute>
                  <BookingWizard />
                </ProtectedRoute>
              } />
              <Route path="/disponibilidad-anuncios" element={
                <ProtectedRoute>
                  <DisponibilidadAnuncios />
                </ProtectedRoute>
              } />
              <Route path="/progreso-campaña" element={
                <ProtectedRoute>
                  <ProgresoCampaña />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;