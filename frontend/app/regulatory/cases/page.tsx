'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  Plus,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  ShieldAlert
} from 'lucide-react';

interface RegulatoryCase {
  id: string;
  category: 'SECTION_22_ORDER' | 'LICENSING' | 'MINE_OPENING';
  mineName: string;
  targetLocation: string;
  status: 'RESPONSE_RECEIVED' | 'UNDER_REVIEW' | 'ORDER_ACTIVE' | 'LIFTED';
  summary: string;
  issuedDate: string;
  responseNote?: string;
}

const INITIAL_CASES: RegulatoryCase[] = [
  {
    id: 'DGMS-2026-0084',
    category: 'SECTION_22_ORDER',
    mineName: 'Gevra OCP',
    targetLocation: 'Bench 7 North (Excavation Face)',
    status: 'RESPONSE_RECEIVED',
    summary: 'Mines Act Section 22(3) Prohibitory Notice halting blasting operations within 50m of unstable slope.',
    issuedDate: '18 Aug 2026',
    responseNote: 'Mine Manager submitted slope stability radar logs & revised blasting pattern proposal on 28 Aug.'
  },
  {
    id: 'DGMS-APP-2026-0117',
    category: 'LICENSING',
    mineName: 'Dipka OCP',
    targetLocation: 'Explosive Magazine Storage (Form IV)',
    status: 'UNDER_REVIEW',
    summary: 'Application for renewal of bulk explosive handling licence (15 Tonnes capacity).',
    issuedDate: '10 Aug 2026'
  },
  {
    id: 'MOP-2026-003',
    category: 'MINE_OPENING',
    mineName: 'Kusmunda OCP (Phase 3)',
    targetLocation: 'East Pit Extension Sector',
    status: 'UNDER_REVIEW',
    summary: 'Mine Opening Permission under CMR 2017 Regulation 3 (Notice of Opening).',
    issuedDate: '01 Jul 2026'
  }
];

export default function RegulatoryCasesPage() {
  const [cases, setCases] = useState<RegulatoryCase[]>(INITIAL_CASES);
  const [selectedCaseModal, setSelectedCaseModal] = useState<RegulatoryCase | null>(null);
  const [newCaseModal, setNewCaseModal] = useState(false);

  const handleLiftOrder = (id: string) => {
    setCases(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: 'LIFTED' } : c
      )
    );
    alert(`Section 22 Prohibitory Order ${id} officially lifted following statutory compliance inspection (POST /regulatory-cases/{id}/actions {action:"LIFT"}).`);
    setSelectedCaseModal(null);
  };

  const handleIssueDecision = (id: string) => {
    alert(`Statutory decision order published for case ${id} (POST /regulatory-cases/{id}/actions {action:"DECIDE"}).`);
    setSelectedCaseModal(null);
  };

  const handleRequestInfo = (id: string) => {
    alert(`Statutory clarification inquiry dispatched to mine management for case ${id} (POST /regulatory-cases/{id}/actions {action:"REQUEST_INFO"}).`);
    setSelectedCaseModal(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/regulatory/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Regulatory Cases · DGMS Dhanbad Region 2
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Section 22 Prohibitory Orders, Licensing Applications & Mine Opening Permissions
          </div>
        </div>

        {/* Action Controls matching wireframe: [+ New Case] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setNewCaseModal(true)}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ New Case]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: SECTION 22 PROHIBITORY ORDERS matching wireframe */}
        <div className="p-4 space-y-3 bg-red-50/20">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#8B0000]" />
            <span>SECTION 22 PROHIBITORY ORDERS</span>
          </div>

          <div className="space-y-2">
            {cases
              .filter(c => c.category === 'SECTION_22_ORDER')
              .map((c) => (
                <div key={c.id} className="p-3.5 bg-white border border-red-300 rounded space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {c.id}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-bold text-slate-900">
                        {c.mineName} · {c.targetLocation}
                      </span>
                    </div>

                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                        c.status === 'LIFTED'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      [{c.status}]
                    </span>
                  </div>

                  <div className="text-slate-700 text-xs pl-4.5">
                    {c.summary}
                  </div>

                  {c.responseNote && (
                    <div className="pl-4.5 font-mono text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                      Response: {c.responseNote}
                    </div>
                  )}

                  <div className="pl-4.5 flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCaseModal(c)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded"
                    >
                      [Review response]
                    </button>

                    <button
                      type="button"
                      onClick={() => handleIssueDecision(c.id)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded"
                    >
                      [Issue decision]
                    </button>

                    {c.status !== 'LIFTED' && (
                      <button
                        type="button"
                        onClick={() => handleLiftOrder(c.id)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-xs"
                      >
                        [Lift order]
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* SECTION 2: LICENSING APPLICATIONS matching wireframe */}
        <div className="p-4 space-y-3">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-slate-700" />
            <span>LICENSING APPLICATIONS</span>
          </div>

          <div className="space-y-2">
            {cases
              .filter(c => c.category === 'LICENSING')
              .map((c) => (
                <div key={c.id} className="p-3.5 bg-white border border-slate-300 rounded space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {c.id}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-bold text-slate-900">
                        {c.mineName} · {c.targetLocation}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
                      [{c.status}]
                    </span>
                  </div>

                  <div className="text-slate-700 text-xs pl-4.5">
                    {c.summary}
                  </div>

                  <div className="pl-4.5 flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => alert(`Reviewing statutory Form IV submission for ${c.mineName}...`)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded"
                    >
                      [Review application]
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRequestInfo(c.id)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded"
                    >
                      [Request clarification]
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* SECTION 3: MINE OPENING PERMISSIONS matching wireframe */}
        <div className="p-4 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="font-bold text-slate-900">
            MINE OPENING PERMISSIONS (CMR 2017 Reg. 3 Notice of Opening)
          </div>

          <button
            type="button"
            onClick={() => alert('Displaying all Mine Opening Permission (MOP) dossiers across Dhanbad Region 2...')}
            className="text-[11px] font-bold text-[#8B0000] hover:underline"
          >
            [View all MOP applications in jurisdiction →]
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Statutory Enforcement Registry · Mines Act 1952 Sections 22 & 22A</span>
          <span className="font-mono text-slate-500">DGMS Regional Secretariat</span>
        </div>

      </div>

      {/* Review Response Modal */}
      {selectedCaseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-lg w-full p-5 space-y-3.5 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900">
                Case Dossier: {selectedCaseModal.id} ({selectedCaseModal.mineName})
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div>
                <span className="text-slate-500">Subject: </span>
                <span className="font-bold">{selectedCaseModal.summary}</span>
              </div>
              <div>
                <span className="text-slate-500">Location: </span>
                <span className="font-mono">{selectedCaseModal.targetLocation}</span>
              </div>
              <div>
                <span className="text-slate-500">Issued On: </span>
                <span className="font-mono">{selectedCaseModal.issuedDate}</span>
              </div>
              {selectedCaseModal.responseNote && (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <div className="font-bold text-slate-700 mb-1">Mine Operator Response:</div>
                  <div className="text-[11px] text-slate-600">{selectedCaseModal.responseNote}</div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCaseModal(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleLiftOrder(selectedCaseModal.id)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded shadow-xs"
              >
                [Confirm & Lift Order]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
