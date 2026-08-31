'use client';

import React, { useState } from 'react';
import {
  ClipboardList,
  Shield,
  Leaf,
  Users,
  TrendingUp,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Download,
  Calendar
} from 'lucide-react';

interface ObligationInstance {
  id: string;
  code: string;
  domain: 'SAFETY' | 'ENVIRONMENT' | 'LABOUR' | 'PRODUCTION';
  title: string;
  source_act: string;
  clause_ref: string;
  due_date: string;
  status: 'SATISFIED' | 'PENDING_SUBMISSION' | 'OVERDUE' | 'UNDER_VERIFICATION' | 'WAIVED';
  responsible_person: string;
  responsible_post: string;
  evidence_required_count: number;
  evidence_submitted_count: number;
  verification_verdict: 'SATISFIED' | 'UNVERIFIED' | 'PENDING' | 'REJECTED';
}

const MOCK_OBLIGATIONS: ObligationInstance[] = [
  {
    id: 'obi_01HZYV1V2W3X4Y5Z6A7B8C9D01',
    code: 'OBL-CMR-106-2',
    domain: 'SAFETY',
    title: 'Continuous Safety Berm along Active Haul Roads (Half Tyre Height)',
    source_act: 'Coal Mines Regulations 2017',
    clause_ref: '/akn/in/act/cmr/2017/main#reg_106__2',
    due_date: '2026-09-07',
    status: 'SATISFIED',
    responsible_person: 'Er. Rajesh Verma',
    responsible_post: 'Safety Officer',
    evidence_required_count: 4,
    evidence_submitted_count: 4,
    verification_verdict: 'SATISFIED'
  },
  {
    id: 'obi_01HZYV1V2W3X4Y5Z6A7B8C9D02',
    code: 'OBL-CMR-40-3',
    domain: 'LABOUR',
    title: 'Daily Shift Attendance Register & Muster Roll Attestation (Form B)',
    source_act: 'CMR 2017 / Mines Act 1952',
    clause_ref: '/akn/in/act/cmr/2017/main#reg_40__3',
    due_date: '2026-08-31',
    status: 'SATISFIED',
    responsible_person: 'Shri K. L. Sharma',
    responsible_post: 'Labour & Welfare Officer',
    evidence_required_count: 1,
    evidence_submitted_count: 1,
    verification_verdict: 'SATISFIED'
  },
  {
    id: 'obi_01HZYV1V2W3X4Y5Z6A7B8C9D03',
    code: 'OBL-EC-2024-SP-04',
    domain: 'ENVIRONMENT',
    title: 'Greenbelt Plantation over 40 ha Overburden Dump Slope',
    source_act: 'MoEFCC EC Clearance Condition #14',
    clause_ref: '/akn/in/clearance/moefcc/2024/gevra-exp#cond_14',
    due_date: '2026-09-15',
    status: 'PENDING_SUBMISSION',
    responsible_person: 'Dr. Ramesh Chandra',
    responsible_post: 'Environmental Officer',
    evidence_required_count: 6,
    evidence_submitted_count: 3,
    verification_verdict: 'UNVERIFIED'
  },
  {
    id: 'obi_01HZYV1V2W3X4Y5Z6A7B8C9D04',
    code: 'OBL-SPCB-AIR-08',
    domain: 'ENVIRONMENT',
    title: 'Continuous PM10/PM2.5 Ambient Air Quality Telemetry Transmission',
    source_act: 'Air (Prevention and Control of Pollution) Act 1981',
    clause_ref: '/akn/in/act/air/1981/consent#cond_6',
    due_date: '2026-08-30',
    status: 'OVERDUE',
    responsible_person: 'Dr. Ramesh Chandra',
    responsible_post: 'Environmental Officer',
    evidence_required_count: 2,
    evidence_submitted_count: 0,
    verification_verdict: 'UNVERIFIED'
  },
  {
    id: 'obi_01HZYV1V2W3X4Y5Z6A7B8C9D05',
    code: 'OBL-PROD-CCO-01',
    domain: 'PRODUCTION',
    title: 'Monthly Form C Coal Despatch & OB Reconciliation Filing to CCO',
    source_act: 'Colliery Control Rules 2004',
    clause_ref: '/akn/in/rules/ccr/2004/main#rule_7',
    due_date: '2026-09-05',
    status: 'PENDING_SUBMISSION',
    responsible_person: 'Er. Alok Nath',
    responsible_post: 'Operations Manager',
    evidence_required_count: 2,
    evidence_submitted_count: 1,
    verification_verdict: 'PENDING'
  }
];

export default function MineObligationsPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [obligations, setObligations] = useState<ObligationInstance[]>(MOCK_OBLIGATIONS);
  const [selectedObligation, setSelectedObligation] = useState<ObligationInstance | null>(null);
  const [newAssignee, setNewAssignee] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filtered = obligations.filter(item => {
    const matchesDomain = selectedDomain === 'ALL' || item.domain === selectedDomain;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.responsible_person.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const satisfiedCount = obligations.filter(o => o.status === 'SATISFIED').length;
  const overdueCount = obligations.filter(o => o.status === 'OVERDUE').length;
  const pendingCount = obligations.filter(o => o.status === 'PENDING_SUBMISSION' || o.status === 'UNDER_VERIFICATION').length;

  const handleReassign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObligation || !newAssignee) return;
    setObligations(prev =>
      prev.map(o => (o.id === selectedObligation.id ? { ...o, responsible_person: newAssignee } : o))
    );
    setActionNotice(`Responsible person updated to "${newAssignee}" via PATCH /obligation-instances/${selectedObligation.id}`);
    setSelectedObligation(null);
    setNewAssignee('');
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleExport = () => {
    setActionNotice('Compliance Register PDF export compiled via POST /report-instances/{definition_id}/actions {action:"COMPILE"}.');
    setTimeout(() => setActionNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §2.1 Screen 7 · Statutory Master Register
            </span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /obligation-instances?filter[mine_id]=...
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Mine Statutory Obligations Registry</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gevra OpenCast Project · Total Obligations: <span className="font-bold text-slate-800">{obligations.length}</span>
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors border border-slate-300 shadow-sm"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Statutory Register (PDF)</span>
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Total Obligations</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{obligations.length}</div>
          <p className="text-xs text-slate-400 mt-0.5">Under 4 Regulatory Acts</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase">Verified & Satisfied</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{satisfiedCount}</div>
          <p className="text-xs text-emerald-600 mt-0.5">{((satisfiedCount / obligations.length) * 100).toFixed(0)}% Compliant</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-amber-600 uppercase">Pending / In Progress</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</div>
          <p className="text-xs text-amber-600 mt-0.5">Evidence in collection</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-red-600 uppercase">Overdue Load</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{overdueCount}</div>
          <p className="text-xs text-red-600 mt-0.5">{overdueCount > 0 ? 'Requires immediate action' : '0 overdue items'}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'ALL', label: 'All Domains' },
              { id: 'SAFETY', label: 'Safety (CMR 2017)', icon: Shield },
              { id: 'ENVIRONMENT', label: 'Environment (EC/Consent)', icon: Leaf },
              { id: 'LABOUR', label: 'Labour & Welfare', icon: Users },
              { id: 'PRODUCTION', label: 'Production & Returns', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedDomain(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  selectedDomain === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search obligations, clause..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Obligations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3">Obligation Code & Title</th>
                <th className="p-3">Domain</th>
                <th className="p-3">Clause Reference</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Responsible Post</th>
                <th className="p-3">Status</th>
                <th className="p-3">Evidence</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{item.code}</div>
                    <div className="text-slate-600 text-xs line-clamp-1">{item.title}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                      {item.domain}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                    <span>{item.source_act}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </td>
                  <td className="p-3 font-medium text-slate-800">{item.due_date}</td>
                  <td className="p-3">
                    <div className="font-medium text-slate-900">{item.responsible_person}</div>
                    <div className="text-[11px] text-slate-400">{item.responsible_post}</div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        item.status === 'SATISFIED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'OVERDUE'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800">
                      {item.evidence_submitted_count}/{item.evidence_required_count}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">items</span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedObligation(item)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition-colors"
                    >
                      Reassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Modal */}
      {selectedObligation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <span>Reassign Responsibility</span>
              </h3>
              <button
                onClick={() => setSelectedObligation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs space-y-1">
              <div><span className="font-semibold text-slate-700">Obligation:</span> {selectedObligation.code}</div>
              <div><span className="font-semibold text-slate-700">Current Officer:</span> {selectedObligation.responsible_person} ({selectedObligation.responsible_post})</div>
            </div>

            <form onSubmit={handleReassign} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Statutory Responsible Officer
                </label>
                <select
                  required
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Select Appointed Officer...</option>
                  <option value="Er. Rajesh Verma">Er. Rajesh Verma (Safety Officer)</option>
                  <option value="Dr. Ramesh Chandra">Dr. Ramesh Chandra (Environmental Officer)</option>
                  <option value="Shri K. L. Sharma">Shri K. L. Sharma (Labour & Welfare Officer)</option>
                  <option value="Er. Alok Nath">Er. Alok Nath (Operations Manager)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedObligation(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
                >
                  Update Responsible Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
