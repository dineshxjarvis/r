'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  ShieldAlert,
  Calendar,
  Lock,
  Send
} from 'lucide-react';

export default function IssueRegulatoryFindingPage() {
  const router = useRouter();

  const [clause, setClause] = useState('CMR 2017 Reg. 103(1) — Parapet Berms & Haulage Gradients');
  const [severity, setSeverity] = useState<'SEVERE' | 'SIGNIFICANT' | 'MINOR'>('SEVERE');
  const [description, setDescription] = useState('Bench 7 North parapet berm height measured at 1.1m against statutory 2.2m wheel diameter standard.');
  const [correctiveAction, setCorrectiveAction] = useState('Immediately regrade and reconstruct parapet berm to a minimum height of 2.2m using compacted overburden material.');
  const [preventiveAction, setPreventiveAction] = useState('Implement weekly surveyor cross-sectional profile scans and pre-shift overman checklist for all active haul roads.');
  const [dueDate, setDueDate] = useState('2026-09-14');
  const [sourceInspection, setSourceInspection] = useState('INS-2024-0891 (DGMS Comprehensive Safety Audit · Gevra OCP)');

  const handleIssueFinding = (e: React.FormEvent) => {
    e.preventDefault();

    if (!correctiveAction.trim() || !preventiveAction.trim()) {
      alert('Statutory Rule: A regulatory finding cannot be issued without a mandatory CAPA specification.');
      return;
    }

    alert(`Regulatory Finding issued under ${clause} (POST /findings). Notification dispatched to Gevra Mine Manager & Safety Officer.`);
    router.push('/regulatory/findings');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/regulatory/findings"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Findings</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Issue Regulatory Finding · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Mines Act 1952 s.7 & CMR 2017 Form B Statutory Non-Compliance Issuance Desk
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-[#8B0000]" />
          <span>Statutory Authority Notice</span>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <form onSubmit={handleIssueFinding} className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: STATUTORY CLAUSE & SEVERITY */}
        <div className="p-4 space-y-3 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            STATUTORY CLAUSE SELECTION & SEVERITY
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">CMR 2017 / Mines Act Clause Reference:</label>
              <select
                value={clause}
                onChange={(e) => setClause(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
              >
                <option>CMR 2017 Reg. 103(1) — Parapet Berms & Haulage Gradients</option>
                <option>CMR 2017 Reg. 106(2) — Monsoon Drainage & Sump Capacity</option>
                <option>CMR 2017 Reg. 181(3) — HEMM Braking & Mechanical Certifications</option>
                <option>CMR 2017 Reg. 182 — Fire Suppression & Safety Signboards</option>
                <option>Mines Act 1952 s.17 — Statutory Appointment Vacancy</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Statutory Severity Level:</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-bold"
              >
                <option value="SEVERE">🔴 SEVERE (Imminent Danger / 24h SLA)</option>
                <option value="SIGNIFICANT">🟡 SIGNIFICANT (Statutory Defect / 72h SLA)</option>
                <option value="MINOR">🟢 MINOR (Administrative / 7d SLA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Finding Description & Factual Evidence:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
              required
            />
          </div>
        </div>

        {/* SECTION 2: MANDATORY CAPA REQUIRED matching wireframe */}
        <div className="p-4 space-y-3 bg-red-50/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#8B0000]" />
              <span>CAPA REQUIRED (MANDATORY — A FINDING WITHOUT CAPA IS INVALID)</span>
            </div>
            <span className="font-mono text-[10px] text-red-700 font-bold">
              Novelty Pillar 1: Mandatory Corrective Action Plan
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mandatory Corrective Action (Immediate Rectification):</label>
              <textarea
                rows={2}
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mandatory Preventive Action (Root-Cause Prevention):</label>
              <textarea
                rows={2}
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                required
              />
            </div>

            <div className="max-w-xs">
              <label className="block font-bold text-slate-700 mb-1">CAPA Compliance Deadline:</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-mono"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: SOURCE INSTRUMENT matching wireframe */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            SOURCE INSTRUMENT (AUTO-LINKED)
          </div>

          <div className="p-2.5 bg-white border border-slate-300 rounded flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-slate-900">{sourceInspection}</span>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
              Verified Locked
            </span>
          </div>
        </div>

        {/* Action Controls matching wireframe: [Cancel] [Issue Finding] */}
        <div className="p-4 bg-white flex items-center justify-end gap-2">
          <Link
            href="/regulatory/findings"
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded text-xs transition"
          >
            [Cancel]
          </Link>

          <button
            type="submit"
            className="px-4 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1.5 transition shadow-xs text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>[Issue Finding]</span>
          </button>
        </div>

      </form>
    </div>
  );
}
