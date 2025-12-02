import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CampaignProvider } from './context/CampaignContext'

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CampaignProvider>
      <App />
    </CampaignProvider>
  </StrictMode>
);
