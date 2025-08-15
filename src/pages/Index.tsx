import { Header } from "@/components/layout/Header"
import { DashboardStats } from "@/components/dashboard/DashboardStats"
import { BillboardGrid } from "@/components/billboard/BillboardGrid"

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your out-of-home billboard inventory and reservations
          </p>
        </div>
        
        <DashboardStats />
        
        <BillboardGrid />
      </main>
    </div>
  );
};

export default Index;
