import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Shield, Eye, EyeOff } from "lucide-react";

export default function SuperAdminAuth() {
  const [email, setEmail] = useState("carlos.admin@adavailable.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { isSuperAdmin, loading: checkingAdmin } = useSuperAdmin();

  // Redirect if already authenticated as superadmin
  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-foreground text-xl">Verificando credenciales...</div>
      </div>
    );
  }

  if (isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // First authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      // Then check if user is superadmin
      const { data: superAdminData, error: superAdminError } = await supabase
        .from('superadmins')
        .select('status')
        .eq('user_id', authData.user.id)
        .eq('status', 'active')
        .single();

      if (superAdminError || !superAdminData) {
        // Sign out if not superadmin
        await supabase.auth.signOut();
        throw new Error('Acceso denegado. No tienes permisos de superadministrador.');
      }

      // Update last login
      await supabase
        .from('superadmins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', authData.user.id);

      // Log the action
      await supabase.rpc('log_user_action', {
        action_type: 'superadmin_login',
        resource_type: 'auth',
        details: { email, timestamp: new Date().toISOString() }
      });

    } catch (error: any) {
      console.error('SuperAdmin sign in error:', error);
      setError(error.message || 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">SuperAdministrador</CardTitle>
          <CardDescription>
            Acceso restringido al panel de administración del sistema
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="carlos.admin@adavailable.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? "Autenticando..." : "Acceder al Sistema"}
            </Button>
          </CardFooter>
        </form>
        
        <div className="p-4 text-center text-sm text-muted-foreground border-t">
          Sistema de gestión AdAvailable
        </div>
      </Card>
    </div>
  );
}