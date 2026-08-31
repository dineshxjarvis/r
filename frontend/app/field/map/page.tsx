'use client';

import React from 'react';
import Link from 'next/link';
import { GISMap } from '@/app/components/shared/GISMap';
import { ArrowLeft, MapPin } from 'lucide-react';

export default function FieldGisMapPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/field/dashboard"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              GET /spatial-topologies & /governed-geometry-versions
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Field GIS Mine Map</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gevra OCP · High-precision georeferenced drone orthomosaic, bench boundaries, and active hazard pins.
          </p>
        </div>
      </div>

      {/* Shared GIS Component */}
      <GISMap mineName="Gevra OCP (SECL)" scope="Field Operations & Daily Inspection Overlay" />
    </div>
  );
}
