'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Users,
  CheckSquare,
  ShieldCheck,
  Plus,
  Trash2,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import {
  FactoryEventItem,
  EventType,
  EventStatus,
  EventPriority,
  EventAttendee,
  EventScheduleItem,
  EventChecklistItem,
} from '@/lib/types/modules';

interface EventEntryPageProps {
  initialEvent?: FactoryEventItem | null;
  onSave: (event: FactoryEventItem) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function EventEntryPage({
  initialEvent,
  onSave,
  onCancel,
  showToast,
}: EventEntryPageProps) {
  const isEditing = Boolean(initialEvent);

  // Form State
  const [eventCode, setEventCode] = useState(
    initialEvent?.eventCode || `EVT-2026-${String(Math.floor(Math.random() * 90) + 10)}`
  );
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [type, setType] = useState<EventType>(
    (initialEvent?.type as EventType) || 'BUYER_VISIT'
  );
  const [priority, setPriority] = useState<EventPriority>(
    initialEvent?.priority || 'HIGH'
  );
  const [buyerName, setBuyerName] = useState(initialEvent?.buyerName || 'H&M Hennes & Mauritz');
  const [department, setDepartment] = useState(
    initialEvent?.department || 'Executive Quality & Merchandising'
  );

  // Timing & Venue
  const [eventDate, setEventDate] = useState(
    initialEvent?.eventDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    initialEvent?.endDate || new Date().toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState(
    initialEvent?.timeSlot || '09:00 AM - 05:00 PM'
  );
  const [location, setLocation] = useState(
    initialEvent?.location || 'Executive Boardroom, Sample Room & Sewing Floor'
  );
  const [leadOrganizer, setLeadOrganizer] = useState(
    initialEvent?.leadOrganizer || 'Farhan Rahman (Senior Merchandiser & QA Lead)'
  );

  // Agenda & Scope
  const [agendaSummary, setAgendaSummary] = useState(
    initialEvent?.agendaSummary ||
      'Review bulk production quality metrics, inspect pilot sewing lines, test physical lab equipment, and evaluate CAPA progress.'
  );
  const [description, setDescription] = useState(
    initialEvent?.description || 'Factory technical event scheduled under ERP quality governance calendar.'
  );

  // Status
  const [status, setStatus] = useState<EventStatus>(
    initialEvent?.status || 'UPCOMING'
  );

  // Delegation Builder
  const [attendees, setAttendees] = useState<EventAttendee[]>(
    initialEvent?.delegationMembers || [
      { id: 'att-1', name: 'Tanzim Ahmed', organization: 'FACTORY', role: 'Head of Quality', confirmed: true },
      { id: 'att-2', name: 'Sarah Jenkins', organization: 'BUYER', role: 'Buyer Technical QA', confirmed: true },
    ]
  );
  const [newAttName, setNewAttName] = useState('');
  const [newAttOrg, setNewAttOrg] = useState<'BUYER' | 'FACTORY' | 'AUDITOR' | 'SUPPLIER'>('BUYER');
  const [newAttRole, setNewAttRole] = useState('Quality Representative');

  // Itinerary Builder
  const [itinerary, setItinerary] = useState<EventScheduleItem[]>(
    initialEvent?.itinerary || [
      { id: 'itin-1', timeSlot: '09:00 AM - 10:00 AM', activity: 'Executive Welcome & Overview Presentation', location: 'Boardroom', facilitator: 'Tanzim Ahmed', completed: false },
      { id: 'itin-2', timeSlot: '10:00 AM - 01:00 PM', activity: 'Floor Walkthrough & Sewing Line Inspection', location: 'Sewing Floor', facilitator: 'Floor Lead', completed: false },
    ]
  );
  const [newItinTime, setNewItinTime] = useState('');
  const [newItinActivity, setNewItinActivity] = useState('');

  // Checklist Builder
  const [checklist, setChecklist] = useState<EventChecklistItem[]>(
    initialEvent?.preparationChecklist || [
      { id: 'chk-1', task: 'Prepare DHU trend charts and golden sample display', responsiblePerson: 'QA Documentation', dueDate: eventDate, completed: true },
      { id: 'chk-2', task: 'Audit floor housekeeping and clean workstations', responsiblePerson: 'Floor Supervisor', dueDate: eventDate, completed: false },
    ]
  );
  const [newChkTask, setNewChkTask] = useState('');
  const [newChkPerson, setNewChkPerson] = useState('');

  // Add Attendee
  const handleAddAttendee = () => {
    if (!newAttName.trim()) return;
    const newAtt: EventAttendee = {
      id: `att-${Date.now()}`,
      name: newAttName.trim(),
      organization: newAttOrg,
      role: newAttRole.trim(),
      confirmed: true,
    };
    setAttendees([...attendees, newAtt]);
    setNewAttName('');
  };

  const handleRemoveAttendee = (id: string) => {
    setAttendees(attendees.filter((a) => a.id !== id));
  };

  // Add Itinerary
  const handleAddItinerary = () => {
    if (!newItinActivity.trim() || !newItinTime.trim()) return;
    const newItin: EventScheduleItem = {
      id: `itin-${Date.now()}`,
      timeSlot: newItinTime.trim(),
      activity: newItinActivity.trim(),
      location: location.split(',')[0],
      facilitator: leadOrganizer.split('(')[0],
      completed: false,
    };
    setItinerary([...itinerary, newItin]);
    setNewItinActivity('');
    setNewItinTime('');
  };

  const handleRemoveItinerary = (id: string) => {
    setItinerary(itinerary.filter((i) => i.id !== id));
  };

  // Add Checklist Task
  const handleAddChecklist = () => {
    if (!newChkTask.trim()) return;
    const newChk: EventChecklistItem = {
      id: `chk-${Date.now()}`,
      task: newChkTask.trim(),
      responsiblePerson: newChkPerson.trim() || leadOrganizer.split('(')[0],
      dueDate: eventDate,
      completed: false,
    };
    setChecklist([...checklist, newChk]);
    setNewChkTask('');
    setNewChkPerson('');
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist(checklist.filter((c) => c.id !== id));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please specify the event title');
      return;
    }

    if (!location.trim()) {
      showToast('Please specify the plant location / venue');
      return;
    }

    const completedCount = checklist.filter((c) => c.completed).length;
    const readiness = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 80;

    const eventToSave: FactoryEventItem = {
      id: initialEvent?.id || `evt-${Date.now()}`,
      eventCode: eventCode.trim().toUpperCase(),
      title: title.trim(),
      type,
      priority,
      buyerName: buyerName.trim(),
      department: department.trim(),
      eventDate,
      endDate: endDate || eventDate,
      timeSlot,
      location: location.trim(),
      leadOrganizer: leadOrganizer.trim(),
      agendaSummary: agendaSummary.trim(),
      description: description.trim(),
      status,
      readinessPercentage: readiness,
      attendeesCount: attendees.length,
      delegationMembers: attendees,
      itinerary,
      preparationChecklist: checklist,
      createdAt: initialEvent?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(eventToSave);
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
                {eventCode}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                {isEditing ? 'Edit Scheduled Event' : 'New Plant Event'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {isEditing ? `Edit: ${initialEvent?.title}` : 'Schedule Quality Event, Buyer Visit or Audit'}
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
            <span>{isEditing ? 'Save Event' : 'Publish to Calendar'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Event Identification & Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Event Identification &amp; Purpose
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Event Code *</label>
              <input
                type="text"
                value={eventCode}
                onChange={(e) => setEventCode(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono font-bold text-blue-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Event Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="BUYER_VISIT">Buyer Delegation Visit</option>
                <option value="PRE_PRODUCTION_MEETING">PP Meeting &amp; Pilot Run</option>
                <option value="AUDIT_INSPECTION">Audit &amp; Certification</option>
                <option value="QUALITY_MONTH">Quality Month &amp; Campaign</option>
                <option value="MAINTENANCE_SHUTDOWN">Maintenance &amp; Calibration</option>
                <option value="TRAINING_SEMINAR">Technical QMS Workshop</option>
                <option value="MANAGEMENT_REVIEW">ISO Management Review</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Event Title &amp; Focus *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., H&M Regional Quality Director Semi-Annual Technical Visit"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as EventPriority)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              >
                <option value="CRITICAL">Critical (Executive Priority)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Buyer / Brand Name</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g., H&M, Zara, PVH, Target"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Host Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Executive Quality Assurance & Merchandising"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Timing & Venue Logistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-purple-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              2. Timing &amp; Venue Logistics
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Start Date *</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Time Slot / Duration</label>
              <input
                type="text"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="e.g., 09:00 AM - 05:00 PM"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Event Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
              >
                <option value="UPCOMING">Upcoming</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CONCLUDED">Concluded</option>
                <option value="POSTPONED">Postponed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Plant Location / Venue *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Executive Boardroom, Sample Room & Sewing Floor"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">Lead Organizer *</label>
              <input
                type="text"
                value={leadOrganizer}
                onChange={(e) => setLeadOrganizer(e.target.value)}
                placeholder="e.g., Farhan Rahman (Senior Merchandiser & QA Lead)"
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 3: Objectives & Agenda Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              3. Event Scope &amp; Agenda Summary
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Key Agenda Summary</label>
              <textarea
                rows={2}
                value={agendaSummary}
                onChange={(e) => setAgendaSummary(e.target.value)}
                placeholder="Summary of presentations, line inspections, lab tests, and closing meeting..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Context &amp; Strategic Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Background context, previous audit score, special guest dietary/safety needs..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Delegation & Attendees Builder */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Delegation Roster &amp; Participants ({attendees.length})
              </h2>
            </div>
          </div>

          {/* Add Attendee Row */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 text-xs">
            <input
              type="text"
              placeholder="Delegate Name..."
              value={newAttName}
              onChange={(e) => setNewAttName(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-200 bg-white"
            />
            <select
              value={newAttOrg}
              onChange={(e) => setNewAttOrg(e.target.value as any)}
              className="p-2 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="BUYER">Buyer</option>
              <option value="AUDITOR">Auditor</option>
              <option value="FACTORY">Factory</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
            <input
              type="text"
              placeholder="Role / Title..."
              value={newAttRole}
              onChange={(e) => setNewAttRole(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={handleAddAttendee}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 cursor-pointer"
            >
              + Add
            </button>
          </div>

          {/* Attendees List */}
          <div className="space-y-2">
            {attendees.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{att.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    {att.organization}
                  </span>
                  <span className="text-[11px] text-slate-500">• {att.role}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttendee(att.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Itinerary Schedule Builder */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                5. Schedule &amp; Activity Itinerary ({itinerary.length})
              </h2>
            </div>
          </div>

          {/* Add Itinerary Row */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 text-xs">
            <input
              type="text"
              placeholder="Time Slot (e.g. 10:00 AM - 11:30 AM)..."
              value={newItinTime}
              onChange={(e) => setNewItinTime(e.target.value)}
              className="w-48 p-2 rounded-lg border border-slate-200 bg-white"
            />
            <input
              type="text"
              placeholder="Activity Description..."
              value={newItinActivity}
              onChange={(e) => setNewItinActivity(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={handleAddItinerary}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shrink-0 cursor-pointer"
            >
              + Add
            </button>
          </div>

          {/* Itinerary List */}
          <div className="space-y-2">
            {itinerary.map((itin) => (
              <div
                key={itin.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-700">{itin.timeSlot}</span>
                  <span className="text-slate-800 font-medium truncate">{itin.activity}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItinerary(itin.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Preparation Checklist Builder */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                6. Pre-Event Preparation Checklist ({checklist.length})
              </h2>
            </div>
          </div>

          {/* Add Checklist Row */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 text-xs">
            <input
              type="text"
              placeholder="Preparation task..."
              value={newChkTask}
              onChange={(e) => setNewChkTask(e.target.value)}
              className="flex-1 p-2 rounded-lg border border-slate-200 bg-white"
            />
            <input
              type="text"
              placeholder="Responsible person..."
              value={newChkPerson}
              onChange={(e) => setNewChkPerson(e.target.value)}
              className="w-48 p-2 rounded-lg border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={handleAddChecklist}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0 cursor-pointer"
            >
              + Add
            </button>
          </div>

          {/* Checklist List */}
          <div className="space-y-2">
            {checklist.map((chk) => (
              <div
                key={chk.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{chk.task}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Lead: {chk.responsiblePerson}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveChecklist(chk.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
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
            <span>{isEditing ? 'Save Event' : 'Publish to Calendar'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
