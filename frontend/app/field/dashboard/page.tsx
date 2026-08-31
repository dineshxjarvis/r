'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function FieldDashboardPage() {
  const [acknowledgedItems, setAcknowledgedItems] = useState<Record<string, boolean>>({});

  const handleAck = (id: string) => {
    setAcknowledgedItems(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            1.1 Field / Mine Inspector
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            F-01 — Dashboard / My Queue
          </h1>
          <div className="text-xs text-slate-600 mt-1">
            My Queue · <span className="font-semibold text-slate-800">Gevra OCP</span> · Monday, 31 Aug 2026
          </div>
        </div>

        {/* Actionable / Overdue Counter Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1 bg-blue-50 border border-blue-300 text-[#1E3A8A] font-bold text-xs rounded">
            [4 Actionable]
          </div>
          <div className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs rounded">
            [0 Overdue]
          </div>
        </div>
      </div>

      {/* Main Wireframe Queue Table Box */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300">
        
        {/* ROW 1: DUE TODAY */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[90px]">
          {/* Label Column */}
          <div className="md:col-span-3 bg-slate-100 p-3.5 border-b md:border-b-0 md:border-r border-slate-300 flex items-center">
            <span className="font-extrabold text-xs text-slate-900 tracking-wider">
              DUE TODAY
            </span>
          </div>

          {/* Content Column */}
          <div className="md:col-span-9 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-slate-200 text-slate-800 text-[11px] font-bold px-1.5 py-0.2 rounded">
                [1]
              </span>
              <Link
                href="/field/obligations"
                className="text-xs text-[#1E3A8A] hover:underline font-semibold"
              >
                [↗ All]
              </Link>
            </div>

            <div className="border border-slate-200 bg-slate-50/70 rounded p-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Plantation over 40 hectares — Due today · SIGNIFICANT</span>
              </div>
              <div className="mt-2 pl-4.5 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-600 font-medium">
                  Gevra OCP
                </span>
                <Link
                  href="/field/obligations"
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [Submit Evidence →]
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: VERIFY */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[90px]">
          {/* Label Column */}
          <div className="md:col-span-3 bg-slate-100 p-3.5 border-b md:border-b-0 md:border-r border-slate-300 flex items-center">
            <span className="font-extrabold text-xs text-slate-900 tracking-wider">
              VERIFY
            </span>
          </div>

          {/* Content Column */}
          <div className="md:col-span-9 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-slate-200 text-slate-800 text-[11px] font-bold px-1.5 py-0.2 rounded">
                [1]
              </span>
              <Link
                href="/field/findings"
                className="text-xs text-[#1E3A8A] hover:underline font-semibold"
              >
                [↗ All]
              </Link>
            </div>

            <div className="border border-slate-200 bg-slate-50/70 rounded p-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span>Reinstate 40m berm, east haul road — SEVERE</span>
              </div>
              <div className="mt-2 pl-4.5 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-600 font-medium">
                  Requires: <code className="font-mono text-slate-800">finding.close_severe</code>
                </span>
                <Link
                  href="/field/findings"
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [Verify →]
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: APPROVALS */}
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Label Column */}
          <div className="md:col-span-3 bg-slate-100 p-3.5 border-b md:border-b-0 md:border-r border-slate-300 flex items-center">
            <span className="font-extrabold text-xs text-slate-900 tracking-wider">
              APPROVALS
            </span>
          </div>

          {/* Content Column */}
          <div className="md:col-span-9 p-3.5 flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="bg-slate-200 text-slate-800 text-[11px] font-bold px-1.5 py-0.2 rounded">
              [0]
            </span>
            <span>Nothing awaiting your approval</span>
          </div>
        </div>

        {/* ROW 4: UNREAD */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[90px]">
          {/* Label Column */}
          <div className="md:col-span-3 bg-slate-100 p-3.5 border-b md:border-b-0 md:border-r border-slate-300 flex items-center">
            <span className="font-extrabold text-xs text-slate-900 tracking-wider">
              UNREAD
            </span>
          </div>

          {/* Content Column */}
          <div className="md:col-span-9 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="bg-slate-200 text-slate-800 text-[11px] font-bold px-1.5 py-0.2 rounded">
                [2]
              </span>
              <Link
                href="/field/documents"
                className="text-xs text-[#1E3A8A] hover:underline font-semibold"
              >
                [↗ All]
              </Link>
            </div>

            <div className="space-y-2">
              {/* Item 1 */}
              <div className="border border-slate-200 bg-slate-50/70 rounded p-2.5 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-900">
                  • Plantation obligation due in 14 days
                </span>
                {acknowledgedItems['plant_14'] ? (
                  <span className="text-xs font-bold text-emerald-700">✓ Done</span>
                ) : (
                  <button
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
                  href="/field/inspections"
                  className="text-xs font-medium text-slate-900 hover:text-[#1E3A8A] hover:underline"
                >
                  • DGMS inspection assigned — INS-2024-0891
                </Link>
                {acknowledgedItems['insp_891'] ? (
                  <span className="text-xs font-bold text-emerald-700">✓ Done</span>
                ) : (
                  <button
                    onClick={() => handleAck('insp_891')}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                  >
                    [Ack]
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
