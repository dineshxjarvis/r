'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Download,
  FilePlus2,
  Search,
  Filter,
  CheckCircle2,
  ArrowLeft,
  X,
  Printer
} from 'lucide-react';

interface MineDocItem {
  id: string;
  category: 'Regulations' | 'Instruments' | 'Mine Documents' | 'Generated Reports';
  title: string;
  badge: string;
  date: string;
  fileSize: string;
  isDownloadable?: boolean;
}

const INITIAL_DOCS: MineDocItem[] = [
  {
    id: 'DOC-MCR-AUG',
    category: 'Generated Reports',
    title: 'Monthly Compliance Report — Aug 2026',
    badge: 'Ready',
    date: 'Generated 31 Aug 2026 12:00',
    fileSize: '4.2 MB',
    isDownloadable: true
  },
  {
    id: 'DOC-EC-GEVRA',
    category: 'Instruments',
    title: 'Environmental Clearance — Gevra OCP',
    badge: 'Active',
    date: 'MoEFCC Order J-11015/85/2009-IA.II(M)',
    fileSize: '5.6 MB'
  },
  {
    id: 'DOC-SMP-2026',
    category: 'Mine Documents',
    title: 'Safety Management Plan (SMP) — Gevra OCP (2026–2031)',
    badge: 'Active',
    date: 'Approved by DGMS Central Zone',
    fileSize: '8.2 MB'
  },
  {
    id: 'DOC-CMR-2017',
    category: 'Regulations',
    title: 'Coal Mines Regulations (CMR) 2017 Statutory Gazette',
    badge: 'Statute',
    date: 'Ministry of Labour & Employment',
    fileSize: '12.4 MB'
  }
];

const TABS = ['All', 'Regulations', 'Instruments', 'Mine Documents', 'Generated Reports'] as const;

export default function MineDocumentsReportsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [docsList, setDocsList] = useState<MineDocItem[]>(INITIAL_DOCS);
  const [reportModal, setReportModal] = useState(false);
  const [reportType, setReportType] = useState('Monthly Statutory Compliance Report');
  const [reportPeriod, setReportPeriod] = useState('August 2026');

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: MineDocItem = {
      id: `DOC-REP-${Date.now()}`,
      category: 'Generated Reports',
      title: `${reportType} — ${reportPeriod}`,
      badge: 'Ready',
      date: 'Generated Just Now',
      fileSize: '3.8 MB',
      isDownloadable: true
    };
    setDocsList(prev => [newReport, ...prev]);
    setReportModal(false);
    alert(`Statutory report "${newReport.title}" successfully compiled and signed.`);
  };

  const handleUploadDoc = () => {
    const title = prompt('Enter document title to upload into mine repository:');
    if (title) {
      const newDoc: MineDocItem = {
        id: `DOC-${Date.now()}`,
        category: 'Mine Documents',
        title,
        badge: 'Uploaded',
        date: 'Uploaded by Mine Manager',
        fileSize: '1.8 MB'
      };
      setDocsList(prev => [newDoc, ...prev]);
      alert(`Document "${title}" recorded in mine archive.`);
    }
  };

  const filteredDocs = docsList.filter(d => {
    if (activeTab === 'All') return true;
    return d.category === activeTab;
  });

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
              Documents & Reports · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Statutory Returns, Executive Compliance Compilations, and Official Clearances
          </div>
        </div>

        {/* Action Controls matching wireframe: [Upload Doc] [Generate Report] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={handleUploadDoc}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded flex items-center gap-1 transition"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>[Upload Doc]</span>
          </button>

          <button
            type="button"
            onClick={() => setReportModal(true)}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>[Generate Report]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Tabs matching wireframe: [Regulations] [Instruments] [Mine Documents] [Generated Reports] */}
        <div className="p-3.5 bg-slate-100 flex items-center gap-2 flex-wrap text-xs">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded font-semibold text-xs transition border ${
                  isSelected
                    ? 'bg-[#8B0000] text-white border-[#730000] font-bold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                [{tab}]
              </button>
            );
          })}
        </div>

        {/* Documents List matching wireframe */}
        <div className="divide-y divide-slate-300">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0 pr-2">
                <div className="font-semibold text-slate-900 text-sm truncate">
                  {doc.title}
                </div>
                <div className="text-slate-500 text-[11px] truncate">
                  {doc.date} · {doc.fileSize}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] font-bold bg-slate-100 border border-slate-300 text-slate-800 px-2 py-0.5 rounded">
                  {doc.badge}
                </span>

                {doc.isDownloadable ? (
                  <button
                    type="button"
                    onClick={() => alert(`Downloading official PDF docket: ${doc.title}`)}
                    className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>[Download]</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert(`Opening document viewer for: ${doc.title}`)}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded transition"
                  >
                    [View]
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Official Mine Management & Regulatory Returns Archive</span>
          <span className="font-mono text-slate-500">DGMS & CIL Portal</span>
        </div>

      </div>

      {/* Generate Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#8B0000]" />
                <span>Generate Statutory Report</span>
              </div>
              <button
                type="button"
                onClick={() => setReportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateReport} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Report Template / Type:</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                >
                  <option>Monthly Statutory Compliance Report</option>
                  <option>DGMS Form B Defects & CAPA Summary</option>
                  <option>MoEFCC Environmental Clearance Compliance Return</option>
                  <option>Mines Act Form 11 Muster & Labour Audit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reporting Period:</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900"
                >
                  <option>August 2026</option>
                  <option>Q1 FY 2026-27 (Apr-Jun 2026)</option>
                  <option>Year-to-Date FY 2026-27</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                >
                  [Generate & Compile]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
