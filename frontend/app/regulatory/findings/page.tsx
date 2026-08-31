'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  Plus
} from 'lucide-react';

interface IssuedFinding {
  id: string;
  severity: 'SEVERE' | 'SIGNIFICANT' | 'MINOR';
  mineName: string;
  location: string;
  statusBadge: string;
  clauseRef: string;
  issueDescription: string;
  issuedDate: string;
  statusType: 'RED' | 'YELLOW' | 'GREEN';
}

const ISSUED_FINDINGS: IssuedFinding[] = [
  {
    id: 'DG-2847',
    severity: 'SEVERE',
    mineName: 'Gevra OCP',
    location: 'Bench 7N-S3 (West Flank)',
    statusBadge: 'Ack overdue',
    clauseRef: 'CMR 2017 Reg. 103(1) Slope & Berm Specifications',
    issueDescription: 'Haul road parapet berm eroded below statutory 2.2m height; acknowledgment deadline lapsed 31 Aug.',
    issuedDate: '14 Aug 2026',
    statusType: 'RED'
  },
  {
    id: 'DG-2801',
    severity: 'SIGNIFICANT',
    mineName: 'Dipka OCP',
    location: 'Ramp 3 Culvert Crossing',
    statusBadge: 'CAPA in progress',
    clauseRef: 'CMR 2017 Reg. 106(2) Drainage Standards',
    issueDescription: 'Monsoon silt accumulation obstructing water diversion drain.',
    issuedDate: '10 Aug 2026',
    statusType: 'YELLOW'
  },
  {
    id: 'DG-2754',
    severity: 'MINOR',
    mineName: 'Kusmunda OCP',
    location: 'Workshop Incline Signage',
    statusBadge: 'Verified closed',
    clauseRef: 'CMR 2017 Reg. 182 Safety Signboard Standards',
    issueDescription: 'Reflective traffic signboards replaced and attested by Safety Officer.',
    issuedDate: '25 Jul 2026',
    statusType: 'GREEN'
  }
];

export default function RegulatoryFindingsIssuedPage() {
  const [filterQuery, setFilterQuery] = useState('');
  const [findingsList] = useState<IssuedFinding[]>(ISSUED_FINDINGS);

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
              Findings Issued · R. Verma, DDMS (Mining)
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Official Statutory Non-Compliance Registry Issued Under DGMS Jurisdiction
          </div>
        </div>

        {/* Action Controls matching wireframe: [Filter ▼] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded flex items-center gap-1 transition"
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>[Filter ▼]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Findings List */}
        <div className="divide-y divide-slate-300">
          {findingsList.map((f) => {
            const isRed = f.statusType === 'RED';
            const isYellow = f.statusType === 'YELLOW';
            const isGreen = f.statusType === 'GREEN';

            return (
              <div key={f.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isRed ? 'bg-red-600' : isYellow ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                    />
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {f.id}
                    </span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isRed ? 'text-red-700' : isYellow ? 'text-amber-800' : 'text-emerald-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-slate-900">
                      {f.mineName} ({f.location})
                    </span>
                    <span className="text-slate-400">·</span>
                    <span
                      className={`font-mono text-[11px] font-bold px-1.5 py-0.2 rounded border ${
                        isRed
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : isYellow
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {f.statusBadge}
                    </span>
                  </div>

                  <Link
                    href={`/field/findings/${f.id}`}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition"
                  >
                    [View →]
                  </Link>
                </div>

                <div className="pl-4.5 space-y-1">
                  <div className="font-bold text-slate-800 text-xs">
                    {f.clauseRef}
                  </div>
                  <div className="text-slate-600 text-xs">
                    {f.issueDescription}
                  </div>
                </div>

                <div className="pl-4.5 text-[11px] text-slate-400 font-mono">
                  Issued on: {f.issuedDate} · Statutory Audit Node #982
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Form B Official Findings Ledger</span>
          <span className="font-mono text-slate-500">DGMS Bilaspur Region</span>
        </div>

      </div>
    </div>
  );
}
