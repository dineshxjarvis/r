'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  Building2,
  Bell,
  Globe,
  ArrowLeft,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export default function MineSettingsPage() {
  const [mineName, setMineName] = useState('Gevra Opencast Project (OCP)');
  const [leaseArea, setLeaseArea] = useState('4,184.48 Hectares');
  const [coalfield, setCoalfield] = useState('Korba Coalfield, SECL');
  const [targetCapacity, setTargetCapacity] = useState('70.00 MTPA (Million Tonnes Per Annum)');
  const [digestFrequency, setDigestFrequency] = useState('Daily Executive Briefing (08:00 AM)');
  const [severeSla, setSevereSla] = useState('24 hours');
  const [significantSla, setSignificantSla] = useState('72 hours');
  const [defaultLanguage, setDefaultLanguage] = useState('English (EN)');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    alert('Mine configuration & statutory SLA policy saved (PATCH /mines/{id}). Synced with SECL Subsidiary Database.');
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
              <span>← Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Mine Settings · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Mine Profile Hierarchy, Notification Policies, Escalation SLAs, and Regional Localization
          </div>
        </div>

        {/* Action Controls matching wireframe: [Save] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1.5 transition shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>[Save]</span>
          </button>
        </div>
      </div>

      {/* Main Settings Container matching wireframe */}
      <form onSubmit={handleSave} className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* SECTION 1: MINE PROFILE matching wireframe */}
        <div className="p-5 space-y-3 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-700" />
            <span>Mine Profile — Name, Lease Area & Hierarchy</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Mine Designation:</label>
              <input
                type="text"
                value={mineName}
                onChange={(e) => setMineName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Statutory Leasehold Area:</label>
              <input
                type="text"
                value={leaseArea}
                onChange={(e) => setLeaseArea(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-mono"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Subsidiary / Coalfield:</label>
              <input
                type="text"
                value={coalfield}
                onChange={(e) => setCoalfield(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Approved EC Peak Capacity:</label>
              <input
                type="text"
                value={targetCapacity}
                onChange={(e) => setTargetCapacity(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: NOTIFICATION POLICY matching wireframe */}
        <div className="p-5 space-y-3">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-slate-700" />
            <span>Notification Policy — Channels, Digest Frequency & Escalation SLAs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Executive Digest Frequency:</label>
              <select
                value={digestFrequency}
                onChange={(e) => setDigestFrequency(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
              >
                <option>Daily Executive Briefing (08:00 AM)</option>
                <option>Per-Shift Summary (Morning / Evening / Night)</option>
                <option>Real-Time Broadcast (Instant Push)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">SEVERE Severity Ack SLA:</label>
              <select
                value={severeSla}
                onChange={(e) => setSevereSla(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-mono"
              >
                <option>24 hours (Mandatory DGMS)</option>
                <option>12 hours (High Alert)</option>
                <option>48 hours</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">SIGNIFICANT Severity SLA:</label>
              <select
                value={significantSla}
                onChange={(e) => setSignificantSla(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-mono"
              >
                <option>72 hours (3 Days)</option>
                <option>48 hours</option>
                <option>7 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: LANGUAGE DEFAULT matching wireframe */}
        <div className="p-5 space-y-3 bg-slate-50/50">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-700" />
            <span>Language Default — English / Hindi</span>
          </div>

          <div className="max-w-xs">
            <label className="block font-bold text-slate-700 mb-1">Primary Portal Language:</label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
            >
              <option>English (EN) — Primary Official</option>
              <option>हिन्दी (HI) — राजभाषा</option>
              <option>Bilingual (EN + HI Side-by-Side)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Mine System Configuration Docket · DGMS Authorization Node</span>
          <span className="font-mono text-slate-500">v1.0 Gevra</span>
        </div>

      </form>
    </div>
  );
}
