'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, Plus } from 'lucide-react';

export default function InspectionDetailPage() {
  const params = useParams();
  const inspectionId = (params?.id as string) || 'INS-2024-0891';

  const [teamStatus, setTeamStatus] = useState<'ACCEPTED' | 'PENDING' | 'DECLINED'>('ACCEPTED');
  const [visitClosed, setVisitClosed] = useState(false);
  const [reportPrepared, setReportPrepared] = useState(false);

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/field/inspections"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              {inspectionId} · DGMS Safety Inspection
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold text-amber-900">IN PROGRESS</span>
            <span className="text-slate-400">·</span>
            <span className="font-semibold text-slate-700">REGULATORY</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 self-start sm:self-auto font-mono">
          DGMS Ref: SECL/KORBA/2026/0891
        </div>
      </div>

      {/* Main 2-Column Grid matching wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: Details, Team, Checklist Progress, Actions (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* DETAILS Box */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              DETAILS
            </div>
            <div className="p-3.5 text-xs space-y-2 divide-y divide-slate-100">
              <div className="grid grid-cols-3 gap-2 pt-1">
                <span className="text-slate-500 font-medium">Mine:</span>
                <span className="col-span-2 font-semibold text-slate-900">Gevra OCP (SECL)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <span className="text-slate-500 font-medium">Authority:</span>
                <span className="col-span-2 font-semibold text-slate-900">DGMS (Central Zone)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <span className="text-slate-500 font-medium">Inspector:</span>
                <span className="col-span-2 font-semibold text-slate-900">Er. V. K. Sharma (Director of Mines Safety)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <span className="text-slate-500 font-medium">Scheduled:</span>
                <span className="col-span-2 font-semibold text-slate-900">14 Aug 2026, 09:30 AM</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <span className="text-slate-500 font-medium">Type:</span>
                <span className="col-span-2 font-semibold text-slate-900">Statutory Quarterly Safety Audit</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <span className="text-slate-500 font-medium">Regulation scope:</span>
                <span className="col-span-2 font-mono text-slate-800">CMR 2017 Reg. 103, 104, 128 (Ventilation & Haul Roads)</span>
              </div>
            </div>
          </div>

          {/* TEAM Box */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>TEAM</span>
              <span className="text-[10px] font-mono text-slate-500">Roster Status</span>
            </div>
            <div className="p-3.5 text-xs space-y-2.5">
              <div className="space-y-1 text-slate-700">
                <div className="font-semibold text-slate-900">• Lead: Er. V. K. Sharma (DGMS)</div>
                <div className="pl-2.5 text-slate-600">• Safety Officer: Er. Rajesh Verma (You)</div>
                <div className="pl-2.5 text-slate-600">• Member: Er. S. P. Roy (Ventilation Officer)</div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-medium">
                  Roster Acceptance: <span className="font-bold text-slate-800">[{teamStatus}]</span>
                </span>
                <button
                  onClick={() => setTeamStatus(teamStatus === 'ACCEPTED' ? 'DECLINED' : 'ACCEPTED')}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [Accept/Decline]
                </button>
              </div>
            </div>
          </div>

          {/* CHECKLIST PROGRESS Box */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              CHECKLIST PROGRESS
            </div>
            <div className="p-3.5 text-xs space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-700">Statutory Items</span>
                  <span className="text-slate-900 font-mono">12/15 done (80%)</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-200 h-3 rounded overflow-hidden flex border border-slate-300">
                  <div className="bg-[#8B0000] h-full w-[80%]" />
                </div>
              </div>

              <div>
                <button
                  onClick={() => alert('Opening full statutory checklist modal...')}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#1E3A8A] rounded transition w-full sm:w-auto"
                >
                  [Open Checklist →]
                </button>
              </div>
            </div>
          </div>

          {/* ACTIONS Box */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              ACTIONS
            </div>
            <div className="p-3.5 flex flex-wrap gap-2 text-xs">
              <Link
                href={`/field/inspections/${inspectionId}/observe`}
                className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs transition inline-flex items-center gap-1"
              >
                [Record Observation]
              </Link>

              <button
                onClick={() => {
                  setVisitClosed(!visitClosed);
                  alert(visitClosed ? 'Visit reopened' : 'Visit marked closed');
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
              >
                {visitClosed ? '[Reopen Visit]' : '[Close Visit]'}
              </button>

              <button
                onClick={() => {
                  setReportPrepared(true);
                  alert('Inspection report draft compiled and saved to Documents registry.');
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
              >
                {reportPrepared ? '[Report Draft Prepared ✓]' : '[Prepare Report]'}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Visits & Findings (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* VISITS Box */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>VISITS</span>
              <button
                onClick={() => alert('Add New Visit modal opened')}
                className="text-xs text-[#8B0000] hover:underline font-bold"
              >
                [+ Add Visit]
              </button>
            </div>

            <div className="p-3.5 space-y-3">
              {/* Visit 1 */}
              <div className="border border-slate-300 bg-slate-50/70 rounded p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>Visit 1 · 14 Aug · COMPLETED</span>
                  <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                    Verified
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] font-medium text-slate-800">
                    [12 responses]
                  </span>
                  <span className="bg-white border border-slate-300 px-2 py-0.5 rounded text-[11px] font-medium text-slate-800">
                    [3 observations]
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <button
                    onClick={() => alert('Opening Visit 1 details...')}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                  >
                    [View]
                  </button>
                  <Link
                    href={`/field/inspections/${inspectionId}/observe`}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#1E3A8A] rounded transition"
                  >
                    [Add Observation]
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* FINDINGS FROM THIS INSPECTION Box */}
          <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-100 border-b border-slate-300 font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              FINDINGS FROM THIS INSPECTION
            </div>

            <div className="p-3.5 space-y-3">
              {/* Finding Item */}
              <div className="border border-red-200 bg-red-50/40 rounded p-3 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                  <span>DG-2847 · SEVERE — Ventilation</span>
                </div>

                <div className="text-slate-600 pl-4.5">
                  Reg. 103(1) · Bench 7N-S3
                </div>

                <div className="pt-1 pl-4.5 flex justify-end">
                  <Link
                    href="/field/findings/DG-2847"
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#8B0000] rounded transition"
                  >
                    [View Finding]
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
