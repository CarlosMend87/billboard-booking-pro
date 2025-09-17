import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Shield, Lock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SecuritySettings() {
  const [settings, setSettings] = useState({
    twoFactorRequired: false,
    passwordComplexity: true,
    sessionTimeout: 8, // hours
    maxLoginAttempts: 5,
    lockoutDuration: 30, // minutes
    auditRetention: 90, // days
    requirePasswordChange: false,
    allowConcurrentSessions: true
  });
  
  const [securityStatus, setSecurityStatus] = useState({
    lastSecurityScan: new Date().toISOString(),
    vulnerabilities: 0,
    activeSessions: 23,
    suspiciousActivity: 0
  });

  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuración guardada",
        description: "Los ajustes de seguridad se han actualizado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de seguridad",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const runSecurityScan = async () => {
    try {
      toast({
        title: "Escaneo iniciado",
        description: "Ejecutando análisis de seguridad del sistema...",
      });
      
      // Simulate security scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setSecurityStatus(prev => ({
        ...prev,
        lastSecurityScan: new Date().toISOString(),
        vulnerabilities: Math.floor(Math.random() * 3)
      }));

      toast({
        title: "Escaneo completado",
        description: "El análisis de seguridad ha finalizado sin problemas críticos",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo completar el escaneo de seguridad",
        variant: "destructive",
      });
    }
  };

  const getSecurityScore = () => {
    let score = 0;
    if (settings.twoFactorRequired) score += 25;
    if (settings.passwordComplexity) score += 20;
    if (settings.maxLoginAttempts <= 5) score += 15;
    if (settings.sessionTimeout <= 8) score += 15;
    if (settings.auditRetention >= 90) score += 15;
    if (securityStatus.vulnerabilities === 0) score += 10;
    
    return Math.min(100, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-status-available";
    if (score >= 60) return "text-status-reserved";
    return "text-destructive";
  };

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Configuración de Seguridad</span>
          </CardTitle>
          <CardDescription>
            Gestione los ajustes de seguridad y políticas del sistema
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Puntuación de Seguridad</CardTitle>
          <CardDescription>
            Evaluación actual de la seguridad del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Nivel de Seguridad</span>
                <span className={`text-lg font-bold ${getScoreColor(securityScore)}`}>
                  {securityScore}/100
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    securityScore >= 80 ? 'bg-status-available' :
                    securityScore >= 60 ? 'bg-status-reserved' : 'bg-destructive'
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>
            </div>
            <Button onClick={runSecurityScan} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Escanear
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {securityStatus.activeSessions}
              </div>
              <div className="text-sm text-muted-foreground">Sesiones activas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-available">
                {securityStatus.vulnerabilities}
              </div>
              <div className="text-sm text-muted-foreground">Vulnerabilidades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-status-available">
                {securityStatus.suspiciousActivity}
              </div>
              <div className="text-sm text-muted-foreground">Actividad sospechosa</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Último escaneo</div>
              <div className="text-sm">
                {new Date(securityStatus.lastSecurityScan).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Autenticación y Acceso</span>
          </CardTitle>
          <CardDescription>
            Configuración de políticas de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="twoFactor">Autenticación de dos factores</Label>
              <p className="text-sm text-muted-foreground">
                Requerir 2FA para todos los usuarios administradores
              </p>
            </div>
            <Switch
              id="twoFactor"
              checked={settings.twoFactorRequired}
              onCheckedChange={(checked) => handleSettingChange('twoFactorRequired', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="passwordComplexity">Complejidad de contraseñas</Label>
              <p className="text-sm text-muted-foreground">
                Enforce strong password requirements
              </p>
            </div>
            <Switch
              id="passwordComplexity"
              checked={settings.passwordComplexity}
              onCheckedChange={(checked) => handleSettingChange('passwordComplexity', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout de sesión (horas)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                min="1"
                max="24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max. intentos de login</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="w-5 h-5" />
            <span>Seguridad del Sistema</span>
          </CardTitle>
          <CardDescription>
            Configuración avanzada de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="requirePasswordChange">Forzar cambio de contraseña</Label>
              <p className="text-sm text-muted-foreground">
                Requerir cambio de contraseña periódico (90 días)
              </p>
            </div>
            <Switch
              id="requirePasswordChange"
              checked={settings.requirePasswordChange}
              onCheckedChange={(checked) => handleSettingChange('requirePasswordChange', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="concurrentSessions">Permitir sesiones concurrentes</Label>
              <p className="text-sm text-muted-foreground">
                Permitir múltiples sesiones por usuario
              </p>
            </div>
            <Switch
              id="concurrentSessions"
              checked={settings.allowConcurrentSessions}
              onCheckedChange={(checked) => handleSettingChange('allowConcurrentSessions', checked)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Duración de bloqueo (minutos)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => handleSettingChange('lockoutDuration', parseInt(e.target.value))}
                min="5"
                max="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auditRetention">Retención de logs (días)</Label>
              <Input
                id="auditRetention"
                type="number"
                value={settings.auditRetention}
                onChange={(e) => handleSettingChange('auditRetention', parseInt(e.target.value))}
                min="30"
                max="365"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Seguridad</CardTitle>
          <CardDescription>
            Estado actual de la seguridad del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {securityStatus.vulnerabilities > 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Se detectaron {securityStatus.vulnerabilities} vulnerabilidades de seguridad. 
                Se recomienda ejecutar un escaneo completo.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-status-available/50 bg-status-available/10">
              <CheckCircle className="h-4 w-4 text-status-available" />
              <AlertDescription className="text-status-available">
                Sistema seguro. No se detectaron vulnerabilidades críticas.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Badge variant="outline" className="bg-status-available/10">
              Firewall Activo
            </Badge>
            <Badge variant="outline" className="bg-status-available/10">
              SSL/TLS Configurado
            </Badge>
            <Badge variant="outline" className="bg-status-available/10">
              Backups Automáticos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end space-x-4">
            <Button variant="outline">
              Restablecer a valores por defecto
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}