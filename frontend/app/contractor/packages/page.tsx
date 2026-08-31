'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, ChevronRight, X, ShieldCheck } from 'lucide-react';

interface WorkPackage {
  id: string;
  mine: string;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'EXPIRED';
  period: string;
  eligibility: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'PENDING';
  requirements: { label: string; status: 'VALID' | 'PENDING' | 'EXPIRED'; expiry: string }[];
}

const PACKAGES: WorkPackage[] = [
  {
    id: 'OB-REM-PKG-03',
    mine: 'Gevra OCP',
    status: 'APPROVED',
    period: '01 Oct 2026 – 31 Mar 2027',
    eligibility: 'ELIGIBLE',
    requirements: [
      { label: 'Labour Licence (Form IV)', status: 'VALID', expiry: '31 Dec 2026' },
      { label: 'CAR Insurance Policy', status: 'VALID', expiry: '15 Feb 2027' },
      { label: 'Safety Management Plan', status: 'PENDING', expiry: 'Renewal due 15 Sep 2026' },
      { label: 'ESI/EPF Registration', status: 'VALID', expiry: 'Ongoing' }
    ]
  },
  {
    id: 'OB-REM-PKG-07',
    mine: 'Dipka OCP',
    status: 'PENDING_APPROVAL',
    period: '01 Nov 2026 – 31 Mar 2027',
    eligibility: 'PENDING',
    requirements: [
      { label: 'Labour Licence (Form IV)', status: 'VALID', expiry: '31 Dec 2026' },
      { label: 'CAR Insurance Policy', status: 'PENDING', expiry: 'Awaiting renewal upload' },
      { label: 'Safety Management Plan', status: 'PENDING', expiry: 'Not yet submitted' }
    ]
  }
];

export default function ContractorPackagesPage() {
  const [requirementsModal, setRequirementsModal] = useState<WorkPackage | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex items-center gap-3">
        <Link href="/contractor/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />← Back
        </Link>
        <span className="text-slate-300">|</span>
        <h1 className="text-base font-bold text-slate-900">Work Packages · Acme Mining Services</h1>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        {PACKAGES.map((pkg) => (
          <div key={pkg.id} className="p-4 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">{pkg.id}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-900">{pkg.mine}</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                      pkg.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    [{pkg.status}]
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] font-mono">{pkg.period}</div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-1 font-bold text-xs ${
                    pkg.eligibility === 'ELIGIBLE' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {pkg.eligibility === 'ELIGIBLE' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>{pkg.eligibility}</span>
                </span>

                <button
                  type="button"
                  onClick={() => setRequirementsModal(pkg)}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
                >
                  [View requirements]
                </button>

                <Link
                  href="/contractor/packages"
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded transition"
                >
                  [View →]
                </Link>
              </div>
            </div>
          </div>
        ))}

        <div className="p-3 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Contractor Work Package Registry · GET /contractor-work-packages</span>
          <span className="font-mono text-slate-500">SECL · Korba Area</span>
        </div>
      </div>

      {/* Requirements Modal */}
      {requirementsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-3.5 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B0000]" />
                <span>Eligibility Requirements · {requirementsModal.id}</span>
              </div>
              <button type="button" onClick={() => setRequirementsModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {requirementsModal.requirements.map((req, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{req.label}</div>
                    <div className="text-[11px] font-mono text-slate-500">{req.expiry}</div>
                  </div>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    req.status === 'VALID'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : req.status === 'EXPIRED'
                      ? 'bg-red-100 text-red-900 border-red-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    [{req.status}]
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button type="button" onClick={() => setRequirementsModal(null)} className="px-3 py-1.5 bg-[#8B0000] text-white font-bold rounded shadow-xs">
                [Close]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
