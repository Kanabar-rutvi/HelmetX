import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl } from 'react-leaflet';
import { MapPin, Users, Activity } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
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

interface SiteMapProps {
  workers: any[];
  center: [number, number];
  geofenceRadius: number;
}

const SiteMap: React.FC<SiteMapProps> = ({ workers, center, geofenceRadius }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-[500px] transition-colors">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <MapPin size={18} className="text-blue-500" />
          Live Site Intelligence
        </h3>
        <div className="flex gap-2">
           <span className="text-xs font-bold flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full border border-green-100 dark:border-green-900/50">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div> Live
           </span>
        </div>
      </div>
      
      <div className="flex-1 relative z-0">
        <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <Circle 
            center={center} 
            radius={geofenceRadius} 
            pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, dashArray: '5, 5' }} 
          />

          {workers.map((worker) => (
             worker.lat && worker.lng && (
               <Marker key={worker._id} position={[worker.lat, worker.lng]}>
                 <Popup className="custom-popup">
                   <div className="min-w-[150px] p-1">
                     <div className="font-bold text-slate-800 dark:text-slate-900 mb-1 flex justify-between items-center">
                        {worker.name || worker.deviceId}
                        <span className={`w-2 h-2 rounded-full ${worker.status === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                     </div>
                     <div className="space-y-1 text-xs text-slate-600 dark:text-slate-700 border-t border-slate-100 pt-1 mt-1">
                         <div className="flex justify-between"><span>HR:</span> <span className="font-mono font-bold">{worker.heartRate} bpm</span></div>
                         <div className="flex justify-between"><span>Helmet:</span> <span className={`font-bold ${worker.helmetOn ? 'text-green-600' : 'text-red-600'}`}>{worker.helmetOn ? 'On' : 'Off'}</span></div>
                     </div>
                   </div>
                 </Popup>
               </Marker>
             )
          ))}
        </MapContainer>
        
        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
           <button className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Toggle Zones">
              <Activity size={18} />
           </button>
           <button className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Filter Workers">
              <Users size={18} />
           </button>
        </div>
      </div>
    </div>
  );
};

export default SiteMap;
