'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Layers,
  Compass,
  Radio,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Eye,
  EyeOff
} from 'lucide-react';

interface GISMapProps {
  mineName?: string;
  scope?: string;
  showEditing?: boolean;
}

export function GISMap({
  mineName = 'Gevra OCP (SECL)',
  scope = 'High-Precision Georeferenced Orthomosaic',
  showEditing = false
}: GISMapProps) {
  const [layers, setLayers] = useState({
    leaseBoundary: true,
    benches: true,
    haulRoads: true,
    findings: true,
    sensors: true,
    hemmUnits: true
  });

  const [selectedPin, setSelectedPin] = useState<{
    id: string;
    title: string;
    type: string;
    coords: string;
    details: string;
  } | null>(null);

  const toggleLayer = (k: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <div className="space-y-4">
      {/* Map Control Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>GIS Layers:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'leaseBoundary', label: 'Lease Boundary', color: 'border-blue-500 text-blue-800' },
            { id: 'benches', label: 'Mine Benches', color: 'border-amber-500 text-amber-800' },
            { id: 'haulRoads', label: 'Haul Roads', color: 'border-slate-500 text-slate-800' },
            { id: 'findings', label: 'Active Findings', color: 'border-red-500 text-red-800' },
            { id: 'sensors', label: 'Telemetry Sensors', color: 'border-emerald-500 text-emerald-800' },
            { id: 'hemmUnits', label: 'Live HEMM (GPS)', color: 'border-purple-500 text-purple-800' }
          ].map(layer => (
            <button
              key={layer.id}
              onClick={() => toggleLayer(layer.id as keyof typeof layers)}
              className={`px-2.5 py-1 rounded-md border font-semibold transition-all flex items-center gap-1.5 ${
                layers[layer.id as keyof typeof layers]
                  ? `bg-slate-50 ${layer.color} shadow-xs`
                  : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  layers[layer.id as keyof typeof layers] ? 'bg-current' : 'bg-slate-300'
                }`}
              />
              <span>{layer.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual GIS Canvas */}
      <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Background Grid / Contour Styling */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, #3b82f6 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '30px 30px, 60px 60px, 60px 60px'
          }}
        />

        {/* SVG Topographic Simulation */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40" viewBox="0 0 800 500">
          <ellipse cx="400" cy="250" rx="340" ry="200" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="6 4" />
          <ellipse cx="400" cy="250" rx="280" ry="160" fill="none" stroke="#93c5fd" strokeWidth="1" />
          <ellipse cx="400" cy="250" rx="210" ry="120" fill="none" stroke="#bfdbfe" strokeWidth="1" />
          <ellipse cx="400" cy="250" rx="140" ry="80" fill="none" stroke="#3b82f6" strokeWidth="1" />
          <path d="M 120 180 Q 250 220 400 250 T 680 320" fill="none" stroke="#fbbf24" strokeWidth="3" />
          <path d="M 220 380 Q 320 280 400 250 T 580 120" fill="none" stroke="#fbbf24" strokeWidth="2.5" />
        </svg>

        {/* Active Findings Pins */}
        {layers.findings && (
          <div
            onClick={() =>
              setSelectedPin({
                id: 'pin-1',
                title: 'DGMS Finding #DG-2847 (Severe)',
                type: 'Safety Finding',
                coords: '22°20\'14.2"N 82°35\'08.9"E (Bench 7 East)',
                details: 'Haul road edge protection missing along 40m section. Continuous safety berm required.'
              })
            }
            className="absolute top-[38%] left-[45%] cursor-pointer group z-10 animate-bounce"
          >
            <div className="p-2 bg-red-600 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
              Finding: Berm Missing (Bench 7)
            </div>
          </div>
        )}

        {/* Telemetry Sensor Pins */}
        {layers.sensors && (
          <div
            onClick={() =>
              setSelectedPin({
                id: 'pin-2',
                title: 'Continuous Air Quality Station (CAAQMS-02)',
                type: 'Environmental Sensor',
                coords: '22°21\'02.1"N 82°36\'11.4"E (Mine Boundary North)',
                details: 'PM10: 84 µg/m³ · PM2.5: 38 µg/m³ · Wind: 4.2 m/s NW. Telemetry status: ONLINE.'
              })
            }
            className="absolute top-[22%] left-[68%] cursor-pointer group z-10"
          >
            <div className="p-1.5 bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center">
              <Radio className="w-3.5 h-3.5" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
              Sensor: CAAQMS-02 (Active)
            </div>
          </div>
        )}

        {/* Live HEMM Pin */}
        {layers.hemmUnits && (
          <div
            onClick={() =>
              setSelectedPin({
                id: 'pin-3',
                title: 'Dumper DMP-240-08 (Payload 240t)',
                type: 'HEMM Telemetry',
                coords: '22°19\'55.8"N 82°34\'42.1"E (Haul Road Section 3)',
                details: 'Speed: 22 km/h · Operator: D. Murmu · Slope Sensor: Normal · Fatigue Alert: Clear.'
              })
            }
            className="absolute top-[62%] left-[32%] cursor-pointer group z-10"
          >
            <div className="p-1.5 bg-purple-600 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
              HEMM: DMP-240-08 (Active Hauling)
            </div>
          </div>
        )}

        {/* Compass HUD */}
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-lg text-white text-center font-mono text-[10px]">
          <Compass className="w-5 h-5 text-blue-400 mx-auto mb-0.5 animate-pulse" />
          <span>N 0°</span>
        </div>

        {/* Coordinate Overlay */}
        <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 font-mono text-[11px] flex items-center gap-3">
          <span>Lat: 22°20&apos;14.2&quot;N</span>
          <span>Long: 82°35&apos;08.9&quot;E</span>
          <span>Datum: WGS84 (EPSG:4326)</span>
        </div>

        {/* Interactive Pin Details Drawer */}
        {selectedPin && (
          <div className="absolute bottom-4 right-4 max-w-sm bg-white p-4 rounded-xl border border-slate-200 shadow-2xl z-20 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{selectedPin.type}</span>
                <h4 className="font-bold text-slate-900">{selectedPin.title}</h4>
              </div>
              <button
                onClick={() => setSelectedPin(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-500">{selectedPin.coords}</p>
            <p className="text-slate-700 leading-relaxed">{selectedPin.details}</p>
          </div>
        )}
      </div>
    </div>
  );
}
