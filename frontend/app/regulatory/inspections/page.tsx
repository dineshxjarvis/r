'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  ShieldCheck
} from 'lucide-react';

interface JurisdictionInspection {
  id: string;
  mineName: string;
  type: 'STATUTORY_DGMS' | 'ROUTINE_QUARTERLY' | 'SPECIAL_INQUIRY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'CLOSED';
  scheduledDate: string;
  inspectorName: string;
  scope: string;
}

const INITIAL_INSPECTIONS: JurisdictionInspection[] = [
  {
    id: 'INS-2024-0891',
    mineName: 'Gevra OCP',
    type: 'STATUTORY_DGMS',
    status: 'IN_PROGRESS',
    scheduledDate: '14 Aug 2026',
    inspectorName: 'Er. R. Verma, DDMS (Mining)',
    scope: 'Annual Comprehensive Safety & Slope Stability Audit (CMR 2017)'
  },
  {
    id: 'INS-2024-0870',
    mineName: 'Dipka OCP',
    type: 'ROUTINE_QUARTERLY',
    status: 'CLOSED',
    scheduledDate: '05 Aug 2026',
    inspectorName: 'Er. R. Verma, DDMS (Mining)',
    scope: 'Haul road gradient, illumination & continuous environmental monitoring check'
  },
  {
    id: 'INS-2024-0899',
    mineName: 'Kusmunda OCP',
    type: 'SPECIAL_INQUIRY',
    status: 'SCHEDULED',
    scheduledDate: '12 Sep 2026',
    inspectorName: 'Er. R. Verma, DDMS (Mining)',
    scope: 'Bulk explosive storage safety & magazine license renewal inspection'
  }
];

export default function RegulatoryInspectionsSchedulingPage() {
  const [inspections, setInspections] = useState<JurisdictionInspection[]>(INITIAL_INSPECTIONS);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [targetMine, setTargetMine] = useState('Gevra OCP');
  const [scopeText, setScopeText] = useState('');

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scopeText.trim()) return;

    const newInsp: JurisdictionInspection = {
      id: `INS-2026-${Math.floor(Math.random() * 900 + 100)}`,
      mineName: targetMine,
      type: 'STATUTORY_DGMS',
      status: 'SCHEDULED',
      scheduledDate: '15 Sep 2026',
      inspectorName: 'Er. R. Verma, DDMS (Mining)',
      scope: scopeText
    };
    setInspections(prev => [newInsp, ...prev]);
    alert(`Statutory DGMS inspection ${newInsp.id} created (POST /inspections {origin:"REGULATORY"}). Added to ${targetMine} field queue.`);
    setScopeText('');
    setScheduleModal(false);
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
              Inspections · Jurisdiction Scheduling (Dhanbad Region 2)
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Statutory DGMS Inspection Calendar across 12 Jurisdiction Coal Mines
          </div>
        </div>

        {/* Action Controls matching wireframe: [+ Schedule Inspection] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setScheduleModal(true)}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ Schedule Inspection]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Inspections List */}
        <div className="divide-y divide-slate-300">
          {inspections.map((insp) => (
            <div key={insp.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      insp.status === 'IN_PROGRESS'
                        ? 'bg-amber-500'
                        : insp.status === 'CLOSED'
                        ? 'bg-emerald-600'
                        : 'bg-blue-600'
                    }`}
                  />
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {insp.id}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-900">
                    {insp.mineName}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono font-bold text-[#8B0000]">
                    {insp.type}
                  </span>
                </div>

                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                    insp.status === 'CLOSED'
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : insp.status === 'IN_PROGRESS'
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-blue-100 text-blue-900 border-blue-300'
                  }`}
                >
                  [{insp.status}]
                </span>
              </div>

              <div className="pl-4.5 text-slate-700 text-xs">
                Scope: <span className="font-medium text-slate-900">{insp.scope}</span>
              </div>

              <div className="pl-4.5 flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 font-mono">
                  Scheduled: {insp.scheduledDate} · Lead Inspector: {insp.inspectorName}
                </div>

                <Link
                  href="/field/inspections/INS-2026-0881"
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded text-xs transition"
                >
                  [View Inspection Record →]
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Statutory Inspection Scheduling System · Mines Act 1952 s.7</span>
          <span className="font-mono text-slate-500">DGMS Regional Office</span>
        </div>

      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8B0000]" />
                <span>Schedule Statutory Inspection</span>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Mine (Jurisdiction):</label>
                <select
                  value={targetMine}
                  onChange={(e) => setTargetMine(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                >
                  <option>Gevra OCP (SECL)</option>
                  <option>Dipka OCP (SECL)</option>
                  <option>Kusmunda OCP (SECL)</option>
                  <option>Manikpur OCP (SECL)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Inspection Scope / Statute:</label>
                <input
                  type="text"
                  value={scopeText}
                  onChange={(e) => setScopeText(e.target.value)}
                  placeholder="e.g. CMR 2017 Reg. 103 Slope Stability & Deep Pit Water Drainage"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScheduleModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                >
                  [Schedule Inspection]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
