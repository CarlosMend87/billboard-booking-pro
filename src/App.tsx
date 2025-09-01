import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import Index from "./pages/Index";
import AddBillboard from "./pages/AddBillboard";
import BookingWizard from "./pages/BookingWizard";
import DisponibilidadAnuncios from "./pages/DisponibilidadAnuncios";
import ProgresoCampaña from "./pages/ProgresoCampaña";
import Auth from "./pages/Auth";
import OwnerDashboard from "./pages/OwnerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  
  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function OwnerOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  
  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (role !== 'owner') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function RoleBasedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  
  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect owners directly to their dashboard
  if (role === 'owner') {
    return <Navigate to="/owner-dashboard" replace />;
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
                <RoleBasedRoute>
                  <Index />
                </RoleBasedRoute>
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
              <Route path="/owner-dashboard" element={
                <OwnerOnlyRoute>
                  <OwnerDashboard />
                </OwnerOnlyRoute>
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