'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Shield,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CorporateFinding {
  id: string;
  finding_number: string;
  mine_name: string;
  severity: 'SEVERE' | 'SIGNIFICANT' | 'MODERATE' | 'MINOR';
  title: string;
  issuing_authority: string;
  issued_at: string;
  due_on: string;
  status: 'OPEN' | 'CAPA_ASSIGNED' | 'PENDING_VERIFICATION' | 'CLOSED';
  overdue: boolean;
  capas_count: number;
}

const MOCK_FINDINGS: CorporateFinding[] = [
  {
    id: 'find_01HZZ55F6G7H8J9K0T1M2N3040',
    finding_number: 'DGMS-2026-0441',
    mine_name: 'Gevra OCP',
    severity: 'SEVERE',
    title: 'Haul road edge protection below CMR 2017 Reg. 106(2)',
    issuing_authority: 'Directorate General of Mines Safety (DGMS)',
    issued_at: '2026-09-07',
    due_on: '2026-09-14',
    status: 'PENDING_VERIFICATION',
    overdue: false,
    capas_count: 1
  },
  {
    id: 'find_01HZZ55F6G7H8J9K0T1M2N3041',
    finding_number: 'SPCB-2026-0182',
    mine_name: 'Kusmunda OCP',
    severity: 'SEVERE',
    title: 'Effluent discharge from workshop oil-grease trap exceeding 10 mg/l',
    issuing_authority: 'State Pollution Control Board (SPCB)',
    issued_at: '2026-08-20',
    due_on: '2026-08-30',
    status: 'CAPA_ASSIGNED',
    overdue: true,
    capas_count: 2
  },
  {
    id: 'find_01HZZ55F6G7H8J9K0T1M2N3042',
    finding_number: 'DGMS-2026-0399',
    mine_name: 'Dipka OCP',
    severity: 'SIGNIFICANT',
    title: 'HEMM Operator Fatigue Monitoring Sensor Calibration Overdue',
    issuing_authority: 'DGMS Bilaspur Region',
    issued_at: '2026-08-25',
    due_on: '2026-09-05',
    status: 'CAPA_ASSIGNED',
    overdue: false,
    capas_count: 1
  }
];

export default function CorporateFindingsPage() {
  const [findings] = useState<CorporateFinding[]>(MOCK_FINDINGS);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  const filtered = findings.filter(
    f => selectedSeverity === 'ALL' || f.severity === selectedSeverity
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Screen 7 · Portfolio Findings
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /findings?filter[org_unit_id]=...&sort=attention
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Corporate Regulatory Findings Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Ranked by severity and attention score across all subsidiary operating mines.
          </p>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {['ALL', 'SEVERE', 'SIGNIFICANT', 'MODERATE'].map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Finding Ref & Title</th>
                <th className="p-3.5">Operating Mine</th>
                <th className="p-3.5">Issuing Authority</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 text-sm">{f.finding_number}</div>
                    <div className="text-slate-600 text-xs mt-0.5">{f.title}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-900">{f.mine_name}</td>
                  <td className="p-3.5 text-slate-600">{f.issuing_authority}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        f.severity === 'SEVERE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium">
                    <span className={f.overdue ? 'text-red-600 font-bold' : 'text-slate-800'}>
                      {f.due_on} {f.overdue && '(OVERDUE)'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-800">
                      {f.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href={`/field/findings/${f.id}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded text-xs transition-colors inline-block"
                    >
                      View Finding →
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
