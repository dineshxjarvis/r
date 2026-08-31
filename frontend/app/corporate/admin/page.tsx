'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  ArrowRight,
  Shield,
  Users,
  Settings,
  X,
  CheckCircle2,
  ChevronRight,
  Briefcase,
  Layers,
  ArrowLeft
} from 'lucide-react';

interface MineNode {
  id: string;
  name: string;
  type: 'OCP' | 'UG';
  status: 'ACTIVE' | 'DEVELOPMENT';
  activeAppointments: number;
}

interface AreaNode {
  id: string;
  name: string;
  mines: MineNode[];
}

const INITIAL_HIERARCHY: AreaNode[] = [
  {
    id: 'AREA-KORBA',
    name: 'Korba Area',
    mines: [
      { id: 'MINE-GEVRA', name: 'Gevra OCP', type: 'OCP', status: 'ACTIVE', activeAppointments: 18 },
      { id: 'MINE-DIPKA', name: 'Dipka OCP', type: 'OCP', status: 'ACTIVE', activeAppointments: 15 },
      { id: 'MINE-KUSMUNDA', name: 'Kusmunda OCP', type: 'OCP', status: 'ACTIVE', activeAppointments: 14 }
    ]
  },
  {
    id: 'AREA-RAIGARH',
    name: 'Raigarh Area',
    mines: [
      { id: 'MINE-CHHAL', name: 'Chhal OCP', type: 'OCP', status: 'ACTIVE', activeAppointments: 11 },
      { id: 'MINE-BAROUD', name: 'Baroud OCP', type: 'OCP', status: 'ACTIVE', activeAppointments: 9 }
    ]
  }
];

export default function CorporateAdministrationPage() {
  const [hierarchy, setHierarchy] = useState<AreaNode[]>(INITIAL_HIERARCHY);
  const [newMineModal, setNewMineModal] = useState(false);
  const [newUnitModal, setNewUnitModal] = useState(false);
  const [positionTemplatesModal, setPositionTemplatesModal] = useState(false);
  const [userApptModal, setUserApptModal] = useState(false);

  // Form states
  const [mineName, setMineName] = useState('');
  const [selectedArea, setSelectedArea] = useState('Korba Area');
  const [unitName, setUnitName] = useState('');

  const handleCreateMine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mineName.trim()) return;

    setHierarchy(prev =>
      prev.map(area =>
        area.name === selectedArea
          ? {
              ...area,
              mines: [
                ...area.mines,
                {
                  id: `MINE-${Date.now()}`,
                  name: mineName,
                  type: 'OCP',
                  status: 'ACTIVE',
                  activeAppointments: 1
                }
              ]
            }
          : area
      )
    );
    alert(`New mine "${mineName}" provisioned under ${selectedArea} (POST /mines). Tenancy & DGMS code generated.`);
    setMineName('');
    setNewMineModal(false);
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim()) return;

    const newArea: AreaNode = {
      id: `AREA-${Date.now()}`,
      name: unitName,
      mines: []
    };
    setHierarchy(prev => [...prev, newArea]);
    alert(`New organisational administrative unit "${unitName}" registered (POST /organizations).`);
    setUnitName('');
    setNewUnitModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/corporate/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Portfolio</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Administration · SECL
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Subsidiary Multi-Mine Tenancy, Statutory Post Templates, and Governance Hierarchies (Pillar 3)
          </div>
        </div>

        {/* Action Controls matching wireframe: [+ New Mine] [+ New Unit] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setNewMineModal(true)}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>[+ New Mine]</span>
          </button>

          <button
            type="button"
            onClick={() => setNewUnitModal(true)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>[+ New Unit]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: ORGANISATION HIERARCHY matching wireframe */}
        <div className="p-4 space-y-3 bg-slate-50/40">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#8B0000]" />
            <span>ORGANISATION HIERARCHY</span>
          </div>

          <div className="space-y-3">
            {hierarchy.map((area) => (
              <div key={area.id} className="p-3 bg-white border border-slate-200 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <span className="font-mono text-[#8B0000]">SECL (Subsidiary HQ)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                    {area.name}
                  </span>
                  <span className="text-slate-400 font-normal text-[11px] ml-auto font-mono">
                    ({area.mines.length} authorised mines)
                  </span>
                </div>

                <div className="pl-4 flex items-center gap-2 flex-wrap font-mono text-[11px]">
                  {area.mines.map((mine) => (
                    <div
                      key={mine.id}
                      className="p-2 bg-slate-50 border border-slate-300 rounded flex items-center gap-2 hover:bg-slate-100 transition"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-900">{mine.name}</span>
                      <span className="text-slate-500 font-sans">({mine.activeAppointments} statutory appts)</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: POSITION TEMPLATES matching wireframe */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div className="space-y-1">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#8B0000]" />
              <span>POSITION TEMPLATES — Mine Manager, Safety Officer, Ventilation Officer, Surveyor, Overman</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              Statutory requirements, mandatory qualifications (1st/2nd Class Certificate), and statutory duties rulebooks
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPositionTemplatesModal(true)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded transition self-start sm:self-auto shrink-0 shadow-2xs"
          >
            [Manage →]
          </button>
        </div>

        {/* SECTION 3: USER & APPOINTMENT ADMINISTRATION matching wireframe */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          <div className="space-y-1">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#8B0000]" />
              <span>USER & APPOINTMENT ADMINISTRATION</span>
            </div>
            <div className="text-slate-600 text-[11px]">
              Issue time-bounded statutory orders, assign multi-mine roles, and manage DGMS appointment notifications
            </div>
          </div>

          <button
            type="button"
            onClick={() => setUserApptModal(true)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded transition self-start sm:self-auto shrink-0 shadow-2xs"
          >
            [Manage →]
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>SECL Corporate Statutory Governance Framework · Mines Act 1952</span>
          <span className="font-mono text-slate-500">CIL Headquarters</span>
        </div>

      </div>

      {/* New Mine Modal */}
      {newMineModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8B0000]" />
                <span>+ Register New Mine Unit</span>
              </div>
              <button
                type="button"
                onClick={() => setNewMineModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMine} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Area:</label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                >
                  {hierarchy.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mine Name / Designation:</label>
                <input
                  type="text"
                  value={mineName}
                  onChange={(e) => setMineName(e.target.value)}
                  placeholder="e.g. Manikpur OCP"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewMineModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                >
                  [Provision Mine]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Unit Modal */}
      {newUnitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8B0000]" />
                <span>+ Register New Administrative Unit</span>
              </div>
              <button
                type="button"
                onClick={() => setNewUnitModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUnit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit / Area Name:</label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="e.g. Hasdeo Area"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewUnitModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                >
                  [Create Unit]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Position Templates Modal */}
      {positionTemplatesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#8B0000]" />
                <span>Statutory Position Templates (Pillar 3 Governance)</span>
              </div>
              <button
                type="button"
                onClick={() => setPositionTemplatesModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="font-bold text-slate-900 font-sans text-xs">Mine Manager (1st Class Manager)</div>
                <div className="text-slate-600">Statute: Mines Act 1952 s.17 · CMR 2017 Reg. 27</div>
                <div className="text-slate-500">Required Cert: First Class Mine Manager Certificate of Competency (FCM)</div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="font-bold text-slate-900 font-sans text-xs">Safety Officer</div>
                <div className="text-slate-600">Statute: CMR 2017 Reg. 29</div>
                <div className="text-slate-500">Required Cert: FCM / First Class Degree in Mining Engineering</div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded space-y-1">
                <div className="font-bold text-slate-900 font-sans text-xs">Electrical Supervisor</div>
                <div className="text-slate-600">Statute: CEA Safety Regulations 2010 Reg. 29</div>
                <div className="text-slate-500">Required Cert: Electrical Supervisor Competency Certificate (Mining)</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPositionTemplatesModal(false)}
                className="px-3 py-1.5 bg-[#8B0000] text-white font-bold rounded shadow-xs"
              >
                [Done]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User & Appointment Modal */}
      {userApptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-lg w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8B0000]" />
                <span>Corporate User & Appointment Administration</span>
              </div>
              <button
                type="button"
                onClick={() => setUserApptModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Er. S. Chatterjee</span> · Mine Manager (Gevra OCP)
                </div>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-emerald-300">
                  Valid to 2029
                </span>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Er. Rajesh Verma</span> · Safety Officer (Gevra OCP)
                </div>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-emerald-300">
                  Valid to 2028
                </span>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Er. S. Mishra</span> · Survey Officer (Gevra OCP)
                </div>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-amber-300">
                  Expiring in 60d
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setUserApptModal(false)}
                className="px-3 py-1.5 bg-[#8B0000] text-white font-bold rounded shadow-xs"
              >
                [Done]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
