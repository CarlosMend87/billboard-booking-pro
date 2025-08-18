import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, Plus, Target } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Campaign {
  id: string;
  nombre: string;
  presupuesto_total: number;
  presupuesto_usado: number;
  dias_totales: number;
  dias_transcurridos: number;
  fecha_inicio: string;
  fecha_fin: string;
  status: string;
  reservas: {
    asset_name: string;
    asset_type: string;
    modalidad: string;
    precio_total: number;
  };
}

export default function ProgresoCampaña() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [extendingCampaign, setExtendingCampaign] = useState<string | null>(null);
  const [additionalBudget, setAdditionalBudget] = useState<number>(0);
  const [additionalDays, setAdditionalDays] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCampaigns = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('campañas')
        .select(`
          *,
          reservas:reserva_id (
            asset_name,
            asset_type,
            modalidad,
            precio_total
          )
        `)
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate days elapsed
      const campaignsWithProgress = data?.map(campaign => {
        const today = new Date();
        const startDate = new Date(campaign.fecha_inicio);
        const endDate = new Date(campaign.fecha_fin);
        
        const daysElapsed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        return {
          ...campaign,
          dias_transcurridos: Math.min(daysElapsed, totalDays),
          dias_totales: totalDays
        };
      });

      setCampaigns(campaignsWithProgress || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExtensionDays = (campaign: Campaign, budget: number) => {
    const dailyRate = campaign.presupuesto_total / campaign.dias_totales;
    return Math.floor(budget / dailyRate);
  };

  const extendCampaign = async (campaignId: string) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const extensionDays = calculateExtensionDays(campaign, additionalBudget);
      const newEndDate = new Date(campaign.fecha_fin);
      newEndDate.setDate(newEndDate.getDate() + extensionDays);

      const { error } = await supabase
        .from('campañas')
        .update({
          presupuesto_total: campaign.presupuesto_total + additionalBudget,
          fecha_fin: newEndDate.toISOString().split('T')[0],
          dias_totales: campaign.dias_totales + extensionDays
        })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaña Extendida",
        description: `Se agregaron ${extensionDays} días adicionales`,
      });

      setExtendingCampaign(null);
      setAdditionalBudget(0);
      setAdditionalDays(0);
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">Cargando campañas...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Progreso de Campañas</h1>
          <p className="text-muted-foreground">
            Monitorea el progreso de tus campañas publicitarias activas
          </p>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No tienes campañas activas</h3>
              <p className="text-muted-foreground">
                Cuando tengas reservas aceptadas, aparecerán aquí como campañas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {campaigns.map((campaign) => {
              const progressPercentage = (campaign.dias_transcurridos / campaign.dias_totales) * 100;
              const budgetUsedPercentage = (campaign.presupuesto_usado / campaign.presupuesto_total) * 100;
              const daysRemaining = campaign.dias_totales - campaign.dias_transcurridos;

              return (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {campaign.nombre}
                          <Badge className={getStatusColor(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {campaign.reservas?.asset_name} - {campaign.reservas?.asset_type}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${campaign.presupuesto_total.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Presupuesto Total</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Progress Bars */}
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Progreso de Tiempo
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {campaign.dias_transcurridos} de {campaign.dias_totales} días
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Presupuesto Usado
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ${campaign.presupuesto_usado.toLocaleString()} de ${campaign.presupuesto_total.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={budgetUsedPercentage} className="h-2" />
                      </div>
                    </div>

                    {/* Campaign Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Inicio</p>
                          <p className="text-muted-foreground">
                            {new Date(campaign.fecha_inicio).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Fin</p>
                          <p className="text-muted-foreground">
                            {new Date(campaign.fecha_fin).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Días Restantes</p>
                          <p className={`${daysRemaining <= 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {Math.max(0, daysRemaining)} días
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Modalidad</p>
                          <p className="text-muted-foreground">{campaign.reservas?.modalidad}</p>
                        </div>
                      </div>
                    </div>

                    {/* Extension Controls */}
                    {campaign.status === 'active' && (
                      <div className="border-t pt-4">
                        {extendingCampaign === campaign.id ? (
                          <div className="space-y-4">
                            <h4 className="font-medium">Extender Campaña</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="budget">Presupuesto Adicional</Label>
                                <Input
                                  id="budget"
                                  type="number"
                                  value={additionalBudget || ''}
                                  onChange={(e) => setAdditionalBudget(Number(e.target.value))}
                                  placeholder="$0"
                                />
                              </div>
                              <div>
                                <Label>Días Adicionales</Label>
                                <p className="text-2xl font-bold text-primary">
                                  {calculateExtensionDays(campaign, additionalBudget)} días
                                </p>
                              </div>
                              <div className="flex items-end gap-2">
                                <Button
                                  onClick={() => extendCampaign(campaign.id)}
                                  disabled={!additionalBudget}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setExtendingCampaign(null)}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setExtendingCampaign(campaign.id)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar Más Días
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}