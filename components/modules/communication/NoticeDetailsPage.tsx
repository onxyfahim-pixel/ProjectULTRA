'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Copy,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  CheckSquare,
  Plus,
  Send,
  Pin,
  Calendar,
  FileText,
  Download,
  AlertTriangle,
  User,
  MessageSquare,
  Check,
  Share2,
  FileDown,
} from 'lucide-react';
import {
  CommunicationNotice,
  NoticeAcknowledgment,
  NoticeComment,
} from '@/lib/types/modules';
import { NOTICE_CATEGORY_CONFIG, NOTICE_URGENCY_CONFIG } from './communication-data';
import { CommunicationSingleExportModal } from './CommunicationSingleExportModal';
import { useModulePermission } from '@/hooks/use-module-permission';

interface NoticeDetailsPageProps {
  notice: CommunicationNotice;
  onBack: () => void;
  onEdit: (notice: CommunicationNotice) => void;
  onDuplicate: (notice: CommunicationNotice) => void;
  onDelete: (notice: CommunicationNotice) => void;
  onUpdateNotice?: (updated: CommunicationNotice) => void;
  showToast: (msg: string) => void;
}

export function NoticeDetailsPage({
  notice,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateNotice,
  showToast,
}: NoticeDetailsPageProps) {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('communication');
  const [currentNotice, setCurrentNotice] = useState<CommunicationNotice>(notice);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [acknowledgments, setAcknowledgments] = useState<NoticeAcknowledgment[]>(
    notice.acknowledgments || []
  );
  const [comments, setComments] = useState<NoticeComment[]>(notice.comments || []);

  // Quick Sign Off Form State
  const [showSignOffModal, setShowSignOffModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Floor QC Supervisor');
  const [signerDept, setSignerDept] = useState('Sewing Lines');
  const [signerNotes, setSignerNotes] = useState('');

  // Comment Form State
  const [commentText, setCommentText] = useState('');
  const [commenterName, setCommenterName] = useState('Floor Supervisor');
  const [commenterDept, setCommenterDept] = useState('Production Floor');

  const categoryConfig =
    (currentNotice.category && NOTICE_CATEGORY_CONFIG[currentNotice.category]) ||
    NOTICE_CATEGORY_CONFIG.QUALITY_FLASH;
  const urgencyConfig = NOTICE_URGENCY_CONFIG[currentNotice.urgency];

  const totalRecipients = currentNotice.totalRecipientsCount || 20;
  const ackCount = acknowledgments.length;
  const ackPercentage = Math.round((ackCount / Math.max(totalRecipients, 1)) * 100);

  // Handle Sign Off / Acknowledge
  const handleSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      showToast('Please enter your name for sign-off verification');
      return;
    }

    const newAck: NoticeAcknowledgment = {
      id: `ack-${Date.now()}`,
      userName: signerName.trim(),
      userRole: signerRole,
      department: signerDept,
      acknowledgedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      actionTakenNotes: signerNotes.trim() || 'Floor inspection completed and containment applied.',
    };

    const updatedAcks = [newAck, ...acknowledgments];
    setAcknowledgments(updatedAcks);

    const updatedNotice: CommunicationNotice = {
      ...currentNotice,
      isRead: true,
      acknowledgedCount: updatedAcks.length,
      acknowledgments: updatedAcks,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentNotice(updatedNotice);
    onUpdateNotice?.(updatedNotice);
    setShowSignOffModal(false);
    setSignerName('');
    setSignerNotes('');
    showToast(`Acknowledgment logged for ${newAck.userName}`);
  };

  // Handle Add Discussion Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newCmt: NoticeComment = {
      id: `cmt-${Date.now()}`,
      authorName: commenterName,
      authorRole: 'Floor Lead',
      department: commenterDept,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      comment: commentText.trim(),
    };

    const updatedComments = [...comments, newCmt];
    setComments(updatedComments);

    const updatedNotice: CommunicationNotice = {
      ...currentNotice,
      comments: updatedComments,
    };
    setCurrentNotice(updatedNotice);
    onUpdateNotice?.(updatedNotice);
    setCommentText('');
    showToast('Comment posted to floor bulletin thread');
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 xl:p-8 animate-in fade-in duration-150">
      <div className="w-full max-w-[1920px] mx-auto space-y-6 pb-20">
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
                {currentNotice.noticeNumber}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${categoryConfig.bg} ${categoryConfig.text} ${categoryConfig.border}`}>
                {categoryConfig.label}
              </span>
              {currentNotice.pinned && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                  PINNED TO FLOOR KIOSK
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {currentNotice.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons styled like Buyer & Order */}
        <div className="flex items-center gap-2 shrink-0">
          {canCreate && (
            <button
              type="button"
              onClick={() => onDuplicate(currentNotice)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Duplicate Bulletin"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(currentNotice)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Edit Bulletin"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}

          {canExport && (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Export Notice (PDF/Excel)"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(currentNotice)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              title="Delete Bulletin"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowSignOffModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Sign Off / Acknowledge</span>
          </button>
        </div>
      </div>

      {/* Hero Meta Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Urgency & Category */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Urgency &amp; Classification
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                currentNotice.urgency === 'HIGH_PRIORITY'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : currentNotice.urgency === 'STANDARD'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {urgencyConfig.label}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">{categoryConfig.desc}</div>
        </div>

        {/* Origin & Author */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Origin / Author
          </div>
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            {currentNotice.author}
          </div>
          <div className="text-[11px] text-slate-500">
            {currentNotice.authorRole || 'Quality Assurance'}
          </div>
        </div>

        {/* Timestamps */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Broadcast &amp; Validity
          </div>
          <div className="font-mono text-xs text-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {currentNotice.publishedDate}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Valid until: {currentNotice.effectiveUntil || 'Active Indefinitely'}
          </div>
        </div>

        {/* Floor Acknowledgment Meter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Floor Compliance</span>
            <span className="font-bold text-slate-900">{ackPercentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ackPercentage >= 90
                  ? 'bg-emerald-500'
                  : ackPercentage >= 60
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(ackPercentage, 100)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between">
            <span>{ackCount} Sign-offs logged</span>
            <span>Target: {totalRecipients}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Notice Content & Action Required, Right Acknowledgment & Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Content & Mandatory Action */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mandatory Floor Action Card */}
          {currentNotice.actionRequired && (
            <div className="bg-gradient-to-r from-amber-50 to-rose-50/50 p-5 rounded-2xl border border-amber-200/80 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Mandatory Containment Action &amp; Process Instructions
                  </div>
                  <p className="text-xs text-amber-950 font-medium leading-relaxed">
                    {currentNotice.actionRequired}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-amber-800">
                    <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                    <span>Every floor supervisor must verify and sign off below prior to production shift resumption.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bulletin Body */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Bulletin Description &amp; Technical Scope</span>
              </h2>
              {currentNotice.buyerRef && (
                <div className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  Buyer: <span className="text-slate-900 font-bold">{currentNotice.buyerRef}</span>
                  {currentNotice.styleRef && <span> • Style: {currentNotice.styleRef}</span>}
                  {currentNotice.orderRef && <span> • PO: {currentNotice.orderRef}</span>}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-700 leading-relaxed space-y-3 whitespace-pre-line font-normal">
              {currentNotice.content}
            </div>

            {/* Target Departments */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Targeted Factory Divisions &amp; Lines
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                  {currentNotice.targetDepartment}
                </span>
                {currentNotice.targetAudience &&
                  currentNotice.targetAudience.map((aud, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100"
                    >
                      {aud}
                    </span>
                  ))}
              </div>
            </div>

            {/* Attachments */}
            {currentNotice.attachments && currentNotice.attachments.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Technical Attachments &amp; Spec Sheets ({currentNotice.attachments.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentNotice.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {att.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{att.size}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => showToast(`Downloading ${att.name}...`)}
                        className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                        title="Download Attachment"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Floor Discussion Thread */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Floor Discussion &amp; Feedback Notes ({comments.length})</span>
              </h2>
              <span className="text-[11px] text-slate-400">Live Communication Channel</span>
            </div>

            {/* Comment List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No floor comments logged yet. Supervisors can post field observations below.
                </div>
              ) : (
                comments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{cmt.authorName}</span>
                        <span className="text-[10px] font-normal text-slate-500">
                          ({cmt.department})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{cmt.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pl-5">{cmt.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input Form */}
            <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={commenterName}
                  onChange={(e) => setCommenterName(e.target.value)}
                  placeholder="Your Name (e.g. Line 04 Lead)"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={commenterDept}
                  onChange={(e) => setCommenterDept(e.target.value)}
                  placeholder="Department / Line"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type floor verification feedback or operational note..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Verified Acknowledgment Log Roster */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Sign-offs ({acknowledgments.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowSignOffModal(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                + Add Sign-off
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Official ISO/WRAP digital sign-off log for quality containment and SOP adoption.
            </p>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {acknowledgments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No sign-offs recorded yet. Click above to log supervisor verification.
                </div>
              ) : (
                acknowledgments.map((ack) => (
                  <div
                    key={ack.id}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {ack.userName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ack.acknowledgedAt}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {ack.userRole} • {ack.department}
                    </div>
                    {ack.actionTakenNotes && (
                      <div className="text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100 italic">
                        "{ack.actionTakenNotes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Sign-off Modal */}
      {showSignOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Sign Off Bulletin Receipt</h3>
                  <p className="text-[11px] text-slate-500">Floor Supervisor Compliance Record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignOffModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSignOff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervisor / Officer Name *
                </label>
                <input
                  type="text"
                  required
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="e.g. Kamal Hossain"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    value={signerRole}
                    onChange={(e) => setSignerRole(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section / Line
                  </label>
                  <input
                    type="text"
                    value={signerDept}
                    onChange={(e) => setSignerDept(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Taken / Floor Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={signerNotes}
                  onChange={(e) => setSignerNotes(e.target.value)}
                  placeholder="e.g. Conducted 100% collar lot segregation; informed machine operators on Line 03."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSignOffModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Sign-off</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* Single Notice Export Modal */}
        <CommunicationSingleExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          notice={currentNotice}
        />
      </div>
    </div>
  );
}
