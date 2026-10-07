'use client';

import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  FolderDown,
  Paperclip,
  Eye,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  X,
  File,
} from 'lucide-react';
import { OrderAttachment, OrderAttachmentCategory, BuyerOrder } from '@/lib/types/modules';
import {
  ATTACHMENT_CATEGORIES,
  formatFileSize,
  getFileExtension,
  getFileExtensionColor,
  downloadOrderAttachment,
} from './order-attachment-utils';

interface OrderAttachmentsSectionProps {
  order: BuyerOrder;
  showToast?: (msg: string) => void;
  onEdit?: (order: BuyerOrder) => void;
}

export function OrderAttachmentsSection({
  order,
  showToast,
  onEdit,
}: OrderAttachmentsSectionProps) {
  const attachments = order.attachments || [];
  const [filterCategory, setFilterCategory] = useState<'ALL' | OrderAttachmentCategory>('ALL');
  const [previewAttachment, setPreviewAttachment] = useState<OrderAttachment | null>(null);

  const filtered =
    filterCategory === 'ALL'
      ? attachments
      : attachments.filter((a) => a.category === filterCategory);

  const totalBytes = attachments.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);

  const handleDownloadAll = () => {
    if (attachments.length === 0) return;
    attachments.forEach((att, idx) => {
      // Stagger downloads by 300ms so browser doesn't block multi-download
      setTimeout(() => {
        downloadOrderAttachment(att, order.orderNumber);
      }, idx * 300);
    });
    showToast?.(`Initiated batch download for all ${attachments.length} specification file(s)`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
      {/* SECTION HEADER & SUMMARY TILES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Paperclip className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Order Attachments &amp; Technical Documents</span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {attachments.length} Document{attachments.length === 1 ? '' : 's'}
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Measurement Specs, Technical Packs, Lab Test Records, and official files downloadable for PO {order.orderNumber}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {attachments.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
              title="Download all specification files in sequence"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Download All ({attachments.length} Files)</span>
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(order)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Upload new documents or edit files"
            >
              <Paperclip className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload / Manage Files</span>
            </button>
          )}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN PILLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.keys(ATTACHMENT_CATEGORIES) as OrderAttachmentCategory[]).map((catKey) => {
          const cat = ATTACHMENT_CATEGORIES[catKey];
          const count = attachments.filter((a) => a.category === catKey).length;
          const isSelected = filterCategory === catKey;

          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setFilterCategory(isSelected ? 'ALL' : catKey)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-2xs ring-1 ring-blue-500'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className={cat.accentColor}>{cat.shortLabel}</span>
                <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded-md border border-slate-200 text-[11px]">
                  {count}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1">{cat.label}</p>
            </button>
          );
        })}
      </div>

      {/* FILTER & COUNT BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
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
            All Categories ({attachments.length})
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

        <span className="text-[11px] font-mono font-bold text-slate-500">
          Total Repository Size: {formatFileSize(totalBytes)}
        </span>
      </div>

      {/* ATTACHMENT CARDS GRID */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200 shadow-2xs">
            <Paperclip className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              No {filterCategory === 'ALL' ? '' : ATTACHMENT_CATEGORIES[filterCategory]?.label + ' '}Files Attached
            </h4>
            <p className="text-xs text-slate-500">
              Upload Measurement Specs, CAD drawings, Technical Specs, Lab Test Records, or packing sheets to make them accessible for line supervisors and inspectors.
            </p>
          </div>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(order)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attach Specification Files</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((att) => {
            const cat = ATTACHMENT_CATEGORIES[att.category] || ATTACHMENT_CATEGORIES.ETC;
            const ext = getFileExtension(att.fileName);
            const extColor = getFileExtensionColor(ext);

            return (
              <div
                key={att.id}
                className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/90 hover:border-blue-300 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl ${extColor.bg} ${extColor.text} font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs`}
                      >
                        {ext.substring(0, 4)}
                      </div>
                      <div className="min-w-0">
                        <h4
                          className="font-bold text-slate-900 truncate max-w-[240px] sm:max-w-[280px]"
                          title={att.fileName}
                        >
                          {att.fileName}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{formatFileSize(att.fileSize)}</span>
                          <span>•</span>
                          <span>{att.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${cat.badgeBg} ${cat.badgeText} ${cat.badgeBorder}`}
                    >
                      {cat.shortLabel}
                    </span>
                  </div>

                  {att.notes && (
                    <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70 leading-relaxed">
                      {att.notes}
                    </p>
                  )}

                  {att.uploadedBy && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">Sign-off: {att.uploadedBy}</span>
                    </div>
                  )}
                </div>

                {/* Card footer: download & preview buttons */}
                <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Format: {ext}
                  </span>

                  <div className="flex items-center gap-2">
                    {att.fileData && (
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(att)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        title="Preview document details"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Preview</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        downloadOrderAttachment(att, order.orderNumber);
                        showToast?.(`Downloading: ${att.fileName}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                      title="Download file to computer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span>Document Preview: {previewAttachment.fileName}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {ATTACHMENT_CATEGORIES[previewAttachment.category]?.label} • PO {order.orderNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPreviewAttachment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* If image, display actual preview */}
              {previewAttachment.fileData &&
              (previewAttachment.fileType?.includes('image') ||
                previewAttachment.fileName.match(/\.(png|jpe?g|webp|gif)$/i)) ? (
                <div className="max-h-72 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                  <img
                    src={previewAttachment.fileData}
                    alt={previewAttachment.fileName}
                    className="max-h-72 object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-mono text-xs font-bold text-slate-800">
                    File: {previewAttachment.fileName}
                  </div>
                  <div className="text-slate-600">
                    Category: {ATTACHMENT_CATEGORIES[previewAttachment.category]?.label}
                  </div>
                  <div className="text-slate-600">
                    Size: {formatFileSize(previewAttachment.fileSize)}
                  </div>
                  <div className="text-slate-600">
                    Uploaded Date: {previewAttachment.uploadedAt}
                  </div>
                  {previewAttachment.notes && (
                    <div className="text-slate-700 pt-2 border-t border-slate-200">
                      <strong>Notes:</strong> {previewAttachment.notes}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    downloadOrderAttachment(previewAttachment, order.orderNumber);
                    showToast?.(`Downloaded ${previewAttachment.fileName}`);
                    setPreviewAttachment(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
