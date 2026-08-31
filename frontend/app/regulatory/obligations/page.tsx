'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Search,
  Lock
} from 'lucide-react';

interface PublishedObligation {
  id: string;
  mineName: string;
  domain: 'Safety' | 'Environment' | 'Labour';
  statutoryRef: string;
  summary: string;
  duePeriod: string;
  status: 'SATISFIED' | 'SUBMITTED' | 'OVERDUE';
  evidenceVerified: boolean;
}

const PUBLISHED_OBLIGATIONS: PublishedObligation[] = [
  {
    id: 'OBL-PUB-01',
    mineName: 'Gevra OCP',
    domain: 'Safety',
    statutoryRef: 'CMR 2017 Reg. 103(1)',
    summary: 'Bench 7 North parapet berm height restoration (minimum 2.2m)',
    duePeriod: '31 Aug 2026',
    status: 'OVERDUE',
    evidenceVerified: false
  },
  {
    id: 'OBL-PUB-02',
    mineName: 'Gevra OCP',
    domain: 'Safety',
    statutoryRef: 'CMR 2017 Reg. 181(3)',
    summary: 'HEMM Heavy Dumper brake retarder test certification',
    duePeriod: '28 Aug 2026',
    status: 'SUBMITTED',
    evidenceVerified: false
  },
  {
    id: 'OBL-PUB-03',
    mineName: 'Dipka OCP',
    domain: 'Safety',
    statutoryRef: 'CMR 2017 Reg. 29',
    summary: 'Monthly pit safety committee minutes & resolution return',
    duePeriod: '25 Aug 2026',
    status: 'SATISFIED',
    evidenceVerified: true
  },
  {
    id: 'OBL-PUB-04',
    mineName: 'Kusmunda OCP',
    domain: 'Safety',
    statutoryRef: 'CMR 2017 Reg. 106',
    summary: 'Monsoon haul road sump water pumping rate attestation',
    duePeriod: '15 Aug 2026',
    status: 'SATISFIED',
    evidenceVerified: true
  }
];

export default function RegulatoryObligationRegisterPage() {
  const [obligations] = useState<PublishedObligation[]>(PUBLISHED_OBLIGATIONS);

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
              Obligation Register · Published Projection
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Regulator-Safe Published View across 12 Jurisdiction Mines (Excludes internal notes / private drafts)
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 border border-slate-300 px-2 py-1 rounded text-slate-700">
          <Lock className="w-3 h-3 text-[#8B0000]" />
          <span>Published Projection Only</span>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2.5 px-4">Mine</th>
                <th className="py-2.5 px-4">Domain</th>
                <th className="py-2.5 px-4">Statute Ref</th>
                <th className="py-2.5 px-4">Obligation Summary</th>
                <th className="py-2.5 px-4">Due Period</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {obligations.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.mineName}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {row.domain}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {row.statutoryRef}
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    {row.summary}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {row.duePeriod}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        row.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : row.status === 'SATISFIED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-blue-100 text-blue-900 border-blue-300'
                      }`}
                    >
                      [{row.status}]
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {row.evidenceVerified ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified ✓</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Form B Statutory Obligations View · Novelty Pillar 3 & 5</span>
          <span className="font-mono text-slate-500">DGMS Regional Database</span>
        </div>

      </div>
    </div>
  );
}
