'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Plus, Download, Bell, CheckCircle2, AlertTriangle, Clock, X, Upload } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  designation: string;
  complianceStatus: 'OK' | 'EXPIRED' | 'DUE_SOON';
  complianceNote: string;
  certExpiry?: string;
}

const INITIAL_WORKERS: Worker[] = [
  { id: 'W-001', name: 'D. Murmu', designation: 'Dumper Operator', complianceStatus: 'OK', complianceNote: 'Certified · Active', certExpiry: '31 Mar 2027' },
  { id: 'W-002', name: 'M. Soren', designation: 'Dumper Operator', complianceStatus: 'EXPIRED', complianceNote: 'Safety certificate expired', certExpiry: 'EXPIRED' },
  { id: 'W-003', name: 'R. Oraon', designation: 'Excavator Op.', complianceStatus: 'DUE_SOON', complianceNote: 'Medical exam due 05 Sep', certExpiry: '05 Sep 2026' },
  { id: 'W-004', name: 'K. Hembram', designation: 'Helper', complianceStatus: 'OK', complianceNote: 'Certified · Active', certExpiry: '15 Jan 2027' },
  { id: 'W-005', name: 'S. Kisku', designation: 'Blasting Mate', complianceStatus: 'OK', complianceNote: 'Certified · Active', certExpiry: '28 Feb 2027' },
];

export default function ContractorWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [addModal, setAddModal] = useState(false);
  const [updateDocModal, setUpdateDocModal] = useState<Worker | null>(null);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newDesignation, setNewDesignation] = useState('Helper');

  const eligibleCount = workers.filter(w => w.complianceStatus === 'OK').length;
  const totalCount = workers.length + 307; // simulate 312 full roster
  const exceptionsCount = workers.filter(w => w.complianceStatus !== 'OK').length;

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerName.trim()) return;
    setWorkers(prev => [...prev, {
      id: `W-0${prev.length + 10}`,
      name: newWorkerName,
      designation: newDesignation,
      complianceStatus: 'OK',
      complianceNote: 'Certified · Active',
      certExpiry: '31 Mar 2027'
    }]);
    alert('Worker added to roster package. Biometric gate sync initiated (POST /contractor-roster-versions).');
    setNewWorkerName('');
    setAddModal(false);
  };

  const handleUpdateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateDocModal) return;
    setWorkers(prev => prev.map(w =>
      w.id === updateDocModal.id
        ? { ...w, complianceStatus: 'OK' as const, complianceNote: 'Certified · Active (renewed)', certExpiry: '31 Aug 2027' }
        : w
    ));
    alert(`Certificate renewed for ${updateDocModal.name} (POST /contractor-requirement-instances/{id}/actions {action:"SUBMIT", payload:{document_id}}).`);
    setUpdateDocModal(null);
  };

  const handleRemind = (worker: Worker) => {
    alert(`Reminder notification sent to ${worker.name} for medical exam (POST /notifications).`);
  };

  const handleDownloadRoster = () => {
    alert('Roster PDF downloaded — Approved 29 Aug 2026 · 312 workers (GET /contractor-roster-versions/current).');
  };

  const handlePrepareNextRoster = () => {
    alert('New roster draft created for 30 Sep 2026 cycle (POST /contractor-roster-versions).');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Header matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>Contractor Supervisor · Worker Compliance Desk</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Workers · OB-REM-PKG-03
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Gevra OCP · Acme Mining Services · SECL/KRB/OB-REMOVAL/2026/17
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setAddModal(true)}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ Add worker]</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadRoster}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded flex items-center gap-1 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>[Export]</span>
          </button>
        </div>
      </div>

      {/* Main Docket matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">

        {/* ELIGIBLE WORKERS STRIP matching wireframe */}
        <div className="p-4 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 uppercase tracking-wider">
              ELIGIBLE WORKERS:
            </span>
            <span className="font-mono font-black text-emerald-800 text-sm">
              {eligibleCount + 305}/{totalCount}
            </span>
          </div>
          <span className="font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
            [{exceptionsCount} Exceptions]
          </span>
        </div>

        {/* WORKER LIST matching wireframe */}
        <div className="divide-y divide-slate-200">
          {INITIAL_WORKERS.map((worker) => {
            const isOk = worker.complianceStatus === 'OK';
            const isExpired = worker.complianceStatus === 'EXPIRED';
            const isDue = worker.complianceStatus === 'DUE_SOON';

            return (
              <div key={worker.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  {isOk ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : isExpired ? (
                    <span className="w-4 h-4 rounded-full bg-red-600 shrink-0 flex items-center justify-center" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-amber-500 shrink-0 flex items-center justify-center" />
                  )}

                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                      <span>{worker.name}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className="font-normal text-slate-700">{worker.designation}</span>
                      <span className="text-slate-400 font-normal">·</span>
                      <span className={`font-mono text-[11px] ${
                        isOk ? 'text-emerald-700' : isExpired ? 'text-red-700 font-bold' : 'text-amber-700 font-bold'
                      }`}>
                        {worker.complianceNote}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isExpired && (
                    <button
                      type="button"
                      onClick={() => setUpdateDocModal(worker)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded transition"
                    >
                      [Update document]
                    </button>
                  )}
                  {isDue && (
                    <button
                      type="button"
                      onClick={() => handleRemind(worker)}
                      className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 font-bold rounded transition"
                    >
                      [Remind]
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ROSTER SUBMISSIONS matching wireframe */}
        <div className="p-4 bg-slate-50/50 space-y-2.5">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            ROSTER SUBMISSIONS
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-slate-800 font-medium">
              Current approved: <span className="font-mono font-bold text-slate-900">29 Aug 2026</span> · 312 workers
            </span>
            <button
              type="button"
              onClick={handleDownloadRoster}
              className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded flex items-center gap-1 transition text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              [Download]
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-slate-800 font-medium">
              Next due: <span className="font-mono font-bold text-amber-800">30 Sep 2026</span>
            </span>
            <button
              type="button"
              onClick={handlePrepareNextRoster}
              className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1 transition text-xs shadow-xs"
            >
              [Prepare next roster]
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>GET /package-assignments?filter[package_id]=… · Contractor Worker Compliance</span>
          <span className="font-mono text-slate-500">SECL · Korba</span>
        </div>
      </div>

      {/* Add Worker Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8B0000]" />
                <span>Add Worker to OB-REM-PKG-03</span>
              </div>
              <button type="button" onClick={() => setAddModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddWorker} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name:</label>
                <input type="text" value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} placeholder="e.g. B. Toppo" className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation:</label>
                <select value={newDesignation} onChange={e => setNewDesignation(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-xs">
                  <option>Helper</option>
                  <option>Driller</option>
                  <option>Dumper Operator</option>
                  <option>Excavator Op.</option>
                  <option>Blasting Mate</option>
                  <option>Supervisor</option>
                </select>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setAddModal(false)} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs">[Add to Roster]</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Document Modal */}
      {updateDocModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#8B0000]" />
                <span>Update Certificate — {updateDocModal.name}</span>
              </div>
              <button type="button" onClick={() => setUpdateDocModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateDoc} className="space-y-3">
              <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-800 font-medium">
                Safety certificate expired for {updateDocModal.name} ({updateDocModal.designation}). Upload renewed certificate to restore eligibility.
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Upload Renewed Certificate (PDF):</label>
                <input type="file" accept=".pdf,.jpg,.png" className="w-full text-xs" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Expiry Date:</label>
                <input type="date" defaultValue="2027-08-31" className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono" required />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setUpdateDocModal(null)} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs">[Submit Renewal]</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
