'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  Shield,
  FileCheck,
  Info
} from 'lucide-react';

export default function SafetyOfficerDashboardPage() {
  const [acknowledgedItems, setAcknowledgedItems] = useState<Record<string, boolean>>({});

  const handleAck = (id: string) => {
    setAcknowledgedItems(prev => ({ ...prev, [id]: true }));
  };

  const handleReviewCapas = () => {
    alert('Filtering safety CAPA records for fast-closure inspection anomalies (Pillar 4: Process Integrity)');
  };

  const handleAlertManager = () => {
    alert('Formal escalation notification dispatched to Mine Manager (Er. S. Chatterjee).');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Top Header Strip matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Safety Management Console
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Safety Dashboard · Gevra OCP · 31 Aug 2026
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Statutory appointment: <span className="font-semibold text-slate-800">Safety Officer (CMR 2017 Reg. 29)</span>
          </div>
        </div>

        {/* Counter Badges matching wireframe */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs font-bold">
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded">
            [4 Actionable]
          </span>
          <span className="bg-red-100 text-red-900 border border-red-300 px-2.5 py-1 rounded">
            [1 Overdue]
          </span>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300">
        
        {/* ========================================================= */}
        {/* SECTION 1: MY QUEUE (Safety-Domain Filtered Lanes)        */}
        {/* ========================================================= */}

        {/* Header Strip for MY QUEUE */}
        <div className="px-4 py-2.5 bg-slate-100 font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-300">
          MY QUEUE (Safety-Domain Filtered)
        </div>

        {/* LANE 1: DUE TODAY */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start hover:bg-slate-50/60 transition">
          <div className="md:col-span-3 font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>DUE TODAY</span>
            <span className="font-mono text-slate-500 font-semibold">[1]</span>
          </div>

          <div className="md:col-span-9 space-y-2">
            <div className="border border-slate-300 bg-white rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span>Plantation over 40 hectares — Due today · SIGNIFICANT</span>
                </div>
                <div className="text-slate-600 text-[11px] pl-3.5">
                  Gevra OCP · Environmental Clearance Condition 14
                </div>
              </div>

              <Link
                href="/field/obligations/OBL-PLANT-40HA/submit"
                className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition self-start sm:self-auto shrink-0 shadow-xs"
              >
                [Submit Evidence →]
              </Link>
            </div>
          </div>
        </div>

        {/* LANE 2: VERIFY */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start hover:bg-slate-50/60 transition">
          <div className="md:col-span-3 font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-red-700" />
            <span>VERIFY</span>
            <span className="font-mono text-slate-500 font-semibold">[1]</span>
          </div>

          <div className="md:col-span-9 space-y-2">
            <div className="border border-slate-300 bg-white rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                  <span>Reinstate 40m berm, east haul road — SEVERE</span>
                </div>
                <div className="text-slate-600 text-[11px] pl-3.5 font-mono">
                  Requires: finding.close_severe · Required verifier: Safety Officer
                </div>
              </div>

              <Link
                href="/field/findings/DG-2847"
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-900 text-xs font-bold rounded transition self-start sm:self-auto shrink-0"
              >
                [Verify →]
              </Link>
            </div>
          </div>
        </div>

        {/* LANE 3: APPROVALS */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-3 font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>APPROVALS</span>
            <span className="font-mono text-slate-500 font-semibold">[0]</span>
          </div>

          <div className="md:col-span-9 text-xs text-slate-500 italic">
            Nothing awaiting your approval
          </div>
        </div>

        {/* LANE 4: UNREAD */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-start hover:bg-slate-50/60 transition">
          <div className="md:col-span-3 font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-blue-700" />
            <span>UNREAD</span>
            <span className="font-mono text-slate-500 font-semibold">[2]</span>
          </div>

          <div className="md:col-span-9 space-y-2">
            {/* Item 1 */}
            <div className="border border-slate-200 bg-slate-50/70 rounded p-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-900">
                • Plantation obligation due in 14 days
              </span>
              {acknowledgedItems['plant_14'] ? (
                <span className="text-xs font-bold text-emerald-700">✓ Done</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAck('plant_14')}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [Ack]
                </button>
              )}
            </div>

            {/* Item 2 */}
            <div className="border border-slate-200 bg-slate-50/70 rounded p-2.5 flex items-center justify-between gap-2">
              <Link
                href="/field/inspections/INS-2024-0891"
                className="text-xs font-medium text-slate-900 hover:text-[#1E3A8A] hover:underline"
              >
                • DGMS inspection assigned — INS-2024-0891
              </Link>
              {acknowledgedItems['insp_891'] ? (
                <span className="text-xs font-bold text-emerald-700">✓ Done</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAck('insp_891')}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [Ack]
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: PROCESS-INTEGRITY ALERTS (Pillar 4)           */}
        {/* ========================================================= */}
        <div className="p-4 bg-red-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-xs text-red-950 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#8B0000]" />
              <span>PROCESS-INTEGRITY ALERTS (Pillar 4)</span>
            </div>
            <span className="text-[11px] font-mono text-red-800 bg-red-100 border border-red-200 px-1.5 py-0.2 rounded font-bold">
              2 Signals Detected
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Alert 1: Fast closure pattern */}
            <div className="bg-white border border-red-300 rounded p-3 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 mt-1 shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-slate-900">
                    🔴 FLAG — 3 CAPAs closed within 24h of submission, no verification
                  </div>
                  <div className="text-slate-600 pl-4.5">
                    Fast closure pattern detected
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 pl-4.5 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleReviewCapas}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-900 rounded transition"
                >
                  [Review CAPAs]
                </button>
                <button
                  type="button"
                  onClick={handleAlertManager}
                  className="px-2.5 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs"
                >
                  [Alert mine manager]
                </button>
              </div>
            </div>

            {/* Alert 2: Ventilation check coverage */}
            <div className="bg-white border border-slate-300 rounded p-3 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-slate-900">
                    ℹ NOTICE — Ventilation check coverage 70% this week (below 80%)
                  </div>
                  <div className="text-slate-600 pl-6">
                    Weekly statutory pre-shift test compliance shortfall
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 pl-6 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Opening ventilation attendance and pre-shift testing records...')}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#1E3A8A] rounded transition"
                >
                  [View attendance records]
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
