import { Header } from '@/components/layout/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgentesManagement } from '@/components/owner/AgentesManagement';
import { MaterialesManagement } from '@/components/owner/MaterialesManagement';
import { RenovacionesPanel } from '@/components/owner/RenovacionesPanel';
import { BonificacionesPanel } from '@/components/owner/BonificacionesPanel';
import { Users, FileText, RefreshCw, Gift } from 'lucide-react';

export default function AgentesVenta() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Módulo de Agentes de Venta
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu equipo de ventas, materiales, renovaciones y bonificaciones
          </p>
        </div>

        <Tabs defaultValue="agentes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agentes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Agentes</span>
            </TabsTrigger>
            <TabsTrigger value="materiales" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Materiales</span>
            </TabsTrigger>
            <TabsTrigger value="renovaciones" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Renovaciones</span>
            </TabsTrigger>
            <TabsTrigger value="bonificaciones" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Bonificaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agentes" className="mt-6">
            <AgentesManagement />
          </TabsContent>

          <TabsContent value="materiales" className="mt-6">
            <MaterialesManagement />
          </TabsContent>

          <TabsContent value="renovaciones" className="mt-6">
            <RenovacionesPanel />
          </TabsContent>

          <TabsContent value="bonificaciones" className="mt-6">
            <BonificacionesPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
