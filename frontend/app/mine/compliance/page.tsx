'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface ObligationRow {
  id: string;
  ref: string;
  domain: 'Safety' | 'Environment' | 'Production' | 'Labour';
  title: string;
  due: string;
  status: 'SATISFIED' | 'SUBMITTED' | 'OVERDUE' | 'WAIVED';
  evidenceDoc?: string;
}

const OBLIGATIONS: ObligationRow[] = [
  {
    id: 'OBL-SAF-01',
    ref: 'CMR Reg. 103(1)',
    domain: 'Safety',
    title: 'Bench 7 North berm height restoration (2.2m)',
    due: '31 Aug 2026',
    status: 'OVERDUE',
    evidenceDoc: 'Pending submission'
  },
  {
    id: 'OBL-SAF-02',
    ref: 'CMR Reg. 29',
    domain: 'Safety',
    title: 'Monthly safety committee muster roll & resolution record',
    due: '25 Aug 2026',
    status: 'SATISFIED',
    evidenceDoc: 'muster_aug26.pdf'
  },
  {
    id: 'OBL-SAF-03',
    ref: 'CMR Reg. 181(3)',
    domain: 'Safety',
    title: 'HEMM Heavy Dumper brake retarder test certification',
    due: '28 Aug 2026',
    status: 'SUBMITTED',
    evidenceDoc: 'dumper_brake_test_cert.pdf'
  },
  {
    id: 'OBL-ENV-01',
    ref: 'EC Cond. 14',
    domain: 'Environment',
    title: 'Afforestation over 40 ha overburden dump area',
    due: '31 Aug 2026',
    status: 'OVERDUE',
    evidenceDoc: 'plantation_survey_2026.pdf'
  },
  {
    id: 'OBL-ENV-02',
    ref: 'EC Cond. 31',
    domain: 'Environment',
    title: 'Continuous ambient air quality monitoring quarterly report',
    due: '05 Sep 2026',
    status: 'SUBMITTED',
    evidenceDoc: 'aaqmr_q1_report.pdf'
  },
  {
    id: 'OBL-LAB-01',
    ref: 'Mines Act s.48',
    domain: 'Labour',
    title: 'Form 11 Register of persons employed daily reconciliation',
    due: 'Daily Shift',
    status: 'SATISFIED',
    evidenceDoc: 'form11_shift_signed.pdf'
  }
];

const TABS = ['All domains', 'Safety', 'Environment', 'Production', 'Labour'] as const;

export default function MineComplianceRegisterPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All domains');

  const filteredObligations = OBLIGATIONS.filter(o => {
    if (activeTab === 'All domains') return true;
    return o.domain.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/mine/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Compliance Register · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Comprehensive statutory obligation tracking across DGMS, MoEFCC, SPCB, and Labour mandates
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => alert('Generating full Compliance Register PDF audit docket...')}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>[Export PDF]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Domain Filter Tabs */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 flex items-center gap-2 flex-wrap text-xs">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded font-semibold text-xs transition border ${
                  isSelected
                    ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                [{tab}]
              </button>
            );
          })}
        </div>

        {/* SECTION 1: SAFETY — CMR 2017 Progress Bar */}
        {(activeTab === 'All domains' || activeTab === 'Safety') && (
          <div className="p-4 space-y-2 bg-slate-50/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold text-slate-900 text-sm">
                SAFETY — CMR 2017
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs">
                18/22 satisfied (81.8%)
              </span>
            </div>

            {/* Visual Progress Bar matching wireframe: ████████░░░░ */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-[#8B0000] h-full" style={{ width: '81.8%' }} />
            </div>

            <div className="text-[11px] text-slate-600 font-medium">
              2 submitted (awaiting verification) · <span className="text-red-700 font-bold">1 overdue</span> · 1 waived
            </div>
          </div>
        )}

        {/* SECTION 2: ENVIRONMENT — EC Conditions Progress Bar */}
        {(activeTab === 'All domains' || activeTab === 'Environment') && (
          <div className="p-4 space-y-2 bg-slate-50/40">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold text-slate-900 text-sm">
                ENVIRONMENT — EC Conditions
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs">
                8/12 satisfied (66.7%)
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-emerald-700 h-full" style={{ width: '66.7%' }} />
            </div>

            <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
              <span>2 submitted · </span>
              <span className="text-red-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600" />
                <span>2 overdue 🔴</span>
              </span>
            </div>
          </div>
        )}

        {/* OBLIGATIONS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <th className="py-2.5 px-4">Ref</th>
                <th className="py-2.5 px-4">Domain</th>
                <th className="py-2.5 px-4">Obligation</th>
                <th className="py-2.5 px-4">Due</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredObligations.map((row) => {
                const isOverdue = row.status === 'OVERDUE';
                const isSatisfied = row.status === 'SATISFIED';
                const isSubmitted = row.status === 'SUBMITTED';

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {row.ref}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.domain}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {row.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {row.due}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                          isOverdue
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : isSatisfied
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : isSubmitted
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        [{row.status}]
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {row.evidenceDoc}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Statutory Compliance Matrix · Gevra Opencast Project</span>
          <span className="font-mono text-slate-500">DGMS & MoEFCC Portal</span>
        </div>
      </div>
    </div>
  );
}
