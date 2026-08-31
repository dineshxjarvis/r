'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Clock,
  ArrowLeft,
  X,
  Filter,
  Image,
  MapPin
} from 'lucide-react';

interface CapaItem {
  id: string;
  findingId: string;
  findingSource: string;
  severity: 'SEVERE' | 'SIGNIFICANT' | 'MINOR';
  status: 'PENDING_VERIFICATION' | 'IN_PROGRESS' | 'OVERDUE' | 'APPROVED' | 'REJECTED';
  dueText: string;
  submittedBy: string;
  evidenceSummary: string;
  evidencePhotos: number;
  hasCertificate: boolean;
  reqMineManagerSignoff: boolean;
  requiresGeoPin: boolean;
}

const INITIAL_CAPAS: CapaItem[] = [
  {
    id: 'CAPA-2847-01',
    findingId: 'DG-2847',
    findingSource: 'DGMS Regular Inspection',
    severity: 'SEVERE',
    status: 'PENDING_VERIFICATION',
    dueText: 'Due 14 Sep 2026',
    submittedBy: 'Er. Rajesh Verma (Safety Officer)',
    evidenceSummary: '3 geo-tagged photos + berm compaction test certificate',
    evidencePhotos: 3,
    hasCertificate: true,
    reqMineManagerSignoff: true,
    requiresGeoPin: true
  },
  {
    id: 'CAPA-0412-02',
    findingId: 'DEF-0412',
    findingSource: 'Internal Pit Safety Audit',
    severity: 'SIGNIFICANT',
    status: 'IN_PROGRESS',
    dueText: 'Due 08 Sep 2026',
    submittedBy: 'Er. D. Mukherjee (Overman)',
    evidenceSummary: 'Ramp gradient resurfacing underway (75% completed)',
    evidencePhotos: 2,
    hasCertificate: false,
    reqMineManagerSignoff: true,
    requiresGeoPin: true
  }
];

export default function MineCapaManagementPage() {
  const [capas, setCapas] = useState<CapaItem[]>(INITIAL_CAPAS);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING_VERIFICATION' | 'OVERDUE' | 'IN_PROGRESS'>('ALL');
  const [rejectModalCapa, setRejectModalCapa] = useState<CapaItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = (id: string) => {
    setCapas(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: 'APPROVED' } : c
      )
    );
    alert(`CAPA ${id} verified and officially closed under CMR 2017 Reg. 27 statutory authority.`);
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      alert('Please provide a statutory reason for rejecting this CAPA.');
      return;
    }
    if (rejectModalCapa) {
      setCapas(prev =>
        prev.map(c =>
          c.id === rejectModalCapa.id ? { ...c, status: 'REJECTED' } : c
        )
      );
      alert(`CAPA ${rejectModalCapa.id} rejected. Reason logged: "${rejectReason}". Submitter notified.`);
      setRejectModalCapa(null);
      setRejectReason('');
    }
  };

  const handleRequestMoreEvidence = (id: string) => {
    alert(`Evidence deficiency notice dispatched to submitter for CAPA ${id} (POST /notifications).`);
  };

  const pendingCount = capas.filter(c => c.status === 'PENDING_VERIFICATION').length;
  const overdueCount = capas.filter(c => c.status === 'OVERDUE').length;
  const inProgressCount = capas.filter(c => c.status === 'IN_PROGRESS').length;

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
              CAPAs · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Mine Manager Statutory Verification & Sign-off Authority (CMR 2017 Reg. 27)
          </div>
        </div>

        {/* Action Controls matching wireframe */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto text-xs font-bold">
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded transition"
          >
            [Filter]
          </button>
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded transition"
          >
            [Group by: Status]
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Status Counters Strip matching wireframe: PENDING VERIFICATION [3]  OVERDUE [1]  IN PROGRESS [8] */}
        <div className="p-3.5 bg-slate-100 flex items-center gap-3 flex-wrap text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setActiveFilter('PENDING_VERIFICATION')}
            className={`px-3 py-1 rounded border transition ${
              activeFilter === 'PENDING_VERIFICATION'
                ? 'bg-[#8B0000] text-white border-[#730000] shadow-xs'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            PENDING VERIFICATION [{pendingCount}]
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('OVERDUE')}
            className={`px-3 py-1 rounded border transition ${
              activeFilter === 'OVERDUE'
                ? 'bg-red-700 text-white border-red-800 shadow-xs'
                : 'bg-white text-red-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            OVERDUE [{overdueCount}]
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('IN_PROGRESS')}
            className={`px-3 py-1 rounded border transition ${
              activeFilter === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
            }`}
          >
            IN PROGRESS [{inProgressCount}]
          </button>

          {activeFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className="text-xs text-slate-500 hover:underline font-sans ml-auto"
            >
              [Show All]
            </button>
          )}
        </div>

        {/* CAPA Cards List */}
        <div className="divide-y divide-slate-300">
          {capas.map((capa) => {
            const isSevere = capa.severity === 'SEVERE';
            const isApproved = capa.status === 'APPROVED';
            const isRejected = capa.status === 'REJECTED';

            return (
              <div key={capa.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition">
                {/* Row 1: Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {capa.id}
                    </span>
                    <span className="font-mono font-bold text-red-700">
                      {capa.severity}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-700 font-semibold">
                      Submitted — awaiting mine-manager ack
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : isRejected
                        ? 'bg-red-100 text-red-900 border-red-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    [{capa.status}]
                  </span>
                </div>

                {/* Row 2: Finding source & Due Date */}
                <div className="text-slate-600 pl-4.5 space-y-0.5">
                  <div>
                    <span className="font-semibold text-slate-800">Finding: </span>
                    <span className="font-mono font-bold text-slate-900">{capa.findingId} ({capa.findingSource})</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="font-mono text-slate-700">{capa.dueText}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Submitted by: </span>
                    <span>{capa.submittedBy}</span>
                    <span className="text-slate-400 mx-2">·</span>
                    <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                      Evidence: {capa.evidenceSummary}
                    </span>
                  </div>
                </div>

                {/* Row 3: VERIFICATION REQUIRED Box matching wireframe */}
                <div className="p-3 bg-red-50/50 border border-red-200 rounded space-y-1.5 text-slate-800 ml-4.5">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#8B0000]" />
                    <span>VERIFICATION REQUIRED — SEVERE requires:</span>
                  </div>
                  <ul className="space-y-1 pl-5 list-disc text-[11px] text-slate-700 font-medium">
                    <li>Mine Manager sign-off (you)</li>
                    <li>Photo evidence at exact DGMS finding location (GPS lat/long verified)</li>
                  </ul>
                </div>

                {/* Row 4: Action buttons matching wireframe: [Approve] [Reject with reason] [Request more evidence] */}
                <div className="flex items-center gap-2 pl-4.5 pt-1">
                  {isApproved ? (
                    <span className="text-emerald-700 font-bold text-xs flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>[Verified & Closed by Mine Manager ✓]</span>
                    </span>
                  ) : isRejected ? (
                    <span className="text-red-700 font-bold text-xs font-mono">
                      [Rejected / Sent Back for Rework]
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApprove(capa.id)}
                        className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs"
                      >
                        [Approve]
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectModalCapa(capa)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded transition"
                      >
                        [Reject with reason]
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestMoreEvidence(capa.id)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded transition"
                      >
                        [Request more evidence]
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>CMR 2017 Reg. 27 Statutory CAPA Sign-off Register</span>
          <span className="font-mono text-slate-500">DGMS Zone 3 Oversight</span>
        </div>

      </div>

      {/* Reject Modal */}
      {rejectModalCapa && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900">
                Reject CAPA: {rejectModalCapa.id}
              </div>
              <button
                type="button"
                onClick={() => setRejectModalCapa(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700">
                Mandatory Statutory Reason for Rejection:
              </label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Specify what corrective measures remain incomplete or why evidence is insufficient..."
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalCapa(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded shadow-xs"
              >
                [Confirm Rejection]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
