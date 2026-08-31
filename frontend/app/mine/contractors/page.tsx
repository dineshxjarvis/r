'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Clock,
  ShieldCheck,
  Plus,
  X
} from 'lucide-react';

interface ContractorPackage {
  id: string;
  code: string;
  contractorName: string;
  scopeWork: string;
  licenceNumber: string;
  licenceExpiry: string;
  status: 'APPROVED' | 'PENDING_APPROVAL' | 'EXPIRED';
  rosterPendingReview: boolean;
  activeWorkers: number;
  incidents: number;
  findingsAttributed: number;
  capaComplianceRate: string;
}

const CONTRACTOR_PACKAGES: ContractorPackage[] = [
  {
    id: 'CPKG-03',
    code: 'OB-REM-PKG-03',
    contractorName: 'Acme Mining Services Pvt. Ltd.',
    scopeWork: 'Overburden Removal & Waste Dumping (North Pit Bench 6-8)',
    licenceNumber: 'CLRA-CG-2024-881',
    licenceExpiry: '31 Dec 2026',
    status: 'APPROVED',
    rosterPendingReview: true,
    activeWorkers: 62,
    incidents: 0,
    findingsAttributed: 2,
    capaComplianceRate: '100%'
  },
  {
    id: 'CPKG-01',
    code: 'COAL-HAUL-01',
    contractorName: 'Eastern Haulage & Logistics Corp',
    scopeWork: 'Coal Transport from Pit 2 to Central Coal Handling Plant',
    licenceNumber: 'CLRA-CG-2023-412',
    licenceExpiry: '30 Jun 2027',
    status: 'APPROVED',
    rosterPendingReview: false,
    activeWorkers: 45,
    incidents: 0,
    findingsAttributed: 0,
    capaComplianceRate: '100%'
  }
];

export default function MineContractorsPage() {
  const [packages, setPackages] = useState<ContractorPackage[]>(CONTRACTOR_PACKAGES);
  const [selectedRosterModal, setSelectedRosterModal] = useState<ContractorPackage | null>(null);

  const handleApproveRoster = (pkgId: string) => {
    setPackages(prev =>
      prev.map(p =>
        p.id === pkgId ? { ...p, rosterPendingReview: false } : p
      )
    );
    alert(`Contractor shift roster for ${pkgId} approved by Mine Manager (POST /contractor-roster-versions/{id}/actions {action:"APPROVE"}).`);
    setSelectedRosterModal(null);
  };

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
              Contractors · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Contract Labour (Regulation & Abolition) Act 1970 · Package Approvals & Safety Audits
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => alert('Opening new contractor work-package registration modal...')}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ Register Work Package]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Contractor Packages List */}
        <div className="divide-y divide-slate-300">
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-4 space-y-2.5 hover:bg-slate-50/50 transition">
              {/* Row 1: Code, Contractor Name, Approval Status */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {pkg.code}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {pkg.contractorName}
                  </span>
                </div>

                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                  [{pkg.status}]
                </span>
              </div>

              {/* Scope & Licence info */}
              <div className="text-slate-600 pl-4.5 text-xs">
                <div>Scope: <span className="font-medium text-slate-800">{pkg.scopeWork}</span></div>
                <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                  Licence: {pkg.licenceNumber} (Valid to {pkg.licenceExpiry}) · {pkg.activeWorkers} workers deployed
                </div>
              </div>

              {/* Row 2: Roster Pending Review Banner */}
              {pkg.rosterPendingReview ? (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded flex items-center justify-between ml-4.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-semibold text-amber-900">
                      Roster pending review (Shift A/B/C rotation for Sep 2026)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedRosterModal(pkg)}
                    className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-xs font-bold text-[#8B0000] rounded transition"
                  >
                    [Review roster →]
                  </button>
                </div>
              ) : (
                <div className="pl-4.5 text-[11px] text-emerald-700 font-mono font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Roster Approved & Synced with Biometric Pit Gate</span>
                </div>
              )}

              {/* Row 3: Incidents, Findings, Compliance stats matching wireframe */}
              <div className="pl-4.5 pt-1 flex items-center justify-between flex-wrap gap-2 text-slate-700 border-t border-slate-100">
                <div className="font-mono text-xs space-x-2">
                  <span>Incidents: <strong>{pkg.incidents}</strong></span>
                  <span>·</span>
                  <span>Findings attributed: <strong>{pkg.findingsAttributed}</strong></span>
                  <span>·</span>
                  <span>CAPA compliance: <strong className="text-emerald-700">{pkg.capaComplianceRate}</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => alert(`Opening comprehensive performance dossier & DGMS compliance audit for ${pkg.contractorName}...`)}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [Full performance report]
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Contractor Safety Management Registry · DGMS Circular 02 of 2020</span>
          <span className="font-mono text-slate-500">Form V Contractor Authorization</span>
        </div>

      </div>

      {/* Roster Review Modal */}
      {selectedRosterModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-lg w-full p-5 space-y-3.5 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900">
                Review Roster: {selectedRosterModal.code} ({selectedRosterModal.contractorName})
              </div>
              <button
                type="button"
                onClick={() => setSelectedRosterModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div>
                <span className="text-slate-500">Period: </span>
                <span className="font-bold">September 2026 (Month Schedule)</span>
              </div>
              <div>
                <span className="text-slate-500">Workers Assigned: </span>
                <span className="font-mono">{selectedRosterModal.activeWorkers} certified personnel</span>
              </div>
              <div>
                <span className="text-slate-500">DGMS Vocational Training: </span>
                <span className="font-bold text-emerald-700">100% VTC & Initial Medical Exam (IME) Verified</span>
              </div>
              <div>
                <span className="text-slate-500">Supervisor: </span>
                <span>Er. Rajesh Kumar (DGMS Overman Cert #4110)</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRosterModal(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleApproveRoster(selectedRosterModal.id)}
                className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
              >
                [Approve Roster]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
