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
  ShieldCheck,
  CheckSquare,
  Plus,
  Check,
  Percent,
  Sparkles,
  FileText,
  UserCheck,
  Compass,
  Briefcase,
  AlertTriangle,
  FileDown,
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
import { EVENT_TYPE_CONFIG } from './events-data';
import { useModulePermission } from '@/hooks/use-module-permission';
import { EventSingleExportModal } from './EventSingleExportModal';

interface EventDetailsPageProps {
  event: FactoryEventItem;
  onBack: () => void;
  onEdit: (event: FactoryEventItem) => void;
  onDuplicate: (event: FactoryEventItem) => void;
  onDelete: (event: FactoryEventItem) => void;
  onUpdateEvent?: (updated: FactoryEventItem) => void;
  showToast: (msg: string) => void;
}

export function EventDetailsPage({
  event,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateEvent,
  showToast,
}: EventDetailsPageProps) {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('events');
  const [currentEvent, setCurrentEvent] = useState<FactoryEventItem>(event);
  const [attendees, setAttendees] = useState<EventAttendee[]>(event.delegationMembers || []);
  const [itinerary, setItinerary] = useState<EventScheduleItem[]>(event.itinerary || []);
  const [checklist, setChecklist] = useState<EventChecklistItem[]>(event.preparationChecklist || []);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Quick Add Attendee Form State
  const [showAddAttendee, setShowAddAttendee] = useState(false);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeOrg, setNewAttendeeOrg] = useState<'BUYER' | 'FACTORY' | 'AUDITOR' | 'SUPPLIER'>('BUYER');
  const [newAttendeeRole, setNewAttendeeRole] = useState('Technical Representative');

  // Quick Add Itinerary Item Form State
  const [showAddItinerary, setShowAddItinerary] = useState(false);
  const [newItinTime, setNewItinTime] = useState('');
  const [newItinActivity, setNewItinActivity] = useState('');
  const [newItinLocation, setNewItinLocation] = useState(event.location.split(',')[0]);
  const [newItinFacilitator, setNewItinFacilitator] = useState(event.leadOrganizer.split('(')[0]);

  // Quick Add Checklist Item Form State
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newChecklistTask, setNewChecklistTask] = useState('');
  const [newChecklistAssignee, setNewChecklistAssignee] = useState(event.leadOrganizer.split('(')[0]);
  const [newChecklistDueDate, setNewChecklistDueDate] = useState('');

  // Status Change Handler
  const handleStatusChange = (newStatus: EventStatus) => {
    const updated: FactoryEventItem = {
      ...currentEvent,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    showToast(`Event status updated to ${newStatus}`);
  };

  // Priority Change Handler
  const handlePriorityChange = (newPriority: EventPriority) => {
    const updated: FactoryEventItem = {
      ...currentEvent,
      priority: newPriority,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    showToast(`Event priority updated to ${newPriority}`);
  };

  // Toggle Checklist Item Completion & Recalculate Readiness %
  const handleToggleChecklist = (index: number) => {
    const updatedList = [...checklist];
    const item = updatedList[index];
    const isNowDone = !item.completed;

    updatedList[index] = {
      ...item,
      completed: isNowDone,
      completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
    };
    setChecklist(updatedList);

    const completedCount = updatedList.filter((c) => c.completed).length;
    const newReadiness = Math.round((completedCount / (updatedList.length || 1)) * 100);

    const updated: FactoryEventItem = {
      ...currentEvent,
      preparationChecklist: updatedList,
      readinessPercentage: newReadiness,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    showToast(isNowDone ? 'Preparation task completed' : 'Preparation task reopened');
  };

  // Add Checklist Item
  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTask.trim()) return;

    const newItem: EventChecklistItem = {
      id: `chk-${Date.now()}`,
      task: newChecklistTask.trim(),
      responsiblePerson: newChecklistAssignee.trim(),
      dueDate: newChecklistDueDate || currentEvent.eventDate,
      completed: false,
    };

    const updatedList = [...checklist, newItem];
    setChecklist(updatedList);

    const completedCount = updatedList.filter((c) => c.completed).length;
    const newReadiness = Math.round((completedCount / updatedList.length) * 100);

    const updated: FactoryEventItem = {
      ...currentEvent,
      preparationChecklist: updatedList,
      readinessPercentage: newReadiness,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    setNewChecklistTask('');
    setShowAddChecklist(false);
    showToast('Preparation task added');
  };

  // Toggle Itinerary Item
  const handleToggleItinerary = (index: number) => {
    const updatedItin = [...itinerary];
    const item = updatedItin[index];
    updatedItin[index] = {
      ...item,
      completed: !item.completed,
    };
    setItinerary(updatedItin);

    const updated: FactoryEventItem = {
      ...currentEvent,
      itinerary: updatedItin,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
  };

  // Add Itinerary Activity
  const handleAddItinerary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItinActivity.trim() || !newItinTime.trim()) return;

    const newItin: EventScheduleItem = {
      id: `itin-${Date.now()}`,
      timeSlot: newItinTime.trim(),
      activity: newItinActivity.trim(),
      location: newItinLocation.trim(),
      facilitator: newItinFacilitator.trim(),
      completed: false,
    };

    const updatedItin = [...itinerary, newItin];
    setItinerary(updatedItin);

    const updated: FactoryEventItem = {
      ...currentEvent,
      itinerary: updatedItin,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    setNewItinActivity('');
    setNewItinTime('');
    setShowAddItinerary(false);
    showToast('Itinerary activity scheduled');
  };

  // Add Attendee
  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttendeeName.trim()) return;

    const newAtt: EventAttendee = {
      id: `att-${Date.now()}`,
      name: newAttendeeName.trim(),
      organization: newAttendeeOrg,
      role: newAttendeeRole.trim(),
      confirmed: true,
    };

    const updatedAttendees = [...attendees, newAtt];
    setAttendees(updatedAttendees);

    const updated: FactoryEventItem = {
      ...currentEvent,
      delegationMembers: updatedAttendees,
      attendeesCount: updatedAttendees.length,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setCurrentEvent(updated);
    onUpdateEvent?.(updated);
    setNewAttendeeName('');
    setShowAddAttendee(false);
    showToast('Delegate registered');
  };

  // Event Type Configuration
  const typeCfg = EVENT_TYPE_CONFIG[currentEvent.type] || {
    label: currentEvent.type,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    tone: 'blue',
  };

  const readiness = currentEvent.readinessPercentage ?? 80;

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
        {/* Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Events Calendar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {currentEvent.eventCode}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${typeCfg.badgeClass}`}>
                {typeCfg.label}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1 line-clamp-1">
              {currentEvent.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Status:</span>
            <select
              value={currentEvent.status}
              onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
              className="text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="UPCOMING">Upcoming</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="CONCLUDED">Concluded</option>
              <option value="POSTPONED">Postponed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Priority:</span>
            <select
              value={currentEvent.priority || 'HIGH'}
              onChange={(e) => handlePriorityChange(e.target.value as EventPriority)}
              className="text-xs font-bold bg-transparent border-none text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
            </select>
          </div>


          {/* Duplicate Button */}
          {canCreate && (
            <button
              type="button"
              onClick={() => onDuplicate(currentEvent)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Duplicate Event Template"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden md:inline">Duplicate</span>
            </button>
          )}

          {/* Export Button */}
          {canExport && (
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Export Event Dossier"
            >
              <FileDown className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden md:inline">Export Dossier</span>
            </button>
          )}

          {/* Edit Button */}
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(currentEvent)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Event</span>
            </button>
          )}

          {/* Delete Button */}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(currentEvent)}
              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Event"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI & Readiness Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Scheduled Date */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Scheduled Date</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-slate-900">
            {currentEvent.eventDate}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            {currentEvent.timeSlot || 'Full Day Program'}
          </div>
        </div>

        {/* Readiness Index */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Readiness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-emerald-700 flex items-center gap-2">
            <span>{readiness}%</span>
            <span className="text-xs font-normal text-slate-500 font-sans">Prepared</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${readiness}%` }}
            />
          </div>
        </div>

        {/* Location & Hall */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Plant Location</span>
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 line-clamp-1">
            {currentEvent.location}
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            Host: <span className="font-semibold text-slate-700">{currentEvent.department || 'Quality Assurance'}</span>
          </div>
        </div>

        {/* Delegation Size */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Delegation Roster</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-slate-900">
            {attendees.length || currentEvent.attendeesCount || 5} Delegates
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1">
            Lead: {currentEvent.leadOrganizer.split('(')[0]}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Itinerary & Checklist, Right Column Scope & Delegates */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Itinerary & Preparation Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scheduled Itinerary & Activity Timeline */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Event Itinerary &amp; Activity Schedule ({itinerary.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItinerary(!showAddItinerary)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Activity</span>
              </button>
            </div>

            {/* Quick Add Itinerary Form */}
            {showAddItinerary && (
              <form onSubmit={handleAddItinerary} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Schedule Itinerary Activity</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Time Slot *</label>
                    <input
                      type="text"
                      value={newItinTime}
                      onChange={(e) => setNewItinTime(e.target.value)}
                      placeholder="e.g., 10:00 AM - 11:30 AM"
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Location / Room</label>
                    <input
                      type="text"
                      value={newItinLocation}
                      onChange={(e) => setNewItinLocation(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Activity Description *</label>
                  <input
                    type="text"
                    value={newItinActivity}
                    onChange={(e) => setNewItinActivity(e.target.value)}
                    placeholder="e.g., Floor walkthrough: Sewing Line 01-04 Pilot run & needle inspection..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Facilitator</label>
                  <input
                    type="text"
                    value={newItinFacilitator}
                    onChange={(e) => setNewItinFacilitator(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddItinerary(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            )}

            {/* Itinerary Timeline List */}
            <div className="space-y-2.5">
              {itinerary.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.completed
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleItinerary(idx)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        item.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }`}
                      title={item.completed ? 'Click to reopen activity' : 'Click to complete activity'}
                    >
                      {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {item.timeSlot}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400" /> {item.location}
                        </span>
                      </div>
                      <p
                        className={`text-xs mt-1.5 leading-snug ${
                          item.completed ? 'line-through text-slate-500' : 'text-slate-900 font-semibold'
                        }`}
                      >
                        {item.activity}
                      </p>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Facilitator: <strong className="text-slate-700">{item.facilitator}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation & Readiness Checklist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Pre-Event Readiness Checklist ({checklist.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddChecklist(!showAddChecklist)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Quick Add Checklist Form */}
            {showAddChecklist && (
              <form onSubmit={handleAddChecklist} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Add Pre-Visit Preparation Task</h4>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Preparation Task *</label>
                  <input
                    type="text"
                    value={newChecklistTask}
                    onChange={(e) => setNewChecklistTask(e.target.value)}
                    placeholder="e.g., Prepare A/W 2026 bulk production DHU charts & golden sample display..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Responsible Person</label>
                    <input
                      type="text"
                      value={newChecklistAssignee}
                      onChange={(e) => setNewChecklistAssignee(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={newChecklistDueDate}
                      onChange={(e) => setNewChecklistDueDate(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddChecklist(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            )}

            {/* Checklist Items with Checkbox Toggling */}
            <div className="space-y-2.5">
              {checklist.map((chk, idx) => (
                <div
                  key={chk.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    chk.completed
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleChecklist(idx)}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        chk.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-blue-500 bg-white'
                      }`}
                      title={chk.completed ? 'Click to reopen task' : 'Click to complete task'}
                    >
                      {chk.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className={`text-xs font-medium leading-snug ${
                            chk.completed ? 'line-through text-slate-500' : 'text-slate-900 font-semibold'
                          }`}
                        >
                          {chk.task}
                        </p>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            chk.completed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {chk.completed ? 'Done' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
                        <span>Lead: <strong className="text-slate-800">{chk.responsiblePerson}</strong></span>
                        <span className="font-mono">Due: <strong>{chk.dueDate}</strong></span>
                        {chk.completed && chk.completedDate && (
                          <span className="text-emerald-700 font-mono">Completed: {chk.completedDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Operational Scope & Delegation Roster */}
        <div className="space-y-6">
          {/* Operational Context Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Event Logistics &amp; Scope
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Buyer / Org:
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {currentEvent.buyerName || 'Plant-Wide Event'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Department:
                </span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {currentEvent.department || 'Quality Assurance'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Lead Organizer:
                </span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                  {currentEvent.leadOrganizer}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Main Venue:
                </span>
                <span className="font-medium text-slate-800 truncate max-w-[170px]">
                  {currentEvent.location}
                </span>
              </div>
            </div>
          </div>

          {/* Agenda Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Agenda &amp; Objectives Summary
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {currentEvent.agendaSummary || currentEvent.description || 'Quality event agenda outlined under factory QMS calendar.'}
            </p>
          </div>

          {/* Delegation & Attendees Roster */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Delegation Roster ({attendees.length})
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

            {/* Quick Add Delegate Form */}
            {showAddAttendee && (
              <form onSubmit={handleAddAttendee} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <input
                  type="text"
                  placeholder="Delegate Full Name"
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
                    <option value="BUYER">Buyer</option>
                    <option value="AUDITOR">Auditor (3rd Party)</option>
                    <option value="FACTORY">Factory</option>
                    <option value="SUPPLIER">Supplier</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Role"
                    value={newAttendeeRole}
                    onChange={(e) => setNewAttendeeRole(e.target.value)}
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
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Attendees List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {attendees.map((att) => {
                const orgBadgeClass =
                  att.organization === 'BUYER'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : att.organization === 'AUDITOR'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200';

                return (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 truncate">{att.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${orgBadgeClass}`}>
                          {att.organization}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{att.role}</div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      Confirmed
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Single Event Export Modal */}
      <EventSingleExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        event={currentEvent}
      />
    </div>
  );
}
