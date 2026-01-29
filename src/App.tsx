import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { CartValidationProvider } from "@/context/CartValidationContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { GlobalFloatingCart } from "@/components/cart/GlobalFloatingCart";
import Index from "./pages/Index";
import AdvertiserHome from "./pages/AdvertiserHome";
import AddBillboard from "./pages/AddBillboard";
import BookingWizard from "./pages/BookingWizard";
import ProgresoCampaña from "./pages/ProgresoCampaña";
import Auth from "./pages/Auth";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerReservations from "./pages/OwnerReservations";
import AgenteDashboard from "./pages/AgenteDashboard";
import TestOwnerActions from "./pages/TestOwnerActions";
import SuperAdminAuth from "./pages/SuperAdminAuth";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Prevent refetch on window focus - stops reload when switching tabs
      refetchOnWindowFocus: false,
      // Prevent refetch on reconnect
      refetchOnReconnect: false,
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Retry failed requests only once
      retry: 1,
    },
  },
});

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

function AgentOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  
  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (role !== 'agente') {
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
  
  // Redirect agents to their dashboard
  if (role === 'agente') {
    return <Navigate to="/agente-dashboard" replace />;
  }
  
  // Advertisers see the new Airbnb-style home
  if (role === 'advertiser') {
    return <Navigate to="/explorar" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartValidationProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* Global Floating Cart - persists across navigation */}
              <GlobalFloatingCart />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={
                <RoleBasedRoute>
                  <Index />
                </RoleBasedRoute>
              } />
              <Route path="/explorar" element={
                <ProtectedRoute>
                  <AdvertiserHome />
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
              {/* Redirect legacy route to /explorar */}
              <Route path="/disponibilidad-anuncios" element={<Navigate to="/explorar" replace />} />
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
              <Route path="/owner-reservations" element={
                <OwnerOnlyRoute>
                  <OwnerReservations />
                </OwnerOnlyRoute>
              } />
              <Route path="/agente-dashboard" element={
                <AgentOnlyRoute>
                  <AgenteDashboard />
                </AgentOnlyRoute>
              } />
              <Route path="/test-owner" element={
                <ProtectedRoute>
                  <TestOwnerActions />
                </ProtectedRoute>
              } />
              <Route path="/superadmin-auth" element={<SuperAdminAuth />} />
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </CartValidationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;