'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  CheckSquare,
  Plus,
  Check,
  XCircle,
  Clock3,
  Sparkles,
  ShieldCheck,
  Layers,
  ChevronRight,
  ExternalLink,
  FileDown,
} from 'lucide-react';
import {
  MeetingMinutesItem,
  MeetingStatus,
  MeetingActionItem,
  MeetingAttendee,
} from '@/lib/types/modules';
import { useModulePermission } from '@/hooks/use-module-permission';
import { MEETING_TYPE_LABELS } from './meeting-minutes-data';
import { MeetingSingleExportModal } from './MeetingSingleExportModal';

interface MeetingMinutesDetailsPageProps {
  meeting: MeetingMinutesItem;
  onBack: () => void;
  onEdit: (meeting: MeetingMinutesItem) => void;
  onDuplicate: (meeting: MeetingMinutesItem) => void;
  onDelete: (meeting: MeetingMinutesItem) => void;
  onUpdateMeeting?: (updated: MeetingMinutesItem) => void;
  showToast: (msg: string) => void;
}

export function MeetingMinutesDetailsPage({
  meeting,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateMeeting,
  showToast,
}: MeetingMinutesDetailsPageProps) {
  const [currentMeeting, setCurrentMeeting] = useState<MeetingMinutesItem>(meeting);
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(meeting.actionItems || []);
  const [attendees, setAttendees] = useState<MeetingAttendee[]>(meeting.attendees || []);
  const [discussionNotes, setDiscussionNotes] = useState<string[]>(meeting.discussionNotes || []);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { canExport } = useModulePermission('meeting_minutes');

  // Inline Quick Add Action Item
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newActionDept, setNewActionDept] = useState('Quality Assurance');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [newActionPriority, setNewActionPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Inline Quick Add Attendee
  const [showAddAttendee, setShowAddAttendee] = useState(false);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeOrg, setNewAttendeeOrg] = useState<'FACTORY' | 'BUYER' | 'SUPPLIER' | 'THIRD_PARTY'>('FACTORY');
  const [newAttendeeDept, setNewAttendeeDept] = useState('Quality Assurance');
  const [newAttendeeRole, setNewAttendeeRole] = useState('QA Representative');

  // Inline Quick Add Discussion Point
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Status Change handler
  const handleStatusChange = (newStatus: MeetingStatus) => {
    const updated: MeetingMinutesItem = {
      ...currentMeeting,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentMeeting(updated);
    onUpdateMeeting?.(updated);
    showToast(`Meeting status updated to ${newStatus.replace('_', ' ')}`);
  };

  // Toggle Action Item completion
  const handleToggleAction = (index: number) => {
    const updatedActions = [...actionItems];
    const item = updatedActions[index];
    const isNowDone = !item.completed;
    updatedActions[index] = {
      ...item,
      completed: isNowDone,
      completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
    };
    setActionItems(updatedActions);

    // If all action items completed, offer to close status
    const allDone = updatedActions.every((a) => a.completed);
    const newStatus: MeetingStatus = allDone ? 'CLOSED' : 'ACTIONS_PENDING';

    const updatedMeeting: MeetingMinutesItem = {
      ...currentMeeting,
      actionItems: updatedActions,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentMeeting(updatedMeeting);
    onUpdateMeeting?.(updatedMeeting);
    showToast(isNowDone ? 'Action item marked as complete' : 'Action item reopened');
  };

  // Add Action Item
  const handleAddAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTask.trim() || !newActionAssignee.trim()) {
      showToast('Please specify task description and assignee');
      return;
    }
    const newAction: MeetingActionItem = {
      id: `act-${Date.now()}`,
      task: newActionTask.trim(),
      assignee: newActionAssignee.trim(),
      department: newActionDept,
      dueDate: newActionDueDate || new Date().toISOString().split('T')[0],
      priority: newActionPriority,
      completed: false,
    };
    const updatedActions = [...actionItems, newAction];
    setActionItems(updatedActions);

    const updatedMeeting: MeetingMinutesItem = {
      ...currentMeeting,
      actionItems: updatedActions,
      status: 'ACTIONS_PENDING',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentMeeting(updatedMeeting);
    onUpdateMeeting?.(updatedMeeting);

    setNewActionTask('');
    setNewActionAssignee('');
    setShowAddAction(false);
    showToast('New action item assigned');
  };

  // Add Attendee
  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeName.trim()) {
      showToast('Please enter attendee name');
      return;
    }
    const newAtt: MeetingAttendee = {
      id: `att-${Date.now()}`,
      name: newAttendeeName.trim(),
      organization: newAttendeeOrg,
      department: newAttendeeDept,
      role: newAttendeeRole,
      attendanceStatus: 'PRESENT',
      signatureConfirmed: true,
    };
    const updatedAttendees = [...attendees, newAtt];
    setAttendees(updatedAttendees);

    const updatedMeeting: MeetingMinutesItem = {
      ...currentMeeting,
      attendees: updatedAttendees,
      attendeesCount: updatedAttendees.length,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentMeeting(updatedMeeting);
    onUpdateMeeting?.(updatedMeeting);

    setNewAttendeeName('');
    setShowAddAttendee(false);
    showToast('Attendee added to roster');
  };

  // Toggle Attendee status
  const handleToggleAttendee = (id: string, newStatus: MeetingAttendee['attendanceStatus']) => {
    const updatedAttendees = attendees.map((a) =>
      a.id === id ? { ...a, attendanceStatus: newStatus } : a
    );
    setAttendees(updatedAttendees);
    const updatedMeeting: MeetingMinutesItem = {
      ...currentMeeting,
      attendees: updatedAttendees,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentMeeting(updatedMeeting);
    onUpdateMeeting?.(updatedMeeting);
  };

  // Add Discussion Point
  const handleAddDiscussionPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const updatedNotes = [...discussionNotes, newNoteText.trim()];
    setDiscussionNotes(updatedNotes);

    const updatedMeeting: MeetingMinutesItem = {
      ...currentMeeting,
      discussionNotes: updatedNotes,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentMeeting(updatedMeeting);
    onUpdateMeeting?.(updatedMeeting);

    setNewNoteText('');
    setShowAddNote(false);
    showToast('Discussion point recorded');
  };

  // Metrics
  const totalActions = actionItems.length;
  const completedActions = actionItems.filter((a) => a.completed).length;
  const pendingActions = totalActions - completedActions;
  const actionCompletionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 100;

  const presentCount = attendees.filter((a) => a.attendanceStatus === 'PRESENT').length;
  const attendanceRate = attendees.length > 0 ? Math.round((presentCount / attendees.length) * 100) : 100;

  const typeConfig = currentMeeting.meetingType
    ? MEETING_TYPE_LABELS[currentMeeting.meetingType] || { label: currentMeeting.meetingType, badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' }
    : { label: 'General Quality Meeting', badgeClass: 'bg-slate-50 text-slate-700 border-slate-200' };

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
        {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Meeting Minutes List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {currentMeeting.meetingCode}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${typeConfig.badgeClass}`}>
                {typeConfig.label}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1 line-clamp-1">
              {currentMeeting.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Status:</span>
            <select
              value={currentMeeting.status}
              onChange={(e) => handleStatusChange(e.target.value as MeetingStatus)}
              className="text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="ACTIONS_PENDING">Actions Pending</option>
              <option value="CLOSED">Closed (100% Resolved)</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>


          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(currentMeeting)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Duplicate as new meeting template"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Duplicate</span>
          </button>

          {/* Export Button */}
          {canExport && (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Export Meeting Minutes Dossier"
            >
              <FileDown className="w-3.5 h-3.5 text-teal-600" />
              <span className="hidden md:inline">Export Dossier</span>
            </button>
          )}

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(currentMeeting)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Minutes</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(currentMeeting)}
            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Meeting Minutes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI & Health Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Date & Time</span>
          </div>
          <div className="font-mono text-sm font-bold text-slate-900">{currentMeeting.meetingDate}</div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">{currentMeeting.meetingTime || 'Standard Morning Slot'}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Attendance Rate</span>
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>{presentCount} / {attendees.length || currentMeeting.attendeesCount} Present</span>
            <span className="text-xs font-mono font-normal text-indigo-600">({attendanceRate}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">Chair: {currentMeeting.chairperson.split('(')[0]}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Action Tracker</span>
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span className="text-emerald-700">{completedActions} Done</span>
            <span className="text-slate-400">•</span>
            <span className={pendingActions > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
              {pendingActions} Open
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${actionCompletionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Governance Gate</span>
          </div>
          <div className="text-sm font-bold text-slate-900">
            {currentMeeting.status === 'CLOSED' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> All Actions Closed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <Clock3 className="w-4 h-4 text-amber-600" /> Follow-Up Active
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            Target: {currentMeeting.targetClosureDate || 'Within 72 Hours'}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Details & Actions, Right Column Logistics & Attendees */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Garment & Production Context Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Buyer &amp; Production Order Context
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Garment QMS Ref</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Buyer / Brand</span>
                <span className="font-semibold text-slate-900 mt-0.5 block truncate">
                  {currentMeeting.buyerName || 'Factory Quality Board'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Order PO #</span>
                <span className="font-mono font-bold text-blue-700 mt-0.5 block truncate">
                  {currentMeeting.orderPoNumber || 'N/A (Multi-Order)'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Style Ref</span>
                <span className="font-mono font-bold text-purple-700 mt-0.5 block truncate">
                  {currentMeeting.styleNumber || 'Enterprise Wide'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Venue / Room</span>
                <span className="font-medium text-slate-800 mt-0.5 block truncate">
                  {currentMeeting.venue || 'Main Conference Room'}
                </span>
              </div>
            </div>
          </div>

          {/* Meeting Agenda & Objectives */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Agenda &amp; Core Objectives
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                Mandatory Review
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
              {currentMeeting.agenda}
            </p>
          </div>

          {/* Discussion Notes & Decisions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Technical Discussion &amp; Decisions ({discussionNotes.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNote(!showAddNote)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            {showAddNote && (
              <form onSubmit={handleAddDiscussionPoint} className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record key technical decision, tolerance agreed, machine adjustment, or test result..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNote(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {discussionNotes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed flex-1">{note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Action Items Tracker */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Action Items &amp; Accountability Tracker ({actionItems.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAction(!showAddAction)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Action</span>
              </button>
            </div>

            {/* Quick Add Action Form */}
            {showAddAction && (
              <form onSubmit={handleAddAction} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">New Corrective / Preventative Action Task</h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Task Description *</label>
                  <input
                    type="text"
                    value={newActionTask}
                    onChange={(e) => setNewActionTask(e.target.value)}
                    placeholder="e.g., Install edge guides on Line 03 waistbands or calibrate spectrophotometer..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Assignee *</label>
                    <input
                      type="text"
                      value={newActionAssignee}
                      onChange={(e) => setNewActionAssignee(e.target.value)}
                      placeholder="e.g., Babul Akter"
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Department</label>
                    <input
                      type="text"
                      value={newActionDept}
                      onChange={(e) => setNewActionDept(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newActionDueDate}
                      onChange={(e) => setNewActionDueDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Priority</label>
                    <select
                      value={newActionPriority}
                      onChange={(e) => setNewActionPriority(e.target.value as any)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAction(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Add Action Task
                  </button>
                </div>
              </form>
            )}

            {/* Actions List with Direct Checkbox Toggling */}
            <div className="space-y-2.5">
              {actionItems.map((act, idx) => {
                const priorityClass =
                  act.priority === 'HIGH'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : act.priority === 'MEDIUM'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200';

                return (
                  <div
                    key={act.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      act.completed
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleAction(idx)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          act.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-blue-500 bg-white'
                        }`}
                        title={act.completed ? 'Click to mark as pending' : 'Click to mark as completed'}
                      >
                        {act.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p
                            className={`text-xs font-medium leading-snug ${
                              act.completed ? 'line-through text-slate-500' : 'text-slate-900 font-semibold'
                            }`}
                          >
                            {act.task}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {act.priority && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityClass}`}>
                                {act.priority}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                act.completed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {act.completed ? 'Completed' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                          <span>
                            Assignee: <strong className="text-slate-800 font-medium">{act.assignee}</strong>
                            {act.department && ` (${act.department})`}
                          </span>
                          <span className="font-mono">
                            Due: <strong className="text-slate-700">{act.dueDate}</strong>
                          </span>
                          {act.completed && act.completedDate && (
                            <span className="text-emerald-700 font-mono">
                              Closed on: {act.completedDate}
                            </span>
                          )}
                        </div>

                        {act.verificationNotes && (
                          <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 font-mono">
                            Verification: {act.verificationNotes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Logistics, Attendees & Sign-off) */}
        <div className="space-y-6">
          {/* Logistics Summary Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Meeting Logistics
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date:
                </span>
                <span className="font-mono font-bold text-slate-800">{currentMeeting.meetingDate}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Time / Duration:
                </span>
                <span className="font-mono text-slate-800">
                  {currentMeeting.meetingTime || `${currentMeeting.durationMinutes || 60} mins`}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Venue:
                </span>
                <span className="text-slate-800 font-medium truncate max-w-[170px]">
                  {currentMeeting.venue || 'QA Conference Room'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Chairperson:
                </span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {currentMeeting.chairperson}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Minutes Scribe:
                </span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {currentMeeting.scribeName || 'Documentation Officer'}
                </span>
              </div>
            </div>
          </div>

          {/* Attendees Roster */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Attendees Roster ({attendees.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAttendee(!showAddAttendee)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                + Add
              </button>
            </div>

            {/* Quick Add Attendee Form */}
            {showAddAttendee && (
              <form onSubmit={handleAddAttendee} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Attendee Full Name"
                  value={newAttendeeName}
                  onChange={(e) => setNewAttendeeName(e.target.value)}
                  className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newAttendeeOrg}
                    onChange={(e) => setNewAttendeeOrg(e.target.value as any)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                  >
                    <option value="FACTORY">Factory</option>
                    <option value="BUYER">Buyer</option>
                    <option value="SUPPLIER">Supplier</option>
                    <option value="THIRD_PARTY">Third Party</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Department"
                    value={newAttendeeDept}
                    onChange={(e) => setNewAttendeeDept(e.target.value)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-[11px]"
                  />
                </div>
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAddAttendee(false)}
                    className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded"
                  >
                    Add Attendee
                  </button>
                </div>
              </form>
            )}

            {/* Attendees List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {attendees.map((att) => {
                const orgBadgeClass =
                  att.organization === 'BUYER'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : att.organization === 'SUPPLIER'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate">{att.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${orgBadgeClass}`}>
                          {att.organization}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {att.role} • {att.department}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleToggleAttendee(
                          att.id,
                          att.attendanceStatus === 'PRESENT' ? 'ABSENT' : 'PRESENT'
                        )
                      }
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer transition-colors shrink-0 ${
                        att.attendanceStatus === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                      }`}
                      title="Click to toggle attendance"
                    >
                      {att.attendanceStatus}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality Governance & Approval Sign-Off */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              QMS Sign-Off &amp; Approvals
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Prepared By (Scribe)</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {currentMeeting.preparedBy || currentMeeting.scribeName || 'QA Documentation Officer'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Date: {currentMeeting.meetingDate}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Approved By (Chairperson)</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {currentMeeting.approvedBy || currentMeeting.chairperson}
                </span>
                <span className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Digital Sign-off Verified
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-blue-900 leading-snug">
                ISO 9001:2015 Clause 9.3 Management Review & Buyer Quality manual certified. Minutes archived in ERP QMS registry.
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Single Meeting Export Modal */}
      <MeetingSingleExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        meeting={currentMeeting}
      />
    </div>
  );
}
