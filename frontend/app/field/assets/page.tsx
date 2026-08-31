'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Eye,
  Plus,
  Filter,
  ChevronDown,
  X,
  ShieldAlert
} from 'lucide-react';

interface AssetRecord {
  id: string;
  name: string;
  category: 'HEMM' | 'Electrical' | 'Fire Equipment';
  status: 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  model: string;
  regCert: string;
  certExpiry: string;
  lastInspection: string;
  hoursRun: number;
}

const ASSET_RECORDS: Record<string, AssetRecord> = {
  'DMP-041': {
    id: 'DMP-041',
    name: 'CAT 777D Heavy Rear Dumper (100 Ton)',
    category: 'HEMM',
    status: 'OUT_OF_SERVICE',
    model: 'Caterpillar 777D (2021)',
    regCert: 'CMR Reg. 181(3) Statutory Fitness',
    certExpiry: 'Expired on 28 Aug 2026',
    lastInspection: '15 Jul 2026 (Passed)',
    hoursRun: 14280
  },
  'EX-007': {
    id: 'EX-007',
    name: 'Komatsu PC3000-6 Hydraulic Shovel',
    category: 'HEMM',
    status: 'OPERATIONAL',
    model: 'Komatsu PC3000 (15 m³ Bucket)',
    regCert: 'DGMS Periodic Mechanical Fitness',
    certExpiry: 'Due 15 Sep 2026',
    lastInspection: '15 Sep 2025 (Annual)',
    hoursRun: 18940
  }
};

const TABS = ['All Assets', 'HEMM', 'Electrical', 'Fire Equipment', 'Out of Service'] as const;

export default function AssetComplianceDashboardPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All Assets');
  const [selectedAssetModal, setSelectedAssetModal] = useState<AssetRecord | null>(null);
  const [observationModal, setObservationModal] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [outOfServiceFlagged, setOutOfServiceFlagged] = useState(false);

  const handleRaiseFinding = (assetId: string) => {
    alert(`Opening DGMS Finding Form pre-linked to Asset: ${assetId} (Reg. 181(3) Statutory Non-Compliance).`);
  };

  const handleScheduleInspection = () => {
    setScheduledSuccess(true);
    alert('Inspection request dispatched to DGMS Mechanical Inspection Wing (POST /inspection-requests).');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-slate-700" />
            <span>Heavy Machinery & Engineering Maintenance</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Equipment & Assets · Gevra OCP
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            HEMM Fleet Monitoring · DGMS Reg. 181/182 Mechanical Approvals · Out-of-Service Dockets
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
          <Link
            href="/field/assets/findings"
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded transition"
          >
            [⚠ Asset Findings Registry]
          </Link>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: FLEET FILTER TABS matching wireframe */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
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

          <button
            type="button"
            className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded flex items-center gap-1 text-xs"
          >
            <span>[Filter ▼]</span>
          </button>
        </div>

        {/* SECTION 2: HEMM FLEET STATUS matching wireframe */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-slate-700" />
            <span>HEMM FLEET STATUS</span>
          </div>

          <div className="space-y-1.5 text-slate-800 font-mono">
            <div className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 font-sans">Dumpers: </span>
                <span className="text-emerald-700 font-bold">62 operational</span> · <span className="text-amber-800">3 in maintenance</span> · <span className="text-red-700 font-bold">1 out of service</span>
              </div>
              <span className="text-[11px] text-slate-500 font-sans">Total: 66</span>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 font-sans">Excavators: </span>
                <span className="text-emerald-700 font-bold">9 operational</span> · <span className="text-slate-600">0 in maintenance</span>
              </div>
              <span className="text-[11px] text-slate-500 font-sans">Total: 9</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: COMPLIANCE FLAGS matching wireframe */}
        <div className="p-4 space-y-2.5 bg-red-50/20">
          <div className="font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#8B0000]" />
            <span>COMPLIANCE FLAGS</span>
          </div>

          <div className="space-y-2">
            {/* Flag 1: Dumper DMP-041 */}
            <div className="p-3 bg-white border border-red-300 rounded space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span className="font-bold text-slate-900">
                  Dumper DMP-041 — Reg. 181(3) certificate expired
                </span>
                <span className="text-[11px] text-red-700 font-mono bg-red-50 px-1.5 py-0.2 rounded border border-red-200 font-bold">
                  [EXPIRED 28 AUG]
                </span>
              </div>

              <div className="flex items-center gap-2 pl-4.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleRaiseFinding('DMP-041')}
                  className="px-2.5 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs"
                >
                  [Raise finding]
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAssetModal(ASSET_RECORDS['DMP-041'])}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [View asset record]
                </button>
              </div>
            </div>

            {/* Flag 2: Excavator EX-007 */}
            <div className="p-3 bg-white border border-amber-300 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-900">
                  Excavator EX-007 — Annual inspection due 15 Sep
                </span>
                <span className="text-[11px] text-amber-800 font-mono bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  (Due in 15 days)
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {scheduledSuccess ? (
                  <span className="text-emerald-700 font-bold text-xs">[Scheduled ✓]</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleScheduleInspection}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-[#8B0000] rounded transition"
                  >
                    [Schedule →]
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedAssetModal(ASSET_RECORDS['EX-007'])}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [View record]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: RECENT OBSERVATIONS matching wireframe */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-slate-900 uppercase tracking-wider">
              RECENT OBSERVATIONS
            </div>

            <button
              type="button"
              onClick={() => setObservationModal(true)}
              className="px-2.5 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>[+ Record observation]</span>
            </button>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded bg-white">
            <div className="p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900">
                  • Haul road chainage 1.4km — berm erosion
                </span>
                <span className="text-slate-500 text-[11px]">
                  (Berm height reduced below 2m wheel diameter rule)
                </span>
              </div>

              <Link
                href="/field/findings"
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition shrink-0"
              >
                [View]
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Circular No. 02/2021 — HEMM Safety & Pre-Shift Audit</span>
          <span className="font-mono text-slate-500">DGMS Mechanical Wing</span>
        </div>

      </div>

      {/* Asset Record Modal */}
      {selectedAssetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#8B0000]" />
                <span>Asset Record: {selectedAssetModal.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssetModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div>
                <span className="text-slate-500">Description: </span>
                <span className="font-bold">{selectedAssetModal.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Model / Make: </span>
                <span className="font-mono">{selectedAssetModal.model}</span>
              </div>
              <div>
                <span className="text-slate-500">Statutory Certificate: </span>
                <span className="font-mono font-semibold">{selectedAssetModal.regCert}</span>
              </div>
              <div>
                <span className="text-slate-500">Validity Status: </span>
                <span className="font-bold text-red-700">{selectedAssetModal.certExpiry}</span>
              </div>
              <div>
                <span className="text-slate-500">Cumulative Operating Hours: </span>
                <span className="font-mono">{selectedAssetModal.hoursRun} hrs</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setOutOfServiceFlagged(true);
                  alert(`Asset ${selectedAssetModal.id} officially flagged OUT_OF_SERVICE under CMR Reg. 181.`);
                  setSelectedAssetModal(null);
                }}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded transition shadow-xs"
              >
                [Take Out of Service]
              </button>

              <button
                type="button"
                onClick={() => setSelectedAssetModal(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                [Close]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Observation Modal */}
      {observationModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900">
                + Record Engineering / HEMM Observation
              </div>
              <button
                type="button"
                onClick={() => setObservationModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Equipment / Pit Location:</label>
                <input
                  type="text"
                  defaultValue="Dumper DMP-041 / Ramp 4"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observation Summary:</label>
                <textarea
                  rows={3}
                  defaultValue="Hydraulic steering pump high temperature warning observed during gradient haulage."
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setObservationModal(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setObservationModal(false);
                  alert('Engineering observation recorded and synced with field supervisor log.');
                }}
                className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
              >
                [Submit Observation]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
