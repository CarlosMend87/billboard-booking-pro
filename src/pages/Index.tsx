import { Header } from "@/components/layout/Header"
import { BusinessIntelligence } from "@/components/dashboard/BusinessIntelligence"
import { EnhancedInventoryManager } from "@/components/inventory/EnhancedInventoryManager"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Search, Plus, MapPin, BarChart3, Grid3X3, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">
            Detalle Marketplace - Gestiona tu inventario de anuncios publicitarios
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Propietarios de Anuncios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gestiona tu inventario, precios y disponibilidad de espacios publicitarios
              </p>
              <Button asChild className="w-full">
                <Link to="/add-billboard">
                  <Plus className="h-4 w-4 mr-2" />
                  Administrar Inventario
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Anunciantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Encuentra y reserva espacios publicitarios disponibles
              </p>
              <Button asChild variant="secondary" className="w-full">
                <Link to="/disponibilidad-anuncios">
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver Disponibilidad
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progreso de Campañas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Monitorea tus campañas publicitarias activas y su progreso
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/progreso-campaña">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Ver Campañas
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Inteligencia de Negocio
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Gestión de Inventario
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-6">
            <BusinessIntelligence />
          </TabsContent>
          
          <TabsContent value="inventory" className="mt-6">
            <EnhancedInventoryManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;