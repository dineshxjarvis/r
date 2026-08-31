'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  X,
  Send,
  Building2,
  Share2
} from 'lucide-react';

interface StatutoryInstrument {
  id: string;
  title: string;
  type: 'CIRCULAR' | 'SECTION_22_ORDER' | 'SPECIAL_DIRECTIVE';
  issuedDate: string;
  applicableMinesCount: number;
  scope: string;
  propagatedMines: { mineName: string; obligationRef: string; status: string }[];
}

const INITIAL_INSTRUMENTS: StatutoryInstrument[] = [
  {
    id: 'CIRCULAR-2026-14',
    title: 'Circular DGMS/2026/14 — Ventilation standards clarification',
    type: 'CIRCULAR',
    issuedDate: '10 Aug 2026',
    applicableMinesCount: 12,
    scope: 'Mandatory minimum air quantity and auxiliary fan interlock specifications for opencast haulages.',
    propagatedMines: [
      { mineName: 'Gevra OCP', obligationRef: 'CMR-VENT-041', status: 'OBLIGATION MATERIALISED' },
      { mineName: 'Dipka OCP', obligationRef: 'CMR-VENT-041', status: 'OBLIGATION MATERIALISED' },
      { mineName: 'Kusmunda OCP', obligationRef: 'CMR-VENT-041', status: 'OBLIGATION MATERIALISED' },
      { mineName: 'Manikpur OCP', obligationRef: 'CMR-VENT-041', status: 'OBLIGATION MATERIALISED' }
    ]
  },
  {
    id: 'SEC22-2026-0084',
    title: 'Section 22 Order DGMS-2026-0084 — Gevra OCP',
    type: 'SECTION_22_ORDER',
    issuedDate: '18 Aug 2026',
    applicableMinesCount: 1,
    scope: 'Prohibitory order on highwall face mining until geotechnical berm reconstruction is attested.',
    propagatedMines: [
      { mineName: 'Gevra OCP', obligationRef: 'SEC22-RESTORE-01', status: 'ACTION PENDING' }
    ]
  }
];

export default function RegulatoryInstrumentsPage() {
  const [instruments, setInstruments] = useState<StatutoryInstrument[]>(INITIAL_INSTRUMENTS);
  const [selectedInstrument, setSelectedInstrument] = useState<StatutoryInstrument | null>(null);
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [orderTitle, setOrderTitle] = useState('');
  const [orderType, setOrderType] = useState<'CIRCULAR' | 'SECTION_22_ORDER'>('CIRCULAR');

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderTitle.trim()) return;

    const newInst: StatutoryInstrument = {
      id: `INST-${Date.now()}`,
      title: orderTitle,
      type: orderType,
      issuedDate: '31 Aug 2026',
      applicableMinesCount: orderType === 'CIRCULAR' ? 12 : 1,
      scope: 'Statutory directive issued under regulatory authority powers.',
      propagatedMines: [
        { mineName: 'Gevra OCP', obligationRef: `OBL-${Date.now()}`, status: 'SCHEDULED' },
        { mineName: 'Dipka OCP', obligationRef: `OBL-${Date.now()}`, status: 'SCHEDULED' }
      ]
    };
    setInstruments(prev => [newInst, ...prev]);
    alert(`Statutory order "${orderTitle}" published (POST /regulatory-instrument-versions). Obligations propagated to affected mine queues.`);
    setOrderTitle('');
    setNewOrderModal(false);
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
              Instruments & Orders · DGMS Dhanbad Region 2
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Official Promulgations, Section 22 Orders & Regulatory Directives with Multi-Mine Propagation
          </div>
        </div>

        {/* Action Controls matching wireframe: [+ New Order] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setNewOrderModal(true)}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ New Order]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Instruments List matching wireframe */}
        <div className="divide-y divide-slate-300">
          {instruments.map((inst) => (
            <div key={inst.id} className="p-4 space-y-2 hover:bg-slate-50/50 transition">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B0000] shrink-0" />
                  <span className="font-bold text-slate-900 text-xs">
                    {inst.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInstrument(inst)}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded text-xs transition"
                >
                  [View]
                </button>
              </div>

              <div className="pl-4.5 text-slate-600 text-xs">
                Issued {inst.issuedDate} · Applicable: <strong className="font-mono text-slate-900">{inst.applicableMinesCount} mines</strong>
              </div>

              <div className="pl-4.5 text-[11px] text-slate-500 font-mono">
                Scope: {inst.scope}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Gazette Registry & Statutory Promulgation Engine</span>
          <span className="font-mono text-slate-500">DGMS Zone 3</span>
        </div>

      </div>

      {/* View Instrument Propagation Modal matching wireframe */}
      {selectedInstrument && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-lg w-full p-5 space-y-3.5 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#8B0000]" />
                <span>Statutory Instrument Propagation Docket</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInstrument(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div className="font-bold text-slate-900">{selectedInstrument.title}</div>
              <div className="text-slate-600 text-[11px]">Issued: {selectedInstrument.issuedDate} · Applicable: {selectedInstrument.applicableMinesCount} mines</div>
              
              <div className="pt-2 font-bold text-slate-700">Propagated Mine Obligations:</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedInstrument.propagatedMines.map((m, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded flex items-center justify-between font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-slate-900">{m.mineName}</span>
                      <span className="text-slate-500 font-sans">({m.obligationRef})</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInstrument(null)}
                className="px-3 py-1.5 bg-[#8B0000] text-white font-bold rounded shadow-xs"
              >
                [Close]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      {newOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8B0000]" />
                <span>Issue Statutory Instrument / Order</span>
              </div>
              <button
                type="button"
                onClick={() => setNewOrderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Instrument Category:</label>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                >
                  <option value="CIRCULAR">Statutory Circular (Jurisdiction-Wide)</option>
                  <option value="SECTION_22_ORDER">Section 22 Prohibitory Order (Mine-Specific)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Order Title / Directive:</label>
                <input
                  type="text"
                  value={orderTitle}
                  onChange={(e) => setOrderTitle(e.target.value)}
                  placeholder="e.g. Circular DGMS/2026/15 — Monsoon Haul Road Sump Rules"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewOrderModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                >
                  [Promulgate Order]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
