'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  UserCheck,
  Shield,
  ArrowRight
} from 'lucide-react';

export default function AttendanceDashboardPage() {
  const [musterReconciled, setMusterReconciled] = useState(false);
  const [shiftValidated, setShiftValidated] = useState(false);
  const [dailyAttested, setDailyAttested] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-700" />
            <span>Muster & Workforce Management</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Attendance · Gevra OCP · Shift: 31 Aug 2026 Day Shift
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Mines Act 1952 Form 11 Muster Roll · Contractor Labour (R&A) Act 1970
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <Link
            href="/field/grievances"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded transition"
          >
            [📢 Grievance Intake]
          </Link>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: PRESENT & CONTRACTOR STATS */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/50">
          
          {/* STAT 1: REGULAR PRESENT */}
          <div className="bg-white border border-slate-300 rounded p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase tracking-wide">
                PRESENT (Departmental)
              </span>
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded">
                [90.4%]
              </span>
            </div>
            <div className="font-mono text-lg font-black text-slate-900">
              1,247 <span className="text-xs font-normal text-slate-500 font-sans">/ 1,380 expected</span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Displaying 133 departmental absentees for Day Shift (31 Aug 2026).')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
              >
                [View absentees]
              </button>
            </div>
          </div>

          {/* STAT 2: CONTRACTORS */}
          <div className="bg-white border border-slate-300 rounded p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 uppercase tracking-wide">
                CONTRACTORS (Outsourced)
              </span>
              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                [89.1%]
              </span>
            </div>
            <div className="font-mono text-lg font-black text-slate-900">
              312 <span className="text-xs font-normal text-slate-500 font-sans">/ 350 deployed</span>
            </div>
            <div className="pt-1.5 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => alert('Displaying 4 active contractor package rosters:\n• OB-REM-PKG-01 (110 workers)\n• OB-REM-PKG-02 (95 workers)\n• OB-REM-PKG-03 (62 workers)\n• COAL-HAUL-01 (45 workers)')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
              >
                [View roster]
              </button>
            </div>
          </div>

        </div>

        {/* SECTION 2: ALERTS */}
        <div className="p-4 space-y-2.5 bg-red-50/20">
          <div className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#8B0000]" />
            <span>ALERTS</span>
          </div>

          <div className="space-y-2">
            {/* Alert 1 */}
            <div className="border border-red-300 bg-white rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span className="font-bold text-slate-900">
                  12 persons on muster but not gate-scanned
                </span>
                <span className="text-slate-500 text-[11px] hidden md:inline">
                  (Biometric RF Gate mismatch)
                </span>
              </div>

              {musterReconciled ? (
                <span className="text-emerald-700 font-bold text-xs">[Reconciled ✓]</span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMusterReconciled(true);
                    alert('Biometric exception log reconciled with manual pit attendance slip.');
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-900 rounded transition self-start sm:self-auto shrink-0"
                >
                  [Reconcile muster]
                </button>
              )}
            </div>

            {/* Alert 2 */}
            <div className="border border-amber-300 bg-white rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-900">
                  Contractor OB-REM-PKG-03 roster not yet approved
                </span>
              </div>

              <button
                type="button"
                onClick={() => alert('Opening Contractor Roster Review modal for OB-REM-PKG-03...')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#8B0000] rounded transition self-start sm:self-auto shrink-0"
              >
                [Review →]
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: PENDING ACTIONS */}
        <div className="p-4 space-y-2.5">
          <div className="font-extrabold text-slate-900 uppercase tracking-wider">
            PENDING ACTIONS
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setShiftValidated(true);
                alert('Shift Register digitally validated under Mines Act Section 48.');
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
            >
              {shiftValidated ? '[Validated ✓]' : '[Validate shift register]'}
            </button>

            <button
              type="button"
              onClick={() => {
                setDailyAttested(true);
                alert('Daily Statutory Attendance attested with digital timestamp signature.');
              }}
              className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs"
            >
              {dailyAttested ? '[Daily Attested ✓]' : '[Attest daily attendance]'}
            </button>

            <button
              type="button"
              onClick={() => {
                const emp = prompt('Enter Employee Code / Gate Pass ID for manual entry:');
                if (emp) alert(`Manual shift entry recorded for ${emp}.`);
              }}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
            >
              [Record manual entry]
            </button>

            <button
              type="button"
              onClick={() => alert('Reviewing 7 shift overtime / early-out exceptions...')}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
            >
              [Review exceptions]
            </button>
          </div>
        </div>

        {/* SECTION 4: COMPLIANCE */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-slate-900 uppercase tracking-wider">
            COMPLIANCE
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between border border-slate-200 bg-white p-2.5 rounded">
              <span className="font-medium text-slate-900">
                Form 11 (Register of persons employed): Up to date
              </span>
              <span className="text-emerald-700 font-bold">✅</span>
            </div>

            <div className="flex items-center justify-between border border-slate-200 bg-white p-2.5 rounded">
              <span className="font-medium text-slate-900">
                Monthly wages statement: Due 05 Sep
              </span>
              <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[11px]">
                🟡 Pending File
              </span>
            </div>

            <div className="flex items-center justify-between border border-slate-200 bg-white p-2.5 rounded">
              <span className="font-medium text-slate-900">
                Contractor labour licence: Valid until 31 Dec 2026
              </span>
              <span className="font-mono text-slate-600 text-[11px]">Licence #CLRA-CG-2024-881</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Mines Act 1952 Statutory Labour & Welfare Return</span>
          <span className="font-mono text-slate-500">DGMS Zone 3</span>
        </div>

      </div>
    </div>
  );
}
