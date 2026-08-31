'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Filter, Check } from 'lucide-react';

interface FindingItem {
  id: string;
  category: 'Findings' | 'Defects' | 'Observations' | 'CAPAs';
  severity: 'SEVERE' | 'SIGNIFICANT' | 'MINOR';
  status: 'AWAITING_ACKNOWLEDGEMENT' | 'CAPA_ASSIGNED' | 'CLOSED';
  regClause?: string;
  location?: string;
  dueText?: string;
  overdueBadge?: string;
  acknowledged?: boolean;
}

const INITIAL_FINDINGS: FindingItem[] = [
  {
    id: 'DG-2847',
    category: 'Findings',
    severity: 'SEVERE',
    status: 'AWAITING_ACKNOWLEDGEMENT',
    regClause: 'Reg. 103(1)',
    location: 'Bench 7N-S3',
    dueText: 'Ack due 31 Aug',
    overdueBadge: 'OVERDUE BY 0 D',
    acknowledged: false
  },
  {
    id: 'DEF-0412',
    category: 'Defects',
    severity: 'SIGNIFICANT',
    status: 'CAPA_ASSIGNED',
    regClause: 'Reg. 104(2)',
    location: 'Haul Road Ramp 4'
  },
  {
    id: 'DEF-0389',
    category: 'Defects',
    severity: 'MINOR',
    status: 'CLOSED',
    regClause: 'CMR Reg. 128',
    location: 'Substation West'
  }
];

const TABS = ['Findings', 'Defects', 'Observations', 'CAPAs'] as const;

export default function FindingsListPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Findings');
  const [findings, setFindings] = useState<FindingItem[]>(INITIAL_FINDINGS);
  const [sortOption, setSortOption] = useState('Attention');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleAck = (id: string) => {
    setFindings(prev =>
      prev.map(f => (f.id === id ? { ...f, acknowledged: true } : f))
    );
  };

  const filteredItems = findings.filter(f => {
    if (activeTab === 'Findings' && f.category !== 'Findings' && f.category !== 'Defects') return false;
    if (activeTab === 'Defects' && f.category !== 'Defects') return false;
    if (activeTab === 'CAPAs' && f.status !== 'CAPA_ASSIGNED') return false;
    if (selectedSeverity !== 'All' && f.severity !== selectedSeverity) return false;
    if (selectedState !== 'All' && f.status !== selectedState) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Field Safety Registry
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            F-05 — Finding & Defect List
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Statutory non-compliances, physical defects, and CAPA tracking
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Link
            href="/field/inspections/INS-2024-0891/observe"
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ Raise Finding]</span>
          </Link>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded flex items-center gap-1 transition"
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>[Filter]</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        
        {/* Top Control Bar matching wireframe */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 space-y-2.5 text-xs">
          {/* Tabs: [Findings •] [Defects] [Observations] [CAPAs] */}
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded font-semibold text-xs transition border ${
                    isSelected
                      ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  [{tab} {isSelected && '•'}]
                </button>
              );
            })}
          </div>

          {/* Sort & Filter row: Sort: [Attention ▼] Filter: [All severities] [All states] */}
          <div className="flex items-center gap-3 flex-wrap text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Sort:</span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono text-slate-800 font-medium"
              >
                <option value="Attention">[Attention ▼]</option>
                <option value="Date">[Date Newest ▼]</option>
                <option value="Severity">[Severity High-Low ▼]</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-700">Filter:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono text-slate-800 font-medium"
              >
                <option value="All">[All severities]</option>
                <option value="SEVERE">[SEVERE only]</option>
                <option value="SIGNIFICANT">[SIGNIFICANT only]</option>
                <option value="MINOR">[MINOR only]</option>
              </select>

              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono text-slate-800 font-medium"
              >
                <option value="All">[All states]</option>
                <option value="AWAITING_ACKNOWLEDGEMENT">[AWAITING_ACK]</option>
                <option value="CAPA_ASSIGNED">[CAPA_ASSIGNED]</option>
                <option value="CLOSED">[CLOSED]</option>
              </select>
            </div>
          </div>
        </div>

        {/* Findings List Items matching wireframe */}
        <div className="divide-y divide-slate-300">
          
          {/* Item 1: DG-2847 */}
          <div className="p-4 hover:bg-slate-50/80 transition space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span className="font-mono font-bold text-slate-900 text-sm">
                  DG-2847
                </span>
                <span className="font-bold text-red-700">SEVERE</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-slate-700">AWAITING_ACKNOWLEDGEMENT</span>
              </div>
            </div>

            <div className="pl-4.5 text-slate-700 flex items-center gap-2 flex-wrap">
              <span>Reg. 103(1) · Bench 7N-S3 · Ack due 31 Aug</span>
              <span className="bg-red-100 text-red-800 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-300">
                [OVERDUE BY 0 D]
              </span>
            </div>

            <div className="pl-4.5 pt-1 flex items-center gap-2">
              {findings[0]?.acknowledged ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                  <Check className="w-3.5 h-3.5" /> [Acknowledged ✓]
                </span>
              ) : (
                <button
                  onClick={() => handleAck('DG-2847')}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-900 rounded transition"
                >
                  [Acknowledge]
                </button>
              )}

              <Link
                href="/field/findings/DG-2847"
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#8B0000] rounded transition"
              >
                [View Details]
              </Link>
            </div>
          </div>

          {/* Item 2: DEF-0412 */}
          <div className="p-4 hover:bg-slate-50/80 transition space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-mono font-bold text-slate-900 text-sm">
                  DEF-0412
                </span>
                <span className="font-bold text-amber-800">SIGNIFICANT</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-slate-700">CAPA_ASSIGNED</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/field/findings/DEF-0412"
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [View CAPA]
                </Link>
                <Link
                  href="/field/findings/DEF-0412"
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [Details]
                </Link>
              </div>
            </div>
          </div>

          {/* Item 3: DEF-0389 */}
          <div className="p-4 hover:bg-slate-50/80 transition space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-mono font-bold text-slate-900 text-sm">
                  DEF-0389
                </span>
                <span className="font-bold text-emerald-800">MINOR</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-slate-700">CLOSED</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/field/findings/DEF-0389"
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [View Details]
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Form B Statutory Defects Register</span>
          <span className="font-mono text-slate-500">Korba Area</span>
        </div>
      </div>
    </div>
  );
}
