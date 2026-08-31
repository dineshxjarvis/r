'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Leaf,
  AlertTriangle,
  MapPin,
  Lock,
  FileCheck,
  Scale,
  ShieldAlert,
  Building2,
  ChevronRight
} from 'lucide-react';

export default function MoEFCCDashboardPage() {
  const [sessionPurpose, setSessionPurpose] = useState('Routine oversight (EC/CTE/CTO Monitoring)');
  const [purposeDeclared, setPurposeDeclared] = useState(true);
  const [showcauseIssued, setShowcauseIssued] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);

  const handleIssueShowCause = () => {
    setShowcauseIssued(true);
    alert('Show-cause notice issued to Gevra OCP Mine Management for Plantation obligation EC Cond 14 (POST /regulatory-cases {type:"SHOW_CAUSE"}).');
  };

  const handleEscalate = () => {
    alert('Environmental violation escalated to MoEFCC Regional Appellate Authority and SPCB (POST /regulatory-cases {type:"ESCALATION"}).');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ministry of Environment, Forest & Climate Change · Statutory Regulatory Desk</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            MoEFCC Dashboard — Central Region
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Jurisdiction: 9 mines · Mandate: EC / CTE / CTO Environmental Conditions
          </div>
        </div>

        {/* Mandatory Purpose of Session Box */}
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
            <option>Routine oversight (EC/CTE/CTO Monitoring)</option>
            <option>EC Condition Compliance Audit</option>
            <option>Consent Renewal Appraisal</option>
            <option>Environmental Violation Inquiry</option>
          </select>
          <div className="text-[10px] text-slate-400 font-mono">
            Purpose logged in immutable audit trail
          </div>
        </div>
      </div>

      {/* Main Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">

        {/* SECTION 1: EC CONDITION COMPLIANCE OVERVIEW matching wireframe */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            EC CONDITION COMPLIANCE OVERVIEW (PUBLISHED PROJECTION ONLY)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-2.5 bg-white border border-emerald-300 rounded text-emerald-900">
              <div className="text-[10px] text-slate-500 font-sans">Fully Compliant</div>
              <div className="text-base font-black">6 <span className="text-xs font-normal font-sans">mines</span></div>
            </div>

            <div className="p-2.5 bg-white border border-amber-300 rounded text-amber-900">
              <div className="text-[10px] text-slate-500 font-sans">Partial Compliance</div>
              <div className="text-base font-black">2 <span className="text-xs font-normal font-sans">mines</span></div>
            </div>

            <div className="p-2.5 bg-white border border-red-300 bg-red-50/20 rounded text-red-900">
              <div className="text-[10px] text-red-700 font-bold font-sans">Non-Compliant</div>
              <div className="text-base font-black text-red-700">1 <span className="text-xs font-normal font-sans">mine (Gevra)</span></div>
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
                  Gevra OCP — Plantation obligation overdue (EC Cond 14)
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                [OVERDUE 31 Aug 2026]
              </span>
            </div>

            <div className="text-slate-600 pl-4 text-xs">
              EC Condition 14: 40ha greenbelt afforestation on OB dump by 31 Aug 2026. Mining activity continues without plantation certification — contravenes EC approval granted under EIA Notification 2006.
            </div>

            <div className="flex items-center gap-2 pl-4 pt-1">
              <Link
                href="/regulatory/obligations"
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded text-xs transition"
              >
                [View obligation]
              </Link>

              {showcauseIssued ? (
                <span className="text-emerald-700 font-bold font-mono text-xs">[Show-Cause Issued ✓]</span>
              ) : (
                <button
                  type="button"
                  onClick={handleIssueShowCause}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition"
                >
                  [Issue show-cause]
                </button>
              )}

              <button
                type="button"
                onClick={handleEscalate}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-xs transition shadow-xs"
              >
                [Escalate]
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: APPLICATIONS AWAITING APPRAISAL matching wireframe */}
        <div className="p-4 space-y-2.5">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-slate-700" />
            <span>APPLICATIONS AWAITING APPRAISAL</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">EC-RASM-2026-041</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-700">EC Expansion Appraisal</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-[#8B0000]">Dipka OCP (Phase 3 Extension)</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono pl-2">
                Submitted: 10 Aug 2026 · EIA Report attached · SPCB NOC pending
              </div>
            </div>

            <Link
              href="/regulatory/cases"
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition whitespace-nowrap"
            >
              [Review →]
            </Link>
          </div>
        </div>

        {/* SECTION 4: MONITORING DATA ANOMALIES matching wireframe */}
        <div className="p-4 space-y-2.5 bg-amber-50/20">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>MONITORING DATA ANOMALIES</span>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-white border border-amber-200 rounded flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-900">Noise: 76dB vs 75dB limit at Gevra OCP</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 text-[11px]">CPCB Noise Pollution Rules 2000</span>
              </div>
              <Link
                href="/regulatory/findings"
                className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 font-bold rounded text-xs transition"
              >
                [Log Violation →]
              </Link>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                <span className="font-bold text-slate-900">Ambient Dust: RSPM 98μg/m³ at Dipka OCP</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 text-[11px]">Std: 100μg/m³ (within threshold)</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-bold">WITHIN LIMIT ✓</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: JURISDICTION MAP BUTTON matching wireframe */}
        <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#8B0000]" />
              <span>JURISDICTION MAP (9 MINES · EC OVERLAY)</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              Mine lease boundaries with published EC condition compliance status (Green / Amber / Red)
            </div>
          </div>

          <Link
            href="/regulatory/map"
            className="px-3.5 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1.5 transition shadow-xs self-start sm:self-auto shrink-0 text-xs"
          >
            <span>[🗺 View mine map with EC overlay]</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>MoEFCC Statutory Environmental Compliance Authority · EIA Notification 2006</span>
          <span className="font-mono text-slate-500">Central Regional Office · Raipur</span>
        </div>

      </div>
    </div>
  );
}
