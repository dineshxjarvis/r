'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, Upload, AlertTriangle, X } from 'lucide-react';

interface ComplianceItem {
  id: string;
  label: string;
  validity: string;
  status: 'VALID' | 'DUE_SOON' | 'EXPIRED';
  renewalAllowed: boolean;
}

const COMPLIANCE_ITEMS: ComplianceItem[] = [
  { id: 'CI-01', label: 'Labour Licence', validity: 'Valid until 31 Dec 2026', status: 'VALID', renewalAllowed: false },
  { id: 'CI-02', label: 'Insurance (CAR policy)', validity: 'Valid until 15 Feb 2027', status: 'VALID', renewalAllowed: false },
  { id: 'CI-03', label: 'Safety Plan', validity: 'Renewal due 15 Sep 2026', status: 'DUE_SOON', renewalAllowed: true }
];

export default function ContractorCompliancePage() {
  const [items, setItems] = useState<ComplianceItem[]>(COMPLIANCE_ITEMS);
  const [uploadModal, setUploadModal] = useState<ComplianceItem | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadRenewal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModal) return;
    setUploading(true);
    setTimeout(() => {
      setItems(prev => prev.map(i => i.id === uploadModal.id
        ? { ...i, status: 'VALID' as const, validity: 'Under review — renewed 31 Aug 2026', renewalAllowed: false }
        : i
      ));
      alert(`Renewal document uploaded and submitted for Mine Manager review (POST /documents → POST /contractor-requirement-instances/{id}/actions {action:"SUBMIT"}).`);
      setUploading(false);
      setUploadModal(null);
    }, 700);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/contractor/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />← Back
          </Link>
          <span className="text-slate-300">|</span>
          <h1 className="text-base font-bold text-slate-900">Compliance Register · Acme Mining Services</h1>
        </div>

        <button
          type="button"
          onClick={() => setUploadModal(items.find(i => i.renewalAllowed) || null)}
          className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded flex items-center gap-1 text-xs shadow-xs transition"
        >
          <Upload className="w-3.5 h-3.5" />
          [Upload Renewal]
        </button>
      </div>

      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        {/* Table header */}
        <div className="grid grid-cols-3 gap-4 px-4 py-2.5 bg-slate-100 font-bold text-slate-700">
          <span>Requirement</span>
          <span>Validity</span>
          <span>Status</span>
        </div>

        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-3 gap-4 px-4 py-3 items-center hover:bg-slate-50 transition">
            <span className="font-bold text-slate-900">{item.label}</span>
            <span className="font-mono text-slate-700">{item.validity}</span>
            <div className="flex items-center gap-2">
              {item.status === 'VALID' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : item.status === 'DUE_SOON' ? (
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              {item.renewalAllowed && (
                <button
                  type="button"
                  onClick={() => setUploadModal(item)}
                  className="px-2.5 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-[#8B0000] font-bold rounded transition"
                >
                  [Upload Renewal]
                </button>
              )}
            </div>
          </div>
        ))}

        <div className="p-3 bg-slate-50 text-[11px] text-slate-600 flex justify-between">
          <span>GET /contractor-requirement-instances · Acme Mining Services</span>
          <span className="font-mono text-slate-500">SECL · Korba</span>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#8B0000]" />
                <span>Upload Renewal — {uploadModal.label}</span>
              </div>
              <button type="button" onClick={() => setUploadModal(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadRenewal} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Document File:</label>
                <input type="file" accept=".pdf,.jpg,.png" className="w-full text-xs" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Validity Until:</label>
                <input type="date" defaultValue="2027-12-31" className="w-full p-2 border border-slate-300 rounded bg-white text-xs font-mono" required />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" onClick={() => setUploadModal(null)} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded">Cancel</button>
                <button type="submit" disabled={uploading} className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs disabled:opacity-60">
                  {uploading ? 'Uploading...' : '[Submit Renewal]'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
