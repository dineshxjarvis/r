'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Upload,
  ArrowRight,
  ShieldCheck,
  Scale,
  Search,
  BookOpen,
  Filter,
  X
} from 'lucide-react';

interface ReviewQueueItem {
  id: string;
  type: 'NEW_CIRCULAR' | 'CONFLICT';
  title: string;
  authority: string;
  clausesCount: number;
  status: 'PENDING_APPROVAL' | 'CONFLICT';
  conflictPair?: string;
}

const INITIAL_QUEUE: ReviewQueueItem[] = [
  {
    id: 'RQ-01',
    type: 'NEW_CIRCULAR',
    title: 'MoEFCC Amendment Circular 2026-08 — 3 clauses awaiting approval',
    authority: 'Ministry of Environment & Forests',
    clausesCount: 3,
    status: 'PENDING_APPROVAL'
  },
  {
    id: 'RQ-02',
    type: 'CONFLICT',
    title: 'Draft obligation conflict: EC-Cond14 vs new clause',
    authority: 'Gevra OCP Consent Review',
    clausesCount: 1,
    status: 'CONFLICT',
    conflictPair: 'EC Condition 14 (50m buffer) vs Circular 2026-08 (100m buffer)'
  }
];

export default function ComplianceTeamDashboardPage() {
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(INITIAL_QUEUE);
  const [selectedConflict, setSelectedConflict] = useState<ReviewQueueItem | null>(null);

  const handleApprove = (id: string) => {
    setReviewQueue(prev => prev.filter(item => item.id !== id));
    alert('MoEFCC Circular approved. 3 obligation instances generated and scheduled across subsidiary mine calendars (POST /extractions/{id}/actions {action:"APPROVE"}).');
  };

  const handleResolve = (id: string) => {
    setReviewQueue(prev => prev.filter(item => item.id !== id));
    alert('Statutory conflict resolved under legal precedence rules (POST /obligation-conflicts/{id}/actions {action:"RESOLVE"}).');
    setSelectedConflict(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>Corporate Compliance Ingestion & Legal Verification Desk</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Compliance Team Dashboard · SECL
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Regulation Ingestion, Conflict Resolution & Cross-Mine Obligation Scheduling
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs font-bold">
          <Link
            href="/corporate/documents"
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded transition shadow-xs flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>[+ Ingest Regulation PDF]</span>
          </Link>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: COMPLIANCE HEALTH STRIP matching wireframe */}
        <div className="p-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider">
              COMPLIANCE HEALTH —
            </span>
            <span className="font-mono text-slate-800">
              Verified <strong className="text-emerald-700 font-bold">80%</strong> · Submission <strong className="text-emerald-700 font-bold">90%</strong>
            </span>
          </div>

          <Link
            href="/corporate/dashboard"
            className="text-[11px] font-bold text-[#8B0000] hover:underline self-start sm:self-auto"
          >
            [drill →Portfolio]
          </Link>
        </div>

        {/* SECTION 2: PENDING REVIEW QUEUE matching wireframe */}
        <div className="p-4 space-y-3 bg-red-50/20">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-[#8B0000]" />
            <span>PENDING REVIEW QUEUE (AI Extractions & Conflicts)</span>
          </div>

          <div className="space-y-2">
            {reviewQueue.length === 0 ? (
              <div className="p-3 bg-white border border-slate-200 rounded text-slate-500 italic text-center">
                All uploaded circulars and conflicts reviewed and approved.
              </div>
            ) : (
              reviewQueue.map((item) => {
                const isConflict = item.type === 'CONFLICT';

                return (
                  <div
                    key={item.id}
                    className="p-3 bg-white border border-slate-300 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-400 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isConflict ? 'bg-red-600' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-bold text-slate-900 text-xs">
                          • {item.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-4">
                        Authority: {item.authority}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      {isConflict ? (
                        <button
                          type="button"
                          onClick={() => setSelectedConflict(item)}
                          className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded shadow-xs"
                        >
                          [Resolve]
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApprove(item.id)}
                          className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                        >
                          [Review & Approve]
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECTION 3: REGULATION LIBRARY (Document Intelligence) matching wireframe */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-700" />
              <span>REGULATION LIBRARY (Document Intelligence)</span>
            </div>

            <Link
              href="/corporate/documents"
              className="text-[11px] font-bold text-[#8B0000] hover:underline"
            >
              [Open Full Intelligence Library →]
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="font-bold text-slate-900">Coal Mines Regulations (CMR) 2017</div>
              <div className="text-slate-600 text-[11px]">
                186 Regulations · 42 Applicable Obligations mapped across 5 Korba mines
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="font-bold text-slate-900">Mines Act 1952 & Rules 1955</div>
              <div className="text-slate-600 text-[11px]">
                88 Sections · 14 Mandates Active (Health, Welfare & Form 11 Musters)
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: OBLIGATIONS REGISTRY (cross-mine table) matching wireframe */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
              OBLIGATIONS REGISTRY (cross-mine, filterable by domain/status)
            </div>

            <Link
              href="/corporate/compliance"
              className="text-[11px] font-bold text-[#8B0000] hover:underline"
            >
              [View Matrix Matrix →]
            </Link>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th className="py-2 px-3">Mine</th>
                  <th className="py-2 px-3">Domain</th>
                  <th className="py-2 px-3">Statutory Ref</th>
                  <th className="py-2 px-3">Obligation Summary</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Gevra OCP</td>
                  <td className="py-2.5 px-3 text-slate-600">Environment</td>
                  <td className="py-2.5 px-3 font-mono">EC Cond 14</td>
                  <td className="py-2.5 px-3">Greenbelt 40ha afforestation on OB dump</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-red-100 text-red-900 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                      [OVERDUE]
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Dipka OCP</td>
                  <td className="py-2.5 px-3 text-slate-600">Safety</td>
                  <td className="py-2.5 px-3 font-mono">CMR Reg 103</td>
                  <td className="py-2.5 px-3">Haul road berm restoration (2.5m height)</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                      [SATISFIED]
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900">Gevra OCP</td>
                  <td className="py-2.5 px-3 text-slate-600">Safety</td>
                  <td className="py-2.5 px-3 font-mono">CMR Reg 181(3)</td>
                  <td className="py-2.5 px-3">HEMM Dumper DMP-041 brake test certification</td>
                  <td className="py-2.5 px-3">
                    <span className="bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                      [SUBMITTED]
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Novelty Pillar 1: Hybrid AI Ingestion & Governance Verification</span>
          <span className="font-mono text-slate-500">CIL Regulatory Portal</span>
        </div>

      </div>

      {/* Conflict Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-3.5 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-red-700" />
                <span>Resolve Statutory Conflict</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedConflict(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div className="p-2.5 bg-red-50 border border-red-200 rounded">
                <div className="font-bold text-red-900">Conflict Details:</div>
                <div className="text-[11px] text-slate-700 mt-1">{selectedConflict.conflictPair}</div>
              </div>
              <p className="text-slate-600 text-[11px]">
                Precedence Rule: Mine-specific EC Condition prevails for operational bench; Circular 2026-08 applies to Phase-2 expansion.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedConflict(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolve(selectedConflict.id)}
                className="px-3 py-1.5 bg-[#8B0000] text-white font-bold rounded shadow-xs"
              >
                [Confirm & Resolve]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
