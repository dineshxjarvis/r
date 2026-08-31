'use client';

import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  FileText,
  UserCheck,
  ShieldCheck
} from 'lucide-react';

interface CorporateInspection {
  id: string;
  inspection_number: string;
  mine_name: string;
  type_title: string;
  lead_auditor: string;
  scheduled_date: string;
  state: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'REPORT_ISSUED';
  findings_count: number;
  origin: 'INTERNAL_AUDIT' | 'DGMS_STATUTORY' | 'SPCB_MONITORING';
}

const MOCK_INSPECTIONS: CorporateInspection[] = [
  {
    id: 'insp_01HZY1A2B3C4D5E6F7G8H9J0K0',
    inspection_number: 'INSP-2026-08-011',
    mine_name: 'Gevra OCP',
    type_title: 'DGMS Comprehensive Safety Audit (CMR 2017)',
    lead_auditor: 'Dr. A. K. Banerjee (DDMS Bilaspur)',
    scheduled_date: '2026-09-07',
    state: 'REPORT_ISSUED',
    findings_count: 1,
    origin: 'DGMS_STATUTORY'
  },
  {
    id: 'insp_01HZY1A2B3C4D5E6F7G8H9J0K1',
    inspection_number: 'INSP-2026-08-014',
    mine_name: 'Kusmunda OCP',
    type_title: 'Corporate Cross-Mine Environmental Audit',
    lead_auditor: 'Er. Vivek Sharma (CIL HQ Audit Team)',
    scheduled_date: '2026-09-12',
    state: 'SCHEDULED',
    findings_count: 0,
    origin: 'INTERNAL_AUDIT'
  },
  {
    id: 'insp_01HZY1A2B3C4D5E6F7G8H9J0K2',
    inspection_number: 'INSP-2026-08-019',
    mine_name: 'Dipka OCP',
    type_title: 'SPCB Quarterly Effluent & Emissions Survey',
    lead_auditor: 'Er. S. Sengupta (Raipur Regional Office)',
    scheduled_date: '2026-08-25',
    state: 'COMPLETED',
    findings_count: 2,
    origin: 'SPCB_MONITORING'
  }
];

export default function CorporateInspectionsPage() {
  const [inspections, setInspections] = useState<CorporateInspection[]>(MOCK_INSPECTIONS);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedMine, setSelectedMine] = useState('Gevra OCP');
  const [auditType, setAuditType] = useState('Cross-Mine Safety Audit');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleRequestAudit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInsp: CorporateInspection = {
      id: `insp_${Date.now()}`,
      inspection_number: `INSP-2026-REQ-${Math.floor(Math.random() * 900 + 100)}`,
      mine_name: selectedMine,
      type_title: auditType,
      lead_auditor: 'Corporate Audit Cell Appointee',
      scheduled_date: '2026-09-20',
      state: 'SCHEDULED',
      findings_count: 0,
      origin: 'INTERNAL_AUDIT'
    };
    setInspections(prev => [newInsp, ...prev]);
    setShowRequestModal(false);
    setActionSuccess(`Cross-mine audit request created via POST /inspection-requests {scope:"org_unit"}`);
    setTimeout(() => setActionSuccess(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Screen 6 · Portfolio Oversight
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /inspections?filter[org_unit_id]=...
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Corporate Inspections & Audit Oversight</h1>
          <p className="text-sm text-slate-500 mt-1">
            Statutory regulatory visits and corporate internal audit schedule across all operating units.
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Request Cross-Mine Audit</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Inspections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Inspection Ref & Title</th>
                <th className="p-3.5">Operating Mine</th>
                <th className="p-3.5">Origin Type</th>
                <th className="p-3.5">Lead Auditor / Inspector</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">State</th>
                <th className="p-3.5">Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {inspections.map(insp => (
                <tr key={insp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 text-sm">{insp.inspection_number}</div>
                    <div className="text-slate-600 text-xs mt-0.5">{insp.type_title}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-900">{insp.mine_name}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                      {insp.origin.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 font-medium text-slate-800">{insp.lead_auditor}</td>
                  <td className="p-3.5 font-medium text-slate-800">{insp.scheduled_date}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        insp.state === 'REPORT_ISSUED' || insp.state === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {insp.state.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900">
                    {insp.findings_count > 0 ? (
                      <span className="text-red-600 font-bold">{insp.findings_count} Finding(s)</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Cross-Mine Audit Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Request Cross-Mine Independent Audit</span>
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestAudit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Operating Mine</label>
                <select
                  value={selectedMine}
                  onChange={e => setSelectedMine(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Gevra OCP">Gevra OCP (SECL)</option>
                  <option value="Dipka OCP">Dipka OCP (SECL)</option>
                  <option value="Kusmunda OCP">Kusmunda OCP (SECL)</option>
                  <option value="North Tisra Underground">North Tisra Underground (BCCL)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Subject Area</label>
                <select
                  value={auditType}
                  onChange={e => setAuditType(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cross-Mine Safety Audit (CMR 2017)">Cross-Mine Safety Audit (CMR 2017)</option>
                  <option value="Environmental Clearances & Slope Stability Audit">Environmental Clearances & Slope Stability Audit</option>
                  <option value="Contractor Labour & Welfare Compliance Inspection">Contractor Labour & Welfare Compliance Inspection</option>
                  <option value="Weighbridge & Coal Despatch Lineage Verification">Weighbridge & Coal Despatch Lineage Verification</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
                >
                  Dispatch Audit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
