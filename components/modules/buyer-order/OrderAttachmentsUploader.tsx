'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileSpreadsheet,
  FileCheck2,
  Trash2,
  Download,
  Plus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Paperclip,
  File,
  X,
  Tag,
  Info,
} from 'lucide-react';
import { OrderAttachment, OrderAttachmentCategory } from '@/lib/types/modules';
import {
  ATTACHMENT_CATEGORIES,
  formatFileSize,
  getFileExtension,
  getFileExtensionColor,
  downloadOrderAttachment,
  generateSampleOrderAttachments,
} from './order-attachment-utils';

interface OrderAttachmentsUploaderProps {
  attachments: OrderAttachment[];
  onChange: (attachments: OrderAttachment[]) => void;
  orderNumber?: string;
  styleNumber?: string;
  showToast?: (msg: string) => void;
  readOnly?: boolean;
}

export function OrderAttachmentsUploader({
  attachments,
  onChange,
  orderNumber = 'PO-ORDER',
  styleNumber = 'STY-STYLE',
  showToast,
  readOnly = false,
}: OrderAttachmentsUploaderProps) {
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] =
    useState<OrderAttachmentCategory>('MEASUREMENT_SPEC');
  const [filterCategory, setFilterCategory] = useState<'ALL' | OrderAttachmentCategory>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered list
  const filteredAttachments =
    filterCategory === 'ALL'
      ? attachments
      : attachments.filter((a) => a.category === filterCategory);

  // Handle multi-file upload
  const handleFilesSelected = (files: FileList | null, overrideCategory?: OrderAttachmentCategory) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const categoryToUse = overrideCategory || selectedCategoryForUpload;
    const fileArray = Array.from(files);
    let loadedCount = 0;
    const newAttachments: OrderAttachment[] = [];
    const now = new Date().toISOString().split('T')[0];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newAttachments.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          category: categoryToUse,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || file.name.split('.').pop() || 'document',
          fileData: reader.result as string,
          uploadedAt: now,
          uploadedBy: 'Current User (Merchandising / QC)',
          notes: `${ATTACHMENT_CATEGORIES[categoryToUse]?.label} file uploaded on ${now}`,
        });

        loadedCount++;
        if (loadedCount === fileArray.length) {
          setIsUploading(false);
          onChange([...attachments, ...newAttachments]);
          showToast?.(
            `✓ Successfully uploaded ${newAttachments.length} file(s) under ${ATTACHMENT_CATEGORIES[categoryToUse]?.label}`
          );
        }
      };

      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === fileArray.length) {
          setIsUploading(false);
          if (newAttachments.length > 0) {
            onChange([...attachments, ...newAttachments]);
          }
        }
      };

      // Read as Data URL so the file can be downloaded or previewed
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    const target = attachments.find((a) => a.id === id);
    const updated = attachments.filter((a) => a.id !== id);
    onChange(updated);
    showToast?.(`Removed attachment: ${target?.fileName || 'File'}`);
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    const updated = attachments.map((a) => (a.id === id ? { ...a, notes } : a));
    onChange(updated);
  };

  const handleUpdateCategory = (id: string, category: OrderAttachmentCategory) => {
    const updated = attachments.map((a) => (a.id === id ? { ...a, category } : a));
    onChange(updated);
  };

  const handleLoadSampleDocuments = () => {
    const samples = generateSampleOrderAttachments(orderNumber, styleNumber);
    onChange([...attachments, ...samples]);
    showToast?.('✓ Loaded 4 standard specification documents for testing!');
  };

  const totalBytes = attachments.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & SUMMARY TILES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-blue-600" />
            <span>Order Attachments &amp; Technical Document Repository</span>
          </h3>
          <p className="text-xs text-slate-500">
            Upload Measurement Specs, Technical Specs, Lab Test Records, and other production files (multiple files supported)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              type="button"
              onClick={handleLoadSampleDocuments}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
              title="Quickly fill in sample Measurement Spec, Tech Pack, Test Record & ETC files"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Sample Specs</span>
            </button>
          )}

          <div className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {attachments.length} file{attachments.length === 1 ? '' : 's'} ({formatFileSize(totalBytes)})
          </div>
        </div>
      </div>

      {/* 4 CATEGORY ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {(Object.keys(ATTACHMENT_CATEGORIES) as OrderAttachmentCategory[]).map((catKey) => {
          const cat = ATTACHMENT_CATEGORIES[catKey];
          const count = attachments.filter((a) => a.category === catKey).length;
          const isSelected = selectedCategoryForUpload === catKey;

          return (
            <div
              key={catKey}
              onClick={() => setSelectedCategoryForUpload(catKey)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-2 ring-blue-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}
                >
                  {cat.label}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {count} file{count === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                {cat.description}
              </p>

              {!readOnly && (
                <label
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 w-full justify-center px-2.5 py-1.5 text-[11px] font-bold rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 transition-colors cursor-pointer border border-slate-200 hover:border-blue-600"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload {cat.shortLabel}</span>
                  <input
                    type="file"
                    multiple
                    accept={cat.acceptedFormats}
                    onChange={(e) => handleFilesSelected(e.target.files, catKey)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* MULTIPLE FILE DROPZONE / UPLOADER AREA */}
      {!readOnly && (
        <div className="bg-slate-50/70 p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 transition-all text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Upload className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-900">
              Multiple File Upload Option
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select or drop multiple files simultaneously into category:{' '}
              <span className="font-bold text-blue-700">
                {ATTACHMENT_CATEGORIES[selectedCategoryForUpload]?.label}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Select Multiple Files</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.xlsx,.xls,.doc,.docx,.cad,.dxf,.png,.jpg,.jpeg,.webp,.zip,.csv"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />
            </label>

            <select
              value={selectedCategoryForUpload}
              onChange={(e) => setSelectedCategoryForUpload(e.target.value as OrderAttachmentCategory)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-300 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {(Object.keys(ATTACHMENT_CATEGORIES) as OrderAttachmentCategory[]).map((key) => (
                <option key={key} value={key}>
                  Upload as: {ATTACHMENT_CATEGORIES[key].label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Supported: PDF, Excel (.xlsx, .xls), Word (.docx), Images (PNG, JPG), CAD/DXF, ZIP archive</span>
          </div>
        </div>
      )}

      {/* FILTER TABS & ATTACHMENT LIST */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Category filter pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterCategory('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filterCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Files ({attachments.length})
            </button>

            {(Object.keys(ATTACHMENT_CATEGORIES) as OrderAttachmentCategory[]).map((catKey) => {
              const cat = ATTACHMENT_CATEGORIES[catKey];
              const count = attachments.filter((a) => a.category === catKey).length;
              const isCurrent = filterCategory === catKey;

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setFilterCategory(catKey)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.shortLabel} ({count})
                </button>
              );
            })}
          </div>

          {attachments.length > 0 && !readOnly && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to remove all attachments?')) {
                  onChange([]);
                  showToast?.('Removed all attachments');
                }
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer px-2 py-1"
            >
              Clear All Files
            </button>
          )}
        </div>

        {/* ATTACHMENTS LIST TABLE / CARDS */}
        {filteredAttachments.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">
              No files in {filterCategory === 'ALL' ? 'this order' : ATTACHMENT_CATEGORIES[filterCategory]?.label}
            </p>
            <p className="text-[11px] text-slate-400">
              Use the upload button above to add Measurement Specs, Technical Specs, or Test Records.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAttachments.map((att) => {
              const cat = ATTACHMENT_CATEGORIES[att.category] || ATTACHMENT_CATEGORIES.ETC;
              const ext = getFileExtension(att.fileName);
              const extColor = getFileExtensionColor(ext);

              return (
                <div
                  key={att.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* File info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl ${extColor.bg} ${extColor.text} font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs`}
                    >
                      {ext.substring(0, 4)}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 truncate max-w-md" title={att.fileName}>
                          {att.fileName}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}
                        >
                          {cat.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>{formatFileSize(att.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded {att.uploadedAt}</span>
                        {att.uploadedBy && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{att.uploadedBy}</span>
                          </>
                        )}
                      </div>

                      {/* Editable / viewable notes */}
                      {!readOnly ? (
                        <input
                          type="text"
                          value={att.notes || ''}
                          onChange={(e) => handleUpdateNotes(att.id, e.target.value)}
                          placeholder="Add specification note / revision comments..."
                          className="w-full text-[11px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none mt-1"
                        />
                      ) : (
                        att.notes && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 mt-1">
                            {att.notes}
                          </p>
                        )
                      )}
                    </div>
                  </div>

                  {/* Actions: Download & Delete */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {!readOnly && (
                      <select
                        value={att.category}
                        onChange={(e) =>
                          handleUpdateCategory(att.id, e.target.value as OrderAttachmentCategory)
                        }
                        className="text-[11px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                        title="Change document category"
                      >
                        {(Object.keys(ATTACHMENT_CATEGORIES) as OrderAttachmentCategory[]).map((key) => (
                          <option key={key} value={key}>
                            {ATTACHMENT_CATEGORIES[key].shortLabel}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        downloadOrderAttachment(att, orderNumber);
                        showToast?.(`Downloading: ${att.fileName}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors shadow-2xs cursor-pointer"
                      title="Download document to device"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>Download</span>
                    </button>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                        title="Delete file attachment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
