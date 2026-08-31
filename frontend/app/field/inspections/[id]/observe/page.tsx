'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Camera,
  Paperclip,
  Mic,
  Check,
  Save,
  Send
} from 'lucide-react';

const OBS_TYPES = ['Safety', 'Environment', 'Structural', 'Equipment', 'Labour'];
const SEVERITIES = ['MINOR', 'SIGNIFICANT', 'SEVERE', 'CRITICAL'];

export default function RecordObservationPage() {
  const params = useParams();
  const router = useRouter();
  const inspectionId = (params?.id as string) || 'INS-2024-0891';

  const [obsType, setObsType] = useState('Safety');
  const [selectedReg, setSelectedReg] = useState('Reg. 103(1) — Ventilation shall be adequate to dilute and render harmless inflammable and noxious gases.');
  const [description, setDescription] = useState('Inadequate ventilation velocity recorded at face of Bench 7N, Section 3. Auxiliary ventilation duct terminated 15m back from working face.');
  const [severity, setSeverity] = useState('SEVERE');
  const [raiseFinding, setRaiseFinding] = useState<'yes' | 'no'>('yes');
  const [attachedFiles, setAttachedFiles] = useState(['IMG_2026-08-14.jpg']);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      alert('Observation successfully recorded and submitted.');
      router.push(`/field/inspections/${inspectionId}`);
    }, 1000);
  };

  const handleSaveOffline = () => {
    alert('Observation saved to local browser storage (Offline Queue).');
  };

  return (
    <div className="max-w-4xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/field/inspections/${inspectionId}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              F-04 — Record Observation / Field Capture
            </h1>
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            Inspection Record · <span className="font-mono font-semibold">{inspectionId}</span>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          DGMS Form B Entry
        </div>
      </div>

      {/* Main Form Card matching wireframe */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: LOCATION (Required — GPS) */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-slate-900 tracking-wide">
            LOCATION (Required — GPS)
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-300 bg-white p-3 rounded">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <div>
                <div className="font-bold text-slate-900 text-xs">
                  Bench 7 North — Section 3
                </div>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Lat: 22.3412° N, Lng: 82.6891° E · Accuracy: ±4m · Captured 14:32:07 · GPS: HIGH
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Geo-pin refreshed from GPS receiver')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition self-start sm:self-auto shrink-0"
            >
              [🗺️ Geo-pin]
            </button>
          </div>
        </div>

        {/* SECTION 2: OBSERVATION TYPE */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide">
            OBSERVATION TYPE
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {OBS_TYPES.map((t) => {
              const isSelected = obsType === t;
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => setObsType(t)}
                  className={`px-3 py-1.5 rounded font-semibold text-xs transition border ${
                    isSelected
                      ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  [{t} {isSelected && '•'}]
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: REGULATION REFERENCE (CMR 2017 — AI Suggested) */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide">
            REGULATION REFERENCE (CMR 2017 — Suggested)
          </div>

          <div className="border border-slate-300 bg-slate-50 p-3 rounded space-y-2">
            <div className="font-mono text-slate-900 leading-relaxed text-xs">
              {selectedReg}
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => alert('Regulation confirmed')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-emerald-800 rounded transition"
              >
                [✓ Use this]
              </button>

              <button
                type="button"
                onClick={() => {
                  const query = prompt('Search Coal Mines Regulations 2017:');
                  if (query) setSelectedReg(`CMR 2017 — Search result for: ${query}`);
                }}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
              >
                [Search manually]
              </button>

              <button
                type="button"
                onClick={() => {
                  const ref = prompt('Enter regulation clause (e.g. Reg 104):');
                  if (ref) setSelectedReg(`${ref} — Custom Regulation Reference`);
                }}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition"
              >
                [Enter clause ref]
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: DESCRIPTION [free text] */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide">
            DESCRIPTION [free text]
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-2.5 border border-slate-300 rounded font-sans text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#8B0000] bg-white"
            placeholder="Record detailed physical observation, measurements, hazard severity..."
            required
          />
        </div>

        {/* SECTION 5: SEVERITY */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide">
            SEVERITY
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {SEVERITIES.map((s) => {
              const isSelected = severity === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSeverity(s)}
                  className={`px-3 py-1.5 rounded font-semibold text-xs transition border ${
                    isSelected
                      ? s === 'CRITICAL' || s === 'SEVERE'
                        ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                        : 'bg-amber-600 text-white border-amber-700 font-bold shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  [{s} {isSelected && '•'}]
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 6: EVIDENCE */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide">
            EVIDENCE
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const name = `PHOTO_${Date.now()}.jpg`;
                setAttachedFiles(prev => [...prev, name]);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5 text-slate-600" />
              <span>[📷 Take Photo]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const name = `DOC_ATTACHMENT_${Date.now()}.pdf`;
                setAttachedFiles(prev => [...prev, name]);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition flex items-center gap-1"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-600" />
              <span>[📎 Attach File]</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const name = `VOICE_NOTE_${Date.now()}.wav`;
                setAttachedFiles(prev => [...prev, name]);
              }}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-800 rounded transition flex items-center gap-1"
            >
              <Mic className="w-3.5 h-3.5 text-slate-600" />
              <span>[🎙️ Voice Note]</span>
            </button>
          </div>

          {/* Attached files list */}
          <div className="space-y-1 pt-1">
            {attachedFiles.map((file) => (
              <div key={file} className="border border-slate-200 bg-slate-50 px-3 py-1.5 rounded flex items-center justify-between text-xs">
                <span className="font-mono text-slate-800 font-medium">
                  {file} <span className="text-emerald-700 font-sans font-bold">✓ Geo-tagged</span> · Capture: CAMERA
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFiles(prev => prev.filter(f => f !== file))}
                  className="text-slate-400 hover:text-red-700 text-xs font-bold"
                >
                  [Remove]
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 7: RAISE FINDING IMMEDIATELY? */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide">
            RAISE FINDING IMMEDIATELY?
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRaiseFinding('yes')}
              className={`px-3 py-1.5 rounded font-semibold text-xs transition border ${
                raiseFinding === 'yes'
                  ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              [Yes {raiseFinding === 'yes' && '•'}]
            </button>

            <button
              type="button"
              onClick={() => setRaiseFinding('no')}
              className={`px-3 py-1.5 rounded font-semibold text-xs transition border ${
                raiseFinding === 'no'
                  ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              [No, observation only {raiseFinding === 'no' && '•'}]
            </button>
          </div>
        </div>

        {/* SECTION 8: FORM SUBMISSION ACTIONS */}
        <div className="p-4 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSaveOffline}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>[Save Offline]</span>
          </button>

          <button
            type="submit"
            disabled={submitted}
            className="px-4 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitted ? 'Submitting...' : '[Submit Observation]'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
