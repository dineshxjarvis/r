'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  Scale,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Clock,
  ArrowRight,
  ChevronRight,
  FileText,
  Lock,
  Eye
} from 'lucide-react';

export default function RegulatoryDashboardPage() {
  const [sessionPurpose, setSessionPurpose] = useState('Routine oversight (CMR 2017 Audit)');
  const [purposeDeclared, setPurposeDeclared] = useState(true);
  const [reminderSent, setReminderSent] = useState(false);

  const handleIssueReminder = () => {
    setReminderSent(true);
    alert('Statutory reminder notice dispatched to Gevra Mine Manager for overdue finding DG-2847 (POST /notifications).');
  };

  const handleEscalateCase = () => {
    alert('Section 22 Prohibitory Proceeding Case initiated for Bench 7 Berm breach (POST /regulatory-cases).');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>Statutory Regulatory Authority · Mines Act 1952 s.22 / CMR 2017</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            DGMS Dashboard — Dhanbad Region 2
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Jurisdiction: 12 authorised coal mines · Statutory Mandate: CMR 2017 Safety Oversight
          </div>
        </div>

        {/* Mandatory Purpose of Session Box (Novelty Pillar 3 & 5 Audit Trail) */}
        <div className="bg-slate-50 border border-slate-300 p-2.5 rounded text-xs space-y-1 self-start sm:self-auto min-w-[220px]">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#8B0000]" />
            <span>PURPOSE OF THIS SESSION:</span>
          </div>
          <select
            value={sessionPurpose}
            onChange={(e) => {
              setSessionPurpose(e.target.value);
              setPurposeDeclared(true);
            }}
            className="w-full bg-white border border-slate-300 rounded p-1 text-xs text-slate-900 font-semibold"
          >
            <option>Routine oversight (CMR 2017 Audit)</option>
            <option>Statutory Inspection Follow-up</option>
            <option>Accident / Violation Inquiry</option>
            <option>Legal Proceeding & Tribunal Filing</option>
          </select>
          <div className="text-[10px] text-slate-400 font-mono">
            Purpose logged in immutable audit trail
          </div>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: COMPLIANCE OVERVIEW (Published projection only) matching wireframe */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              COMPLIANCE OVERVIEW (PUBLISHED PROJECTION ONLY)
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              12 Mines in Jurisdiction · Live Projection
            </span>
          </div>

          {/* Counters strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
            <div className="p-2.5 bg-white border border-emerald-300 rounded text-emerald-900">
              <div className="text-[10px] text-slate-500 font-sans">Fully Compliant</div>
              <div className="text-base font-black">8 <span className="text-xs font-normal font-sans">mines</span></div>
            </div>

            <div className="p-2.5 bg-white border border-amber-300 rounded text-amber-900">
              <div className="text-[10px] text-slate-500 font-sans">Partial Compliance</div>
              <div className="text-base font-black">3 <span className="text-xs font-normal font-sans">mines</span></div>
            </div>

            <div className="p-2.5 bg-white border border-red-300 rounded text-red-900 bg-red-50/20">
              <div className="text-[10px] text-red-700 font-bold font-sans">Non-Compliant</div>
              <div className="text-base font-black text-red-700">1 <span className="text-xs font-normal font-sans">mine (Gevra)</span></div>
            </div>

            <div className="p-2.5 bg-white border border-slate-300 rounded text-slate-700">
              <div className="text-[10px] text-slate-500 font-sans">Unmeasured</div>
              <div className="text-base font-black">0</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ATTENTION REQUIRED matching wireframe */}
        <div className="p-4 space-y-2.5 bg-red-50/20">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#8B0000]" />
            <span>ATTENTION REQUIRED</span>
          </div>

          <div className="p-3.5 bg-white border border-red-300 rounded space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span className="font-bold text-slate-900 text-xs">
                  Gevra OCP — Overdue finding acknowledgement, DG-2847 SEVERE
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                [ACK OVERDUE]
              </span>
            </div>

            <div className="text-slate-600 pl-4.5 text-xs">
              Bench 7 North berm height reduced to 1.1m (Statutory minimum 2.2m under CMR Reg. 103). Acknowledgment deadline lapsed on 31 Aug.
            </div>

            <div className="flex items-center gap-2 pl-4.5 pt-1">
              <Link
                href="/regulatory/findings"
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded text-xs transition"
              >
                [View finding]
              </Link>

              {reminderSent ? (
                <span className="text-emerald-700 font-bold font-mono text-xs">[Reminder Issued ✓]</span>
              ) : (
                <button
                  type="button"
                  onClick={handleIssueReminder}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition"
                >
                  [Issue reminder]
                </button>
              )}

              <button
                type="button"
                onClick={handleEscalateCase}
                className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-xs transition shadow-xs"
              >
                [Escalate to Case]
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: RECENT INSPECTIONS I CONDUCTED & MY ACTIVE FINDINGS matching wireframe */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
          
          {/* Box 1: Recent Inspections */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                RECENT INSPECTIONS I CONDUCTED
              </div>
              <Link
                href="/regulatory/inspections"
                className="text-[11px] font-bold text-[#8B0000] hover:underline"
              >
                [View all →]
              </Link>
            </div>

            <div className="space-y-1.5">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">INS-2024-0891</span> · Gevra OCP
                </div>
                <span className="font-mono text-[10px] text-amber-800 font-bold">[IN PROGRESS]</span>
              </div>

              <div className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">INS-2024-0870</span> · Dipka OCP
                </div>
                <span className="font-mono text-[10px] text-emerald-800 font-bold">[COMPLETED]</span>
              </div>
            </div>
          </div>

          {/* Box 2: My Active Findings */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                MY ACTIVE FINDINGS
              </div>
              <span className="font-mono text-slate-500 text-[11px]">3 issued</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="p-2 bg-red-50/40 border border-red-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-red-700">DG-2847 SEVERE</span> · Gevra OCP
                </div>
                <span className="text-[10px] font-mono text-red-700 font-bold">1 SEVERE</span>
              </div>

              <div className="p-2 bg-amber-50/40 border border-amber-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-amber-800">DG-2801 SIGNIFICANT</span> · Dipka OCP
                </div>
                <span className="text-[10px] font-mono text-amber-800 font-bold">2 SIGNIFICANT</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: JURISDICTION MAP BUTTON matching wireframe */}
        <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#8B0000]" />
              <span>JURISDICTION MAP (12 COAL MINES)</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              Georeferenced boundary overlays with published compliance status coloring (Green / Amber / Red)
            </div>
          </div>

          <Link
            href="/regulatory/map"
            className="px-3.5 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto shrink-0 text-xs"
          >
            <span>[🗺 View mine map with compliance overlay]</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Statutory Inspectorate Portal · Section 22 Enforcement Authority</span>
          <span className="font-mono text-slate-500">DGMS Zone 3 Headquarters</span>
        </div>

      </div>
    </div>
  );
}
