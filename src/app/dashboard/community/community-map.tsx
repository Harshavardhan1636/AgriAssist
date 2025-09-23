'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { CommunityOutbreak } from '@/lib/types';
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

export default function CommunityMap({ outbreaks }: CommunityMapProps) {
  return (
    <div className="h-[400px] w-full rounded-lg border overflow-hidden">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup>
            {outbreaks.map(outbreak => (
            <Marker key={outbreak.id} position={[outbreak.latitude, outbreak.longitude]}>
                <Popup>
                    <div className="space-y-2">
                        <h3 className="font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" />{outbreak.disease}</h3>
                        <p className="text-sm"><span className="font-semibold">Crop:</span> {outbreak.crop}</p>
                        <p className="text-sm"><span className="font-semibold">Cases:</span> {outbreak.detectedCases}</p>
                        <p className="text-sm"><span className="font-semibold">Risk:</span> {outbreak.riskLevel}</p>
                    </div>
                </Popup>
            </Marker>
            ))}
        </MarkerClusterGroup>
        </MapContainer>
    </div>
  );
}
