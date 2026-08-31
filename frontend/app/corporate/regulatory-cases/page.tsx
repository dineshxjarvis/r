'use client';

import React, { useState } from 'react';
import {
  Scale,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Shield,
  Leaf,
  Building2
} from 'lucide-react';

interface RegulatoryCase {
  id: string;
  case_number: string;
  authority_system: 'PARIVESH' | 'DGMS_PORTAL' | 'STATE_POLLUTION_PORTAL';
  case_type: 'ENVIRONMENTAL_CLEARANCE' | 'SECTION_22_ORDER' | 'FOREST_CLEARANCE' | 'MINE_OPENING_PERMISSION';
  mine_name: string;
  title: string;
  stage_name: string;
  status: 'UNDER_SCRUTINY' | 'EAC_RECOMMENDED' | 'ORDER_ACTIVE' | 'ORDER_LIFTED' | 'GRANTED';
  last_snapshot_at: string;
  is_federated: boolean;
}

const MOCK_CASES: RegulatoryCase[] = [
  {
    id: 'rcas_01HZYH7J8K9T0M1N203P4Q5R60',
    case_number: 'IA/CG/CMIN/442118/2026',
    authority_system: 'PARIVESH',
    case_type: 'ENVIRONMENTAL_CLEARANCE',
    mine_name: 'Gevra OCP (SECL)',
    title: 'Environmental Clearance (Capacity Expansion from 52.5 to 70.0 Mtpa)',
    stage_name: 'Post-ToR, Comprehensive EIA Study in Progress',
    status: 'UNDER_SCRUTINY',
    last_snapshot_at: '2026-08-31T04:00:00Z',
    is_federated: true
  },
  {
    id: 'rcas_01HZYH7J8K9T0M1N203P4Q5R61',
    case_number: 'DGMS-2026-SEC22-0084',
    authority_system: 'DGMS_PORTAL',
    case_type: 'SECTION_22_ORDER',
    mine_name: 'Gevra OCP (SECL)',
    title: 'Section 22(1) Order — East Haul Road Bench Berm Reinstatement',
    stage_name: 'CAPA Verification Submitted to Regional Inspector',
    status: 'ORDER_ACTIVE',
    last_snapshot_at: '2026-08-30T10:00:00Z',
    is_federated: false
  },
  {
    id: 'rcas_01HZYH7J8K9T0M1N203P4Q5R62',
    case_number: 'FC/CG/KORBA/2024/918',
    authority_system: 'PARIVESH',
    case_type: 'FOREST_CLEARANCE',
    mine_name: 'Dipka OCP (SECL)',
    title: 'Stage-II Forest Clearance for 84.6 ha Non-Forest CA Land Bank Transfer',
    stage_name: 'FAC Recommendations Approved by MoEFCC',
    status: 'GRANTED',
    last_snapshot_at: '2026-08-15T08:00:00Z',
    is_federated: true
  }
];

export default function CorporateRegulatoryCasesPage() {
  const [cases] = useState<RegulatoryCase[]>(MOCK_CASES);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Screen 3 · Regulatory Legal Cases
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /regulatory-cases?filter[tenant_id]=...
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Regulatory Cases & Clearances Portfolio</h1>
          <p className="text-sm text-slate-500 mt-1">
            Federated PARIVESH clearance snapshots, DGMS statutory orders, and compliance proceedings.
          </p>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {cases.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900">{item.case_number}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {item.case_type.replace(/_/g, ' ')}
                </span>
                <span className="text-xs text-slate-500 font-medium">· {item.mine_name}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.is_federated && (
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Federated: {item.authority_system}
                  </span>
                )}
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    item.status === 'GRANTED' || item.status === 'ORDER_LIFTED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'ORDER_ACTIVE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {item.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-600 mt-1">
                Current Stage: <span className="font-semibold text-slate-800">{item.stage_name}</span>
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Last Parivesh Snapshot: {new Date(item.last_snapshot_at).toLocaleString()}
              </span>
              <button
                onClick={() => alert(`Opening snapshot audit lineage for ${item.case_number}`)}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                View Case Snapshot & Query History →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
