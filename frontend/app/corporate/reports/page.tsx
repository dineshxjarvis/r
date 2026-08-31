'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Calendar,
  Sparkles,
  Award,
  Lock,
  ChevronRight
} from 'lucide-react';

interface ReportItem {
  id: string;
  definition_id: string;
  title: string;
  statutory_body: string;
  period: string;
  status: 'DRAFT' | 'COMPILED' | 'ATTESTED' | 'SUBMITTED';
  compiled_at: string | null;
  attested_by: string | null;
  document_hash: string | null;
}

const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rins_01HZY4D5E6F7G8H9J0K1T2M3N0',
    definition_id: 'rdef_01HZY1A2B3C4D5E6F7G8H9J0K0',
    title: 'Quarterly Safety & Accident Return (Form IV)',
    statutory_body: 'Directorate General of Mines Safety (DGMS)',
    period: 'Q1 FY 2026-27',
    status: 'ATTESTED',
    compiled_at: '2026-08-25T14:00:00Z',
    attested_by: 'Er. S. K. Mahapatra (Director Tech, CIL)',
    document_hash: 'sha256:7b1e4...88d2'
  },
  {
    id: 'rins_01HZY4D5E6F7G8H9J0K1T2M3N1',
    definition_id: 'rdef_01HZY1A2B3C4D5E6F7G8H9J0K1',
    title: 'Half-Yearly EC Compliance Monitoring Return',
    statutory_body: 'Ministry of Environment, Forest & Climate Change (MoEFCC)',
    period: 'Apr – Sep 2026',
    status: 'COMPILED',
    compiled_at: '2026-08-30T11:20:00Z',
    attested_by: null,
    document_hash: 'sha256:4a9c2...e13b'
  },
  {
    id: 'rins_01HZY4D5E6F7G8H9J0K1T2M3N2',
    definition_id: 'rdef_01HZY1A2B3C4D5E6F7G8H9J0K2',
    title: 'Monthly Form C Coal Despatch & Royalty Return',
    statutory_body: "Coal Controller's Organisation (CCO)",
    period: 'AUG-2026',
    status: 'DRAFT',
    compiled_at: null,
    attested_by: null,
    document_hash: null
  }
];

export default function CorporateReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleCompile = (rep: ReportItem) => {
    setReports(prev =>
      prev.map(r =>
        r.id === rep.id
          ? { ...r, status: 'COMPILED', compiled_at: new Date().toISOString(), document_hash: 'sha256:9d1a3...f72c' }
          : r
      )
    );
    setActionSuccess(`Report "${rep.title}" compiled via POST /report-instances/${rep.definition_id}/actions {action:"COMPILE"}`);
    setTimeout(() => setActionSuccess(null), 6000);
  };

  const handleAttest = (rep: ReportItem) => {
    setReports(prev =>
      prev.map(r =>
        r.id === rep.id
          ? { ...r, status: 'ATTESTED', attested_by: 'Shri A. K. Jain, Director (Technical)' }
          : r
      )
    );
    setActionSuccess(`Report "${rep.title}" cryptographically signed and attested via POST /report-instances/${rep.id}/actions {action:"ATTEST"}`);
    setTimeout(() => setActionSuccess(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Screen 8 · Corporate Statutory Filings
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /report-definition-versions & /report-instances
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Statutory Reports & Filings Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated statutory report generation, digital signature (DSC) attestation, and regulatory delivery.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map(rep => (
          <div
            key={rep.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded">
                  {rep.period}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    rep.status === 'ATTESTED' || rep.status === 'SUBMITTED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rep.status === 'COMPILED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {rep.status}
                </span>
                <span className="text-xs text-slate-500 font-medium">· {rep.statutory_body}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">{rep.title}</h3>
              {rep.attested_by && (
                <p className="text-xs text-emerald-700 font-medium flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Attested by: {rep.attested_by}</span>
                  {rep.document_hash && <span className="font-mono text-slate-400">({rep.document_hash})</span>}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {rep.status === 'DRAFT' && (
                <button
                  onClick={() => handleCompile(rep)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Compile Numbers</span>
                </button>
              )}
              {rep.status === 'COMPILED' && (
                <button
                  onClick={() => handleAttest(rep)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>Sign with DSC / eSign</span>
                </button>
              )}
              {rep.status === 'ATTESTED' && (
                <button
                  onClick={() => alert(`Downloading verified PDF for ${rep.title}`)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>Download Verified PDF</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
