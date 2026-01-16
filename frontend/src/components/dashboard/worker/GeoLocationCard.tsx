import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { MapPin, Navigation, ShieldCheck, ShieldAlert } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet with React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GeoLocationCardProps {
  position: [number, number]; // [lat, lng]
  safeZoneCenter: [number, number];
  safeZoneRadius: number; // meters
  lastUpdate: Date;
}

const GeoLocationCard: React.FC<GeoLocationCardProps> = ({ position, safeZoneCenter, safeZoneRadius, lastUpdate }) => {
  // Simple distance calculation (Haversine not strictly needed for this visual check, but logic should be here)
  const isInside = (pos: [number, number], center: [number, number], radius: number) => {
    const ky = 40000 / 360;
    const kx = Math.cos(Math.PI * center[0] / 180.0) * ky;
    const dx = Math.abs(center[1] - pos[1]) * kx;
    const dy = Math.abs(center[0] - pos[0]) * ky;
    return Math.sqrt(dx * dx + dy * dy) <= (radius / 1000);
  };

  const insideZone = isInside(position, safeZoneCenter, safeZoneRadius);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden flex flex-col h-[400px] transition-colors">
      <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <MapPin size={18} className="text-blue-500" /> Location Intelligence
        </h3>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${insideZone ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {insideZone ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          {insideZone ? 'Safe Zone' : 'Restricted Area'}
        </div>
      </div>
      
      <div className="flex-1 relative z-0">
        <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Circle 
            center={safeZoneCenter} 
            radius={safeZoneRadius} 
            pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.1 }} 
          />
          <Marker position={position}>
            <Popup>
              You are here <br /> Updated: {lastUpdate.toLocaleTimeString()}
            </Popup>
          </Marker>
        </MapContainer>
        
        {/* Overlay Stats */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/50 text-xs flex justify-between items-center z-[400]">
          <div>
            <p className="text-gray-500">Last Coordinates</p>
            <p className="font-mono font-medium">{position[0].toFixed(5)}, {position[1].toFixed(5)}</p>
          </div>
          <div className="text-right">
             <p className="text-gray-500">Last Update</p>
             <p className="font-medium text-blue-600 flex items-center gap-1 justify-end">
               <Navigation size={12} /> {Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)}s ago
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoLocationCard;
