import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type CampaignSearchMethod = 'mensual' | 'dia' | 'spot' | 'full' | 'catorcenal';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'inactive' | 'completed';

export interface CampaignInfo {
  id?: string;
  nombre: string;
  propuesta: string;
  presupuesto: number;
  metodo: CampaignSearchMethod;
  status?: CampaignStatus;
}

interface CampaignContextType {
  currentCampaignId: string | null;
  currentCampaign: CampaignInfo | null;
  setCurrentCampaign: (campaignId: string | null) => void;
  createDraftCampaign: (info: Omit<CampaignInfo, 'id' | 'status'>) => Promise<string | null>;
  updateCampaignStatus: (campaignId: string, status: CampaignStatus) => Promise<void>;
  refreshCampaign: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

const STORAGE_KEY = 'current_campaign_id';

export function CampaignProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });
  const [currentCampaign, setCurrentCampaignState] = useState<CampaignInfo | null>(null);

  // Cargar campaña actual cuando cambia el ID
  useEffect(() => {
    if (currentCampaignId && user) {
      loadCampaign(currentCampaignId);
    } else {
      setCurrentCampaignState(null);
    }
  }, [currentCampaignId, user]);

  // Sincronizar con localStorage
  useEffect(() => {
    if (currentCampaignId) {
      localStorage.setItem(STORAGE_KEY, currentCampaignId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [currentCampaignId]);

  const loadCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campañas')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      
      if (data) {
        setCurrentCampaignState({
          id: data.id,
          nombre: data.nombre,
          propuesta: data.propuesta || '',
          presupuesto: data.presupuesto_total,
          metodo: data.metodo_busqueda as CampaignSearchMethod,
          status: data.status as CampaignStatus
        });
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
      setCurrentCampaignId(null);
    }
  };

  const setCurrentCampaign = (campaignId: string | null) => {
    setCurrentCampaignId(campaignId);
  };

  const createDraftCampaign = async (info: Omit<CampaignInfo, 'id' | 'status'>): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('campañas')
        .insert({
          advertiser_id: user.id,
          nombre: info.nombre,
          propuesta: info.propuesta,
          presupuesto_total: info.presupuesto,
          metodo_busqueda: info.metodo,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setCurrentCampaignId(data.id);
        return data.id;
      }
      return null;
    } catch (error) {
      console.error('Error creating draft campaign:', error);
      return null;
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: CampaignStatus) => {
    try {
      const { error } = await supabase
        .from('campañas')
        .update({ status })
        .eq('id', campaignId);

      if (error) throw error;
      
      if (campaignId === currentCampaignId) {
        await loadCampaign(campaignId);
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
      throw error;
    }
  };

  const refreshCampaign = async () => {
    if (currentCampaignId) {
      await loadCampaign(currentCampaignId);
    }
  };

  return (
    <CampaignContext.Provider 
      value={{ 
        currentCampaignId, 
        currentCampaign, 
        setCurrentCampaign, 
        createDraftCampaign,
        updateCampaignStatus,
        refreshCampaign
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
}