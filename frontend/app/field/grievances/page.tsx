'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft,
  User,
  AlertCircle
} from 'lucide-react';

interface GrievanceItem {
  id: string;
  category: 'Safety Gear & PPE' | 'Wages & Overtime' | 'Canteen & Sanitation' | 'Medical / First Aid';
  complainantType: 'Departmental Worker' | 'Contractor Labour' | 'Shift Official';
  subject: string;
  location: string;
  raisedDate: string;
  status: 'OPEN' | 'IN_ENQUIRY' | 'RESOLVED';
  assignee: string;
  timeline: { step: string; date: string; note: string }[];
}

const INITIAL_GRIEVANCES: GrievanceItem[] = [
  {
    id: 'GRV-2026-081',
    category: 'Safety Gear & PPE',
    complainantType: 'Contractor Labour',
    subject: 'Delayed issuance of heavy-duty safety boots (Size 9/10) for Bench 7 North team',
    location: 'Gevra OCP Central Stores',
    raisedDate: '26 Aug 2026',
    status: 'IN_ENQUIRY',
    assignee: 'Shri B. S. Chawla (Labour Officer)',
    timeline: [
      { step: 'Logged', date: '26 Aug 2026', note: 'Intake recorded via pit welfare committee slip' },
      { step: 'Under Enquiry', date: '28 Aug 2026', note: 'Procurement requisition verified with stores officer' },
      { step: 'Resolution Due', date: '02 Sep 2026', note: 'Stock batch expected at store' }
    ]
  },
  {
    id: 'GRV-2026-074',
    category: 'Canteen & Sanitation',
    complainantType: 'Departmental Worker',
    subject: 'Potable drinking water cooler filter replacement required at Haulage Rest Shelter #2',
    location: 'Ramp 4 Shelter',
    raisedDate: '19 Aug 2026',
    status: 'RESOLVED',
    assignee: 'Pit Safety & Welfare Committee',
    timeline: [
      { step: 'Logged', date: '19 Aug 2026', note: 'Grievance submitted' },
      { step: 'Actioned', date: '22 Aug 2026', note: 'Water RO filter replacement installed & tested' },
      { step: 'Closed', date: '23 Aug 2026', note: 'Complainant sign-off received' }
    ]
  }
];

const TABS = ['All', 'OPEN', 'IN_ENQUIRY', 'RESOLVED'] as const;

export default function GrievanceIntakePage() {
  const [grievances, setGrievances] = useState<GrievanceItem[]>(INITIAL_GRIEVANCES);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [selectedGrievance, setSelectedGrievance] = useState<GrievanceItem | null>(null);

  const handleNewGrievance = () => {
    const subj = prompt('Enter worker grievance summary:');
    if (subj) {
      const newGrv: GrievanceItem = {
        id: `GRV-2026-${Math.floor(Math.random() * 900 + 100)}`,
        category: 'Safety Gear & PPE',
        complainantType: 'Departmental Worker',
        subject: subj,
        location: 'Gevra OCP Pit',
        raisedDate: '31 Aug 2026',
        status: 'OPEN',
        assignee: 'Labour Officer',
        timeline: [
          { step: 'Logged', date: '31 Aug 2026', note: 'Recorded by Labour Officer' }
        ]
      };
      setGrievances(prev => [newGrv, ...prev]);
      alert(`Grievance #${newGrv.id} successfully recorded in statutory register.`);
    }
  };

  const filteredGrievances = grievances.filter(g => {
    if (activeTab !== 'All' && g.status !== activeTab) return false;
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-red-700" />
            <span>Worker Welfare & Dispute Redressal</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Grievance Intake & Statutory Redressal · Gevra OCP
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Industrial Disputes Act 1947 · Mine Pit Welfare Committee Channel
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewGrievance}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ New Grievance]</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        
        {/* Filter Tabs */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 flex items-center gap-2 flex-wrap text-xs">
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

        {/* Grievance Items List */}
        <div className="divide-y divide-slate-300">
          {filteredGrievances.map((g) => {
            const isOpen = g.status === 'OPEN';
            const isEnquiry = g.status === 'IN_ENQUIRY';
            const isResolved = g.status === 'RESOLVED';

            return (
              <div
                key={g.id}
                onClick={() => setSelectedGrievance(selectedGrievance?.id === g.id ? null : g)}
                className="p-4 hover:bg-slate-50/80 transition cursor-pointer text-xs space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isOpen ? 'bg-red-600' : isEnquiry ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                    />
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {g.id}
                    </span>
                    <span className="font-bold text-slate-700">
                      {g.category}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 font-medium">
                      {g.complainantType}
                    </span>
                  </div>

                  <span
                    className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                      isOpen
                        ? 'bg-red-100 text-red-900 border-red-300'
                        : isEnquiry
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    [{g.status}]
                  </span>
                </div>

                <div className="pl-4.5 text-slate-800 font-medium">
                  {g.subject}
                </div>

                <div className="pl-4.5 text-slate-500 text-[11px] flex items-center gap-3">
                  <span>Location: {g.location}</span>
                  <span>·</span>
                  <span>Raised: {g.raisedDate}</span>
                  <span>·</span>
                  <span>Assignee: {g.assignee}</span>
                </div>

                {/* Resolution Timeline Details on Row Click */}
                {selectedGrievance?.id === g.id && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded space-y-2 font-mono text-[11px] animate-in fade-in duration-150">
                    <div className="font-sans font-bold text-slate-900 text-xs">
                      Statutory Resolution Timeline:
                    </div>
                    <div className="space-y-1.5 pl-2 border-l-2 border-[#8B0000]">
                      {g.timeline.map((step, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="font-bold text-slate-800">
                            • {step.step} ({step.date})
                          </div>
                          <div className="text-slate-600 pl-3">
                            {step.note}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Official Mine Labour Grievance & Welfare Log</span>
          <span className="font-mono text-slate-500">DGMS & CIL Welfare Framework</span>
        </div>
      </div>
    </div>
  );
}
