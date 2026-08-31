'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Shield,
  Leaf,
  Users,
  TrendingUp,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

interface CorporateObligation {
  id: string;
  code: string;
  domain: string;
  title: string;
  source_act: string;
  active_mines_count: number;
  satisfied_count: number;
  overdue_count: number;
}

const MOCK_CORP_OBLIGATIONS: CorporateObligation[] = [
  {
    id: 'cobl_01',
    code: 'CMR-2017-REG-106',
    domain: 'SAFETY',
    title: 'Haul Road Safety Berms & Edge Protection Standards',
    source_act: 'Coal Mines Regulations 2017',
    active_mines_count: 3,
    satisfied_count: 2,
    overdue_count: 1
  },
  {
    id: 'cobl_02',
    code: 'CMR-2017-REG-40',
    domain: 'LABOUR',
    title: 'Biometric/Tag Attendance Registers & Statutory Form B Muster',
    source_act: 'CMR 2017 / Mines Act 1952',
    active_mines_count: 3,
    satisfied_count: 3,
    overdue_count: 0
  },
  {
    id: 'cobl_03',
    code: 'EC-COND-PLANTATION',
    domain: 'ENVIRONMENT',
    title: 'Compensatory Afforestation & Dump Slope Bio-Reclamation',
    source_act: 'MoEFCC Environmental Clearance Conditions',
    active_mines_count: 3,
    satisfied_count: 1,
    overdue_count: 2
  },
  {
    id: 'cobl_04',
    code: 'CCO-FORM-C-DESPATCH',
    domain: 'PRODUCTION',
    title: 'Monthly Form C Coal Production, Despatch & Grade Return',
    source_act: 'Colliery Control Rules 2004',
    active_mines_count: 3,
    satisfied_count: 3,
    overdue_count: 0
  }
];

export default function CorporateObligationsPage() {
  const [obligations] = useState<CorporateObligation[]>(MOCK_CORP_OBLIGATIONS);
  const [search, setSearch] = useState('');

  const filtered = obligations.filter(
    o =>
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Screen 10 · Corporate Obligations Master
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /obligation-instances?filter[org_unit_id]=...
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Corporate Statutory Obligations Master</h1>
          <p className="text-sm text-slate-500 mt-1">
            Canonical repository of legal requirements applied across subsidiaries, areas, and operating mines.
          </p>
        </div>
      </div>

      {/* Obligations Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search master obligations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Standard Code & Title</th>
                <th className="p-3.5">Domain</th>
                <th className="p-3.5">Source Act / Rule</th>
                <th className="p-3.5">Mines in Scope</th>
                <th className="p-3.5">Satisfied Across Portfolio</th>
                <th className="p-3.5">Overdue Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 text-sm">{o.code}</div>
                    <div className="text-slate-600 text-xs mt-0.5">{o.title}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                      {o.domain}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-800">{o.source_act}</td>
                  <td className="p-3.5 font-bold text-slate-900">{o.active_mines_count} Mines</td>
                  <td className="p-3.5 font-semibold text-emerald-700">
                    {o.satisfied_count} of {o.active_mines_count} Satisfied
                  </td>
                  <td className="p-3.5">
                    {o.overdue_count > 0 ? (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                        {o.overdue_count} Overdue
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-semibold">0 Overdue</span>
                    )}
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
