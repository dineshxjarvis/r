'use client';

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  Zap,
  TrendingDown,
  Sparkles,
  Search,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Clock,
  UserX,
  RotateCcw,
  Info
} from 'lucide-react';

interface IntegritySignal {
  id: string;
  signal_code: string;
  anomaly_type: 'FAST_CLOSURE_ANOMALY' | 'ZERO_REJECTION_VERIFIER' | 'REPEATED_EXTENSIONS' | 'WEIGHBRIDGE_DISPATCH_MISMATCH';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  mine_name: string;
  title: string;
  description: string;
  metric_observed: string;
  baseline_benchmark: string;
  confidence_score: number;
  status: 'ACTIVE' | 'INVESTIGATING' | 'DISMISSED';
  detected_at: string;
}

const MOCK_SIGNALS: IntegritySignal[] = [
  {
    id: 'sig_01HZY99A1B2C3D4E5F6G7H8J90',
    signal_code: 'SIG-2026-FCA-012',
    anomaly_type: 'FAST_CLOSURE_ANOMALY',
    severity: 'CRITICAL',
    mine_name: 'Kusmunda OCP',
    title: 'Fast CAPA Closure without Rigorous Physical Evidence Gate',
    description: '4 severe ventilation findings were marked VERIFIED_CLOSED within 18 hours of issue; baseline for ventilation overhaul in this seam is 6.5 days.',
    metric_observed: 'Avg closure time: 14.2 hours',
    baseline_benchmark: 'Subsidiary mean: 156.0 hours',
    confidence_score: 0.94,
    status: 'ACTIVE',
    detected_at: '2026-08-30T16:20:00Z'
  },
  {
    id: 'sig_01HZY99A1B2C3D4E5F6G7H8J91',
    signal_code: 'SIG-2026-ZRV-008',
    anomaly_type: 'ZERO_REJECTION_VERIFIER',
    severity: 'HIGH',
    mine_name: 'Gevra OCP',
    title: 'Zero-Rejection Verifier Pattern Detected in Contractor Submissions',
    description: '142 consecutive contractor compliance renewals approved by the same verifier over 6 months with 0% clarification or rejection rate.',
    metric_observed: 'Rejection rate: 0.0% (142/142)',
    baseline_benchmark: 'Subsidiary peer benchmark: 14.8% rejections',
    confidence_score: 0.91,
    status: 'ACTIVE',
    detected_at: '2026-08-29T10:05:00Z'
  },
  {
    id: 'sig_01HZY99A1B2C3D4E5F6G7H8J92',
    signal_code: 'SIG-2026-RDE-003',
    anomaly_type: 'REPEATED_EXTENSIONS',
    severity: 'HIGH',
    mine_name: 'Dipka OCP',
    title: 'Repeated Deadline Extensions on High-Risk EC Plantation Condition',
    description: 'Obligation OBL-EC-2024-SP-04 has received 3 consecutive statutory deadline extensions totaling 90 days without documented weather or technical justification.',
    metric_observed: 'Extensions count: 3 (cumulative 90 days)',
    baseline_benchmark: 'Policy maximum: 2 extensions / 30 days',
    confidence_score: 0.98,
    status: 'ACTIVE',
    detected_at: '2026-08-28T08:30:00Z'
  }
];

export default function CorporateAnalyticsPage() {
  const [signals, setSignals] = useState<IntegritySignal[]>(MOCK_SIGNALS);
  const [selectedSignal, setSelectedSignal] = useState<IntegritySignal | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleTriggerAudit = (sig: IntegritySignal) => {
    setActionSuccess(`Independent Corporate Internal Audit dispatched for ${sig.mine_name} (${sig.signal_code}) via POST /inspection-requests.`);
    setSignals(prev => prev.map(s => (s.id === sig.id ? { ...s, status: 'INVESTIGATING' } : s)));
    setTimeout(() => setActionSuccess(null), 6000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              §3.1 Novelty Pillar 4 · Process-Integrity Analytics
            </span>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              GET /signals?filter[scope]=organization_unit
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Process-Integrity & AI Anomaly Detection</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated compliance gaming detection, fast-closure anomalies, and verifier pattern auditing.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-900 text-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Novelty Pillar 4 Explainer Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-xl shadow-sm border border-slate-800">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-indigo-500/20 rounded-lg shrink-0 border border-indigo-400/30">
            <Zap className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="space-y-1 text-xs">
            <h2 className="text-sm font-bold text-white">Continuous Anti-Gaming & Process Governance</h2>
            <p className="text-slate-300 leading-relaxed">
              Standard compliance systems only check whether a box is ticked. Strata AI analyzes the <strong>integrity of the governance process itself</strong>: flagging statistically improbable fast closures, rubber-stamp verifications without rejections, and abnormal extension chains before accidents happen.
            </p>
          </div>
        </div>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {signals.map(sig => (
          <div
            key={sig.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    sig.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {sig.severity}
                </span>
                <span className="font-mono text-xs font-bold text-slate-900">{sig.signal_code}</span>
                <span className="text-xs text-slate-500 font-medium">· {sig.mine_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500">
                  AI Confidence: <strong className="text-indigo-600">{(sig.confidence_score * 100).toFixed(0)}%</strong>
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded font-semibold ${
                    sig.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {sig.status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">{sig.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{sig.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Observed Metric:</span>
                <p className="font-bold text-slate-900 mt-0.5">{sig.metric_observed}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Peer Benchmark / Standard:</span>
                <p className="font-bold text-slate-900 mt-0.5">{sig.baseline_benchmark}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Detected: {new Date(sig.detected_at).toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTriggerAudit(sig)}
                  disabled={sig.status === 'INVESTIGATING'}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{sig.status === 'INVESTIGATING' ? 'Audit Dispatched' : 'Request Independent Audit'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
