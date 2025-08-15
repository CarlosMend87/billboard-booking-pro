import { Header } from "@/components/layout/Header"
import { EnhancedInventoryManager } from "@/components/inventory/EnhancedInventoryManager"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground">
            Gestiona tu inventario de vallas publicitarias con herramientas avanzadas
          </p>
        </div>
        
        <EnhancedInventoryManager />
      </main>
    </div>
  );
};

export default Index;
