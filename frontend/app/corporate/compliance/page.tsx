'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  Download,
  Shield,
  Leaf,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface MineComplianceMatrix {
  mine_id: string;
  mine_name: string;
  subsidiary: string;
  safety: { total: number; satisfied: number; overdue: number; status: 'GREEN' | 'AMBER' | 'RED' | 'UNMEASURED' };
  environment: { total: number; satisfied: number; overdue: number; status: 'GREEN' | 'AMBER' | 'RED' | 'UNMEASURED' };
  production: { total: number; satisfied: number; overdue: number; status: 'GREEN' | 'AMBER' | 'RED' | 'UNMEASURED' };
  labour: { total: number; satisfied: number; overdue: number; status: 'GREEN' | 'AMBER' | 'RED' | 'UNMEASURED' };
}

const MOCK_MATRIX: MineComplianceMatrix[] = [
  {
    mine_id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K0',
    mine_name: 'Gevra OCP',
    subsidiary: 'SECL (Korba Area)',
    safety: { total: 22, satisfied: 18, overdue: 1, status: 'AMBER' },
    environment: { total: 12, satisfied: 8, overdue: 2, status: 'RED' },
    production: { total: 6, satisfied: 6, overdue: 0, status: 'GREEN' },
    labour: { total: 12, satisfied: 12, overdue: 0, status: 'GREEN' }
  },
  {
    mine_id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K1',
    mine_name: 'Dipka OCP',
    subsidiary: 'SECL (Korba Area)',
    safety: { total: 21, satisfied: 20, overdue: 0, status: 'GREEN' },
    environment: { total: 11, satisfied: 10, overdue: 0, status: 'GREEN' },
    production: { total: 6, satisfied: 6, overdue: 0, status: 'GREEN' },
    labour: { total: 11, satisfied: 11, overdue: 0, status: 'GREEN' }
  },
  {
    mine_id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K2',
    mine_name: 'Kusmunda OCP',
    subsidiary: 'SECL (Korba Area)',
    safety: { total: 20, satisfied: 17, overdue: 1, status: 'AMBER' },
    environment: { total: 10, satisfied: 8, overdue: 1, status: 'AMBER' },
    production: { total: 6, satisfied: 6, overdue: 0, status: 'GREEN' },
    labour: { total: 10, satisfied: 9, overdue: 0, status: 'GREEN' }
  },
  {
    mine_id: 'mine_01HZY7A8B9C0D1E2F3G4H5J6K3',
    mine_name: 'North Tisra Underground',
    subsidiary: 'BCCL (Jharia Area)',
    safety: { total: 0, satisfied: 0, overdue: 0, status: 'UNMEASURED' },
    environment: { total: 0, satisfied: 0, overdue: 0, status: 'UNMEASURED' },
    production: { total: 0, satisfied: 0, overdue: 0, status: 'UNMEASURED' },
    labour: { total: 0, satisfied: 0, overdue: 0, status: 'UNMEASURED' }
  }
];

export default function CorporateCompliancePage() {
  const [matrix] = useState<MineComplianceMatrix[]>(MOCK_MATRIX);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleExport = () => {
    setActionSuccess('Corporate Compliance Portfolio PDF Report generated via POST /report-instances/{id}/actions {action:"COMPILE"}');
    setTimeout(() => setActionSuccess(null), 5000);
  };

  const renderBadge = (cell: { total: number; satisfied: number; overdue: number; status: string }) => {
    if (cell.status === 'UNMEASURED') {
      return <span className="text-slate-400 font-mono text-xs italic">— not measured —</span>;
    }
    const color =
      cell.status === 'GREEN'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : cell.status === 'AMBER'
        ? 'bg-amber-50 text-amber-800 border-amber-200'
        : 'bg-red-50 text-red-800 border-red-200';

    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${color}`}>
        <span>{cell.satisfied}/{cell.total}</span>
        {cell.overdue > 0 && <span className="text-red-600 font-bold">({cell.overdue} overdue)</span>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Screen 5 · Portfolio Drilldown
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /obligation-instances?filter[org_unit_id]=...&group_by=mine,domain,status
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Portfolio Matrix</h1>
          <p className="text-sm text-slate-500 mt-1">
            Korba & Jharia Operational Areas · Multi-Domain Compliance Heatmap
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors border border-slate-300 shadow-sm"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Compliance Matrix</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Operating Mines × Statutory Domains</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click cell to drill down into obligation records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-4">Operating Mine</th>
                <th className="p-4">
                  <div className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-600" /> Safety (CMR 2017)</div>
                </th>
                <th className="p-4">
                  <div className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-emerald-600" /> Environment (EC/Consent)</div>
                </th>
                <th className="p-4">
                  <div className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Production (Returns)</div>
                </th>
                <th className="p-4">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-purple-600" /> Labour & Welfare</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {matrix.map(m => (
                <tr key={m.mine_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4 font-bold text-slate-900 text-sm">
                    {m.mine_name}
                    <div className="text-xs text-slate-400 font-normal">{m.subsidiary}</div>
                  </td>
                  <td className="p-4 cursor-pointer">{renderBadge(m.safety)}</td>
                  <td className="p-4 cursor-pointer">{renderBadge(m.environment)}</td>
                  <td className="p-4 cursor-pointer">{renderBadge(m.production)}</td>
                  <td className="p-4 cursor-pointer">{renderBadge(m.labour)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
