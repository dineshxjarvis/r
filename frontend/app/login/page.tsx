'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  User,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Award,
  Calendar,
  Briefcase
} from 'lucide-react';

interface Persona {
  id: string;
  name: string;
  postTitle: string;
  department: string;
  scope: string;
  roleId: 'field' | 'mine' | 'corporate' | 'regulatory' | 'contractor';
  route: string;
  appointmentPeriod: string;
  certNumber: string;
}

const ROLES_DATA: {
  id: 'field' | 'mine' | 'corporate' | 'regulatory' | 'contractor';
  title: string;
  subtitle: string;
  personae: Persona[];
}[] = [
  {
    id: 'field',
    title: 'Role 1: Field-Level Users',
    subtitle: 'Ground inspections, safety checks, observation capture & frontline returns',
    personae: [
      {
        id: 'safety-officer',
        name: 'Er. Rajesh Verma',
        postTitle: 'Safety Officer',
        department: 'Mine Safety & Rescue Division',
        scope: 'Gevra OCP (SECL)',
        roleId: 'field',
        route: '/field/safety/dashboard',
        appointmentPeriod: '01 Apr 2024 – 31 Mar 2027',
        certNumber: 'SO-DGMS-2024-0981'
      },
      {
        id: 'field-inspector',
        name: 'Shri A. K. Nayak',
        postTitle: 'Field / Mine Inspector',
        department: 'Statutory Inspection Wing',
        scope: 'Gevra OCP (SECL)',
        roleId: 'field',
        route: '/field/dashboard',
        appointmentPeriod: '15 Jan 2024 – 14 Jan 2027',
        certNumber: 'FMI-SECL-2024-4112'
      },
      {
        id: 'env-officer',
        name: 'Ms. Priya Swamy',
        postTitle: 'Environmental Officer',
        department: 'Environment & Afforestation Wing',
        scope: 'Gevra OCP (SECL)',
        roleId: 'field',
        route: '/field/environment',
        appointmentPeriod: '01 May 2024 – 30 Apr 2027',
        certNumber: 'ENV-MOEF-2024-1180'
      },
      {
        id: 'labour-officer',
        name: 'Shri B. S. Chawla',
        postTitle: 'Labour & Welfare Officer',
        department: 'Muster & Contractor Compliance',
        scope: 'Gevra OCP (SECL)',
        roleId: 'field',
        route: '/field/attendance',
        appointmentPeriod: '01 Jul 2023 – 30 Jun 2026',
        certNumber: 'LWO-CIL-2023-7761'
      },
      {
        id: 'engineer-supervisor',
        name: 'Er. D. Mukherjee',
        postTitle: 'Overman / Mechanical In-charge',
        department: 'Heavy Earth Moving Machinery (HEMM)',
        scope: 'Gevra OCP (SECL)',
        roleId: 'field',
        route: '/field/assets',
        appointmentPeriod: '01 Oct 2023 – 30 Sep 2026',
        certNumber: 'OVR-DGMS-2023-5520'
      }
    ]
  },
  {
    id: 'mine',
    title: 'Role 2: Mine-Management Users',
    subtitle: 'Mine manager, agents, planning, control room & site administration',
    personae: [
      {
        id: 'mine-manager',
        name: 'Er. S. Chatterjee',
        postTitle: 'Mine Manager (1st Class Statutory)',
        department: 'General Mine Administration',
        scope: 'Gevra OCP (SECL)',
        roleId: 'mine',
        route: '/mine/dashboard',
        appointmentPeriod: '01 Jan 2023 – 31 Dec 2027',
        certNumber: 'FCM-DGMS-2018-0045'
      },
      {
        id: 'mine-agent',
        name: 'Er. M. K. Sinha',
        postTitle: 'Agent / Sub-Area Manager',
        department: 'Korba Area Operations',
        scope: 'Korba Area Mines (SECL)',
        roleId: 'mine',
        route: '/field/obligations',
        appointmentPeriod: '01 Apr 2024 – 31 Mar 2028',
        certNumber: 'AGT-CIL-2024-0012'
      },
      {
        id: 'planning-officer',
        name: 'Er. R. K. Patel',
        postTitle: 'Mine Planning & Survey Officer',
        department: 'Survey & Geological Mapping',
        scope: 'Gevra OCP (SECL)',
        roleId: 'mine',
        route: '/field/map',
        appointmentPeriod: '15 Aug 2023 – 14 Aug 2026',
        certNumber: 'SRV-DGMS-2023-8891'
      }
    ]
  },
  {
    id: 'corporate',
    title: 'Role 3: Corporate / Subsidiary Oversight',
    subtitle: 'Director Technical, CIL executive board & subsidiary ESG audit',
    personae: [
      {
        id: 'director-tech',
        name: 'Dr. N. K. Roy',
        postTitle: 'Director (Technical) / Area GM',
        department: 'SECL Corporate Headquarters',
        scope: 'Korba Area & SECL Subsidiary',
        roleId: 'corporate',
        route: '/corporate/dashboard',
        appointmentPeriod: '01 Nov 2022 – 31 Oct 2027',
        certNumber: 'DIR-HQ-SECL-2022-01'
      },
      {
        id: 'compliance-team',
        name: 'Shri K. L. Verma',
        postTitle: 'Corporate Compliance Officer',
        department: 'Subsidiary Regulatory & Legal Desk',
        scope: 'SECL Subsidiary Portfolio',
        roleId: 'corporate',
        route: '/corporate/compliance-team',
        appointmentPeriod: '01 Apr 2023 – 31 Mar 2028',
        certNumber: 'COMP-HQ-2023-441'
      },
      {
        id: 'cmd-exec',
        name: 'Shri P. V. Rao',
        postTitle: 'Corporate Executive / Administration',
        department: 'Coal India Limited (CIL HQ)',
        scope: 'SECL Subsidiary Tenancy',
        roleId: 'corporate',
        route: '/corporate/admin',
        appointmentPeriod: '01 Jun 2024 – 31 May 2029',
        certNumber: 'CIL-HQ-2024-009'
      }
    ]
  },
  {
    id: 'regulatory',
    title: 'Role 4: Regulatory / Statutory Authority',
    subtitle: 'DGMS Inspectorate of Mines, Ministry & Environmental Regulators',
    personae: [
      {
        id: 'dgms-director',
        name: 'Er. V. K. Sharma',
        postTitle: 'Director of Mines Safety (DGMS)',
        department: 'Directorate General of Mines Safety',
        scope: 'Central Zone (Bilaspur)',
        roleId: 'regulatory',
        route: '/regulatory/dashboard',
        appointmentPeriod: '01 Aug 2024 – 31 Jul 2028',
        certNumber: 'DGMS-GOI-CENTRAL-003'
      },
      {
        id: 'moefcc-reg',
        name: 'Dr. Sunita Bansal',
        postTitle: 'Regional Environmental Officer',
        department: 'Ministry of Environment, Forest & Climate Change',
        scope: 'Central Regional Office (Raipur)',
        roleId: 'regulatory',
        route: '/regulatory/moefcc',
        appointmentPeriod: '01 Jan 2024 – 31 Dec 2026',
        certNumber: 'MOEFCC-REG-2024-81'
      }
    ]
  },
  {
    id: 'contractor',
    title: 'Role 5: Contractors (Part B)',
    subtitle: 'Contractor Administrator & Supervisor — own workers & engagement only',
    personae: [
      {
        id: 'contractor-admin',
        name: 'Shri R. K. Gupta',
        postTitle: 'Contractor Administrator',
        department: 'Acme Mining Services Pvt. Ltd.',
        scope: 'SECL/KRB/OB-REMOVAL/2026/17',
        roleId: 'contractor',
        route: '/contractor/dashboard',
        appointmentPeriod: '01 Oct 2026 – 31 Mar 2027',
        certNumber: 'CONT-SECL-2026-0341'
      },
      {
        id: 'contractor-supervisor',
        name: 'Shri D. V. Patil',
        postTitle: 'Contractor Site Supervisor',
        department: 'Acme Mining Services Pvt. Ltd.',
        scope: 'Gevra OCP (OB-REM-PKG-03)',
        roleId: 'contractor',
        route: '/contractor/workers',
        appointmentPeriod: '01 Oct 2026 – 31 Mar 2027',
        certNumber: 'CONT-SECL-2026-0342'
      }
    ]
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [activeRoleTab, setActiveRoleTab] = useState<'field' | 'mine' | 'corporate' | 'regulatory' | 'contractor'>('field');
  const [selectedPersona, setSelectedPersona] = useState<Persona>(ROLES_DATA[0].personae[0]);
  const [employeeId, setEmployeeId] = useState('EMP-789021');
  const [password, setPassword] = useState('••••••••••••');

  const handlePersonaSelect = (p: Persona) => {
    setSelectedPersona(p);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('strata_current_persona', JSON.stringify(selectedPersona));
      window.dispatchEvent(new Event('strata_persona_changed'));
    }
    router.push(selectedPersona.route);
  };

  const currentRoleData = ROLES_DATA.find(r => r.id === activeRoleTab) || ROLES_DATA[0];

  return (
    <div className="min-h-[calc(100vh-84px)] bg-slate-100 py-8 px-4 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Ministry & System Header Banner */}
        <div className="bg-white border border-slate-300 rounded shadow-xs p-5 text-center space-y-1.5">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            भारत सरकार | Government of India · Ministry of Coal
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#8B0000]" />
            <span>STRATA — Statutory Mining Compliance & Governance Portal</span>
          </h1>
          <div className="text-xs text-slate-600 font-medium">
            Novelty Pillar 3: Governance-Aware Authorisation & Time-Bounded Appointments
          </div>
        </div>

        {/* Main 2-Column or Stacked Login & Persona Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: Persona Selection based on 4 Major Roles (7 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-300">
              <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Select Role & End-User Persona
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Choose one of the 4 statutory roles and pick an end-user to load their authorized workspace.
              </div>

              {/* 4 Role Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-3">
                {ROLES_DATA.map((r) => {
                  const isSelected = activeRoleTab === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setActiveRoleTab(r.id);
                        setSelectedPersona(r.personae[0]);
                      }}
                      className={`p-2 text-xs rounded font-bold transition text-left border ${
                        isSelected
                          ? 'bg-[#8B0000] text-white border-[#730000] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-[11px] truncate">{r.title.split(':')[0]}</div>
                      <div className="text-[10px] opacity-90 font-normal truncate">
                        {r.id.toUpperCase()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Persona List */}
            <div className="p-4 space-y-3">
              <div className="text-xs text-slate-600 font-medium italic pb-1 border-b border-slate-200">
                {currentRoleData.title}: {currentRoleData.subtitle}
              </div>

              <div className="space-y-2.5">
                {currentRoleData.personae.map((persona) => {
                  const isSelected = selectedPersona.id === persona.id;
                  return (
                    <div
                      key={persona.id}
                      onClick={() => handlePersonaSelect(persona)}
                      className={`p-3.5 rounded border transition cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-red-50/50 border-[#8B0000] ring-1 ring-[#8B0000]'
                          : 'bg-white border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3 h-3 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              isSelected ? 'bg-[#8B0000] text-white' : 'bg-slate-300 text-transparent'
                            }`}
                          >
                            ✓
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              {persona.name}
                            </span>
                            <span className="text-slate-500 text-xs ml-2">
                              ({persona.postTitle})
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded text-slate-700">
                          {persona.certNumber}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 pl-5 text-[11px] text-slate-600">
                        <div>
                          <span className="font-medium text-slate-500">Scope: </span>
                          <span className="font-semibold text-slate-800">{persona.scope}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Valid: </span>
                          <span className="font-mono text-slate-700">{persona.appointmentPeriod}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Login Credentials Form (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-300 rounded shadow-xs p-5 space-y-4">
            <div className="pb-3 border-b border-slate-200">
              <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                Statutory Authentication
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                DGMS / Coal India Single Sign-On
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Selected Post & Appointment:
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 space-y-0.5">
                  <div className="font-bold">{selectedPersona.name}</div>
                  <div className="text-slate-600 text-[11px]">{selectedPersona.postTitle}</div>
                  <div className="text-[#8B0000] font-mono text-[10px] font-bold">
                    Target: {selectedPersona.route}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Official Employee ID / Email:
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Password / eSign PIN:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#8B0000]"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold text-xs rounded transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span>[Sign In to Workspace →]</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center pt-2 text-[11px] text-slate-500">
                <span>Or authenticate with: </span>
                <button
                  type="button"
                  onClick={handleLogin}
                  className="text-[#1E3A8A] font-bold hover:underline ml-1"
                >
                  [Digital DSC / eSign]
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
