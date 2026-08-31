'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Check, AlertCircle, FileText, Camera } from 'lucide-react';

export default function FindingDetailPage() {
  const params = useParams();
  const findingId = (params?.id as string) || 'DG-2847';

  const [acknowledged, setAcknowledged] = useState(false);
  const [capaProgress, setCapaProgress] = useState(60);
  const [capaCompleted, setCapaCompleted] = useState(false);

  const handleAcknowledge = () => {
    setAcknowledged(true);
    alert(`Finding #${findingId} statutory acknowledgement recorded.`);
  };

  const handleUpdateProgress = () => {
    const val = prompt('Enter CAPA progress percentage (0-100):', capaProgress.toString());
    if (val && !isNaN(Number(val))) {
      setCapaProgress(Math.min(100, Math.max(0, Number(val))));
    }
  };

  const handleSubmitCompletion = () => {
    setCapaCompleted(true);
    setCapaProgress(100);
    alert('CAPA completion evidence package submitted for statutory sign-off.');
  };

  return (
    <div className="max-w-4xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/field/findings"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              DGMS Finding #{findingId}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
            <span className="font-bold text-red-800">SEVERE</span>
            <span className="text-slate-400">·</span>
            {acknowledged ? (
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Acknowledged ✓
              </span>
            ) : (
              <span className="font-bold text-slate-700">Awaiting Ack</span>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono self-start sm:self-auto">
          F-06 · Statutory Finding Docket
        </div>
      </div>

      {/* Main Single Card / Docket View matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: ISSUED BY */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-slate-900 tracking-wide uppercase">
            ISSUED BY — Authority, Inspector, Inspection, Jurisdiction
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white border border-slate-300 p-3 rounded text-slate-800">
            <div>
              <span className="text-slate-500 font-medium block">Authority:</span>
              <span className="font-semibold text-slate-900">DGMS (Directorate General of Mines Safety)</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Inspector:</span>
              <span className="font-semibold text-slate-900">Er. V. K. Sharma (Director of Mines Safety)</span>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Inspection Reference:</span>
              <Link href="/field/inspections/INS-2024-0891" className="font-mono text-[#1E3A8A] font-bold hover:underline">
                INS-2024-0891 (DGMS Safety Inspection)
              </Link>
            </div>
            <div>
              <span className="text-slate-500 font-medium block">Jurisdiction:</span>
              <span className="font-semibold text-slate-900">Central Zone / Korba Coalfield (SECL)</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: FINDING */}
        <div className="p-4 space-y-2.5">
          <div className="font-extrabold text-slate-900 tracking-wide uppercase">
            FINDING — Category, Location, CMR 2017 clause + text, clause ref
          </div>

          <div className="space-y-2 bg-white border border-slate-300 p-3 rounded">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-2 border-b border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">Category:</span>
                <span className="font-bold text-red-900">Ventilation & Gas Safety</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Location:</span>
                <span className="font-semibold text-slate-900">Bench 7 North — Section 3 (Open Cast Pit)</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Clause Ref:</span>
                <span className="font-mono text-slate-800">DGMS Circular 04 of 2022</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 font-medium block mb-1">CMR 2017 Statutory Clause:</span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-slate-900 leading-relaxed text-[11px]">
                <strong>Reg. 103(1)</strong> — Ventilation shall be adequate to dilute and render harmless inflammable and noxious gases to that extent that all working places shall be in a safe state for persons to work.
              </div>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 font-medium block mb-1">Description:</span>
              <p className="text-slate-800 leading-relaxed">
                Auxiliary ventilation ducting found disconnected 15m away from working face at Bench 7N. Air velocity measured at 0.12 m/s against statutory minimum threshold of 0.30 m/s. High dust accumulation in haulage track.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: CAPA ASSIGNED */}
        <div className="p-4 space-y-2.5 bg-slate-50/50">
          <div className="font-extrabold text-slate-900 tracking-wide uppercase">
            CAPA ASSIGNED — Corrective / Preventive, Due, Assignee, Status
          </div>

          <div className="space-y-3 bg-white border border-slate-300 p-3 rounded">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-slate-200">
              <div>
                <span className="text-slate-500 font-medium block">Plan Title:</span>
                <span className="font-bold text-slate-900">Reinstate 40m rigid ducting line & verify velocity anemometer readings</span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block">Assignee & Due Date:</span>
                <span className="font-semibold text-slate-900">Er. Rajesh Verma (Safety Officer) · <span className="text-red-700 font-bold">Due 31 Aug 2026</span></span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">CAPA Progress Status:</span>
                <span className="font-mono text-slate-900">{capaProgress}% ({capaCompleted ? 'COMPLETED' : 'IN_PROGRESS'})</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded overflow-hidden flex border border-slate-300">
                <div
                  className={`h-full transition-all ${capaProgress === 100 ? 'bg-emerald-600' : 'bg-[#8B0000]'}`}
                  style={{ width: `${capaProgress}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleUpdateProgress}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
              >
                [Update CAPA Progress]
              </button>

              <button
                type="button"
                onClick={handleSubmitCompletion}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-[#1E3A8A] font-bold rounded transition"
              >
                [Submit CAPA Completion]
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 4: EVIDENCE ATTACHED */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide uppercase">
            EVIDENCE ATTACHED — thumbnails, geo-tag, capture path
          </div>

          <div className="border border-slate-300 bg-white p-3 rounded space-y-2">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="font-mono font-bold text-slate-900">IMG_2026-08-14_DG2847.jpg</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                ✓ Geo-tagged
              </span>
            </div>

            <div className="text-[11px] text-slate-600 font-mono pl-6">
              Coordinates: Lat 22.3412° N, Lng 82.6891° E · Elev: 240m MSL · Camera: DGMS Rugged Field Tab
            </div>
            <div className="text-[11px] text-slate-500 font-mono pl-6">
              Path: <code className="text-slate-700">/compliance/evidence/gevra/2026/08/DG-2847_photo1.jpg</code>
            </div>
          </div>
        </div>

        {/* SECTION 5: TIMELINE */}
        <div className="p-4 space-y-2 bg-slate-50/50">
          <div className="font-extrabold text-slate-900 tracking-wide uppercase">
            TIMELINE — raised → CAPA assigned → ack due (OVERDUE)
          </div>

          <div className="p-3 bg-white border border-slate-300 rounded text-slate-800 leading-relaxed font-mono text-[11px]">
            14 Aug 2026 (Raised by Inspector) → 15 Aug 2026 (CAPA assigned) → 31 Aug 2026 (<span className="text-red-700 font-bold">Ack due — OVERDUE</span>)
          </div>
        </div>

        {/* SECTION 6: STATUTORY ACKNOWLEDGEMENT ACTION */}
        <div className="p-4 bg-white flex items-center justify-between">
          <div className="text-slate-600 font-medium">
            {acknowledged ? (
              <span className="text-emerald-800 font-bold">
                ✓ Finding formally acknowledged by Safety Officer on 31 Aug 2026
              </span>
            ) : (
              <span>Statutory signature required under CMR 2017</span>
            )}
          </div>

          {!acknowledged && (
            <button
              type="button"
              onClick={handleAcknowledge}
              className="px-4 py-2 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs flex items-center gap-1.5 text-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>[Acknowledge]</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
