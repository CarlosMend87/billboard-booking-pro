import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BarChart3, Eye, Map, Settings } from "lucide-react";
import { useBillboards, Billboard } from "@/hooks/useBillboards";
import { BillboardForm } from "@/components/owner/BillboardForm";
import { BusinessIntelligence } from "@/components/dashboard/BusinessIntelligence";
import { QuickActions } from "@/components/owner/QuickActions";
import { BillboardMap } from "@/components/owner/BillboardMap";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function OwnerDashboard() {
  const { billboards, loading, updateBillboard } = useBillboards();
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMapBillboard, setSelectedMapBillboard] = useState<Billboard | null>(null);

  const handleEdit = (billboard: Billboard) => {
    setSelectedBillboard(billboard);
    setIsFormOpen(true);
  };

  const handleViewOnMap = (billboard: Billboard) => {
    setSelectedMapBillboard(billboard);
  };

  const handleUpdateStatus = async (billboardId: string, status: string) => {
    await updateBillboard(billboardId, { status });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dashboard Propietario
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestión completa de pantallas publicitarias y análisis de rendimiento
            </p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={() => setSelectedBillboard(null)}>
                <Plus className="h-4 w-4" />
                Nueva Pantalla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedBillboard ? 'Editar Pantalla' : 'Nueva Pantalla'}
                </DialogTitle>
              </DialogHeader>
              <BillboardForm 
                billboard={selectedBillboard} 
                onClose={() => {
                  setIsFormOpen(false);
                  setSelectedBillboard(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Gestión
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Mapa
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <BusinessIntelligence billboards={billboards} />
            </TabsContent>

            <TabsContent value="management">
              <QuickActions
                billboards={billboards}
                onEditBillboard={handleEdit}
                onViewOnMap={handleViewOnMap}
                onUpdateStatus={handleUpdateStatus}
              />
            </TabsContent>

            <TabsContent value="map">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Ubicación de Pantallas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[600px] w-full">
                    <BillboardMap
                      billboards={billboards}
                      selectedBillboard={selectedMapBillboard}
                      onBillboardSelect={setSelectedMapBillboard}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración del Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Próximamente: Configuraciones avanzadas, notificaciones automáticas, 
                      y exportación de reportes en Excel/PDF.
                    </p>
                    <Button variant="outline" disabled>
                      Exportar Reporte Financiero
                    </Button>
                    <Button variant="outline" disabled className="ml-2">
                      Configurar Alertas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}