'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Download,
  Shield,
  FileCheck
} from 'lucide-react';

interface AppointmentRecord {
  id: string;
  postTitle: string;
  officerName: string;
  certNumber: string;
  appointmentStart: string;
  appointmentEnd: string;
  status: 'ACTIVE' | 'VACANT' | 'EXPIRING_SOON';
  dgmsNotified: boolean;
}

const APPOINTMENTS: AppointmentRecord[] = [
  {
    id: 'APT-MM-01',
    postTitle: 'Mine Manager (1st Class Statutory)',
    officerName: 'Er. S. Chatterjee / A. Sinha (you)',
    certNumber: 'FCM-DGMS-2018-0045',
    appointmentStart: '01 Apr 2024',
    appointmentEnd: '01 Apr 2029',
    status: 'ACTIVE',
    dgmsNotified: true
  },
  {
    id: 'APT-SO-01',
    postTitle: 'Safety Officer',
    officerName: 'Er. Rajesh Verma / R. Kumar',
    certNumber: 'SO-DGMS-2024-0981',
    appointmentStart: '01 Apr 2024',
    appointmentEnd: '01 Apr 2028',
    status: 'ACTIVE',
    dgmsNotified: true
  },
  {
    id: 'APT-EM-01',
    postTitle: 'Electrical Manager',
    officerName: '— VACANT —',
    certNumber: '—',
    appointmentStart: '—',
    appointmentEnd: 'Vacant since 15 Jul 2026',
    status: 'VACANT',
    dgmsNotified: false
  },
  {
    id: 'APT-SRV-01',
    postTitle: 'Survey Officer',
    officerName: 'Er. S. Mishra',
    certNumber: 'SRV-DGMS-2021-3310',
    appointmentStart: '01 Nov 2021',
    appointmentEnd: '31 Oct 2026',
    status: 'EXPIRING_SOON',
    dgmsNotified: true
  }
];

export default function StaffAppointmentsPage() {
  const [appointmentsList, setAppointmentsList] = useState<AppointmentRecord[]>(APPOINTMENTS);
  const [showNewModal, setShowNewModal] = useState(false);

  const handleNewAppointment = () => {
    const post = prompt('Enter Statutory Post Title to appoint (e.g. Electrical Manager):');
    const name = prompt('Enter Officer Name & DGMS Certificate Number:');
    if (post && name) {
      const newApt: AppointmentRecord = {
        id: `APT-${Date.now()}`,
        postTitle: post,
        officerName: name,
        certNumber: 'DGMS-CERT-2026-NEW',
        appointmentStart: '01 Sep 2026',
        appointmentEnd: '31 Aug 2029',
        status: 'ACTIVE',
        dgmsNotified: true
      };
      setAppointmentsList(prev => [newApt, ...prev]);
      alert(`Statutory Appointment order issued for ${post} (${name}). Form B & DGMS Form II return generated.`);
    }
  };

  const handleRenew = (id: string) => {
    setAppointmentsList(prev =>
      prev.map(a =>
        a.id === id ? { ...a, status: 'ACTIVE', appointmentEnd: '31 Oct 2029' } : a
      )
    );
    alert('Statutory Appointment tenure extended by 3 years. DGMS notification recorded.');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/mine/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Staff & Appointments · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Novelty Pillar 3: Governance-Aware Authorisation & Time-Bounded Statutory Appointments
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleNewAppointment}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ New Appointment]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: STATUTORY POSTS STATUS */}
        <div className="p-4 space-y-2.5 bg-slate-50/40">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
            STATUTORY POSTS STATUS
          </div>

          <div className="space-y-2 text-xs">
            {/* Post 1: Mine Manager */}
            <div className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-sm">✅</span>
                <span className="font-bold text-slate-900">
                  Mine Manager: A. Sinha (you) · Valid till 01 Apr 2029
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">FCM-DGMS-2018-0045</span>
            </div>

            {/* Post 2: Safety Officer */}
            <div className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold text-sm">✅</span>
                <span className="font-bold text-slate-900">
                  Safety Officer: R. Kumar · Valid till 01 Apr 2028
                </span>
              </div>
              <span className="text-slate-500 font-mono text-[11px]">SO-DGMS-2024-0981</span>
            </div>

            {/* Post 3: Electrical Manager (Vacant Alert) */}
            <div className="p-3 bg-white border border-amber-300 rounded space-y-2 bg-amber-50/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-bold text-slate-900">
                  Electrical Manager: Post vacant since 15 Jul 2026
                </span>
                <span className="text-amber-800 font-mono text-[11px] font-bold">
                  [Mines Act Section 17 Breach Risk]
                </span>
              </div>

              <div className="flex items-center gap-2 pl-4.5">
                <button
                  type="button"
                  onClick={handleNewAppointment}
                  className="px-2.5 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs"
                >
                  [Urgent: Appoint or notify DGMS]
                </button>

                <button
                  type="button"
                  onClick={() => alert('Statutory Requirement: Mines Act 1952 Section 17 & CEA (Measures relating to Safety and Electric Supply) Regulations 2010 requires every opencast mine exceeding 500kW load to employ a certified Electrical Supervisor.')}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
                >
                  [View requirement]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: EXPIRING SOON */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span className="font-bold text-slate-900">
              EXPIRING SOON (next 90 days) — S. Mishra, Survey Officer
            </span>
            <span className="text-slate-500 text-[11px] font-mono">
              (Expires 31 Oct 2026)
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleRenew('APT-SRV-01')}
            className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition self-start sm:self-auto shrink-0 shadow-xs"
          >
            [Renew]
          </button>
        </div>

        {/* SECTION 3: ALL APPOINTMENTS TABLE */}
        <div className="p-4 space-y-2.5">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>ALL APPOINTMENTS (table, filterable, exportable)</span>
            <button
              type="button"
              onClick={() => alert('Exporting all DGMS statutory appointments register...')}
              className="text-[11px] font-bold text-[#8B0000] hover:underline"
            >
              [Export Register]
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th className="py-2.5 px-4">Statutory Post</th>
                  <th className="py-2.5 px-4">Appointee Name</th>
                  <th className="py-2.5 px-4">Certificate No.</th>
                  <th className="py-2.5 px-4">Tenure Start</th>
                  <th className="py-2.5 px-4">Tenure End / Status</th>
                  <th className="py-2.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {appointmentsList.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {apt.postTitle}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">
                      {apt.officerName}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {apt.certNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {apt.appointmentStart}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {apt.status === 'VACANT' ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          {apt.appointmentEnd}
                        </span>
                      ) : (
                        <span className="text-slate-800">{apt.appointmentEnd}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => alert(`Opening statutory appointment dossier for ${apt.postTitle} (${apt.officerName}).`)}
                        className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded text-[11px]"
                      >
                        [View]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Form II Statutory Appointments Registry</span>
          <span className="font-mono text-slate-500">CMR 2017 Reg. 27</span>
        </div>

      </div>
    </div>
  );
}
