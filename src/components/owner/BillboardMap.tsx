import React, { useEffect, useRef, useState } from 'react';
import { Billboard } from '@/hooks/useBillboards';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface BillboardMapProps {
  billboards: Billboard[];
  selectedBillboard?: Billboard | null;
  onBillboardSelect?: (billboard: Billboard) => void;
}

export function BillboardMap({ billboards, selectedBillboard, onBillboardSelect }: BillboardMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current || !window.google) return;

      // Inicializar el mapa
      const map = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 19.4326, lng: -99.1332 }, // Ciudad de México por defecto
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      // Crear marcadores para cada pantalla
      createMarkers();
    };

    const loadGoogleMaps = () => {
      if (window.google) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB1ErtrPfoAKScTZR7Fa2pnxf47BRImu80&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      // Limpiar marcadores
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      createMarkers();
    }
  }, [billboards]);

  const createMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Limpiar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Crear nuevos marcadores
    billboards.forEach(billboard => {
      if (billboard.lat && billboard.lng) {
        const marker = new google.maps.Marker({
          position: { lat: Number(billboard.lat), lng: Number(billboard.lng) },
          map: mapInstanceRef.current,
          title: billboard.nombre,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: getMarkerColor(billboard.status),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        // Agregar evento click al marcador
        marker.addListener('click', () => {
          const content = createInfoWindowContent(billboard);
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(mapInstanceRef.current, marker);
          
          if (onBillboardSelect) {
            onBillboardSelect(billboard);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Ajustar el mapa para mostrar todos los marcadores
    if (markersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      mapInstanceRef.current?.fitBounds(bounds);
    }
  };

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'disponible':
        return '#10B981'; // Verde
      case 'ocupada':
        return '#EF4444'; // Rojo
      case 'mantenimiento':
        return '#F59E0B'; // Amarillo
      default:
        return '#6B7280'; // Gris
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'disponible':
        return 'Disponible';
      case 'ocupada':
        return 'Ocupada';
      case 'mantenimiento':
        return 'En Mantenimiento';
      default:
        return 'Estado Desconocido';
    }
  };

  const formatPrice = (precio: any): string => {
    if (precio?.mensual) return `$${precio.mensual.toLocaleString()}/mes`;
    if (precio?.spot) return `$${precio.spot}/spot`;
    if (precio?.hora) return `$${precio.hora}/hora`;
    if (precio?.dia) return `$${precio.dia}/día`;
    return "Precio no definido";
  };

  const createInfoWindowContent = (billboard: Billboard): string => {
    const statusColor = getMarkerColor(billboard.status);
    return `
      <div style="padding: 10px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${billboard.nombre}</h3>
        <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${billboard.direccion}</p>
        <p style="margin: 0 0 4px 0; font-size: 14px;"><strong>Tipo:</strong> ${billboard.tipo}</p>
        <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Precio:</strong> ${formatPrice(billboard.precio)}</p>
        <div style="display: inline-block; padding: 4px 8px; background-color: ${statusColor}; color: white; border-radius: 4px; font-size: 12px;">
          ${getStatusLabel(billboard.status)}
        </div>
      </div>
    `;
  };

  const centerOnBillboard = (billboard: Billboard) => {
    if (mapInstanceRef.current && billboard.lat && billboard.lng) {
      const position = new google.maps.LatLng(Number(billboard.lat), Number(billboard.lng));
      mapInstanceRef.current.setCenter(position);
      mapInstanceRef.current.setZoom(15);
      
      // Encontrar y hacer click en el marcador correspondiente
      const marker = markersRef.current.find(m => {
        const pos = m.getPosition();
        return pos && 
               Math.abs(pos.lat() - Number(billboard.lat)) < 0.0001 && 
               Math.abs(pos.lng() - Number(billboard.lng)) < 0.0001;
      });
      
      if (marker) {
        google.maps.event.trigger(marker, 'click');
      }
    }
  };

  // Centrar en la pantalla seleccionada cuando cambie
  useEffect(() => {
    if (selectedBillboard) {
      centerOnBillboard(selectedBillboard);
    }
  }, [selectedBillboard]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Leyenda */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
        <h4 className="font-semibold text-sm mb-2">Leyenda</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Mantenimiento</span>
          </div>
        </div>
      </div>

      {/* Controles */}
      <div className="absolute bottom-4 left-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (markersRef.current.length > 0 && mapInstanceRef.current) {
              const bounds = new google.maps.LatLngBounds();
              markersRef.current.forEach(marker => {
                const position = marker.getPosition();
                if (position) bounds.extend(position);
              });
              mapInstanceRef.current.fitBounds(bounds);
            }
          }}
          className="bg-white"
        >
          <Navigation className="h-4 w-4 mr-1" />
          Ver Todas
        </Button>
      </div>
    </div>
  );
}