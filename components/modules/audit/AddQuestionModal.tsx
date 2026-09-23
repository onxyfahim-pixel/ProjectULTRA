'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  FileText,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Check,
  ZoomIn,
  ShieldAlert,
} from 'lucide-react';
import { AuditChecklistItem, AuditPhotoEvidence, AuditQuestionStatus } from '@/lib/types/modules';
import { parseQuestionsFromText } from './iso9001ChecklistData';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (item: AuditChecklistItem) => void;
  onImportQuestions: (items: AuditChecklistItem[]) => void;
  showToast: (msg: string) => void;
}

export function AddQuestionModal({
  isOpen,
  onClose,
  onAddQuestion,
  onImportQuestions,
  showToast,
}: AddQuestionModalProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Question Form State
  const [clause, setClause] = useState('Clause 8: Operation');
  const [clauseNumber, setClauseNumber] = useState('');
  const [subClauseTitle, setSubClauseTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [guidance, setGuidance] = useState('');
  const [remark, setRemark] = useState('');
  const [status, setStatus] = useState<AuditQuestionStatus>('CONFORMITY');
  const [photos, setPhotos] = useState<AuditPhotoEvidence[]>([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Bulk Import State
  const [rawText, setRawText] = useState('');

  const parsedQuestions = useMemo(() => {
    if (!rawText.trim()) return [];
    return parseQuestionsFromText(rawText);
  }, [rawText]);

  if (!isOpen) return null;

  const handlePhotosUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    const readers = fileArray.map((file) => {
      return new Promise<AuditPhotoEvidence>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            url: e.target?.result as string,
            caption: file.name,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((newPhotos) => {
      setPhotos((prev) => [...prev, ...newPhotos]);
      showToast(`Added ${newPhotos.length} image evidence(s)`);
    });
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      showToast('Please enter the question text');
      return;
    }

    let itemScore = 0;
    if (status === 'CONFORMITY') itemScore = 1.0;
    else if (status === 'MINOR_NC') itemScore = 0.75;
    else if (status === 'MAJOR_NC') itemScore = 0.50;
    else if (status === 'CRITICAL_NC') itemScore = 0;
    else if (status === 'NA') itemScore = 0;

    const newItem: AuditChecklistItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clause,
      clauseNumber: clauseNumber.trim() || 'Custom',
      subClauseTitle: subClauseTitle.trim() || 'Custom Verification Clause',
      question: question.trim(),
      guidance: guidance.trim() || undefined,
      remark: remark.trim() || undefined,
      status,
      maxScore: 1,
      score: itemScore,
      evidencePhotos: photos,
      evidencePhoto: photos[0]?.url,
    };

    onAddQuestion(newItem);
    showToast(`Added question ${newItem.clauseNumber} to checklist`);
    onClose();
  };

  const handleImportBulk = () => {
    if (parsedQuestions.length === 0) {
      showToast('No questions could be parsed from the provided text.');
      return;
    }

    onImportQuestions(parsedQuestions);
    showToast(`Successfully imported ${parsedQuestions.length} audit questions!`);
    setRawText('');
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
        showToast(`Loaded questions file: ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Add or Upload Audit Questions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add custom audit criteria with multiple image evidences or bulk import questions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-100 px-5 pt-3 bg-white gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'single'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Add Single Question
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload / Paste Questions</span>
            {parsedQuestions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-700">
                {parsedQuestions.length}
              </span>
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'single' ? (
            <form id="single-question-form" onSubmit={handleSaveSingle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Standard Clause *
                  </label>
                  <select
                    value={clause}
                    onChange={(e) => setClause(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Clause 4: Context of the Organization">Clause 4: Context of the Organization</option>
                    <option value="Clause 5: Leadership">Clause 5: Leadership</option>
                    <option value="Clause 6: Planning">Clause 6: Planning</option>
                    <option value="Clause 7: Support">Clause 7: Support</option>
                    <option value="Clause 8: Operation">Clause 8: Operation</option>
                    <option value="Clause 9: Performance Evaluation">Clause 9: Performance Evaluation</option>
                    <option value="Clause 10: Improvement">Clause 10: Improvement</option>
                    <option value="Custom Verification Clause">Custom Verification Clause</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Clause Number / Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 8.5.7a or QA-SPE-01"
                    value={clauseNumber}
                    onChange={(e) => setClauseNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sub-Clause / Area Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cutting Quality & Marker Traceability"
                  value={subClauseTitle}
                  onChange={(e) => setSubClauseTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Audit Question / Requirement *
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter the exact auditing question, requirement, or verification check..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Verification Criteria / SOP Guidance
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspect marker efficiency logs, CAD cut order reports..."
                  value={guidance}
                  onChange={(e) => setGuidance(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Status and Initial Remark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Initial Audit Finding / Status & Scoring
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
                    <button
                      type="button"
                      onClick={() => setStatus('CONFORMITY')}
                      className={`flex-1 min-w-[100px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        status === 'CONFORMITY'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      Conformity (100%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('MINOR_NC')}
                      className={`flex-1 min-w-[100px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        status === 'MINOR_NC' || status === 'NON_CONFORMITY'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-amber-700'
                      }`}
                    >
                      Minor NC (75%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('MAJOR_NC')}
                      className={`flex-1 min-w-[100px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        status === 'MAJOR_NC'
                          ? 'bg-orange-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-orange-700'
                      }`}
                    >
                      Major NC (50%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('CRITICAL_NC')}
                      className={`flex-1 min-w-[100px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        status === 'CRITICAL_NC'
                          ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400'
                          : 'text-slate-600 hover:text-rose-700'
                      }`}
                    >
                      Critical NC (0% Fail)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('NA')}
                      className={`flex-1 min-w-[80px] py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        status === 'NA'
                          ? 'bg-slate-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      N/A (Excl.)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Auditor Remark / Evidence Description
                  </label>
                  <input
                    type="text"
                    placeholder="Findings and physical check notes..."
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Multiple Image Evidences Upload */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Upload Multiple Image Evidences ({photos.length})</span>
                  </label>
                  <label className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select Images</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handlePhotosUpload(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center"
                      >
                        <img
                          src={photo.url}
                          alt="Evidence"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setPreviewPhoto(photo.url)}
                        />
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(photo.url)}
                            className="p-1 rounded-md bg-white text-slate-800 hover:bg-slate-100 cursor-pointer"
                            title="Preview"
                          >
                            <ZoomIn className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(photo.id)}
                            className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-xs font-medium text-slate-500 cursor-pointer transition-colors text-center">
                    <Camera className="w-6 h-6 text-blue-500 mb-1" />
                    <span className="font-semibold text-slate-700">Click to choose multiple photos</span>
                    <span className="text-[11px] text-slate-400">JPG, PNG, WebP supported</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handlePhotosUpload(e.target.files);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 leading-relaxed">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-blue-700" />
                  <span>Automatic Question Parser</span>
                </p>
                Paste audit questions starting with clause numbers (e.g.{' '}
                <span className="font-mono font-semibold">4.1a How has the organization...</span> or{' '}
                <span className="font-mono font-semibold">5.1.1a Show me how top management...</span>).
                The system will automatically categorize clauses, assign scoring weights, and add them into your live audit feed.
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Paste Question List Below:
                </label>
                <label className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Text / JSON File</span>
                  <input
                    type="file"
                    accept=".txt,.json,.csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="4.1a How has the organization determined external and internal issues relevant to its purpose?&#10;&#10;4.1b How do you monitor and review information about these internal and external issues?&#10;&#10;5.1.1a Demonstrate their leadership as it applies to their areas of responsibility..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />

              {parsedQuestions.length > 0 && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-900">
                      {parsedQuestions.length} Questions Successfully Detected
                    </span>
                  </div>
                  <span className="text-emerald-700 font-mono text-[11px]">
                    Ready to append to checklist
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {activeTab === 'single' ? (
            <button
              type="submit"
              form="single-question-form"
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question to Checklist</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleImportBulk}
              disabled={parsedQuestions.length === 0}
              className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-xs cursor-pointer ${
                parsedQuestions.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Import {parsedQuestions.length} Questions</span>
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] bg-white rounded-2xl overflow-hidden p-2">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/60 text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewPhoto} alt="Evidence" className="w-full h-auto object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
