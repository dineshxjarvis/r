'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ContractorPackage {
  id: string;
  package_code: string;
  contractor_name: string;
  mine_name: string;
  work_scope: string;
  valid_from: string;
  valid_to: string;
  state: 'APPROVED' | 'PENDING_APPROVAL' | 'SUSPENDED';
  eligibility_status: 'ELIGIBLE' | 'EXCEPTIONS_FLAGGED' | 'INELIGIBLE';
  total_workers: number;
  eligible_workers: number;
  labour_licence_valid_till: string;
}

const MOCK_PACKAGES: ContractorPackage[] = [
  {
    id: 'cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0',
    package_code: 'OB-REM-PKG-03',
    contractor_name: 'Acme Mining Services Pvt Ltd',
    mine_name: 'Gevra OCP (SECL)',
    work_scope: 'Overburden Removal & Bench Formation (East Pit)',
    valid_from: '2026-10-01',
    valid_to: '2027-03-31',
    state: 'APPROVED',
    eligibility_status: 'ELIGIBLE',
    total_workers: 312,
    eligible_workers: 308,
    labour_licence_valid_till: '2026-12-31'
  },
  {
    id: 'cwpk_01HZY1A2B3C4D5E6F7G8H9J0K1',
    package_code: 'HAUL-TRANS-07',
    contractor_name: 'Eastern Coal Logistics Ltd',
    mine_name: 'Dipka OCP (SECL)',
    work_scope: 'Coal Transportation from Pit Face to Silo Rapid Loading System',
    valid_from: '2026-08-01',
    valid_to: '2027-07-31',
    state: 'APPROVED',
    eligibility_status: 'ELIGIBLE',
    total_workers: 185,
    eligible_workers: 185,
    labour_licence_valid_till: '2027-04-15'
  },
  {
    id: 'cwpk_01HZY1A2B3C4D5E6F7G8H9J0K2',
    package_code: 'DRILL-BLAST-02',
    contractor_name: 'Deccan Explosives & Drilling Co.',
    mine_name: 'Kusmunda OCP (SECL)',
    work_scope: 'Controlled Deep-Hole Blasting and Fragmentation',
    valid_from: '2026-09-01',
    valid_to: '2027-02-28',
    state: 'PENDING_APPROVAL',
    eligibility_status: 'EXCEPTIONS_FLAGGED',
    total_workers: 64,
    eligible_workers: 58,
    labour_licence_valid_till: '2026-09-15'
  }
];

export default function CorporateContractorsPage() {
  const [packages] = useState<ContractorPackage[]>(MOCK_PACKAGES);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              §3.1 Screen 9 · Contractor Portfolio
            </span>
            <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              GET /contractor-work-packages?filter[org_unit_id]=...&expand=eligibility
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Contractor Portfolio & Eligibility Gates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Active work packages, labor license validity, and statutory compliance status across all operating areas.
          </p>
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Work Package Ref & Scope</th>
                <th className="p-3.5">Contractor Agency</th>
                <th className="p-3.5">Operating Mine</th>
                <th className="p-3.5">Package Validity</th>
                <th className="p-3.5">Labour Licence</th>
                <th className="p-3.5">Worker Compliance</th>
                <th className="p-3.5">Eligibility Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 text-sm">{pkg.package_code}</div>
                    <div className="text-slate-600 text-xs mt-0.5">{pkg.work_scope}</div>
                  </td>
                  <td className="p-3.5 font-medium text-slate-900">{pkg.contractor_name}</td>
                  <td className="p-3.5 text-slate-600">{pkg.mine_name}</td>
                  <td className="p-3.5 text-slate-600 font-medium">
                    {pkg.valid_from} – {pkg.valid_to}
                  </td>
                  <td className="p-3.5 font-medium text-slate-800">
                    Valid till {pkg.labour_licence_valid_till}
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-900">
                      {pkg.eligible_workers}/{pkg.total_workers}
                    </span>{' '}
                    <span className="text-slate-400">verified</span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        pkg.eligibility_status === 'ELIGIBLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pkg.eligibility_status.replace('_', ' ')}
                    </span>
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
