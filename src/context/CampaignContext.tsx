import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CampaignSearchMethod = 'mensual' | 'dia' | 'spot' | 'full' | 'catorcenal';

export interface CampaignInfo {
  nombre: string;
  propuesta: string;
  presupuesto: number;
  metodo: CampaignSearchMethod;
}

interface CampaignContextType {
  campaignInfo: CampaignInfo | null;
  setCampaignInfo: (info: CampaignInfo | null) => void;
  clearCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

const STORAGE_KEY = 'campaign_info';

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaignInfo, setCampaignInfoState] = useState<CampaignInfo | null>(() => {
    // Cargar desde localStorage al iniciar
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  // Sincronizar con localStorage cada vez que cambia
  useEffect(() => {
    if (campaignInfo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(campaignInfo));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [campaignInfo]);

  const setCampaignInfo = (info: CampaignInfo | null) => {
    setCampaignInfoState(info);
  };

  const clearCampaign = () => {
    setCampaignInfoState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CampaignContext.Provider value={{ campaignInfo, setCampaignInfo, clearCampaign }}>
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