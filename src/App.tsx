import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
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
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

function RoleBasedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  
  if (authLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!profile || !allowedRoles.includes(profile.role || 'advertiser')) {
    // Redirect based on user role
    if (profile?.role === 'owner') {
      return <Navigate to="/owner-dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
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
                <RoleBasedRoute allowedRoles={['advertiser', 'admin']}>
                  <Index />
                </RoleBasedRoute>
              } />
              <Route path="/add-billboard" element={
                <RoleBasedRoute allowedRoles={['advertiser', 'admin']}>
                  <AddBillboard />
                </RoleBasedRoute>
              } />
              <Route path="/booking-wizard" element={
                <RoleBasedRoute allowedRoles={['advertiser', 'admin']}>
                  <BookingWizard />
                </RoleBasedRoute>
              } />
              <Route path="/disponibilidad-anuncios" element={
                <RoleBasedRoute allowedRoles={['advertiser', 'admin']}>
                  <DisponibilidadAnuncios />
                </RoleBasedRoute>
              } />
              <Route path="/progreso-campaña" element={
                <RoleBasedRoute allowedRoles={['advertiser', 'admin']}>
                  <ProgresoCampaña />
                </RoleBasedRoute>
              } />
              <Route path="/owner-dashboard" element={
                <RoleBasedRoute allowedRoles={['owner', 'admin']}>
                  <OwnerDashboard />
                </RoleBasedRoute>
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