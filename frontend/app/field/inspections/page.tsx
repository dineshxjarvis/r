'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Plus, Filter, Check } from 'lucide-react';

interface Inspection {
  id: string;
  type: 'REGULATORY' | 'INTERNAL';
  status: 'IN_PROGRESS' | 'SCHEDULED' | 'REPORT_ISSUED';
  dateText?: string;
  title?: string;
  location?: string;
  assignedText?: string;
  observationsCount?: number;
  findingsCount?: number;
  actionLabel: string;
  actionHref: string;
}

const INSPECTIONS: Inspection[] = [
  {
    id: 'INS-2024-0891',
    type: 'REGULATORY',
    status: 'IN_PROGRESS',
    dateText: '14 Aug 2026',
    title: 'DGMS Safety Inspection',
    location: 'Bench 7N, Section 3',
    observationsCount: 3,
    findingsCount: 1,
    actionLabel: 'Continue →',
    actionHref: '/field/inspections/INS-2024-0891'
  },
  {
    id: 'INS-2024-0876',
    type: 'INTERNAL',
    status: 'SCHEDULED',
    dateText: '07 Sep 2026',
    assignedText: 'Assigned: You + 2 others',
    actionLabel: 'View details →',
    actionHref: '/field/inspections/INS-2024-0876'
  },
  {
    id: 'INS-2024-0855',
    type: 'INTERNAL',
    status: 'REPORT_ISSUED',
    dateText: '15 Jul 2026',
    actionLabel: 'View report →',
    actionHref: '/field/inspections/INS-2024-0855'
  }
];

export default function InspectionsListPage() {
  const [selectedMine, setSelectedMine] = useState('Gevra OCP');
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Field Operations
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            F-02 — Inspections List
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Statutory & Internal mine safety inspection registry
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('Opening Request Inspection form...')}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ Request Inspection]</span>
          </button>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded flex items-center gap-1 transition"
          >
            <Filter className="w-3.5 h-3.5 text-slate-600" />
            <span>[Filter ▼]</span>
          </button>
        </div>
      </div>

      {/* Main Inspections Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        {/* Top Control Bar with Active Filters */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Filter:</span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono text-slate-800 font-medium">
              [Mine: {selectedMine}]
            </span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono text-slate-800 font-medium">
              [Status: {selectedStatus}]
            </span>
            <span className="bg-white border border-slate-300 px-2 py-0.5 rounded font-mono text-slate-800 font-medium">
              [Origin: {selectedOrigin}]
            </span>
          </div>

          <span className="text-slate-500 font-medium self-end sm:self-auto text-[11px]">
            Showing 3 of 3 records
          </span>
        </div>

        {/* Dropdown Filters Expandable */}
        {isFilterOpen && (
          <div className="p-3 bg-slate-50 border-b border-slate-300 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mine / Scope:</label>
              <select
                value={selectedMine}
                onChange={(e) => setSelectedMine(e.target.value)}
                className="w-full border border-slate-300 rounded p-1 bg-white"
              >
                <option value="Gevra OCP">Gevra OCP</option>
                <option value="Kusmunda OCP">Kusmunda OCP</option>
                <option value="Dipka OCP">Dipka OCP</option>
                <option value="All Mines">All Mines</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-slate-300 rounded p-1 bg-white"
              >
                <option value="Active">Active</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="REPORT_ISSUED">REPORT_ISSUED</option>
                <option value="All">All</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Origin:</label>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full border border-slate-300 rounded p-1 bg-white"
              >
                <option value="All">All</option>
                <option value="REGULATORY">REGULATORY (DGMS)</option>
                <option value="INTERNAL">INTERNAL (Mine Safety)</option>
              </select>
            </div>
          </div>
        )}

        {/* List of Inspections matching wireframe */}
        <div className="divide-y divide-slate-300">
          {INSPECTIONS.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50/80 transition space-y-2 text-xs">
              {/* Header: ID + TYPE + STATUS */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {item.id}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-700">
                    {item.type} · {item.status} {item.status !== 'IN_PROGRESS' && item.dateText && `· ${item.dateText}`}
                  </span>
                </div>
              </div>

              {/* Subtitle / Details */}
              {item.title && (
                <div className="text-slate-700 font-medium">
                  {item.title} · {item.dateText} · {item.location}
                </div>
              )}

              {item.assignedText && (
                <div className="text-slate-700 font-medium">
                  {item.assignedText}
                </div>
              )}

              {/* Bottom Row: Observations, Findings, Action Button */}
              <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {item.observationsCount !== undefined && (
                    <span className="bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded font-medium">
                      [{item.observationsCount} observations]
                    </span>
                  )}
                  {item.findingsCount !== undefined && (
                    <span className="bg-red-50 border border-red-200 text-red-800 px-2 py-0.5 rounded font-medium">
                      [{item.findingsCount} finding]
                    </span>
                  )}
                </div>

                <Link
                  href={item.actionHref}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-900 rounded transition"
                >
                  [{item.actionLabel}]
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Form B Inspection Register</span>
          <span className="font-mono text-slate-500">SECL Korba Area</span>
        </div>
      </div>
    </div>
  );
}
