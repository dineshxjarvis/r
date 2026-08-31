'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Plus,
  AlertTriangle,
  FileCheck,
  Lock,
  ArrowLeft,
  Camera,
  MapPin,
  Clock,
  X,
  Scale
} from 'lucide-react';

export default function RegulatoryConductInspectionPage() {
  const params = useParams();
  const inspectionId = (params?.id as string) || 'INS-2024-0891';

  const [obsModal, setObsModal] = useState(false);
  const [prohibitoryModal, setProhibitoryModal] = useState(false);
  const [observations, setObservations] = useState([
    {
      id: 'OBS-01',
      location: 'Bench 7 North (West Face)',
      details: 'Visual inspection indicates berm height measured at 1.1m against statutory 2.2m requirement.',
      time: '11:45 AM',
      geotag: '22.3374° N, 82.5898° E'
    }
  ]);

  const [newObsLocation, setNewObsLocation] = useState('');
  const [newObsDetails, setNewObsDetails] = useState('');

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObsDetails.trim()) return;

    setObservations(prev => [
      ...prev,
      {
        id: `OBS-0${prev.length + 1}`,
        location: newObsLocation || 'Pit Haul Road Ramp 4',
        details: newObsDetails,
        time: '12:15 PM',
        geotag: '22.3385° N, 82.5910° E'
      }
    ]);
    alert('Inspection observation permanently logged with regulator timestamp and GPS coordinates.');
    setNewObsLocation('');
    setNewObsDetails('');
    setObsModal(false);
  };

  const handleIssueProhibitoryOrder = () => {
    alert('Section 22(3) Emergency Prohibitory Notice issued to Gevra Mine Management (POST /regulatory-cases). Haulage face operations halted.');
    setProhibitoryModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/regulatory/inspections"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Inspections</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              {inspectionId} · DGMS Safety Inspection · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Official Regulatory Field Audit Execution · Mines Act 1952 s.7 & CMR 2017
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded font-bold">
          <Lock className="w-3 h-3 text-[#8B0000]" />
          <span>Statutory Provenance Locked</span>
        </div>
      </div>

      {/* Main Single Docket Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: REGULATORY PROVENANCE BOX matching wireframe */}
        <div className="p-4 bg-slate-50/70 space-y-2">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#8B0000]" />
            <span>REGULATORY PROVENANCE (auto-populated, cannot be overridden)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-[11px]">
            <div className="p-2.5 bg-white border border-slate-200 rounded">
              <div className="text-slate-500 font-sans text-[10px]">Your Authority / Official</div>
              <div className="font-bold text-slate-900">DDMS (Mining) R. Verma</div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded">
              <div className="text-slate-500 font-sans text-[10px]">Statutory Appointment</div>
              <div className="font-bold text-slate-900">DGMS Dhanbad Region 2</div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded">
              <div className="text-slate-500 font-sans text-[10px]">Mandate Assignment</div>
              <div className="font-bold text-slate-900">CMR 2017 Coal Mines Safety</div>
            </div>

            <div className="p-2.5 bg-white border border-slate-200 rounded">
              <div className="text-slate-500 font-sans text-[10px]">Jurisdiction Scope</div>
              <div className="font-bold text-slate-900">Gevra OCP (SECL)</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: REGULATORY AUDIT ACTIONS matching wireframe */}
        <div className="p-4 bg-white flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setObsModal(true)}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded flex items-center gap-1.5 transition text-xs shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>[Record Observation]</span>
          </button>

          <Link
            href="/regulatory/findings/raise"
            className="px-3.5 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1.5 transition text-xs shadow-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>[Issue Finding with CAPA →]</span>
          </Link>

          <button
            type="button"
            onClick={() => setProhibitoryModal(true)}
            className="px-3.5 py-1.5 bg-red-50 border border-red-300 hover:bg-red-100 text-red-800 font-bold rounded flex items-center gap-1.5 transition text-xs"
          >
            <Scale className="w-3.5 h-3.5 text-red-700" />
            <span>[Issue Prohibitory Order]</span>
          </button>
        </div>

        {/* SECTION 3: OBSERVATIONS LOGGED matching wireframe */}
        <div className="p-4 space-y-2.5">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>RECORDED OBSERVATIONS DURING THIS VISIT</span>
            <span className="font-mono text-slate-500 text-[11px]">{observations.length} logged</span>
          </div>

          <div className="space-y-2">
            {observations.map((obs) => (
              <div key={obs.id} className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{obs.id}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-bold text-slate-800">{obs.location}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {obs.time} · {obs.geotag}
                  </div>
                </div>
                <div className="text-slate-700 text-xs">
                  {obs.details}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: NOVELTY PILLAR 1 ENFORCEMENT CALLOUT matching wireframe */}
        <div className="p-4 bg-slate-50/70 text-slate-700 text-[11px] space-y-1">
          <div className="font-bold text-slate-900 text-xs">
            Novelty Pillar 1: Clause-to-Closure Traceability
          </div>
          <p>
            Issuing a regulatory finding requires an exact clause reference from the CMR 2017 library. The resulting chain — <strong>Inspection → Visit → Observation → Finding → CAPA → Evidence → Closure</strong> — is permanently linked with every authority ID preserved.
          </p>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Statutory Field Audit System · Section 7 Authorization</span>
          <span className="font-mono text-slate-500">DGMS Central Zone</span>
        </div>

      </div>

      {/* Observation Modal */}
      {obsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#8B0000]" />
                <span>Record Regulatory Field Observation</span>
              </div>
              <button
                type="button"
                onClick={() => setObsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddObservation} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bench / Pit Location:</label>
                <input
                  type="text"
                  value={newObsLocation}
                  onChange={(e) => setNewObsLocation(e.target.value)}
                  placeholder="e.g. Haul Road Ramp 4 Chainage 1.2km"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observation Description:</label>
                <textarea
                  rows={3}
                  value={newObsDetails}
                  onChange={(e) => setNewObsDetails(e.target.value)}
                  placeholder="Record factual condition, dimensions, and deviation from statutory standards..."
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                  required
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setObsModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                >
                  [Log Observation]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prohibitory Order Modal */}
      {prohibitoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-red-700 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>Issue Section 22 Prohibitory Order</span>
              </div>
              <button
                type="button"
                onClick={() => setProhibitoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <p className="font-bold text-red-900">
                Mines Act 1952 Section 22(3) / 22(1) Emergency Directive:
              </p>
              <p className="text-[11px] text-slate-700">
                Immediately prohibits employment of persons and operation of heavy machinery at specified face until attested rectifications are completed.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProhibitoryModal(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueProhibitoryOrder}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white font-bold rounded shadow-xs"
              >
                [Promulgate Section 22 Order]
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
