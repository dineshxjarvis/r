'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Plus, Clock, CheckCircle2, X } from 'lucide-react';

const GRIEVANCES = [
  { id: 'GR-CON-014', worker: 'Ramesh Kumar (Driller)', subject: 'Unpaid overtime — 3 shifts (Aug)', status: 'OPEN', raised: '28 Aug 2026', assignedTo: 'Contractor HR Dept' },
  { id: 'GR-CON-013', worker: 'Mohan Lal (Operator)', subject: 'PPE not provided — safety boots size 11', status: 'IN_PROGRESS', raised: '22 Aug 2026', assignedTo: 'Site Safety Officer' },
  { id: 'GR-CON-011', worker: 'Dinesh Yadav (Helper)', subject: 'Salary discrepancy — Aug statement', status: 'CLOSED', raised: '15 Aug 2026', assignedTo: 'Mine Manager' }
];

export default function ContractorGrievancesPage() {
  const [grievances, setGrievances] = useState(GRIEVANCES);
  const [newModal, setNewModal] = useState(false);
  const [workerName, setWorkerName] = useState('');
  const [subject, setSubject] = useState('');

  const handleNewGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerName.trim() || !subject.trim()) return;
    setGrievances(prev => [{
      id: `GR-CON-0${prev.length + 15}`,
      worker: workerName,
      subject,
      status: 'OPEN',
      raised: '31 Aug 2026',
      assignedTo: 'Contractor HR Dept'
    }, ...prev]);
    alert(`Grievance filed on behalf of worker (POST /grievances). Routed to Mine Manager for oversight.`);
    setWorkerName('');
    setSubject('');
    setNewModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/contractor/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />← Back
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-base font-bold text-slate-900">Grievances · Acme Mining Services Workers</h1>
        </div>
        <button
          type="button"
          onClick={() => setNewModal(true)}
          className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1 text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          [+ New Grievance]
        </button>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        {grievances.map((g) => (
          <div key={g.id} className="p-4 space-y-1.5 hover:bg-slate-50 transition">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${g.status === 'OPEN' ? 'bg-red-500' : g.status === 'IN_PROGRESS' ? 'bg-amber-500' : 'bg-emerald-600'}`} />
                <span className="font-mono font-bold text-slate-900">{g.id}</span>
                <span className="text-slate-400">·</span>
                <span className="font-bold text-slate-900">{g.worker}</span>
              </div>
              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                g.status === 'OPEN' ? 'bg-red-100 text-red-900 border-red-300'
                : g.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}>
                [{g.status}]
              </span>
            </div>
            <div className="pl-4 text-slate-800 font-medium">{g.subject}</div>
            <div className="pl-4 text-[11px] text-slate-500 font-mono">
              Raised: {g.raised} · Assigned to: {g.assignedTo}
            </div>
          </div>
        ))}

        <div className="p-3 bg-slate-50 text-[11px] text-slate-600 flex justify-between">
          <span>GET /grievances?filter[organization_id]=… · Worker Grievance Register</span>
          <span className="font-mono text-slate-500">SECL</span>
        </div>
      </div>

      {/* New Grievance Modal */}
      {newModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#8B0000]" />
                <span>File Grievance on behalf of Worker</span>
              </div>
              <button type="button" onClick={() => setNewModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleNewGrievance} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Worker Name & Designation:</label>
                <input type="text" value={workerName} onChange={e => setWorkerName(e.target.value)} placeholder="e.g. Suresh Patel (Blasting Mate)" className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Grievance Subject:</label>
                <textarea rows={3} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Describe the worker's grievance clearly..." className="w-full p-2 border border-slate-300 rounded bg-white text-xs" required />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setNewModal(false)} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs">[File Grievance]</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
