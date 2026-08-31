'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  History,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export default function MineManagerDashboardPage() {
  const [timeTravelDate, setTimeTravelDate] = useState('LIVE (Current)');
  const [isTimeTravelOpen, setIsTimeTravelOpen] = useState(false);
  const [ackDG2847, setAckDG2847] = useState(false);

  const handleExport = () => {
    alert('Exporting Mine Statutory Executive Dashboard Report (PDF / XLSX)...');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>Statutory Mine Administration · Mines Act 1952 s.17</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Gevra OCP · Mine Dashboard · FY 2026-27 (Apr-Aug 2026)
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Authorised Mine Scope: Gevra Opencast Project (SECL) · First Class Manager
          </div>
        </div>

        {/* Action Controls matching wireframe: [Time travel ▼] [Export] */}
        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs font-bold">
          {/* Time Travel dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsTimeTravelOpen(!isTimeTravelOpen)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded transition flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5 text-slate-600" />
              <span>[{timeTravelDate} ▼]</span>
            </button>

            {isTimeTravelOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-300 rounded shadow-lg z-20 py-1 text-xs font-sans">
                <button
                  type="button"
                  onClick={() => {
                    setTimeTravelDate('LIVE (Current)');
                    setIsTimeTravelOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 font-bold text-[#8B0000]"
                >
                  • LIVE (Current - 31 Aug 2026)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeTravelDate('As of 31 Jul 2026');
                    setIsTimeTravelOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  • As of 31 Jul 2026 (Month End)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeTravelDate('As of 30 Jun 2026');
                    setIsTimeTravelOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-slate-700"
                >
                  • As of Q1 Close (30 Jun 2026)
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded transition flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>[Export]</span>
          </button>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* ========================================================= */}
        {/* SECTION 1: COMPLIANCE MEASURES                            */}
        {/* ========================================================= */}
        <div className="p-4 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              COMPLIANCE MEASURES
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Freshness: <strong className="text-emerald-700 font-bold">LIVE</strong> · Computed 31 Aug 2026 12:00
            </span>
          </div>

          {/* 4 Compliance Measure Metric Tiles matching wireframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Tile 1: Verified Rate */}
            <div className="bg-white border border-slate-300 rounded p-3 space-y-1 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Verified Rate</div>
              <div className="font-mono text-base font-black text-slate-900">
                76.2% <span className="text-xs font-normal text-slate-500 font-sans">(32/42)</span>
              </div>
              <div className="pt-1 border-t border-slate-100 flex justify-end">
                <Link
                  href="/mine/compliance"
                  className="text-[11px] font-bold text-[#8B0000] hover:underline"
                >
                  [→drilldown]
                </Link>
              </div>
            </div>

            {/* Tile 2: Submission Rate */}
            <div className="bg-white border border-slate-300 rounded p-3 space-y-1 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Submission Rate</div>
              <div className="font-mono text-base font-black text-slate-900">
                88.1% <span className="text-xs font-normal text-slate-500 font-sans">(37/42)</span>
              </div>
              <div className="pt-1 border-t border-slate-100 flex justify-end">
                <Link
                  href="/mine/compliance"
                  className="text-[11px] font-bold text-[#8B0000] hover:underline"
                >
                  [→drilldown]
                </Link>
              </div>
            </div>

            {/* Tile 3: Overdue Load */}
            <div className="bg-white border border-red-300 rounded p-3 space-y-1 shadow-2xs bg-red-50/20">
              <div className="text-[11px] text-red-700 font-medium font-bold">Overdue Load</div>
              <div className="font-mono text-base font-black text-red-700">
                5 <span className="text-xs font-normal text-slate-500 font-sans">obligations</span>
              </div>
              <div className="pt-1 border-t border-red-100 flex justify-end">
                <Link
                  href="/mine/compliance"
                  className="text-[11px] font-bold text-red-700 hover:underline"
                >
                  [→view]
                </Link>
              </div>
            </div>

            {/* Tile 4: Unsupported */}
            <div className="bg-white border border-slate-300 rounded p-3 space-y-1 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">Unsupported</div>
              <div className="font-mono text-base font-black text-slate-900">
                2 <span className="text-xs font-normal text-slate-500 font-sans">evidence gaps</span>
              </div>
              <div className="pt-1 border-t border-slate-100 flex justify-end">
                <Link
                  href="/mine/compliance"
                  className="text-[11px] font-bold text-slate-700 hover:underline"
                >
                  [→]
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: MY QUEUE (personal)                            */}
        {/* ========================================================= */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              MY QUEUE (personal)
            </div>
            <button
              type="button"
              onClick={() => alert('Opening full personal executive queue view...')}
              className="text-[11px] font-bold text-[#8B0000] hover:underline"
            >
              [View full queue]
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#8B0000] font-bold">■</span>
                <span className="font-semibold text-slate-900">2 approvals awaiting my decision</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">Overman shift log, explosive requisition</span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#8B0000] font-bold">■</span>
                <span className="font-semibold text-slate-900">1 CAPA verification requiring mine manager authority</span>
              </div>
              <span className="font-mono text-[11px] text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                DEF-0412 (Haul Road Ramp)
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#8B0000] font-bold">■</span>
                <span className="font-semibold text-slate-900">3 unacknowledged notifications</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">DGMS circular, EC compliance notice</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: APPROVAL BACKLOG                               */}
        {/* ========================================================= */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold text-slate-900">
              APPROVAL BACKLOG — 4 items pending, oldest 12 days
            </span>
          </div>

          <button
            type="button"
            onClick={() => alert('Opening statutory approval queue (4 items pending)...')}
            className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-[#8B0000] rounded transition self-start sm:self-auto shrink-0 shadow-2xs"
          >
            [View all →]
          </button>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: OBLIGATION CALENDAR (next 30 days)             */}
        {/* ========================================================= */}
        <div className="p-4 space-y-2.5">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-700" />
            <span>OBLIGATION CALENDAR (next 30 days)</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="p-2 border border-slate-200 bg-white rounded flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded text-[11px]">
                  31 Aug
                </span>
                <span className="font-medium text-slate-900">Plantation survey return (EC Cond 14)</span>
              </div>
              <span className="text-red-700 font-bold font-mono text-[11px]">DUE TODAY</span>
            </div>

            <div className="p-2 border border-slate-200 bg-white rounded flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-[11px]">
                  05 Sep
                </span>
                <span className="font-medium text-slate-900">Air quality monitoring submission (AAQMR)</span>
              </div>
              <span className="text-amber-800 font-mono text-[11px]">PENDING</span>
            </div>

            <div className="p-2 border border-slate-200 bg-white rounded flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-[11px]">
                  15 Sep
                </span>
                <span className="font-medium text-slate-900">Excavator EX-007 statutory fitness inspection</span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">UPCOMING</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 5: ACTIVE FINDINGS REQUIRING MY ACTION            */}
        {/* ========================================================= */}
        <div className="p-4 space-y-2.5 bg-red-50/20">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#8B0000]" />
            <span>ACTIVE FINDINGS REQUIRING MY ACTION</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Finding 1: DG-2847 */}
            <div className="p-3 bg-white border border-red-300 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span className="font-bold text-slate-900 font-mono">DG-2847</span>
                <span className="font-mono font-bold text-red-700">SEVERE</span>
                <span className="text-slate-600">(ack overdue) · Bench 7N-S3 Berm breach</span>
              </div>

              {ackDG2847 ? (
                <span className="text-emerald-700 font-bold text-xs">[Acknowledged ✓]</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAckDG2847(true);
                    alert('Statutory Acknowledgement recorded under CMR Reg. 103 by Mine Manager.');
                  }}
                  className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition self-start sm:self-auto shrink-0 shadow-xs"
                >
                  [Acknowledge]
                </button>
              )}
            </div>

            {/* Finding 2: DEF-0412 */}
            <div className="p-3 bg-white border border-amber-300 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-900 font-mono">DEF-0412</span>
                <span className="font-mono font-bold text-amber-800">SIGNIFICANT</span>
                <span className="text-slate-600">Haul Road Ramp 4 gradient repair</span>
              </div>

              <Link
                href="/field/findings/DEF-0412"
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-[#8B0000] rounded transition self-start sm:self-auto shrink-0"
              >
                [Review CAPA]
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>CMR 2017 Reg. 27 Mine Statutory Compliance Record</span>
          <span className="font-mono text-slate-500">SECL Central Zone</span>
        </div>

      </div>
    </div>
  );
}
