'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { CommunityOutbreak } from '@/lib/types';
import { renderToStaticMarkup } from 'react-dom/server';
import { AlertTriangle } from 'lucide-react';


// Fix for default icon not showing in Next.js
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface CommunityMapProps {
  outbreaks: CommunityOutbreak[];
}

const PopupContent = ({ outbreak }: { outbreak: CommunityOutbreak }) => (
    <div className="space-y-2">
        <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />{outbreak.disease}</h3>
        <p className="text-sm"><span className="font-semibold">Crop:</span> {outbreak.crop}</p>
        <p className="text-sm"><span className="font-semibold">Cases:</span> {outbreak.detectedCases}</p>
        <p className="text-sm"><span className="font-semibold">Risk:</span> {outbreak.riskLevel}</p>
    </div>
);


export default function CommunityMap({ outbreaks }: CommunityMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markers = L.markerClusterGroup();
      
      outbreaks.forEach(outbreak => {
        const marker = L.marker([outbreak.latitude, outbreak.longitude]);
        const popupMarkup = renderToStaticMarkup(<PopupContent outbreak={outbreak} />);
        marker.bindPopup(popupMarkup);
        markers.addLayer(marker);
      });

      map.addLayer(markers);
    }
  }, [outbreaks]);

  return (
    <div ref={mapContainerRef} className="h-[400px] w-full rounded-lg border overflow-hidden" />
  );
}
