'use client';

import React, { useState } from 'react';
import { Upload, Search, Shield } from 'lucide-react';

interface DocumentItem {
  id: string;
  category: 'Safety Circulars' | 'Safety Plans' | 'My Submissions' | 'Certificates';
  title: string;
  badge?: string;
  note?: string;
  fileSize?: string;
  uploadedDate?: string;
}

const SAFETY_DOCS: DocumentItem[] = [
  {
    id: 'DOC-DGMS-CIRC-04',
    category: 'Safety Circulars',
    title: 'DGMS Circular No. 04 of 2022 — Ventilation & Dust Standards',
    badge: 'Statutory Directive',
    fileSize: '1.4 MB',
    uploadedDate: 'Directorate General of Mines Safety'
  },
  {
    id: 'DOC-SMP-2026',
    category: 'Safety Plans',
    title: 'Safety Management Plan (SMP) — Gevra OCP (2026–2031)',
    badge: 'Approved by DGMS',
    fileSize: '8.2 MB',
    uploadedDate: 'SECL Safety Directorate'
  },
  {
    id: 'DOC-FIRE-DRILL-AUG',
    category: 'My Submissions',
    title: 'Monthly Fire Drill Muster Roll & Audit Certificate (Aug 2026)',
    badge: 'Under Verification',
    fileSize: '2.4 MB',
    uploadedDate: 'Submitted by Er. Rajesh Verma'
  },
  {
    id: 'DOC-CAPA-BERM-CERT',
    category: 'Certificates',
    title: 'Haul Road Berm Construction & Compaction Sign-off Certificate',
    badge: 'Verified ✓',
    fileSize: '3.1 MB',
    uploadedDate: 'Civil & Safety Joint Inspection'
  }
];

const TABS = ['All', 'Safety Circulars', 'Safety Plans', 'My Submissions', 'Certificates'] as const;

export default function SafetyDocumentsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [docs, setDocs] = useState<DocumentItem[]>(SAFETY_DOCS);

  const filteredDocs = docs.filter(doc => {
    if (activeTab !== 'All' && doc.category !== activeTab) return false;
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleUpload = () => {
    const name = prompt('Enter safety document or certificate title:');
    if (name) {
      const newDoc: DocumentItem = {
        id: `DOC-SAFE-${Date.now()}`,
        category: 'My Submissions',
        title: name,
        badge: 'New Upload',
        fileSize: '1.2 MB',
        uploadedDate: 'Just now by Safety Officer'
      };
      setDocs(prev => [newDoc, ...prev]);
      alert(`Safety document "${name}" logged to statutory registry.`);
    }
  };

  const handleView = (doc: DocumentItem) => {
    alert(`Opening official document intelligence viewer for:\n${doc.title}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>Safety Department Records</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            Safety Documents & Statutory Certificates · Gevra OCP
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            DGMS circulars, Safety Management Plans (SMP), and certified officer returns
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleUpload}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white text-xs font-bold rounded flex items-center gap-1 transition shadow-xs shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>[Upload Safety Record]</span>
          </button>

          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded flex items-center gap-1 transition shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-slate-600" />
            <span>[🔍]</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden">
        
        {/* Top Filter Tabs */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 space-y-2.5 text-xs">
          {/* Search Box if opened */}
          {isSearchOpen && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search safety circulars, plans, certificates..."
                className="w-full sm:w-80 border border-slate-300 rounded p-1.5 bg-white text-xs text-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-slate-500 hover:text-slate-900 font-bold"
                >
                  [Clear]
                </button>
              )}
            </div>
          )}

          {/* Category Tabs */}
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

        {/* Documents List */}
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

              <div className="flex items-center gap-2.5 shrink-0">
                {item.badge && (
                  <span className="bg-slate-100 border border-slate-300 text-slate-800 text-[11px] font-mono px-2 py-0.5 rounded font-medium shrink-0">
                    {item.badge}
                  </span>
                )}

                <button
                  onClick={() => handleView(item)}
                  className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-900 rounded transition shrink-0"
                >
                  [View]
                </button>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              No safety documents found matching the filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>CMR 2017 Reg. 29 Statutory Safety Records Archive</span>
          <span className="font-mono text-slate-500">DGMS Zone 3</span>
        </div>
      </div>
    </div>
  );
}
