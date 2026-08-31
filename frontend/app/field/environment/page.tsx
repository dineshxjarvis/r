'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Leaf,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Activity,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface SensorMetric {
  id: string;
  label: string;
  value: string;
  limit: string;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  location: string;
  timestamp: string;
}

const SENSORS: SensorMetric[] = [
  {
    id: 'spm',
    label: 'SPM',
    value: '98 µg/m³',
    limit: 'limit 150',
    status: 'SAFE',
    location: 'Continuous Ambient Air Station #1 (North Pit)',
    timestamp: '14:02:11'
  },
  {
    id: 'rspm',
    label: 'RSPM (PM10)',
    value: '61 µg/m³',
    limit: 'limit 100',
    status: 'SAFE',
    location: 'Continuous Ambient Air Station #2 (Workshop)',
    timestamp: '14:02:15'
  },
  {
    id: 'noise',
    label: 'Noise',
    value: '76 dB',
    limit: 'limit 75',
    status: 'WARNING',
    location: 'Coal Handling Plant (CHP) Perimeter',
    timestamp: '14:02:18'
  },
  {
    id: 'ph',
    label: 'Water pH',
    value: '7.2',
    limit: 'range 6.5 - 8.5',
    status: 'SAFE',
    location: 'Settling Pond #3 Effluent Discharge Point',
    timestamp: '14:01:50'
  }
];

export default function EnvironmentalDashboardPage() {
  const [selectedSensor, setSelectedSensor] = useState<SensorMetric | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Top Header Strip matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-700" />
            <span>Environmental Management & Clearances</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Environmental Compliance · Gevra OCP · FY 2026-27
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            MoEFCC EC Conditions · SPCB Consent to Operate (CTO) · Forest Clearance (FC)
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs font-bold">
          <Link
            href="/field/environment/documents"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded transition flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>[EC & Clearances Registry]</span>
          </Link>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* ========================================================= */}
        {/* SECTION 1: 3 SUMMARY TILES (EC CONDITIONS / CONSENT / FC) */}
        {/* ========================================================= */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50/50">
          
          {/* TILE 1: EC CONDITIONS */}
          <div className="bg-white border border-slate-300 rounded p-3.5 space-y-2 shadow-2xs">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span>EC CONDITIONS</span>
              <span className="font-mono text-slate-500 text-[10px]">MoEFCC</span>
            </div>
            <div className="space-y-1.5 pt-0.5 text-slate-800">
              <div className="flex items-center justify-between font-semibold">
                <span>8/12 Satisfied</span>
                <span className="text-emerald-700 font-mono font-bold">67%</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>2 Submitted</span>
                <span className="font-mono text-slate-500 text-[11px]">Under Review</span>
              </div>
              <div className="flex items-center justify-between font-bold text-red-700 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                  <span>2 Overdue</span>
                </span>
                <span className="font-mono">[Action Required]</span>
              </div>
            </div>
          </div>

          {/* TILE 2: CONSENT */}
          <div className="bg-white border border-slate-300 rounded p-3.5 space-y-2 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span>CONSENT</span>
                <span className="font-mono text-slate-500 text-[10px]">CECB / SPCB</span>
              </div>
              <div className="space-y-1 text-slate-800">
                <div className="font-semibold">CTO Valid until</div>
                <div className="font-bold text-slate-900 font-mono text-sm">31 Mar 2027</div>
                <div className="text-[11px] text-slate-500">Air & Water Act Consent (70 MTPA)</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Consent to Operate (CTO) Instrument:\nValidity: 01 Apr 2024 to 31 Mar 2027\nAuthority: Chhattisgarh Environment Conservation Board (CECB)')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-900 rounded transition"
              >
                [View]
              </button>
            </div>
          </div>

          {/* TILE 3: FOREST */}
          <div className="bg-white border border-slate-300 rounded p-3.5 space-y-2 shadow-2xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span>FOREST</span>
                <span className="font-mono text-slate-500 text-[10px]">FCA 1980</span>
              </div>
              <div className="space-y-1 text-slate-800">
                <div className="font-semibold">FC Stage 2</div>
                <div className="font-bold text-amber-900 font-mono">Pending MoEFCC</div>
                <div className="text-[11px] text-slate-500">Diversion of 124.5 ha forest land</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Forest Clearance (FC) Stage 2 Case:\nStatus: Under compliance verification at MoEFCC Regional Office (Raipur)\nCA Land Handover: Completed')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#1E3A8A] rounded transition"
              >
                [View status]
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* SECTION 2: CRITICAL CALENDAR                              */}
        {/* ========================================================= */}
        <div className="p-4 space-y-2.5">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-700" />
            <span>CRITICAL CALENDAR</span>
          </div>

          <div className="space-y-2">
            {/* Calendar Item 1: 31 Aug */}
            <div className="border border-slate-300 bg-white rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded shrink-0">
                  31 Aug
                </span>
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900">
                    Plantation survey submission (EC Cond 14)
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Requires 4 geo-tagged photographs + boundary polygon verification
                  </div>
                </div>
              </div>

              <Link
                href="/field/obligations/OBL-PLANT-40HA/submit"
                className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition self-start sm:self-auto shrink-0 shadow-xs"
              >
                [Submit now →]
              </Link>
            </div>

            {/* Calendar Item 2: 05 Sep */}
            <div className="border border-slate-200 bg-slate-50/70 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded shrink-0">
                  05 Sep
                </span>
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">
                    Air quality monitoring (EC Cond 31)
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Quarterly Fortnightly Ambient Air Monitoring Report (AAQMR)
                  </div>
                </div>
              </div>

              <span className="font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[11px] self-start sm:self-auto">
                PENDING
              </span>
            </div>

            {/* Calendar Item 3: 30 Sep */}
            <div className="border border-slate-200 bg-slate-50/70 rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <span className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded shrink-0">
                  30 Sep
                </span>
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900">
                    Water discharge report (CTE Schedule III)
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Effluent Treatment Plant (ETP) & Workshop oil-grease trap analysis
                  </div>
                </div>
              </div>

              <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px] self-start sm:self-auto">
                NOT_DUE_YET
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: MONITORING DATA (real-time telemetry)          */}
        {/* ========================================================= */}
        <div className="p-4 space-y-2.5 bg-slate-50/40">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>MONITORING DATA (real-time where sensors exist)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Live Telemetry: Telemetric Sensor Array (CAAMS Gevra)
            </span>
          </div>

          {/* 4 Sensor Metric Cards matching wireframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {SENSORS.map((s) => {
              const isWarning = s.status === 'WARNING';
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSensor(s)}
                  className={`bg-white border rounded p-3 cursor-pointer transition shadow-2xs hover:border-slate-400 ${
                    isWarning ? 'border-amber-400 ring-1 ring-amber-300 bg-amber-50/30' : 'border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{s.label}</span>
                    {isWarning ? (
                      <span className="text-amber-800 font-bold flex items-center gap-1 text-[11px]">
                        <span className="text-amber-600 font-extrabold">🟡!</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs">✅</span>
                    )}
                  </div>

                  <div className="font-mono text-base font-bold text-slate-900 mt-1">
                    {s.value}
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    ({s.limit})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sensor Drill-down Details if selected */}
          {selectedSensor && (
            <div className="p-3 bg-white border border-slate-300 rounded text-xs space-y-1 font-mono animate-in fade-in duration-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  Telemetry Detail: {selectedSensor.label} ({selectedSensor.value})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSensor(null)}
                  className="text-slate-400 hover:text-slate-800 text-xs font-bold"
                >
                  [Close]
                </button>
              </div>
              <div className="text-slate-600 text-[11px]">
                Location: {selectedSensor.location}
              </div>
              <div className="text-slate-500 text-[11px]">
                Last Reading Timestamp: {selectedSensor.timestamp} · Status: {selectedSensor.status}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>MoEFCC Environmental Clearance EC-2009/44/IA-II(M)</span>
          <span className="font-mono text-slate-500">CECB Online CEMS Live</span>
        </div>

      </div>
    </div>
  );
}
