'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Send,
  Save,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  Pin,
  CheckCircle2,
  Users,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  CommunicationNotice,
  NoticeCategory,
  NoticeUrgency,
  NoticeStatus,
} from '@/lib/types/modules';
import {
  NOTICE_CATEGORY_CONFIG,
  NOTICE_URGENCY_CONFIG,
  FACTORY_DEPARTMENTS,
} from './communication-data';

interface NoticeEntryPageProps {
  initialNotice?: CommunicationNotice | null;
  onBack: () => void;
  onSave: (notice: CommunicationNotice) => void;
  showToast: (msg: string) => void;
}

const AUDIENCE_OPTIONS = [
  'Cutting Floor Supervisors',
  'Marker & Spreading Masters',
  'Sewing Line Supervisors (All 12 Lines)',
  'In-Line QC Floor Auditors',
  'End-of-Line Quality Controllers',
  'Finishing & Packing Section Heads',
  'Metal Detector Operators',
  'Denim Wash Plant Technicians',
  'Maintenance Mechanics & Engineers',
  'Merchandising & Sourcing Leads',
];

export function NoticeEntryPage({
  initialNotice,
  onBack,
  onSave,
  showToast,
}: NoticeEntryPageProps) {
  const isEditing = !!initialNotice;

  const [noticeNumber, setNoticeNumber] = useState(
    initialNotice?.noticeNumber || `QA-FLSH-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [title, setTitle] = useState(initialNotice?.title || '');
  const [category, setCategory] = useState<NoticeCategory>(
    initialNotice?.category || 'QUALITY_FLASH'
  );
  const [urgency, setUrgency] = useState<NoticeUrgency>(
    initialNotice?.urgency || 'HIGH_PRIORITY'
  );
  const [author, setAuthor] = useState(initialNotice?.author || 'Tanzim Ahmed');
  const [authorRole, setAuthorRole] = useState(initialNotice?.authorRole || 'QA Manager');
  const [targetDepartment, setTargetDepartment] = useState(
    initialNotice?.targetDepartment || 'Cutting, Sewing & Finishing All Lines'
  );
  const [targetAudience, setTargetAudience] = useState<string[]>(
    initialNotice?.targetAudience || [
      'Cutting Floor Supervisors',
      'Sewing Line Supervisors (All 12 Lines)',
      'In-Line QC Floor Auditors',
    ]
  );
  const [publishedDate] = useState(
    initialNotice?.publishedDate || new Date().toISOString().replace('T', ' ').slice(0, 16)
  );
  const [effectiveUntil, setEffectiveUntil] = useState(
    initialNotice?.effectiveUntil ||
      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [content, setContent] = useState(initialNotice?.content || '');
  const [actionRequired, setActionRequired] = useState(
    initialNotice?.actionRequired || ''
  );
  const [buyerRef, setBuyerRef] = useState(initialNotice?.buyerRef || 'H&M Hennes & Mauritz');
  const [orderRef, setOrderRef] = useState(initialNotice?.orderRef || 'PO-HM-9941');
  const [styleRef, setStyleRef] = useState(initialNotice?.styleRef || 'HM-TEE-8829');
  const [pinned, setPinned] = useState(initialNotice?.pinned || false);
  const [totalRecipientsCount, setTotalRecipientsCount] = useState(
    initialNotice?.totalRecipientsCount || 24
  );

  // Attachments
  const [attachments, setAttachments] = useState<{ name: string; size: string; type: string }[]>(
    initialNotice?.attachments || [
      { name: 'Technical_Specification_Update.pdf', size: '1.2 MB', type: 'application/pdf' },
    ]
  );
  const [newAttName, setNewAttName] = useState('');

  const toggleAudience = (role: string) => {
    if (targetAudience.includes(role)) {
      setTargetAudience(targetAudience.filter((r) => r !== role));
    } else {
      setTargetAudience([...targetAudience, role]);
    }
  };

  const handleAddAttachment = () => {
    if (!newAttName.trim()) return;
    setAttachments([
      ...attachments,
      {
        name: newAttName.trim().endsWith('.pdf') ? newAttName.trim() : `${newAttName.trim()}.pdf`,
        size: '1.8 MB',
        type: 'application/pdf',
      },
    ]);
    setNewAttName('');
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  const handleSubmit = (status: NoticeStatus) => {
    if (!title.trim()) {
      showToast('Please enter a notice title');
      return;
    }
    if (!content.trim()) {
      showToast('Please provide bulletin technical instructions');
      return;
    }

    const payload: CommunicationNotice = {
      id: initialNotice?.id || `ntc-${Date.now()}`,
      noticeNumber,
      title: title.trim(),
      urgency,
      category,
      author: author.trim(),
      authorRole: authorRole.trim(),
      targetDepartment: targetDepartment.trim(),
      targetAudience,
      publishedDate,
      effectiveUntil,
      content: content.trim(),
      actionRequired: actionRequired.trim(),
      isRead: false,
      status,
      buyerRef: buyerRef.trim() || undefined,
      orderRef: orderRef.trim() || undefined,
      styleRef: styleRef.trim() || undefined,
      attachments,
      pinned,
      totalRecipientsCount: Number(totalRecipientsCount) || 20,
      acknowledgedCount: initialNotice?.acknowledgedCount || 0,
      acknowledgments: initialNotice?.acknowledgments || [],
      comments: initialNotice?.comments || [],
      createdAt: initialNotice?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(payload);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Header Bar matching Buyer & Order Module */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Back to Bulletins Log"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {noticeNumber}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {isEditing ? 'Editing Published Circular' : 'New Quality Broadcast Form'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {isEditing ? 'Edit Communication Bulletin' : 'Broadcast Quality Bulletin / Floor Circular'}
            </h1>
          </div>
        </div>

        {/* Action Buttons styled like Buyer & Order */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('DRAFT')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('PUBLISHED')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Update & Broadcast' : 'Broadcast Notice Now'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Classification & Urgency */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-mono">
              1
            </span>
            Bulletin Classification &amp; Priority
          </h2>
          <span className="text-[11px] text-slate-400">Step 1 of 5</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bulletin Reference Code *
            </label>
            <input
              type="text"
              required
              value={noticeNumber}
              onChange={(e) => setNoticeNumber(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notice Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NoticeCategory)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              {Object.entries(NOTICE_CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Broadcast Urgency *
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as NoticeUrgency)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              {Object.entries(NOTICE_URGENCY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              Pin this notice to top of floor tablet kiosks and line supervisor boards
            </span>
          </label>
        </div>
      </div>

      {/* SECTION 2: Title & Publisher Origin */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-mono">
              2
            </span>
            Bulletin Title &amp; Originator Credentials
          </h2>
          <span className="text-[11px] text-slate-400">Step 2 of 5</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Bulletin Subject / Headline *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Strict Color Shading Segregation for Lot LOT-FB-8840 (Heather Grey)"
            className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Author / Originator Name *
            </label>
            <input
              type="text"
              required
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Author Designation / Title
            </label>
            <input
              type="text"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Effective Until Date
            </label>
            <input
              type="date"
              value={effectiveUntil}
              onChange={(e) => setEffectiveUntil(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Buyer & Order Mapping */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-mono">
              3
            </span>
            Target Departments &amp; Buyer Order Association
          </h2>
          <span className="text-[11px] text-slate-400">Step 3 of 5</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Target Department *
            </label>
            <select
              value={targetDepartment}
              onChange={(e) => setTargetDepartment(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              {FACTORY_DEPARTMENTS.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Buyer
            </label>
            <input
              type="text"
              value={buyerRef}
              onChange={(e) => setBuyerRef(e.target.value)}
              placeholder="e.g. H&M, Zara, PVH"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Order PO / Style Ref
            </label>
            <input
              type="text"
              value={styleRef}
              onChange={(e) => setStyleRef(e.target.value)}
              placeholder="e.g. HM-TEE-8829"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Mandatory Sign-off Audience (Select Roles)
          </label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map((aud, idx) => {
              const selected = targetAudience.includes(aud);
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => toggleAudience(aud)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                      selected ? 'bg-blue-600 text-white' : 'bg-slate-300 text-white'
                    }`}
                  >
                    ✓
                  </span>
                  <span>{aud}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: Bulletin Technical Instructions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-mono">
              4
            </span>
            Bulletin Text &amp; Mandatory Floor Actions
          </h2>
          <span className="text-[11px] text-slate-400">Step 4 of 5</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Technical Instructions &amp; Bulletin Body *
          </label>
          <textarea
            rows={5}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type comprehensive operational instructions, root cause context, and quality containment guidelines..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-normal"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Mandatory Action Required for Floor Sign-off *
          </label>
          <input
            type="text"
            required
            value={actionRequired}
            onChange={(e) => setActionRequired(e.target.value)}
            placeholder="e.g. Conduct 100% UV shade check on all cut bundles; recalibrate bottom hemming tension to 11 SPI."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-amber-50/30"
          />
        </div>
      </div>

      {/* SECTION 5: Technical Attachments */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-mono">
              5
            </span>
            Spec Sheets &amp; Attached SOP Documents
          </h2>
          <span className="text-[11px] text-slate-400">Step 5 of 5</span>
        </div>

        <div className="space-y-2">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">{att.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{att.size}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                title="Remove attachment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newAttName}
            onChange={(e) => setNewAttName(e.target.value)}
            placeholder="Add attachment filename (e.g. Revised_Inditex_Hem_Spec_Rev2.pdf)"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleAddAttachment}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Add File</span>
          </button>
        </div>
      </div>

      {/* Bottom Submit Footer Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('DRAFT')}
          className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('PUBLISHED')}
          className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>{isEditing ? 'Update & Broadcast' : 'Broadcast to Factory Floor'}</span>
        </button>
      </div>
    </div>
  );
}
