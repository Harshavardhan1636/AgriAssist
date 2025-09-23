
'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import type { StoreLocation } from '@/lib/types';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/i18n-context';

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

interface StoreMapProps {
  locations: StoreLocation[];
}

const PopupContent = ({ location, t }: { location: StoreLocation, t: (key: string) => string }) => {
    const handleDirectionsClick = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`, '_blank');
    }
    
    return (
        <div className="space-y-2">
            <h3 className="font-bold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{location.name}</h3>
            <p className="text-sm">{location.address}</p>
            <Button size="sm" className="w-full" onClick={handleDirectionsClick}>
                {t('Get Directions')}
            </Button>
        </div>
    );
};

export default function StoreMap({ locations }: StoreMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      const markers = L.markerClusterGroup();
      
      locations.forEach(location => {
        const marker = L.marker([location.latitude, location.longitude]);
        
        // We can't pass the click handler directly because renderToStaticMarkup doesn't handle events.
        // So, we create the popup content and add the event listener after the popup is opened.
        const popupDiv = document.createElement('div');
        popupDiv.innerHTML = renderToStaticMarkup(<PopupContent location={location} t={t} />);

        marker.bindPopup(popupDiv);
        
        marker.on('popupopen', () => {
            const button = popupDiv.querySelector('button');
            if (button) {
                button.onclick = () => {
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`, '_blank');
                };
            }
        });

        markers.addLayer(marker);
      });

      map.addLayer(markers);
    }
  }, [locations, t]);

  return (
    <div ref={mapContainerRef} className="h-[400px] w-full rounded-lg border overflow-hidden z-10" />
  );
}
