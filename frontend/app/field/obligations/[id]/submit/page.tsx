'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  Paperclip,
  Check,
  AlertTriangle,
  Save,
  ArrowRight
} from 'lucide-react';

export default function EvidenceSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const obligationId = (params?.id as string) || 'OBL-PLANT-40HA';

  const [step, setStep] = useState(1);
  const [photoCount, setPhotoCount] = useState(2);
  const [reportUploaded, setReportUploaded] = useState(true);

  const handleAddPhoto = () => {
    if (photoCount < 4) {
      setPhotoCount(prev => prev + 1);
    } else {
      alert('Maximum 4 required photos already captured.');
    }
  };

  const handleNextReview = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else {
      alert('Evidence package submitted successfully for verification.');
      router.push('/field/obligations');
    }
  };

  return (
    <div className="max-w-4xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/field/obligations"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              F-08 — Evidence Submission
            </h1>
          </div>
          <div className="text-xs text-slate-600 font-semibold">
            Plantation over 40 ha — FY 2026-27 · EC Condition 14 · Due 31 Aug
          </div>
        </div>

        <div className="text-xs font-bold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2.5 py-1 rounded self-start sm:self-auto font-mono">
          Step {step} of 3: {step === 1 ? 'Capture Evidence' : step === 2 ? 'Verify & Review' : 'Statutory Sign-off'}
        </div>
      </div>

      {/* Main Single Box matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: WHAT'S REQUIRED */}
        <div className="p-4 space-y-1 bg-slate-50/50">
          <div className="font-extrabold text-slate-900 tracking-wide uppercase">
            WHAT&apos;S REQUIRED — 4 geo-tagged photos, 1 survey report, GPS within lease boundary
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Statutory MoEFCC Environmental Clearance mandate: All evidence must be captured on-site with verifiable satellite coordinate stamps.
          </p>
        </div>

        {/* SECTION 2: EVIDENCE CAPTURED */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-slate-900 tracking-wide uppercase">
              EVIDENCE CAPTURED [{photoCount} of 4 photos]
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5 text-slate-600" />
                <span>[+Capture Photo]</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="border border-slate-200 bg-slate-50 p-2.5 rounded flex items-center justify-between">
              <div className="font-mono text-slate-800">
                Photo 1: <span className="font-bold">Plantation_North_Bench.jpg</span> (✓ Geo-tagged: 22.3415° N, 82.6880° E · Acc: ±3m)
              </div>
              <span className="text-emerald-700 font-bold text-[10px]">Verified</span>
            </div>

            <div className="border border-slate-200 bg-slate-50 p-2.5 rounded flex items-center justify-between">
              <div className="font-mono text-slate-800">
                Photo 2: <span className="font-bold">Afforestation_Saplings.jpg</span> (✓ Geo-tagged: 22.3420° N, 82.6895° E · Acc: ±18m)
              </div>
              <span className="text-emerald-700 font-bold text-[10px]">Verified</span>
            </div>

            {photoCount >= 3 && (
              <div className="border border-slate-200 bg-slate-50 p-2.5 rounded flex items-center justify-between">
                <div className="font-mono text-slate-800">
                  Photo 3: <span className="font-bold">Drip_Irrigation_Grid.jpg</span> (✓ Geo-tagged: 22.3418° N, 82.6888° E · Acc: ±4m)
                </div>
                <span className="text-emerald-700 font-bold text-[10px]">Verified</span>
              </div>
            )}

            {photoCount >= 4 && (
              <div className="border border-slate-200 bg-slate-50 p-2.5 rounded flex items-center justify-between">
                <div className="font-mono text-slate-800">
                  Photo 4: <span className="font-bold">Canopy_Boundary_Survey.jpg</span> (✓ Geo-tagged: 22.3425° N, 82.6899° E · Acc: ±5m)
                </div>
                <span className="text-emerald-700 font-bold text-[10px]">Verified</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: SURVEY REPORT & EXTRACTION */}
        <div className="p-4 space-y-2.5 bg-slate-50/50">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-slate-900 tracking-wide uppercase">
              SURVEY REPORT
            </div>

            <button
              type="button"
              onClick={() => alert('Opening PDF file selector...')}
              className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition flex items-center gap-1"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-600" />
              <span>[📎 Upload PDF]</span>
            </button>
          </div>

          <div className="border border-slate-300 bg-white p-3 rounded space-y-1.5 font-mono text-[11px]">
            <div className="text-slate-600">
              Attached: <span className="font-bold text-slate-900">Gevra_Afforestation_Survey_Report_FY26.pdf</span> (1.4 MB)
            </div>
            <div className="text-emerald-800 font-bold">
              → Extraction: <span className="underline">Area = 41.3 ha</span> · <span className="underline">Species: 847 trees (Neem, Sal, Teak)</span>
            </div>
          </div>
        </div>

        {/* SECTION 4: LOCATION INTEGRITY */}
        <div className="p-4 space-y-2">
          <div className="font-extrabold text-slate-900 tracking-wide uppercase">
            LOCATION INTEGRITY
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                ✓
              </span>
              <span>All photos within lease boundary</span>
            </div>

            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                ✓
              </span>
              <span>GPS timestamps consistent (within 2-hour window)</span>
            </div>

            <div className="flex items-center gap-2 text-amber-800 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Photo 2 accuracy ±18m — still acceptable (threshold ±50m)</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: ACTIONS */}
        <div className="p-4 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => alert('Evidence package draft saved offline.')}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-slate-600" />
            <span>[Save offline]</span>
          </button>

          <button
            type="button"
            onClick={handleNextReview}
            className="px-4 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs flex items-center gap-1.5"
          >
            <span>{step === 3 ? '[Submit Evidence Final ✓]' : '[Next: Review →]'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
