import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SetupSuperAdmin() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('carlos.admin@adavailable.com');
  const [password, setPassword] = useState('Carlos9709');
  const [result, setResult] = useState<string>('');

  const createSuperAdminUser = async () => {
    setLoading(true);
    setResult('');
    
    try {
      // First, create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
      });

      if (authError) {
        // If user already exists, that's fine
        if (authError.message.includes('already been registered')) {
          setResult('Usuario ya existe. Configurando como superadmin...');
        } else {
          throw authError;
        }
      } else {
        setResult('Usuario creado exitosamente. Configurando como superadmin...');
      }

      // Now set up as superadmin
      const { data, error } = await supabase.rpc('setup_superadmin', {
        admin_email: email
      });

      if (error) throw error;

      setResult(data || 'Superadmin configurado exitosamente');
      
      toast({
        title: "¡Éxito!",
        description: "Superadmin configurado correctamente. Ya puedes iniciar sesión.",
      });

    } catch (error: any) {
      console.error('Error:', error);
      setResult(`Error: ${error.message}`);
      toast({
        title: "Error",
        description: error.message || "Error al configurar superadmin",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = () => {
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Configurar Superadministrador</CardTitle>
          <CardDescription>
            Configura el usuario superadministrador del sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email del Superadmin</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos.admin@adavailable.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Carlos9709"
            />
          </div>

          <Button 
            onClick={createSuperAdminUser} 
            disabled={loading || !email || !password}
            className="w-full"
          >
            {loading ? 'Configurando...' : 'Crear/Configurar Superadmin'}
          </Button>

          {result && (
            <Alert className={result.includes('Error') ? 'border-destructive' : 'border-green-500'}>
              {result.includes('Error') ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={result.includes('Error') ? 'text-destructive' : 'text-green-600'}>
                {result}
              </AlertDescription>
            </Alert>
          )}

          {result && !result.includes('Error') && (
            <div className="space-y-2">
              <Button onClick={testLogin} variant="outline" className="w-full">
                Ir a Iniciar Sesión
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p><strong>Credenciales por defecto:</strong></p>
            <p>Email: carlos.admin@adavailable.com</p>
            <p>Contraseña: Carlos9709</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}