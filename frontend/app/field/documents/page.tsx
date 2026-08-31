'use client';

import React, { useState } from 'react';
import { Upload, Search } from 'lucide-react';

interface DocumentItem {
  id: string;
  category: 'Regulations' | 'Instruments' | 'My Submissions' | 'Reports';
  title: string;
  badge?: string;
  note?: string;
  fileSize?: string;
  uploadedDate?: string;
}

const INITIAL_DOCS: DocumentItem[] = [
  {
    id: 'DOC-CMR-2017',
    category: 'Regulations',
    title: 'CMR 2017 — Coal Mines Regulations',
    badge: 'v2022 amendment',
    fileSize: '4.8 MB',
    uploadedDate: 'Ministry of Coal'
  },
  {
    id: 'DOC-EC-GEVRA',
    category: 'Instruments',
    title: 'Environmental Clearance — Gevra OCP',
    badge: 'Active',
    fileSize: '1.2 MB',
    uploadedDate: 'MoEFCC Valid till 2035'
  },
  {
    id: 'DOC-IMG-BENCH7N',
    category: 'My Submissions',
    title: 'IMG_bench7n.jpg (my evidence, 14 Aug)',
    badge: 'Field Photo',
    fileSize: '3.4 MB',
    uploadedDate: 'Captured by Er. Rajesh Verma'
  },
  {
    id: 'DOC-PLANT-SURVEY',
    category: 'My Submissions',
    title: 'plantation_survey_aug26.pdf — AI extracted (41.3 ha)',
    badge: 'Verified',
    fileSize: '2.1 MB',
    uploadedDate: 'Survey Report'
  }
];

const TABS = ['All', 'Regulations', 'Instruments', 'My Submissions', 'Reports'] as const;

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [docs, setDocs] = useState<DocumentItem[]>(INITIAL_DOCS);

  const filteredDocs = docs.filter(doc => {
    if (activeTab !== 'All' && doc.category !== activeTab) return false;
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleUpload = () => {
    const name = prompt('Enter document title to upload:');
    if (name) {
      const newDoc: DocumentItem = {
        id: `DOC-${Date.now()}`,
        category: 'My Submissions',
        title: name,
        badge: 'New',
        fileSize: '1.0 MB',
        uploadedDate: 'Just now'
      };
      setDocs(prev => [newDoc, ...prev]);
      alert(`Document "${name}" uploaded to registry.`);
    }
  };

  const handleView = (doc: DocumentItem) => {
    alert(`Opening official document viewer for:\n${doc.title}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-sans text-slate-800 space-y-4">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Repository & Records
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-0.5">
            F-09 — Documents
          </h1>
          <div className="text-xs text-slate-600 mt-0.5">
            Documents · <span className="font-semibold text-slate-800">Gevra OCP</span>
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
        
        {/* Top Filter Tabs matching wireframe */}
        <div className="p-3.5 bg-slate-100 border-b border-slate-300 space-y-2.5 text-xs">
          {/* Search Box if opened */}
          {isSearchOpen && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents by keyword..."
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

          {/* Category Tabs: [All] [Regulations] [Instruments] [My Submissions] [Reports] */}
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
              No documents found matching the selected filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>Official Mine Documentation Registry</span>
          <span className="font-mono text-slate-500">DGMS & CIL Portal</span>
        </div>
      </div>
    </div>
  );
}
