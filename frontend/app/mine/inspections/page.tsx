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
  UserPlus
} from 'lucide-react';

interface MineInspection {
  id: string;
  type: 'REGULATORY' | 'INTERNAL';
  status: 'IN_PROGRESS' | 'SCHEDULED' | 'CLOSED';
  authority: string;
  date: string;
  team: string[];
  scope: string;
}

const INITIAL_INSPECTIONS: MineInspection[] = [
  {
    id: 'INS-2024-0891',
    type: 'REGULATORY',
    status: 'IN_PROGRESS',
    authority: 'DGMS Central Zone',
    date: '14 Aug 2026',
    team: ['Er. R. Kumar (lead)', 'Er. S. Mishra (Survey)'],
    scope: 'Annual Comprehensive Safety Audit (Bench Stability & Haul Roads)'
  },
  {
    id: 'INS-2024-0876',
    type: 'INTERNAL',
    status: 'SCHEDULED',
    authority: 'SECL Internal Safety Wing',
    date: '07 Sep 2026',
    team: ['3 assigned (Safety Officer, Overman, Surveyor)'],
    scope: 'Quarterly Monsoon Drainage & Sump Pump Capacity Verification'
  }
];

const TABS = ['All', 'Internal', 'Regulatory', 'Scheduled', 'In Progress', 'Closed'] as const;

export default function MineInspectionsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [inspections, setInspections] = useState<MineInspection[]>(INITIAL_INSPECTIONS);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [reassignModalInspection, setReassignModalInspection] = useState<MineInspection | null>(null);
  const [newTeamMember, setNewTeamMember] = useState('');

  const handleCreateInspection = () => {
    const title = prompt('Enter Inspection Scope / Title:');
    if (title) {
      const newInsp: MineInspection = {
        id: `INS-2026-${Math.floor(Math.random() * 900 + 100)}`,
        type: 'INTERNAL',
        status: 'SCHEDULED',
        authority: 'Mine Manager Oversight Audit',
        date: '10 Sep 2026',
        team: ['Er. Rajesh Verma (Safety)', 'Er. D. Mukherjee (Overman)'],
        scope: title
      };
      setInspections(prev => [newInsp, ...prev]);
      alert(`Internal Inspection ${newInsp.id} successfully scheduled.`);
    }
  };

  const handleReassignSubmit = () => {
    if (!newTeamMember.trim()) return;
    if (reassignModalInspection) {
      setInspections(prev =>
        prev.map(i =>
          i.id === reassignModalInspection.id
            ? { ...i, team: [...i.team, newTeamMember] }
            : i
        )
      );
      alert(`Team roster updated for inspection ${reassignModalInspection.id}. Official notified.`);
      setReassignModalInspection(null);
      setNewTeamMember('');
    }
  };

  const filteredInspections = inspections.filter(i => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Internal') return i.type === 'INTERNAL';
    if (activeTab === 'Regulatory') return i.type === 'REGULATORY';
    if (activeTab === 'Scheduled') return i.status === 'SCHEDULED';
    if (activeTab === 'In Progress') return i.status === 'IN_PROGRESS';
    if (activeTab === 'Closed') return i.status === 'CLOSED';
    return true;
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
              Inspections · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Mine Oversight, Internal Audit Scheduling, and Statutory Regulatory Roster
          </div>
        </div>

        {/* Action Controls matching wireframe: [+ Schedule Inspection] [Filter] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={handleCreateInspection}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ Schedule Inspection]</span>
          </button>

          <button
            type="button"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded transition"
          >
            [Filter]
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Filter Tabs matching wireframe: [All] [Internal] [Regulatory] [Scheduled] [In Progress] [Closed] */}
        <div className="p-3.5 bg-slate-100 flex items-center gap-2 flex-wrap text-xs">
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

        {/* Inspections List matching wireframe */}
        <div className="divide-y divide-slate-300">
          {filteredInspections.map((insp) => {
            const isRegulatory = insp.type === 'REGULATORY';
            const isInProgress = insp.status === 'IN_PROGRESS';

            return (
              <div key={insp.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition">
                {/* Row 1: ID, TYPE, STATUS, AUTHORITY, DATE */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isInProgress ? 'bg-amber-500' : 'bg-blue-600'
                      }`}
                    />
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {insp.id}
                    </span>
                    <span className="font-mono font-bold text-[#8B0000]">
                      {insp.type}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {insp.status}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-slate-800">
                      {insp.authority}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-600">
                      {insp.date}
                    </span>
                  </div>
                </div>

                {/* Row 2: Team Roster & Scope */}
                <div className="pl-4.5 space-y-1">
                  <div className="text-slate-700">
                    Scope: <span className="font-medium text-slate-900">{insp.scope}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] font-mono">
                    Team: {insp.team.join(', ')}
                  </div>
                </div>

                {/* Row 3: Actions matching wireframe: [Reassign] [View →] */}
                <div className="flex items-center justify-end gap-2 pl-4.5 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReassignModalInspection(insp)}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded transition"
                  >
                    [Reassign]
                  </button>

                  <Link
                    href="/field/inspections/INS-2026-0881"
                    className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs"
                  >
                    [View →]
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>CMR 2017 Reg. 27 Statutory Inspection Oversight</span>
          <span className="font-mono text-slate-500">DGMS Bilaspur Region</span>
        </div>

      </div>

      {/* Reassign Team Modal */}
      {reassignModalInspection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-3.5 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900">
                Reassign Team: {reassignModalInspection.id}
              </div>
              <button
                type="button"
                onClick={() => setReassignModalInspection(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div className="text-slate-500">Current Assigned Team:</div>
              <div className="space-y-1 font-mono text-[11px] bg-slate-50 p-2 border border-slate-200 rounded">
                {reassignModalInspection.team.map((t, idx) => (
                  <div key={idx}>• {t}</div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Add / Replace Official:
                </label>
                <input
                  type="text"
                  value={newTeamMember}
                  onChange={(e) => setNewTeamMember(e.target.value)}
                  placeholder="e.g. Er. Rajesh Verma (Safety Officer)"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignModalInspection(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassignSubmit}
                className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
              >
                [Confirm Roster Update]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
