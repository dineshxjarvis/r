'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  X,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';

interface MineGrievance {
  id: string;
  title: string;
  category: string;
  status: 'OPEN' | 'ESCALATED' | 'CLOSED';
  escalatedTo?: string;
  assignedOfficer?: string;
  details: string;
  raisedDate: string;
}

const INITIAL_GRIEVANCES: MineGrievance[] = [
  {
    id: 'GR-0231',
    title: 'Wage discrepancy — contractor worker',
    category: 'Wages & Overtime',
    status: 'OPEN',
    details: 'Contractor labour under OB-REM-PKG-03 reported minimum wage differential under VDA revision.',
    raisedDate: '27 Aug 2026'
  },
  {
    id: 'GR-0219',
    title: 'Safety equipment shortage',
    category: 'Safety & PPE',
    status: 'ESCALATED',
    escalatedTo: 'Safety Officer',
    details: 'Insufficient supply of dust respirators and safety helmets at West Pit Loading Area.',
    raisedDate: '24 Aug 2026'
  },
  {
    id: 'GR-0198',
    title: 'Roster dispute',
    category: 'Attendance & Roster',
    status: 'CLOSED',
    assignedOfficer: 'Shri B. S. Chawla (Labour Officer)',
    details: 'Shift timing dispute resolved with union welfare delegate and shift overman.',
    raisedDate: '15 Aug 2026'
  }
];

export default function MineGrievancesPage() {
  const [grievances, setGrievances] = useState<MineGrievance[]>(INITIAL_GRIEVANCES);
  const [assignModalGrievance, setAssignModalGrievance] = useState<MineGrievance | null>(null);
  const [assigneeName, setAssigneeName] = useState('Shri B. S. Chawla (Labour Officer)');
  const [selectedViewGrievance, setSelectedViewGrievance] = useState<MineGrievance | null>(null);

  const handleAssignSubmit = () => {
    if (assignModalGrievance) {
      setGrievances(prev =>
        prev.map(g =>
          g.id === assignModalGrievance.id
            ? { ...g, assignedOfficer: assigneeName }
            : g
        )
      );
      alert(`Grievance ${assignModalGrievance.id} officially assigned to ${assigneeName} (POST /grievances/{id}/actions {action:"ASSIGN"}).`);
      setAssignModalGrievance(null);
    }
  };

  const handleEscalate = (id: string, target: string) => {
    setGrievances(prev =>
      prev.map(g =>
        g.id === id
          ? { ...g, status: 'ESCALATED', escalatedTo: target }
          : g
      )
    );
    alert(`Grievance ${id} escalated to ${target} by Mine Manager.`);
  };

  const handleClose = (id: string) => {
    setGrievances(prev =>
      prev.map(g =>
        g.id === id
          ? { ...g, status: 'CLOSED' }
          : g
      )
    );
    alert(`Grievance ${id} officially closed with statutory resolution note.`);
    setSelectedViewGrievance(null);
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
              Grievances · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Mine Manager Executive Oversight · Dispute Redressal & Statutory Escalation
          </div>
        </div>

        {/* Filter button matching wireframe */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded flex items-center gap-1 transition"
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>[Filter ▼]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Grievances List */}
        <div className="divide-y divide-slate-300">
          {grievances.map((g) => {
            const isOpen = g.status === 'OPEN';
            const isEscalated = g.status === 'ESCALATED';
            const isClosed = g.status === 'CLOSED';

            return (
              <div key={g.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition">
                {/* Row 1: Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isOpen ? 'bg-red-600' : isEscalated ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                    />
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {g.id}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {g.title}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                      isOpen
                        ? 'bg-red-100 text-red-900 border-red-300'
                        : isEscalated
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    [{g.status}]
                  </span>
                </div>

                {/* Row 2: Category & Escalated Tag */}
                <div className="pl-4.5 flex items-center justify-between flex-wrap gap-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>Category: <strong>{g.category}</strong></span>
                    <span>·</span>
                    <span>Raised: {g.raisedDate}</span>
                    {g.escalatedTo && (
                      <span className="font-mono text-[11px] text-[#8B0000] font-bold bg-red-50 border border-red-200 px-2 py-0.2 rounded">
                        [Escalated to: {g.escalatedTo}]
                      </span>
                    )}
                    {g.assignedOfficer && (
                      <span className="font-mono text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.2 rounded">
                        Assigned: {g.assignedOfficer}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons matching wireframe: [Assign] [View →] */}
                  <div className="flex items-center gap-2">
                    {isOpen && (
                      <button
                        type="button"
                        onClick={() => setAssignModalGrievance(g)}
                        className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs"
                      >
                        [Assign]
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedViewGrievance(selectedViewGrievance?.id === g.id ? null : g)}
                      className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
                    >
                      [View →]
                    </button>
                  </div>
                </div>

                {/* Details View if opened */}
                {selectedViewGrievance?.id === g.id && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded space-y-2 font-mono text-[11px] animate-in fade-in duration-100">
                    <div className="font-sans font-bold text-slate-900 text-xs">
                      Grievance Details & Action Log:
                    </div>
                    <div className="text-slate-700">
                      {g.details}
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {!isEscalated && !isClosed && (
                          <button
                            type="button"
                            onClick={() => handleEscalate(g.id, 'Safety Officer')}
                            className="px-2.5 py-1 bg-amber-100 border border-amber-300 hover:bg-amber-200 text-amber-900 font-bold rounded"
                          >
                            [Escalate to Safety Officer]
                          </button>
                        )}
                        {!isClosed && (
                          <button
                            type="button"
                            onClick={() => handleClose(g.id)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded"
                          >
                            [Close Grievance]
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedViewGrievance(null)}
                        className="text-slate-500 hover:text-slate-800 font-sans"
                      >
                        [Hide]
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Industrial Disputes Act 1947 · Mine Pit Welfare Committee Redressal</span>
          <span className="font-mono text-slate-500">DGMS & CIL Welfare Cell</span>
        </div>

      </div>

      {/* Assign Modal */}
      {assignModalGrievance && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-3.5 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#8B0000]" />
                <span>Assign Grievance: {assignModalGrievance.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalGrievance(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Assign to Subordinate Official:</label>
              <select
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
              >
                <option>Shri B. S. Chawla (Labour & Welfare Officer)</option>
                <option>Er. Rajesh Verma (Safety Officer)</option>
                <option>Er. D. Mukherjee (Overman / HEMM In-charge)</option>
                <option>Ms. Priya Swamy (Environmental Officer)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignModalGrievance(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignSubmit}
                className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
              >
                [Confirm Assignment]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
