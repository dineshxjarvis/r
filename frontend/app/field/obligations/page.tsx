'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Filter, ArrowUpDown, Check } from 'lucide-react';

interface ObligationItem {
  id: string;
  title: string;
  dueText?: string;
  status: 'PENDING_SUBMISSION' | 'SUBMITTED';
  statusNote?: string;
  requiredEvidence: string;
  actionLabel: string;
  actionHref?: string;
}

const OBLIGATIONS: ObligationItem[] = [
  {
    id: 'OBL-PLANT-40HA',
    title: 'Plantation over 40 ha',
    dueText: 'Due 31 Aug',
    status: 'PENDING_SUBMISSION',
    requiredEvidence: '4 geo-tagged photos + survey report',
    actionLabel: 'Submit Evidence →',
    actionHref: '/field/obligations/OBL-PLANT-40HA/submit'
  },
  {
    id: 'OBL-FIRE-DRILL-08',
    title: 'Monthly fire drill register',
    status: 'SUBMITTED',
    statusNote: 'Under verification',
    requiredEvidence: 'Attendance muster roll + safety warden sign-off certificate',
    actionLabel: 'View submission'
  }
];

export default function ObligationsPage() {
  const [filterState, setFilterState] = useState('All');
  const [sortState, setSortState] = useState('Due');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Field Compliance Docket
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            F-07 — Obligations
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Statutory obligations, environmental clearances, and safety returns
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded flex items-center gap-1 transition"
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>[Filter ▼]</span>
          </button>

          <select
            value={sortState}
            onChange={(e) => setSortState(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded font-mono"
          >
            <option value="Due">[Sort: Due Date ▼]</option>
            <option value="Priority">[Sort: Priority ▼]</option>
          </select>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        
        {/* Status Summary Strip matching wireframe */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 flex-wrap">
            <span className="text-slate-600 font-normal">My Obligations:</span>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
              DUE THIS WEEK [2]
            </span>
            <span className="text-slate-400">·</span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
              OVERDUE [0]
            </span>
            <span className="text-slate-400">·</span>
            <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded">
              SUBMITTED [5]
            </span>
          </div>
        </div>

        {/* Expandable Filter Box */}
        {isFilterOpen && (
          <div className="p-3 bg-slate-50 border-b border-slate-300 text-xs flex items-center gap-3">
            <span className="font-bold text-slate-700">Filter by Status:</span>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="border border-slate-300 rounded p-1 bg-white"
            >
              <option value="All">All Obligations</option>
              <option value="PENDING_SUBMISSION">Pending Submission</option>
              <option value="SUBMITTED">Submitted / Under Verification</option>
            </select>
          </div>
        )}

        {/* Obligations List matching wireframe */}
        <div className="divide-y divide-slate-300">
          
          {/* Item 1: Plantation over 40 ha */}
          <div className="p-4 hover:bg-slate-50/80 transition space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-900 text-sm font-semibold">
                Plantation over 40 ha
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700">Due 31 Aug</span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                PENDING_SUBMISSION
              </span>
            </div>

            <div className="pl-4.5 text-slate-600 font-medium">
              Required evidence: 4 geo-tagged photos + survey report
            </div>

            <div className="pl-4.5 pt-1">
              <Link
                href="/field/obligations/OBL-PLANT-40HA/submit"
                className="inline-block px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs"
              >
                [Submit Evidence →]
              </Link>
            </div>
          </div>

          {/* Item 2: Monthly fire drill register */}
          <div className="p-4 hover:bg-slate-50/80 transition space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-slate-900 text-sm font-semibold">
                Monthly fire drill register
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-700">Submitted</span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Under verification
              </span>
            </div>

            <div className="pl-4.5 text-slate-600 font-medium">
              Required evidence: Attendance muster roll + safety warden sign-off certificate
            </div>

            <div className="pl-4.5 pt-1">
              <button
                type="button"
                onClick={() => alert('Opening submitted evidence verification package...')}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
              >
                [View submission]
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>MoEFCC & DGMS Statutory Obligations Register</span>
          <span className="font-mono text-slate-500">Gevra OCP · FY 2026-27</span>
        </div>
      </div>
    </div>
  );
}
