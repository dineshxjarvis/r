'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Building2,
  Compass
} from 'lucide-react';

interface JurisdictionMine {
  id: string;
  name: string;
  subsidiary: string;
  area: string;
  complianceStatus: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  verifiedRate: string;
  activeFindingsCount: number;
  severeCount: number;
  coordinates: string;
  pos: { top: string; left: string };
}

const MINES_IN_JURISDICTION: JurisdictionMine[] = [
  {
    id: 'GEVRA',
    name: 'Gevra OCP',
    subsidiary: 'SECL',
    area: 'Korba Area',
    complianceStatus: 'NON_COMPLIANT',
    verifiedRate: '76.2%',
    activeFindingsCount: 5,
    severeCount: 1,
    coordinates: '22.3374° N, 82.5898° E',
    pos: { top: '35%', left: '42%' }
  },
  {
    id: 'DIPKA',
    name: 'Dipka OCP',
    subsidiary: 'SECL',
    area: 'Korba Area',
    complianceStatus: 'COMPLIANT',
    verifiedRate: '84.2%',
    activeFindingsCount: 2,
    severeCount: 0,
    coordinates: '22.3180° N, 82.5530° E',
    pos: { top: '55%', left: '28%' }
  },
  {
    id: 'KUSMUNDA',
    name: 'Kusmunda OCP',
    subsidiary: 'SECL',
    area: 'Korba Area',
    complianceStatus: 'PARTIAL',
    verifiedRate: '80.0%',
    activeFindingsCount: 1,
    severeCount: 0,
    coordinates: '22.3450° N, 82.6820° E',
    pos: { top: '25%', left: '68%' }
  },
  {
    id: 'MANIKPUR',
    name: 'Manikpur OCP',
    subsidiary: 'SECL',
    area: 'Korba Area',
    complianceStatus: 'COMPLIANT',
    verifiedRate: '88.9%',
    activeFindingsCount: 0,
    severeCount: 0,
    coordinates: '22.3020° N, 82.7150° E',
    pos: { top: '65%', left: '75%' }
  }
];

export default function RegulatoryJurisdictionMapPage() {
  const [selectedMine, setSelectedMine] = useState<JurisdictionMine | null>(MINES_IN_JURISDICTION[0]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/regulatory/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Jurisdiction Map · Dhanbad Region 2 (12 Mines)
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Georeferenced Mine Lease Boundaries with Color-Coded Statutory Compliance Overlays
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-50 border border-slate-300 px-3 py-1.5 rounded">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>Compliant (8)</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Partial (3)</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-bold text-red-700">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>Non-Compliant (1)</span>
          </span>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Interactive Surface */}
        <div className="relative w-full h-[420px] bg-slate-900 overflow-hidden select-none flex items-center justify-center">
          
          {/* Topographic Grid & Regional Boundaries */}
          <svg className="w-full h-full absolute inset-0 opacity-40">
            <defs>
              <pattern id="reg-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#334155" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reg-grid)" />

            {/* Regional Rivers & Hasdeo Basin contour */}
            <path
              d="M 50,20 Q 240,160 380,190 T 720,290 T 920,400"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
          </svg>

          {/* Map Compass */}
          <div className="absolute top-4 left-4 bg-slate-900/90 text-white border border-slate-700 p-2.5 rounded text-[11px] font-mono space-y-0.5 shadow-lg pointer-events-none">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>DHANBAD REGION 2 · JURISDICTION SECTOR</span>
            </div>
            <div className="text-slate-400 text-[10px]">
              Geodetic Datum: WGS84 · DGMS Statutory Grid
            </div>
          </div>

          {/* Interactive Mine Overlay Pins */}
          {MINES_IN_JURISDICTION.map((mine) => {
            const isNonCompliant = mine.complianceStatus === 'NON_COMPLIANT';
            const isPartial = mine.complianceStatus === 'PARTIAL';
            const isSelected = selectedMine?.id === mine.id;

            return (
              <button
                key={mine.id}
                type="button"
                onClick={() => setSelectedMine(mine)}
                style={{ top: mine.pos.top, left: mine.pos.left }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition ${
                  isSelected ? 'scale-110 z-10' : 'hover:scale-105'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg ${
                    isNonCompliant
                      ? 'bg-red-600 ring-4 ring-red-600/40 animate-pulse'
                      : isPartial
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="bg-slate-900/95 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-700 mt-1 shadow-md whitespace-nowrap">
                  {mine.name} ({mine.verifiedRate})
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Mine Compliance Summary Box matching wireframe */}
        {selectedMine && (
          <div className="p-4 bg-slate-50 border-t border-slate-300 space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    selectedMine.complianceStatus === 'NON_COMPLIANT'
                      ? 'bg-red-600'
                      : selectedMine.complianceStatus === 'PARTIAL'
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                />
                <span className="font-bold text-slate-900 text-sm">
                  {selectedMine.name} · {selectedMine.subsidiary} ({selectedMine.area})
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {selectedMine.coordinates}
                </span>
              </div>

              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                  selectedMine.complianceStatus === 'NON_COMPLIANT'
                    ? 'bg-red-100 text-red-900 border-red-300'
                    : selectedMine.complianceStatus === 'PARTIAL'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                [{selectedMine.complianceStatus}]
              </span>
            </div>

            <div className="text-slate-600 text-xs pl-4.5">
              Verified Compliance Rate: <strong className="font-mono text-slate-900">{selectedMine.verifiedRate}</strong> · Active Statutory Findings: <strong className="font-mono text-slate-900">{selectedMine.activeFindingsCount}</strong> ({selectedMine.severeCount} SEVERE)
            </div>

            <div className="pl-4.5 pt-1 flex items-center gap-2">
              <Link
                href="/regulatory/findings"
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition"
              >
                [View Mine Findings & Violations →]
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Georeferenced Jurisdiction System · Mines Act 1952</span>
          <span className="font-mono text-slate-500">Survey of India Datum</span>
        </div>

      </div>
    </div>
  );
}
