'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, Search, Users, ArrowLeft } from 'lucide-react';

interface LabourDocItem {
  id: string;
  category: 'Statutory Registers' | 'Licences' | 'Wage Records' | 'Roster Approvals';
  title: string;
  badge?: string;
  fileSize?: string;
  uploadedDate?: string;
  actionType: 'view' | 'upload';
}

const INITIAL_LABOUR_DOCS: LabourDocItem[] = [
  {
    id: 'DOC-FORM-11',
    category: 'Statutory Registers',
    title: 'Form 11 — Register of persons employed',
    badge: 'Up to date',
    fileSize: '3.8 MB',
    uploadedDate: 'Mines Act 1952 Section 48',
    actionType: 'view'
  },
  {
    id: 'DOC-CLRA-LIC',
    category: 'Licences',
    title: 'Contractor labour licence',
    badge: 'Valid to 31 Dec',
    fileSize: '1.5 MB',
    uploadedDate: 'CLRA Act 1970 Licence #881',
    actionType: 'view'
  },
  {
    id: 'DOC-WAGE-AUG',
    category: 'Wage Records',
    title: 'Monthly wages statement — Aug 2026',
    badge: 'Due 05 Sep',
    fileSize: 'Pending file',
    uploadedDate: 'Payment of Wages (Mines) Rules',
    actionType: 'upload'
  }
];

const TABS = ['All', 'Statutory Registers', 'Licences', 'Wage Records', 'Roster Approvals'] as const;

export default function LabourDocumentsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [docs, setDocs] = useState<LabourDocItem[]>(INITIAL_LABOUR_DOCS);

  const filteredDocs = docs.filter(doc => {
    if (activeTab !== 'All' && doc.category !== activeTab) return false;
    return true;
  });

  const handleUpload = () => {
    const name = prompt('Enter statutory labour register/document title:');
    if (name) {
      const newDoc: LabourDocItem = {
        id: `DOC-LABOUR-${Date.now()}`,
        category: 'Statutory Registers',
        title: name,
        badge: 'New Upload',
        fileSize: '1.1 MB',
        uploadedDate: 'Logged by Labour Officer',
        actionType: 'view'
      };
      setDocs(prev => [newDoc, ...prev]);
      alert(`Labour document "${name}" logged to statutory registry.`);
    }
  };

  const handleView = (doc: LabourDocItem) => {
    alert(`Opening official labour document viewer for:\n${doc.title}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/field/attendance"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Labour Documents · Gevra OCP
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Mines Act 1952 statutory registers, contractor licences, and wage compliance statements
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleUpload}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>[Upload Document]</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        
        {/* Top Filter Tabs matching wireframe */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
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
        </div>

        {/* Documents List matching wireframe */}
        <div className="divide-y divide-slate-300">
          {filteredDocs.map((item) => (
            <div
              key={item.id}
              className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 min-w-0 pr-2">
                <div className="font-semibold text-slate-900 text-sm truncate">
                  {item.title}
                </div>
                {item.uploadedDate && (
                  <div className="text-slate-500 text-[11px] truncate">
                    {item.uploadedDate} {item.fileSize && `· ${item.fileSize}`}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {item.badge && (
                  <span className="bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-mono px-2 py-0.5 rounded font-medium shrink-0">
                    {item.badge}
                  </span>
                )}

                {item.actionType === 'view' ? (
                  <button
                    onClick={() => handleView(item)}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-900 rounded transition shrink-0"
                  >
                    [View]
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      alert('Opening wages return PDF upload modal...');
                    }}
                    className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded transition shadow-xs shrink-0"
                  >
                    [Upload]
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              No labour documents found matching the selected filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Office of Chief Labour Commissioner (Central) Registry</span>
          <span className="font-mono text-slate-500">Ministry of Labour & Employment</span>
        </div>
      </div>
    </div>
  );
}
