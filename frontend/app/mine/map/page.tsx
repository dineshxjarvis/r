'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Layers,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ArrowLeft,
  Truck,
  Plus,
  Compass,
  Maximize2
} from 'lucide-react';

export default function MineGisMapPage() {
  const [activeLayers, setActiveLayers] = useState({
    pitBoundary: true,
    leaseArea: true,
    hemmLive: true,
    sensors: true,
    blastBuffer: true,
    findings: true
  });

  const [editMode, setEditMode] = useState(false);
  const [selectedPin, setSelectedPin] = useState<{
    id: string;
    label: string;
    coords: string;
    status: string;
    details: string;
  } | null>(null);

  const toggleLayer = (key: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddAnnotation = () => {
    const note = prompt('Enter boundary / geotechnical annotation note:');
    if (note) {
      alert(`Annotation "${note}" geo-pinned to Gevra North Pit Bench 7. Syncing to GIS shapefile layer.`);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/mine/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              GIS Mine Map · Gevra OCP (SECL)
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            High-Precision Georeferenced Drone Orthomosaic, Lease Boundaries, HEMM Telemetry & Blast Exclusion Buffer
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className={`px-3 py-1.5 rounded flex items-center gap-1 transition border ${
              editMode
                ? 'bg-[#8B0000] text-white border-[#730000] shadow-xs'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editMode ? '[Editing Enabled ✓]' : '[Edit Annotations]'}</span>
          </button>

          {editMode && (
            <button
              type="button"
              onClick={handleAddAnnotation}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded flex items-center gap-1 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>[+ Add Geo-Pin]</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Layer Controls Bar */}
        <div className="p-3 bg-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-700 uppercase flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span>Layers:</span>
          </span>

          <button
            type="button"
            onClick={() => toggleLayer('pitBoundary')}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
              activeLayers.pitBoundary
                ? 'bg-slate-800 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            [Pit Excavation Boundary]
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('leaseArea')}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
              activeLayers.leaseArea
                ? 'bg-blue-900 text-white border-blue-950 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            [Mining Lease Line (4,184 ha)]
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('hemmLive')}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
              activeLayers.hemmLive
                ? 'bg-[#8B0000] text-white border-[#730000] shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            [Live HEMM Fleet (GPS)]
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('sensors')}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
              activeLayers.sensors
                ? 'bg-emerald-800 text-white border-emerald-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            [CEMS Air/Noise Stations]
          </button>

          <button
            type="button"
            onClick={() => toggleLayer('blastBuffer')}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition ${
              activeLayers.blastBuffer
                ? 'bg-amber-700 text-white border-amber-800 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            [500m Blast Buffer Zone]
          </button>
        </div>

        {/* Interactive GIS Visual Surface */}
        <div className="relative w-full h-[450px] bg-slate-900 overflow-hidden select-none flex items-center justify-center">
          
          {/* Simulated Topographic Grid Lines & Pit Contours */}
          <svg className="w-full h-full absolute inset-0 opacity-40">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#475569" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Pit Contours */}
            <path
              d="M 120,80 Q 280,40 500,70 T 820,130 Q 880,260 800,360 T 450,390 Q 180,410 110,310 Z"
              fill="rgba(30, 41, 59, 0.6)"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <path
              d="M 190,130 Q 320,100 480,120 T 730,170 Q 770,260 710,330 T 430,340 Q 230,360 170,270 Z"
              fill="rgba(15, 23, 42, 0.7)"
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 2"
            />

            {/* Blast Buffer Zone (500m) */}
            {activeLayers.blastBuffer && (
              <circle
                cx="520"
                cy="220"
                r="140"
                fill="rgba(245, 158, 11, 0.12)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
            )}

            {/* Lease Boundary */}
            {activeLayers.leaseArea && (
              <polygon
                points="40,20 920,30 900,420 50,410"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="8 4"
              />
            )}
          </svg>

          {/* Map Compass & Scale Info */}
          <div className="absolute top-4 left-4 bg-slate-900/90 text-white border border-slate-700 p-2.5 rounded text-[11px] font-mono space-y-1 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>NORTH UP · EPSG:32644 (UTM 44N)</span>
            </div>
            <div className="text-slate-400 text-[10px]">
              Center: 22°20&apos;14.2&quot;N 82°35&apos;22.8&quot;E · Elevation: 298m RL
            </div>
          </div>

          {/* Interactive Geo-Pins */}

          {/* Pin 1: Finding DG-2847 */}
          {activeLayers.findings && (
            <button
              type="button"
              onClick={() => setSelectedPin({
                id: 'DG-2847',
                label: 'Finding DG-2847 (SEVERE)',
                coords: '22.3374° N, 82.5898° E (Bench 7N-S3)',
                status: 'AWAITING ACKNOWLEDGEMENT',
                details: 'Berm height eroded to 1.1m (Statutory minimum 2.2m). Ack overdue.'
              })}
              className="absolute top-[160px] left-[320px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white ring-4 ring-red-600/40 animate-pulse" />
              <span className="bg-slate-900 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-red-500 mt-1 shadow-md">
                DG-2847 (SEVERE)
              </span>
            </button>
          )}

          {/* Pin 2: Live Dumper DMP-041 */}
          {activeLayers.hemmLive && (
            <button
              type="button"
              onClick={() => setSelectedPin({
                id: 'DMP-041',
                label: 'Dumper DMP-041 (CAT 777D)',
                coords: '22.3391° N, 82.5921° E (Haul Road Ramp 4)',
                status: 'OUT OF SERVICE',
                details: 'CMR Reg. 181(3) fitness certificate expired on 28 Aug 2026.'
              })}
              className="absolute top-[280px] left-[610px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
            >
              <div className="p-1 rounded bg-[#8B0000] text-white border border-white shadow-md">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-700 mt-1 shadow-md">
                DMP-041 (0 km/h)
              </span>
            </button>
          )}

          {/* Pin 3: Ambient Air Station */}
          {activeLayers.sensors && (
            <button
              type="button"
              onClick={() => setSelectedPin({
                id: 'CAAMS-01',
                label: 'CAAMS Ambient Station #1',
                coords: '22.3412° N, 82.5850° E (North Pit Boundary)',
                status: 'OPERATIONAL',
                details: 'SPM 98 µg/m³ (limit 150) · RSPM 61 µg/m³ · Noise 76 dB (breach warning)'
              })}
              className="absolute top-[90px] left-[480px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
            >
              <div className="p-1 rounded bg-emerald-700 text-white border border-white shadow-md">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <span className="bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded border border-emerald-500 mt-1 shadow-md">
                CAAMS Air #1 (98µg)
              </span>
            </button>
          )}

        </div>

        {/* Selected Pin Details Panel */}
        {selectedPin && (
          <div className="p-4 bg-slate-50 border-t border-slate-300 space-y-2 text-xs font-mono animate-in fade-in duration-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-sm font-sans">
                Geo-Pinned Entity: {selectedPin.label}
              </span>
              <button
                type="button"
                onClick={() => setSelectedPin(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold font-sans"
              >
                [Close]
              </button>
            </div>
            <div className="text-slate-600">
              Coordinates: <span className="text-slate-900 font-bold">{selectedPin.coords}</span>
            </div>
            <div className="text-slate-600">
              Status: <span className="text-[#8B0000] font-bold">[{selectedPin.status}]</span> · {selectedPin.details}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Survey & Geodesy Division · DGMS Form VII Mine Plan Repository</span>
          <span className="font-mono text-slate-500">DGMS Bilaspur Region</span>
        </div>

      </div>
    </div>
  );
}
