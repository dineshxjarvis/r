'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  ArrowRight,
  Truck,
  Scale,
  Calendar,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

interface ProductionPeriod {
  id: string;
  period_code: string;
  mine_name: string;
  state: 'DRAFT' | 'CUTOFF_REACHED' | 'APPROVED' | 'PUBLISHED';
  coal_despatched_tonnes: number;
  ob_removed_bcm: number;
  grade_code: string;
  approved_capacity_mtpa: number;
  ytd_cumulative_mtpa: number;
  discrepancy_count: number;
  starts_at: string;
  ends_at: string;
  version: number;
}

interface DiscrepancyItem {
  id: string;
  discrepancy_code: string;
  category: 'WEIGHBRIDGE_VS_CLAIMED' | 'BELT_SCALE_MISMATCH' | 'STOCKPILE_VARIANCE';
  claimed_tonnes: number;
  measured_tonnes: number;
  variance_pct: number;
  status: 'OPEN' | 'RESOLVED' | 'UNDER_REVIEW';
  location: string;
  identified_at: string;
  source_device: string;
}

const MOCK_PERIOD: ProductionPeriod = {
  id: 'prod_per_01HZY88A9B0C1D2E3F4G5H6J70',
  period_code: 'AUG-2026',
  mine_name: 'Gevra OCP (SECL)',
  state: 'CUTOFF_REACHED',
  coal_despatched_tonnes: 4350200,
  ob_removed_bcm: 12850000,
  grade_code: 'G-11 Non-Coking',
  approved_capacity_mtpa: 70.0,
  ytd_cumulative_mtpa: 28.4,
  discrepancy_count: 1,
  starts_at: '2026-08-01T00:00:00Z',
  ends_at: '2026-08-31T23:59:59Z',
  version: 4
};

const MOCK_DISCREPANCIES: DiscrepancyItem[] = [
  {
    id: 'pdis_01HZY99B0C1D2E3F4G5H6J7K80',
    discrepancy_code: 'DISC-2026-08-041',
    category: 'WEIGHBRIDGE_VS_CLAIMED',
    claimed_tonnes: 142000,
    measured_tonnes: 138650,
    variance_pct: -2.36,
    status: 'OPEN',
    location: 'Silo Weighbridge #3 (East In-Pit Crusher)',
    identified_at: '2026-08-28T14:30:00Z',
    source_device: 'WB-03 (Calibration Valid)'
  }
];

export default function ProductionPage() {
  const [period, setPeriod] = useState<ProductionPeriod>(MOCK_PERIOD);
  const [discrepancies, setDiscrepancies] = useState<DiscrepancyItem[]>(MOCK_DISCREPANCIES);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<DiscrepancyItem | null>(null);
  const [resolutionReason, setResolutionReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const capacityUtilizationPct = ((period.ytd_cumulative_mtpa / period.approved_capacity_mtpa) * 100).toFixed(1);

  const handleApprovePeriod = () => {
    setPeriod(prev => ({ ...prev, state: 'APPROVED', version: prev.version + 1 }));
    setActionSuccess('Production Period Aug-2026 approved and published to verified statutory ledger (POST /production-periods/actions {action:"APPROVE"})');
    setTimeout(() => setActionSuccess(null), 6000);
  };

  const handleCompileReturn = () => {
    setActionSuccess('Statutory Form C Return compilation triggered via POST /report-instances/actions {action:"COMPILE"}. Artifact link generated.');
    setTimeout(() => setActionSuccess(null), 6000);
  };

  const handleResolveDiscrepancy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiscrepancy) return;
    setDiscrepancies(prev =>
      prev.map(d => (d.id === selectedDiscrepancy.id ? { ...d, status: 'RESOLVED' } : d))
    );
    setPeriod(prev => ({ ...prev, discrepancy_count: Math.max(0, prev.discrepancy_count - 1) }));
    setSelectedDiscrepancy(null);
    setActionSuccess(`Discrepancy ${selectedDiscrepancy.discrepancy_code} marked RESOLVED with audit reason logged.`);
    setTimeout(() => setActionSuccess(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §2.3 Operations & Production Management
            </span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              API: /production-periods & /production-discrepancies
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Production Returns & Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-1">
            {period.mine_name} · Statutory Period: <span className="font-semibold text-slate-700">{period.period_code}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCompileReturn}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors border border-slate-300"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Compile Statutory Return</span>
          </button>
          {period.state !== 'APPROVED' && period.state !== 'PUBLISHED' && (
            <button
              onClick={handleApprovePeriod}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Lock Period</span>
            </button>
          )}
        </div>
      </div>

      {/* Success banner */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Overview Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Coal Despatched (Month)</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {(period.coal_despatched_tonnes / 1000000).toFixed(3)} <span className="text-sm font-medium text-slate-500">Mt</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Grade: {period.grade_code}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">OB Removed (Month)</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {(period.ob_removed_bcm / 1000000).toFixed(2)} <span className="text-sm font-medium text-slate-500">M Cu.m</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Strip Ratio: 2.95 BCM/t</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">EC Capacity Ceiling</span>
            <Scale className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {period.ytd_cumulative_mtpa} / {period.approved_capacity_mtpa} <span className="text-sm font-medium text-slate-500">Mtpa</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, Number(capacityUtilizationPct))}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{capacityUtilizationPct}% YTD within approved clearance</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Period State</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                period.state === 'APPROVED' || period.state === 'PUBLISHED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {period.state.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {period.discrepancy_count === 0 ? '✅ 0 Discrepancy flags' : `🔴 ${period.discrepancy_count} Discrepancy to clear`}
          </p>
        </div>
      </div>

      {/* Discrepancies & Reconciliation Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span>Weighbridge & Production Reconciliation Queue</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated cross-check of declared shift extractions against physical belt-scale and weighbridge measurements.
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
            GET /production-discrepancies
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {discrepancies.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">All Weighbridge Discrepancies Resolved</p>
              <p className="text-xs text-slate-400">All claimed vs measured variance are within ±1.5% statutory tolerance.</p>
            </div>
          ) : (
            discrepancies.map(item => (
              <div key={item.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{item.discrepancy_code}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        item.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-500">({item.category.replace(/_/g, ' ')})</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{item.location}</p>
                  <p className="text-xs text-slate-500">
                    Claimed: <span className="font-semibold text-slate-700">{item.claimed_tonnes.toLocaleString()} t</span> ·
                    Sensor Measured: <span className="font-semibold text-slate-700">{item.measured_tonnes.toLocaleString()} t</span> ·
                    Variance: <span className="font-bold text-red-600">{item.variance_pct}%</span> ({item.source_device})
                  </p>
                </div>
                <div>
                  {item.status !== 'RESOLVED' ? (
                    <button
                      onClick={() => setSelectedDiscrepancy(item)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      Investigate & Resolve →
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Reconciled
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approved Facts View (Pillar 5 Honest Reproducible Ledger) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Published Approved Facts & Lineage</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reproducible numbers published under immutable hash for statutory reporting (CCO / Ministry of Coal).
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1 rounded border border-slate-200">
            GET /production-periods?view=approved_facts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
              <tr>
                <th className="p-3">Accounting Boundary</th>
                <th className="p-3">Material Definition</th>
                <th className="p-3">Net Quantity (Tonnes)</th>
                <th className="p-3">Lineage Basis</th>
                <th className="p-3">Verification Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="p-3 font-medium text-slate-900">Gevra OpenCast Main Pit Face</td>
                <td className="p-3">ROM Coal (G-11 Non-Coking)</td>
                <td className="p-3 font-mono font-bold text-slate-900">4,350,200.000 t</td>
                <td className="p-3">Weighbridge In-Pit Certified (Basis: WET)</td>
                <td className="p-3 font-mono text-[11px] text-slate-500">sha256:7f8a9...b10c</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-slate-900">East Waste Dump Bench 4</td>
                <td className="p-3">Overburden Sandstone/Shale</td>
                <td className="p-3 font-mono font-bold text-slate-900">12,850,000.000 BCM</td>
                <td className="p-3">Drone Photogrammetry Survey v4</td>
                <td className="p-3 font-mono text-[11px] text-slate-500">sha256:3e1c2...99ad</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancy Resolution Modal */}
      {selectedDiscrepancy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Reconcile Discrepancy {selectedDiscrepancy.discrepancy_code}</span>
              </h3>
              <button
                onClick={() => setSelectedDiscrepancy(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
              <div><span className="font-semibold text-slate-700">Location:</span> {selectedDiscrepancy.location}</div>
              <div><span className="font-semibold text-slate-700">Claimed:</span> {selectedDiscrepancy.claimed_tonnes.toLocaleString()} t</div>
              <div><span className="font-semibold text-slate-700">Measured:</span> {selectedDiscrepancy.measured_tonnes.toLocaleString()} t</div>
              <div><span className="font-semibold text-slate-700">Variance:</span> {selectedDiscrepancy.variance_pct}%</div>
            </div>

            <form onSubmit={handleResolveDiscrepancy} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statutory Explanation / Resolution Reason (Mandatory)
                </label>
                <textarea
                  required
                  value={resolutionReason}
                  onChange={e => setResolutionReason(e.target.value)}
                  placeholder="e.g. Moisture deduction adjusted after rain event per CMR Reg. 182 protocol..."
                  rows={3}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDiscrepancy(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
                >
                  Confirm & Post to Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
