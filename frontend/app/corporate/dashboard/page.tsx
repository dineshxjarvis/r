'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Info
} from 'lucide-react';

interface MineRollup {
  id: string;
  name: string;
  subsidiary: string;
  measured: boolean;
  compliance_score_pct: number | null;
  total_obligations: number | null;
  satisfied_obligations: number | null;
  overdue_obligations: number | null;
  active_findings_count: number;
  open_capas_count: number;
  freshness_status: 'CURRENT' | 'STALE' | 'OFFLINE';
  last_sync_at: string | null;
}

const MOCK_MINES_ROLLUP: MineRollup[] = [
  {
    id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K0',
    name: 'Gevra OCP',
    subsidiary: 'SECL (Korba Area)',
    measured: true,
    compliance_score_pct: 92.4,
    total_obligations: 46,
    satisfied_obligations: 42,
    overdue_obligations: 1,
    active_findings_count: 3,
    open_capas_count: 2,
    freshness_status: 'CURRENT',
    last_sync_at: '2026-08-31T11:45:00Z'
  },
  {
    id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K1',
    name: 'Dipka OCP',
    subsidiary: 'SECL (Korba Area)',
    measured: true,
    compliance_score_pct: 95.8,
    total_obligations: 48,
    satisfied_obligations: 46,
    overdue_obligations: 0,
    active_findings_count: 1,
    open_capas_count: 1,
    freshness_status: 'CURRENT',
    last_sync_at: '2026-08-31T10:30:00Z'
  },
  {
    id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K2',
    name: 'Kusmunda OCP',
    subsidiary: 'SECL (Korba Area)',
    measured: true,
    compliance_score_pct: 88.0,
    total_obligations: 42,
    satisfied_obligations: 37,
    overdue_obligations: 2,
    active_findings_count: 5,
    open_capas_count: 4,
    freshness_status: 'CURRENT',
    last_sync_at: '2026-08-31T09:15:00Z'
  },
  {
    id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K3',
    name: 'North Tisra Underground',
    subsidiary: 'BCCL (Jharia Area)',
    measured: false, // Novelty Pillar 5 Honest Uncertainty
    compliance_score_pct: null,
    total_obligations: null,
    satisfied_obligations: null,
    overdue_obligations: null,
    active_findings_count: 0,
    open_capas_count: 0,
    freshness_status: 'OFFLINE',
    last_sync_at: null
  }
];

export default function CorporateDashboardPage() {
  const [mines] = useState<MineRollup[]>(MOCK_MINES_ROLLUP);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState('ALL');

  const measuredMines = mines.filter(m => m.measured);
  const avgCompliance = (
    measuredMines.reduce((acc, m) => acc + (m.compliance_score_pct || 0), 0) / measuredMines.length
  ).toFixed(1);

  const totalOverdue = measuredMines.reduce((acc, m) => acc + (m.overdue_obligations || 0), 0);
  const totalFindings = mines.reduce((acc, m) => acc + m.active_findings_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Corporate Executive / Area GM
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /dashboard?view=measures&scope_type=ORGANIZATION_UNIT&group_by=mine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Coal India Corporate Portfolio Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            CIL Headquarters / Subsidiary Oversight · Operating Units: <span className="font-semibold text-slate-800">{mines.length} Mines</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/corporate/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Activity className="w-4 h-4" />
            <span>AI Process-Integrity Signals →</span>
          </Link>
        </div>
      </div>

      {/* Honest Uncertainty Warning Alert (Pillar 5) */}
      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 text-xs">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-900">Honest Uncertainty & Partial Scope Declaration (Novelty Pillar 5)</p>
          <p className="text-amber-800 mt-0.5 leading-relaxed">
            Portfolio measures reflect only connected mines with verified sensor or telemetry streams. Unmeasured or legacy manual mines (e.g. North Tisra) are displayed as <code className="font-bold bg-amber-100 px-1 py-0.5 rounded">— not measured —</code> and are explicitly excluded from aggregate percentage calculations rather than falsely reported as 0% or 100%.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Portfolio Compliance Rate</div>
          <div className="text-3xl font-extrabold text-emerald-600 mt-1">{avgCompliance}%</div>
          <p className="text-xs text-slate-400 mt-1">Across 3 active telemetry mines</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Active Regulatory Findings</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{totalFindings}</div>
          <p className="text-xs text-amber-600 mt-1">DGMS (2), SPCB (1), CCO (0)</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Overdue Obligations</div>
          <div className="text-3xl font-extrabold text-red-600 mt-1">{totalOverdue}</div>
          <p className="text-xs text-red-500 mt-1">Statutory deadline passed</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Unmeasured / Pending Setup</div>
          <div className="text-3xl font-extrabold text-slate-400 mt-1">1</div>
          <p className="text-xs text-slate-500 mt-1">Awaiting sensor gateway onboarding</p>
        </div>
      </div>

      {/* Mine-by-Mine Rollup Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Subsidiary & Mine Compliance Overview</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status rolled up from mine managers with automated freshness checking.
            </p>
          </div>
          <Link
            href="/corporate/compliance"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View Full Compliance Matrix</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Mine / Unit</th>
                <th className="p-3.5">Subsidiary Area</th>
                <th className="p-3.5">Compliance Score</th>
                <th className="p-3.5">Obligations Satisfied</th>
                <th className="p-3.5">Overdue Load</th>
                <th className="p-3.5">Active Findings</th>
                <th className="p-3.5">Telemetry Freshness</th>
                <th className="p-3.5 text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {mines.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">ID: {m.id.substring(0, 16)}...</div>
                  </td>
                  <td className="p-3.5 text-slate-600">{m.subsidiary}</td>
                  <td className="p-3.5">
                    {m.measured ? (
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{m.compliance_score_pct}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (m.compliance_score_pct || 0) >= 90
                                ? 'bg-emerald-500'
                                : (m.compliance_score_pct || 0) >= 75
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${m.compliance_score_pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="font-mono text-slate-400 font-semibold italic">— not measured —</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {m.measured ? (
                      <span className="font-semibold text-slate-800">
                        {m.satisfied_obligations} / {m.total_obligations}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    {m.measured ? (
                      <span
                        className={`font-bold ${
                          (m.overdue_obligations || 0) > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {m.overdue_obligations}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                      {m.active_findings_count} ({m.open_capas_count} CAPAs)
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        m.freshness_status === 'CURRENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          m.freshness_status === 'CURRENT' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      <span>{m.freshness_status}</span>
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/mine/dashboard"
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors inline-block"
                    >
                      Mine View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
