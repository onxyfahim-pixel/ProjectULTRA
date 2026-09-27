'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  CheckSquare,
  FileText,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Check,
} from 'lucide-react';
import {
  MeetingMinutesItem,
  MeetingType,
  MeetingStatus,
  MeetingActionItem,
  MeetingAttendee,
} from '@/lib/types/modules';

interface MeetingMinutesEntryPageProps {
  initialMeeting?: MeetingMinutesItem | null;
  onSave: (meeting: MeetingMinutesItem) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function MeetingMinutesEntryPage({
  initialMeeting,
  onSave,
  onCancel,
  showToast,
}: MeetingMinutesEntryPageProps) {
  const isEditing = Boolean(initialMeeting);

  // Form State
  const [meetingCode, setMeetingCode] = useState(
    initialMeeting?.meetingCode || `MOM-2026-${String(Math.floor(Math.random() * 900) + 100)}`
  );
  const [title, setTitle] = useState(initialMeeting?.title || '');
  const [meetingType, setMeetingType] = useState<MeetingType>(
    initialMeeting?.meetingType || 'PRE_PRODUCTION'
  );
  const [meetingDate, setMeetingDate] = useState(
    initialMeeting?.meetingDate || new Date().toISOString().split('T')[0]
  );
  const [meetingTime, setMeetingTime] = useState(
    initialMeeting?.meetingTime || '10:00 AM - 11:30 AM'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialMeeting?.durationMinutes || 90
  );
  const [venue, setVenue] = useState(
    initialMeeting?.venue || 'Merchandising Conference Room A'
  );
  const [chairperson, setChairperson] = useState(
    initialMeeting?.chairperson || 'Tanzim Ahmed (Head of Quality)'
  );
  const [scribeName, setScribeName] = useState(
    initialMeeting?.scribeName || 'Farhana Akhter (QA Documentation Lead)'
  );

  // Garment & Buyer Context
  const [buyerName, setBuyerName] = useState(initialMeeting?.buyerName || 'H&M Hennes & Mauritz');
  const [orderPoNumber, setOrderPoNumber] = useState(initialMeeting?.orderPoNumber || 'PO-HM-88219');
  const [styleNumber, setStyleNumber] = useState(initialMeeting?.styleNumber || 'STY-DN-502');
  const [targetClosureDate, setTargetClosureDate] = useState(
    initialMeeting?.targetClosureDate || ''
  );

  // Agenda & Discussion Notes
  const [agenda, setAgenda] = useState(
    initialMeeting?.agenda ||
      'Review pilot sample wash effect, double-needle inseam chainstitch tension, approved size spec tolerances, and broken needle safety protocols.'
  );

  const [discussionNotes, setDiscussionNotes] = useState<string[]>(
    initialMeeting?.discussionNotes && initialMeeting.discussionNotes.length > 0
      ? initialMeeting.discussionNotes
      : [
          'Pilot run of 100 pcs completed with 2.4% DHU; seam tensions verified.',
          'Buyer Technical QA approved Shade Band #2 with enzyme tint.',
          'Needle policy and 9-point metal detector calibration logged and verified.',
        ]
  );
  const [newNoteInput, setNewNoteInput] = useState('');

  // Attendees
  const [attendees, setAttendees] = useState<MeetingAttendee[]>(
    initialMeeting?.attendees && initialMeeting.attendees.length > 0
      ? initialMeeting.attendees
      : [
          {
            id: 'att-1',
            name: 'Tanzim Ahmed',
            organization: 'FACTORY',
            department: 'Quality Assurance',
            role: 'Head of Quality / Meeting Chair',
            attendanceStatus: 'PRESENT',
            signatureConfirmed: true,
          },
          {
            id: 'att-2',
            name: 'Sarah Jenkins',
            organization: 'BUYER',
            department: 'H&M Technical QA',
            role: 'Buyer Quality Specialist',
            attendanceStatus: 'PRESENT',
            signatureConfirmed: true,
          },
          {
            id: 'att-3',
            name: 'Kabir Hossain',
            organization: 'FACTORY',
            department: 'Cutting Department',
            role: 'Chief Cutting Master',
            attendanceStatus: 'PRESENT',
            signatureConfirmed: true,
          },
          {
            id: 'att-4',
            name: 'Babul Akter',
            organization: 'FACTORY',
            department: 'Maintenance & Mechanics',
            role: 'Chief Sewing Mechanic',
            attendanceStatus: 'PRESENT',
            signatureConfirmed: true,
          },
        ]
  );

  // New attendee state
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeOrg, setNewAttendeeOrg] = useState<'FACTORY' | 'BUYER' | 'SUPPLIER' | 'THIRD_PARTY'>('FACTORY');
  const [newAttendeeDept, setNewAttendeeDept] = useState('Quality Assurance');
  const [newAttendeeRole, setNewAttendeeRole] = useState('QA Officer');

  // Action Items
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(
    initialMeeting?.actionItems && initialMeeting.actionItems.length > 0
      ? initialMeeting.actionItems
      : [
          {
            id: 'act-1',
            task: 'Fit titanium heavy-duty needles on Line 03 waistband and belt loop stations',
            assignee: 'Babul Akter',
            department: 'Maintenance',
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            priority: 'HIGH',
            completed: false,
          },
          {
            id: 'act-2',
            task: 'Issue updated approved shade band swatch cards to cutting spreader tables',
            assignee: 'Kabir Hossain',
            department: 'Cutting',
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            priority: 'HIGH',
            completed: false,
          },
        ]
  );

  // New action state
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  const [newActionDept, setNewActionDept] = useState('Quality Assurance');
  const [newActionDueDate, setNewActionDueDate] = useState('');
  const [newActionPriority, setNewActionPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  // Governance & Status
  const [status, setStatus] = useState<MeetingStatus>(
    initialMeeting?.status || 'ACTIONS_PENDING'
  );
  const [preparedBy, setPreparedBy] = useState(
    initialMeeting?.preparedBy || 'Farhana Akhter (QA Documentation Lead)'
  );
  const [approvedBy, setApprovedBy] = useState(
    initialMeeting?.approvedBy || 'Tanzim Ahmed (Head of Quality)'
  );

  // Add Discussion Note
  const handleAddNote = () => {
    if (!newNoteInput.trim()) return;
    setDiscussionNotes([...discussionNotes, newNoteInput.trim()]);
    setNewNoteInput('');
  };

  const handleRemoveNote = (index: number) => {
    setDiscussionNotes(discussionNotes.filter((_, i) => i !== index));
  };

  // Add Attendee
  const handleAddAttendee = () => {
    if (!newAttendeeName.trim()) {
      showToast('Please specify attendee name');
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
    setAttendees([...attendees, newAtt]);
    setNewAttendeeName('');
  };

  const handleRemoveAttendee = (id: string) => {
    setAttendees(attendees.filter((a) => a.id !== id));
  };

  // Add Action Item
  const handleAddAction = () => {
    if (!newActionTask.trim() || !newActionAssignee.trim()) {
      showToast('Please enter both action task and assignee');
      return;
    }
    const newAct: MeetingActionItem = {
      id: `act-${Date.now()}`,
      task: newActionTask.trim(),
      assignee: newActionAssignee.trim(),
      department: newActionDept,
      dueDate: newActionDueDate || new Date().toISOString().split('T')[0],
      priority: newActionPriority,
      completed: false,
    };
    setActionItems([...actionItems, newAct]);
    setNewActionTask('');
    setNewActionAssignee('');
  };

  const handleRemoveAction = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  // Save form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a meeting title');
      return;
    }

    if (!agenda.trim()) {
      showToast('Please enter the meeting agenda');
      return;
    }

    const meetingToSave: MeetingMinutesItem = {
      id: initialMeeting?.id || `mtg-${Date.now()}`,
      meetingCode: meetingCode.trim().toUpperCase(),
      title: title.trim(),
      meetingType,
      meetingDate,
      meetingTime,
      durationMinutes: Number(durationMinutes) || 60,
      venue,
      chairperson: chairperson.trim(),
      scribeName: scribeName.trim(),
      buyerName: buyerName.trim(),
      orderPoNumber: orderPoNumber.trim(),
      styleNumber: styleNumber.trim(),
      attendeesCount: attendees.length,
      attendees,
      agenda: agenda.trim(),
      discussionNotes,
      actionItems,
      status,
      preparedBy: preparedBy.trim(),
      approvedBy: approvedBy.trim(),
      targetClosureDate: targetClosureDate || undefined,
      createdAt: initialMeeting?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(meetingToSave);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Top Header & Sticky Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Cancel and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {meetingCode}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {isEditing ? 'Edit Meeting Record' : 'New Meeting Entry'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {isEditing ? `Edit: ${initialMeeting?.title}` : 'Record Quality Assurance Meeting Minutes (MOM)'}
            </h1>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Publish Meeting Minutes'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Meeting Identification & Logistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Meeting Identification &amp; Logistics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Minutes Code *</label>
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-blue-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Meeting Type *</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="PRE_PRODUCTION">Pre-Production (PP) Meeting</option>
                <option value="BUYER_QUALITY_REVIEW">Buyer Quality Review</option>
                <option value="WEEKLY_QMS">Weekly QA / Defect Reduction</option>
                <option value="NEEDLE_SAFETY">Needle Safety &amp; Metal Detection</option>
                <option value="CUSTOMER_CLAIM_CAPA">Customer Claim &amp; CAPA</option>
                <option value="MANAGEMENT_REVIEW">ISO 9001 Management Review</option>
                <option value="INTERNAL_AUDIT">Internal Quality Audit Review</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Meeting Title &amp; Focus *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Pre-Production Meeting: Style STY-DN-502 Men's Slim Denim Pant"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Meeting Date *</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Time Slot</label>
              <input
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                placeholder="e.g., 10:30 AM - 12:00 PM"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={15}
                max={480}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Venue / Location</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Executive Boardroom 1"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Chairperson *</label>
              <input
                type="text"
                value={chairperson}
                onChange={(e) => setChairperson(e.target.value)}
                placeholder="e.g., Tanzim Ahmed (Head of Quality)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Minutes Scribe (Secretary)</label>
              <input
                type="text"
                value={scribeName}
                onChange={(e) => setScribeName(e.target.value)}
                placeholder="e.g., Farhana Akhter"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Governance Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MeetingStatus)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIONS_PENDING">Actions Pending</option>
                <option value="CLOSED">Closed (All Actions Done)</option>
                <option value="IN_REVIEW">In Review</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Close Date</label>
              <input
                type="date"
                value={targetClosureDate}
                onChange={(e) => setTargetClosureDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Garment Production & Buyer Context */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Garment Production &amp; Buyer Context
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Buyer / Brand Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g., H&M Hennes & Mauritz"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Order / PO Number</label>
              <input
                type="text"
                value={orderPoNumber}
                onChange={(e) => setOrderPoNumber(e.target.value)}
                placeholder="e.g., PO-HM-88219"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Style Reference Code</label>
              <input
                type="text"
                value={styleNumber}
                onChange={(e) => setStyleNumber(e.target.value)}
                placeholder="e.g., STY-DN-502"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-purple-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Agenda & Objectives */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Meeting Agenda &amp; Primary Objectives *
            </h2>
          </div>
          <div>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Outline the meeting purpose, key issues examined, pilot sample outcomes, or ISO compliance audit requirements..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Section 4: Discussion Points & Technical Decisions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Key Discussion Points &amp; Decisions ({discussionNotes.length})
              </h2>
            </div>
          </div>

          {/* Add discussion input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newNoteInput}
              onChange={(e) => setNewNoteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
              placeholder="Enter technical decision, approved tolerance, washing shade result, or machine adjustment..."
              className="flex-1 p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddNote}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              + Add Point
            </button>
          </div>

          <div className="space-y-2">
            {discussionNotes.map((note, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-slate-800 leading-snug">{note}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNote(idx)}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors shrink-0"
                  title="Remove point"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Attendees Roster Builder */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                5. Attendees Roster &amp; Cross-Functional Leads ({attendees.length})
              </h2>
            </div>
          </div>

          {/* Add attendee form row */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="sm:col-span-1">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newAttendeeName}
                  onChange={(e) => setNewAttendeeName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <select
                  value={newAttendeeOrg}
                  onChange={(e) => setNewAttendeeOrg(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="FACTORY">Factory</option>
                  <option value="BUYER">Buyer</option>
                  <option value="SUPPLIER">Trim / Fabric Supplier</option>
                  <option value="THIRD_PARTY">Third-Party Lab / Auditor</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Department (e.g. Cutting, QA)"
                  value={newAttendeeDept}
                  onChange={(e) => setNewAttendeeDept(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Role (e.g. Master, QA Spec)"
                  value={newAttendeeRole}
                  onChange={(e) => setNewAttendeeRole(e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-slate-200 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddAttendee}
                  className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Attendees List Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Organization</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendees.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{att.name}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {att.organization}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{att.department}</td>
                    <td className="py-2 px-3 text-slate-600">{att.role}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {att.attendanceStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(att.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: Action Items & Assignees Builder */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                6. Corrective / Preventive Action Items ({actionItems.length})
              </h2>
            </div>
          </div>

          {/* Add action row */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Action Task Description *
              </label>
              <input
                type="text"
                placeholder="e.g., Fit titanium needles on Line 03 or calibrate VeriVide light box..."
                value={newActionTask}
                onChange={(e) => setNewActionTask(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <input
                  type="text"
                  placeholder="Assignee Name *"
                  value={newActionAssignee}
                  onChange={(e) => setNewActionAssignee(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Department"
                  value={newActionDept}
                  onChange={(e) => setNewActionDept(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={newActionDueDate}
                  onChange={(e) => setNewActionDueDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={newActionPriority}
                  onChange={(e) => setNewActionPriority(e.target.value as any)}
                  className="flex-1 p-2 rounded-lg border border-slate-200 bg-white font-semibold"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0 cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Action Items List */}
          <div className="space-y-2">
            {actionItems.map((act, idx) => (
              <div
                key={act.id || idx}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{act.task}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        act.priority === 'HIGH'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : act.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {act.priority || 'MEDIUM'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Assignee: <strong className="text-slate-800">{act.assignee}</strong> • Due: {act.dueDate}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAction(idx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 7: Governance & Sign-off Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              7. Governance &amp; Official Sign-Off
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Prepared By (Documentation Officer)</label>
              <input
                type="text"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Approved By (QA Head / Factory GM)</label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isEditing ? 'Save Changes' : 'Publish Meeting Minutes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
