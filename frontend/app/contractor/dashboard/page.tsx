'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ChevronRight,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function ContractorDashboardPage() {
  const [rosterUploading, setRosterUploading] = useState(false);
  const [safetyUploading, setSafetyUploading] = useState(false);

  const handleRosterSubmit = () => {
    setRosterUploading(true);
    setTimeout(() => {
      alert('Roster version submitted for Mine Manager review (POST /contractor-roster-versions). Biometric gate sync pending.');
      setRosterUploading(false);
    }, 800);
  };

  const handleSafetyUpload = () => {
    setSafetyUploading(true);
    setTimeout(() => {
      alert('Safety Plan renewal document uploaded and linked to requirement instance (POST /documents → POST /contractor-requirement-instances/{id}/actions {action:"SUBMIT"}).');
      setSafetyUploading(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>Contractor Administration · Work Package Portal</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Contractor Dashboard · Acme Mining Services
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Engagement: <span className="font-mono font-bold">SECL/KRB/OB-REMOVAL/2026/17</span>
          </div>
        </div>
      </div>

      {/* Main Docket matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">

        {/* SECTION 1: ACTIVE PACKAGES */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            ACTIVE PACKAGES
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between gap-3">
            <div>
              <div className="font-mono font-bold text-slate-900">OB-REM-PKG-03</div>
              <div className="text-slate-600 text-[11px]">Gevra OCP · Overburden Removal</div>
            </div>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
              APPROVED
            </span>
          </div>
        </div>

        {/* SECTION 2: ELIGIBILITY STATUS */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            ELIGIBILITY STATUS
          </div>
          <div className="p-3 bg-white border border-emerald-300 bg-emerald-50/20 rounded flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-900">ELIGIBLE to commence work</span>
            </div>
            <Link
              href="/contractor/packages"
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition"
            >
              [View requirements]
            </Link>
          </div>
        </div>

        {/* SECTION 3: ROSTER STATUS */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-700" />
            <span>ROSTER STATUS</span>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900">312 workers APPROVED</div>
              <div className="text-slate-600 text-[11px]">
                Next roster due: <span className="font-mono font-bold text-amber-800">30 Sep 2026</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRosterSubmit}
              disabled={rosterUploading}
              className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1 transition shadow-xs disabled:opacity-60 text-xs"
            >
              <span>[Submit →]</span>
            </button>
          </div>
        </div>

        {/* SECTION 4: COMPLIANCE ALERTS */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>COMPLIANCE ALERTS</span>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-white border border-amber-200 rounded flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-900">Safety plan renewal due 15 Sep 2026</span>
              </div>
              <button
                type="button"
                onClick={handleSafetyUpload}
                disabled={safetyUploading}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition disabled:opacity-60"
              >
                [Upload]
              </button>
            </div>

            <div className="p-3 bg-white border border-emerald-200 rounded flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-900">Labour Licence Valid</span>
              <span className="text-slate-400">·</span>
              <span className="font-bold text-emerald-900">Insurance Valid</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: MY PERFORMANCE */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            MY PERFORMANCE
          </div>
          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-2.5 bg-white border border-emerald-200 rounded text-center">
              <div className="text-[10px] text-slate-500 font-sans">Incidents</div>
              <div className="text-lg font-black text-emerald-800">0</div>
            </div>
            <div className="p-2.5 bg-white border border-amber-200 rounded text-center">
              <div className="text-[10px] text-slate-500 font-sans">Findings</div>
              <div className="text-lg font-black text-amber-800">2</div>
            </div>
            <div className="p-2.5 bg-white border border-emerald-200 rounded text-center">
              <div className="text-[10px] text-slate-500 font-sans">CAPA Compliance</div>
              <div className="text-lg font-black text-emerald-800">100%</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>SECL Contractor Management System · Role 5</span>
          <span className="font-mono text-slate-500">Korba Area</span>
        </div>
      </div>
    </div>
  );
}
