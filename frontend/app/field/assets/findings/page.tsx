'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  AlertTriangle,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  Plus
} from 'lucide-react';

interface AssetFinding {
  id: string;
  assetId: string;
  assetName: string;
  severity: 'SEVERE' | 'SIGNIFICANT' | 'MINOR';
  status: 'AWAITING_ACKNOWLEDGEMENT' | 'CAPA_ASSIGNED' | 'CLOSED';
  regReference: string;
  issueDescription: string;
  dueText: string;
  overdueBadge?: string;
  serviceHistory: string[];
}

const INITIAL_ASSET_FINDINGS: AssetFinding[] = [
  {
    id: 'FD-AST-091',
    assetId: 'DMP-041',
    assetName: 'CAT 777D Heavy Rear Dumper',
    severity: 'SEVERE',
    status: 'AWAITING_ACKNOWLEDGEMENT',
    regReference: 'CMR 2017 Reg. 181(3) Mechanical Approval',
    issueDescription: 'Emergency braking retarder pressure below statutory 180 bar specification.',
    dueText: 'Ack due 31 Aug',
    overdueBadge: 'OVERDUE BY 0 D',
    serviceHistory: [
      '28 Aug 2026: Mandatory periodic brake test failed at Central Workshop',
      '15 Jul 2026: 250-hour preventative maintenance overhaul passed'
    ]
  },
  {
    id: 'FD-AST-074',
    assetId: 'EX-007',
    assetName: 'Komatsu PC3000-6 Shovel',
    severity: 'SIGNIFICANT',
    status: 'CAPA_ASSIGNED',
    regReference: 'CMR 2017 Reg. 182 Fire Suppression Audit',
    issueDescription: 'Automatic fire suppression system (AFSS) pressure sensor calibration overdue.',
    dueText: 'CAPA due 08 Sep',
    serviceHistory: [
      '20 Aug 2026: AFSS sensor inspection logged',
      '01 Jun 2026: Hydraulic cylinder seal kit replaced'
    ]
  }
];

const TABS = ['All Findings', 'SEVERE', 'SIGNIFICANT', 'CLOSED'] as const;

export default function AssetFindingsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All Findings');
  const [findings, setFindings] = useState<AssetFinding[]>(INITIAL_ASSET_FINDINGS);
  const [selectedFinding, setSelectedFinding] = useState<AssetFinding | null>(null);

  const handleAck = (id: string) => {
    setFindings(prev =>
      prev.map(f =>
        f.id === id ? { ...f, status: 'CAPA_ASSIGNED', overdueBadge: undefined } : f
      )
    );
    alert(`Asset Finding ${id} acknowledged. Statutory CAPA docket generated.`);
  };

  const handleTakeOutOfService = (assetId: string) => {
    alert(`Asset ${assetId} marked OUT_OF_SERVICE (POST /assets/{id}/actions {action:"TAKE_OUT_OF_SERVICE"}). Machine locked out in dispatch system.`);
  };

  const filteredFindings = findings.filter(f => {
    if (activeTab === 'All Findings') return true;
    return f.severity === activeTab || (activeTab === 'CLOSED' && f.status === 'CLOSED');
  });

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/field/assets"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Asset & Equipment Findings · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            DGMS Mechanical/Electrical Statutory Non-Compliances & HEMM Service Dockets
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/field/inspections/INS-2026-0881/observe"
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ Raise Asset Finding]</span>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        
        {/* Filter Tabs */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 flex items-center gap-2 flex-wrap text-xs">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded font-semibold text-xs transition border ${
                  isSelected
                    ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                [{tab}]
              </button>
            );
          })}
        </div>

        {/* Findings List */}
        <div className="divide-y divide-slate-300">
          {filteredFindings.map((f) => {
            const isSevere = f.severity === 'SEVERE';
            const isSignificant = f.severity === 'SIGNIFICANT';

            return (
              <div
                key={f.id}
                className="p-4 hover:bg-slate-50/80 transition text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isSevere ? 'bg-red-600' : isSignificant ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                    />
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {f.id}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-extrabold ${
                        isSevere ? 'text-red-700' : isSignificant ? 'text-amber-800' : 'text-emerald-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">
                      {f.assetId} ({f.assetName})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {f.overdueBadge && (
                      <span className="bg-red-50 text-red-700 font-mono font-bold border border-red-200 text-[10px] px-1.5 py-0.5 rounded">
                        [{f.overdueBadge}]
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                      {f.status}
                    </span>
                  </div>
                </div>

                <div className="pl-4.5 space-y-1">
                  <div className="font-bold text-slate-800 text-xs">
                    {f.regReference}
                  </div>
                  <div className="text-slate-600 text-xs">
                    {f.issueDescription}
                  </div>
                </div>

                <div className="pl-4.5 flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {f.status === 'AWAITING_ACKNOWLEDGEMENT' && (
                      <button
                        type="button"
                        onClick={() => handleAck(f.id)}
                        className="px-2.5 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs"
                      >
                        [Acknowledge]
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedFinding(selectedFinding?.id === f.id ? null : f)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                    >
                      {selectedFinding?.id === f.id ? '[Hide Asset Detail]' : '[View Asset Record]'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTakeOutOfService(f.assetId)}
                      className="px-2.5 py-1 bg-red-50 border border-red-300 hover:bg-red-100 text-xs font-bold text-red-700 rounded transition"
                    >
                      [Take Out of Service]
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono">
                    {f.dueText}
                  </span>
                </div>

                {/* Expanded Asset Panel showing Service History */}
                {selectedFinding?.id === f.id && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded space-y-2 font-mono text-[11px] animate-in fade-in duration-150">
                    <div className="font-sans font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#8B0000]" />
                      <span>HEMM Asset Service & Maintenance History:</span>
                    </div>
                    <div className="space-y-1 pl-2 border-l-2 border-[#8B0000]">
                      {f.serviceHistory.map((line, idx) => (
                        <div key={idx} className="text-slate-700">
                          • {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Form B Equipment Defects Register</span>
          <span className="font-mono text-slate-500">DGMS Zone 3</span>
        </div>
      </div>
    </div>
  );
}
