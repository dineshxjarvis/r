'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Upload, Plus, X } from 'lucide-react';

const DOCS = [
  { id: 'D-01', name: 'Labour Licence — Form IV', type: 'Licence', date: '01 Jan 2026', size: '245 KB' },
  { id: 'D-02', name: 'CAR Insurance Policy 2026-27', type: 'Insurance', date: '15 Feb 2026', size: '1.2 MB' },
  { id: 'D-03', name: 'Safety Management Plan v3', type: 'Safety Plan', date: '14 Mar 2026', size: '3.1 MB' },
  { id: 'D-04', name: 'Roster — Aug 2026 (312 Workers)', type: 'Roster PDF', date: '01 Aug 2026', size: '890 KB' }
];

export default function ContractorDocumentsPage() {
  const [docs, setDocs] = useState(DOCS);
  const [uploadModal, setUploadModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Licence');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;
    setDocs(prev => [{
      id: `D-0${prev.length + 1}`,
      name: docName,
      type: docType,
      date: '31 Aug 2026',
      size: '—'
    }, ...prev]);
    alert(`Document uploaded (POST /documents). Linked to contractor account automatically.`);
    setDocName('');
    setUploadModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/contractor/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />← Back
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-base font-bold text-slate-900">Documents · Acme Mining Services</h1>
        </div>
        <button
          type="button"
          onClick={() => setUploadModal(true)}
          className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1 text-xs shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          [Upload Document]
        </button>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        <div className="grid grid-cols-4 gap-3 px-4 py-2.5 bg-slate-100 font-bold text-slate-700">
          <span>Document Name</span>
          <span>Type</span>
          <span>Uploaded</span>
          <span>Size</span>
        </div>
        {docs.map((doc) => (
          <div key={doc.id} className="grid grid-cols-4 gap-3 px-4 py-3 items-center hover:bg-slate-50 transition">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-bold text-slate-900 truncate">{doc.name}</span>
            </div>
            <span className="font-mono text-slate-600">{doc.type}</span>
            <span className="font-mono text-slate-500">{doc.date}</span>
            <span className="font-mono text-slate-500">{doc.size}</span>
          </div>
        ))}
        <div className="p-3 bg-slate-50 text-[11px] text-slate-600 flex justify-between">
          <span>GET /documents?filter[organization_id]=… · Contractor Document Library</span>
          <span className="font-mono text-slate-500">SECL Korba</span>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#8B0000]" />
                <span>Upload Contractor Document</span>
              </div>
              <button type="button" onClick={() => setUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Name:</label>
                <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Labour Licence — Renewal 2027" className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-semibold" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Type:</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-2 border border-slate-300 rounded bg-white text-xs">
                  <option>Licence</option>
                  <option>Insurance</option>
                  <option>Safety Plan</option>
                  <option>Roster PDF</option>
                  <option>Certificate</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">File:</label>
                <input type="file" accept=".pdf,.jpg,.png" className="w-full text-xs" required />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setUploadModal(false)} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs">[Upload]</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
