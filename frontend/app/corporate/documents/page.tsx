'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Brain,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  FileCheck,
  ShieldAlert,
  Sparkles,
  BookOpen,
  Scale,
  Clock
} from 'lucide-react';

interface ExtractionItem {
  id: string;
  docTitle: string;
  sourceAuthority: string;
  extractedClausesCount: number;
  confidenceScore: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'CONFLICT_DETECTED';
  conflictClause?: string;
  summary: string;
}

const INITIAL_EXTRACTIONS: ExtractionItem[] = [
  {
    id: 'EXT-2026-08',
    docTitle: 'MoEFCC Amendment Circular 2026-08',
    sourceAuthority: 'Ministry of Environment, Forest & Climate Change',
    extractedClausesCount: 3,
    confidenceScore: '96.4%',
    status: 'CONFLICT_DETECTED',
    conflictClause: 'Draft Clause 4.2 vs Gevra EC-Cond 14 (Greenbelt Width)',
    summary: 'Requires quarterly drone canopy density indexing over reclaimed overburden dumps.'
  },
  {
    id: 'EXT-DGMS-02',
    docTitle: 'DGMS Circular No. 02 of 2026 — Ergonomic HEMM Audit',
    sourceAuthority: 'Directorate General of Mines Safety',
    extractedClausesCount: 4,
    confidenceScore: '98.1%',
    status: 'PENDING_REVIEW',
    summary: 'Mandates annual whole-body vibration testing for operators of dumpers > 60T.'
  }
];

export default function DocumentIntelligencePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [extractions, setExtractions] = useState<ExtractionItem[]>(INITIAL_EXTRACTIONS);
  const [uploadModal, setUploadModal] = useState(false);
  const [aiAssistOpen, setAiAssistOpen] = useState(false);
  const [conflictModalItem, setConflictModalItem] = useState<ExtractionItem | null>(null);
  const [selectedConfidenceItem, setSelectedConfidenceItem] = useState<ExtractionItem | null>(null);

  const handleApproveExtraction = (id: string) => {
    setExtractions(prev =>
      prev.map(e =>
        e.id === id ? { ...e, status: 'APPROVED' } : e
      )
    );
    alert(`Extraction ${id} approved by Compliance Authority. Materialising dated obligation instances across all subsidiary mines (POST /obligation-instances).`);
  };

  const handleResolveConflict = (id: string) => {
    setExtractions(prev =>
      prev.map(e =>
        e.id === id ? { ...e, status: 'APPROVED', conflictClause: undefined } : e
      )
    );
    alert(`Conflict resolved under legal precedence (MoEFCC Special Condition overrules General Circular). Obligation updated (POST /obligation-conflicts/{id}/actions {action:"RESOLVE"}).`);
    setConflictModalItem(null);
  };

  const handleUploadSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const newExt: ExtractionItem = {
      id: `EXT-${Date.now()}`,
      docTitle: 'CEA Safety Regulations (Amendment) 2026',
      sourceAuthority: 'Central Electricity Authority',
      extractedClausesCount: 2,
      confidenceScore: '97.8%',
      status: 'PENDING_REVIEW',
      summary: 'Automated ground monitoring sensor calibration on all high-voltage draglines.'
    };
    setExtractions(prev => [newExt, ...prev]);
    setUploadModal(false);
    alert('Document ingested. OCR & LLM extraction completed (POST /documents -> POST /extractions). 2 new draft obligations pending compliance approval.');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 font-sans text-slate-800">
      {/* Title & Page Header */}
      <div className="bg-white border border-slate-300 rounded shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/corporate/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#8B0000] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Portfolio</span>
            </Link>
            <span className="text-slate-300">|</span>
            <h1 className="text-base font-bold text-slate-900">
              Document Intelligence & Regulation Library
            </h1>
          </div>
          <div className="text-xs text-slate-600">
            Novelty Pillar 1: Hybrid AI Ingestion, OCR Layout Extraction & Human-in-the-Loop Adaptability
          </div>
        </div>

        {/* Action Controls matching wireframe: [Upload Doc] */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto font-mono text-xs font-bold">
          <button
            type="button"
            onClick={() => setUploadModal(true)}
            className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white rounded flex items-center gap-1 transition shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>[Upload Doc]</span>
          </button>
        </div>
      </div>

      {/* Main Container matching wireframe */}
      <div className="bg-white border border-slate-300 rounded shadow-xs overflow-hidden divide-y divide-slate-300 text-xs">
        
        {/* Search Bar & AI Assist matching wireframe: [Search regulations...] [AI Assist 🧠] */}
        <div className="p-3.5 bg-slate-100 flex items-center gap-2 flex-wrap text-xs">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search regulations, documents, conditions, or statutory clauses..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#8B0000]"
            />
          </div>

          <button
            type="button"
            onClick={() => setAiAssistOpen(!aiAssistOpen)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded flex items-center gap-1.5 transition text-xs shadow-2xs"
          >
            <Brain className="w-3.5 h-3.5 text-[#8B0000]" />
            <span>[AI Assist 🧠]</span>
          </button>
        </div>

        {/* AI Assist Explanation Banner if toggled */}
        {aiAssistOpen && (
          <div className="p-4 bg-red-50/40 border-b border-red-200 text-slate-800 space-y-2 animate-in fade-in duration-100">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8B0000]" />
              <span>Strata Document Intelligence Engine:</span>
            </div>
            <div className="text-[11px] text-slate-700 space-y-1">
              <p>• Automatically parses non-standard gazette PDFs, circulars, and environmental consents.</p>
              <p>• Identifies statutory mandates vs general advisory guidelines.</p>
              <p>• <strong>Zero autonomous deployment:</strong> AI drafts obligation instances, but human compliance head must review and approve before any mine deadline is scheduled.</p>
            </div>
          </div>
        )}

        {/* SECTION 1: ACTIVE REGULATIONS matching wireframe */}
        <div className="p-4 space-y-2.5 bg-slate-50/30">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-700" />
              <span>ACTIVE REGULATIONS — CMR 2017: 186 regs, 42 applicable to you</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => alert('Opening statutory clause browser (186 regulations across 16 chapters)...')}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded"
              >
                [Browse clauses]
              </button>

              <Link
                href="/corporate/obligations"
                className="px-2.5 py-1 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs"
              >
                [View obligations extracted]
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-2.5 bg-white border border-slate-200 rounded">
              <div className="font-bold text-slate-900 font-sans">Coal Mines Regulations (CMR) 2017</div>
              <div className="text-slate-500">186 Regulations · 42 Applicable Obligations</div>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded">
              <div className="font-bold text-slate-900 font-sans">Mines Act 1952 & Rules 1955</div>
              <div className="text-slate-500">88 Sections · 14 Mandates Active</div>
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded">
              <div className="font-bold text-slate-900 font-sans">MoEFCC Environmental Clearance (EC)</div>
              <div className="text-slate-500">32 Specific Conditions · 12 General Conditions</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: RECENT AI EXTRACTIONS matching wireframe */}
        <div className="p-4 space-y-3">
          <div className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-[#8B0000]" />
            <span>RECENT AI EXTRACTIONS — PENDING HUMAN REVIEW & APPROVAL</span>
          </div>

          <div className="space-y-3">
            {extractions.map((item) => {
              const isConflict = item.status === 'CONFLICT_DETECTED';
              const isApproved = item.status === 'APPROVED';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded border space-y-2.5 transition ${
                    isConflict
                      ? 'bg-red-50/30 border-red-300'
                      : isApproved
                      ? 'bg-emerald-50/20 border-emerald-300'
                      : 'bg-white border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          isConflict ? 'bg-red-600' : isApproved ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                      />
                      <span className="font-bold text-slate-900 text-xs">
                        {item.docTitle}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-[11px]">
                        {item.sourceAuthority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedConfidenceItem(item)}
                        className="font-mono text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 px-1.5 py-0.2 rounded text-slate-700 font-semibold"
                      >
                        Confidence: {item.confidenceScore} ⓘ
                      </button>

                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isConflict
                            ? 'bg-red-100 text-red-900 border-red-300'
                            : isApproved
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        [{item.status}]
                      </span>
                    </div>
                  </div>

                  <div className="pl-4.5 text-xs text-slate-700 space-y-1">
                    <div>{item.summary}</div>
                    {item.conflictClause && (
                      <div className="font-mono text-[11px] text-red-700 font-bold flex items-center gap-1.5 bg-red-100/60 p-1.5 rounded border border-red-200">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Conflict Detected: {item.conflictClause}</span>
                      </div>
                    )}
                  </div>

                  <div className="pl-4.5 flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {isConflict ? (
                        <button
                          type="button"
                          onClick={() => setConflictModalItem(item)}
                          className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded transition shadow-xs text-xs"
                        >
                          [Resolve Conflict]
                        </button>
                      ) : isApproved ? (
                        <span className="text-emerald-700 font-mono font-bold text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>[Approved & Obligations Materialised ✓]</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApproveExtraction(item.id)}
                          className="px-3 py-1 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded transition shadow-xs text-xs"
                        >
                          [Review & approve]
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => alert(`Viewing full extracted clauses for: ${item.docTitle}`)}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded text-xs"
                      >
                        [View extraction]
                      </button>
                    </div>

                    <span className="font-mono text-[11px] text-slate-500">
                      {item.extractedClausesCount} clauses extracted
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: REGULATION ADAPTABILITY CALLOUT matching wireframe */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-300 space-y-1 text-[11px] text-slate-700 font-sans">
          <div className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            REGULATION ADAPTABILITY
          </div>
          <p>
            When a new regulation or circular is uploaded, Strata AI extracts new clauses, flags conflicts against existing mine consents, and drafts obligation instances. <strong>A human compliance officer must approve each clause before any obligation goes live on the mine dashboard.</strong>
          </p>
        </div>

      </div>

      {/* Upload Document Modal */}
      {uploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#8B0000]" />
                <span>Upload New Regulation / Gazette</span>
              </div>
              <button
                type="button"
                onClick={() => setUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSimulate} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Title / Gazette Number:</label>
                <input
                  type="text"
                  defaultValue="CEA Safety Regulations (Amendment) 2026"
                  className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Issuing Authority:</label>
                <select className="w-full p-2 border border-slate-300 rounded bg-white text-xs text-slate-900">
                  <option>Central Electricity Authority (CEA)</option>
                  <option>Directorate General of Mines Safety (DGMS)</option>
                  <option>Ministry of Environment, Forest & Climate Change (MoEFCC)</option>
                  <option>State Pollution Control Board (CEPCB)</option>
                </select>
              </div>

              <div className="p-3 border-2 border-dashed border-slate-300 rounded bg-slate-50 text-center text-slate-600">
                <FileText className="w-6 h-6 mx-auto mb-1 text-slate-400" />
                <span>Select PDF or drop statutory instrument file here</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModal(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#8B0000] hover:bg-[#730000] text-white font-bold rounded shadow-xs"
                >
                  [Ingest & Run AI Extraction]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal */}
      {conflictModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-lg w-full p-5 space-y-3.5 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-red-700" />
                <span>Resolve Statutory Conflict</span>
              </div>
              <button
                type="button"
                onClick={() => setConflictModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-slate-800">
              <div className="p-2.5 bg-red-50 border border-red-200 rounded space-y-1">
                <div className="font-bold text-red-900">Clause A (Existing Condition):</div>
                <div className="text-[11px] text-slate-700">Gevra EC Condition 14: 50m greenbelt width required along outer OB toe.</div>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded space-y-1">
                <div className="font-bold text-amber-900">Clause B (New MoEFCC Circular 2026-08):</div>
                <div className="text-[11px] text-slate-700">General Circular 2026-08: Recommends 100m greenbelt where adjoining forest boundary.</div>
              </div>

              <div className="text-slate-600 text-[11px]">
                <strong>Legal Recommendation:</strong> Mine-specific Environmental Clearance (EC) Condition 14 governs until next 5-year lease renewal. Apply 100m only to Phase-2 expansion parcel.
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConflictModalItem(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleResolveConflict(conflictModalItem.id)}
                className="px-3 py-1.5 bg-[#8B0000] text-white font-bold rounded shadow-xs"
              >
                [Confirm Resolution & Apply]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confidence Score Modal */}
      {selectedConfidenceItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-400 rounded-lg max-w-sm w-full p-4 space-y-3 shadow-xl text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="font-bold text-sm text-slate-900">
                AI Extraction Confidence Score
              </div>
              <button
                type="button"
                onClick={() => setSelectedConfidenceItem(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-800">
              <div className="flex justify-between">
                <span>OCR Text Quality:</span>
                <span className="font-bold text-emerald-700">99.2%</span>
              </div>
              <div className="flex justify-between">
                <span>Clause Boundary Detection:</span>
                <span className="font-bold text-emerald-700">96.8%</span>
              </div>
              <div className="flex justify-between">
                <span>Applicability Mapping:</span>
                <span className="font-bold text-emerald-700">94.5%</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span>Composite Confidence:</span>
                <span className="text-[#8B0000]">{selectedConfidenceItem.confidenceScore}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedConfidenceItem(null)}
                className="px-3 py-1 bg-slate-800 text-white rounded font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
