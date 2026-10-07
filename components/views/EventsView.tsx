'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  PieChart,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  CheckSquare,
  Building2,
  ShieldCheck,
  Check,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { FactoryEventItem, EventType, EventStatus, EventPriority } from '@/lib/types/modules';
import { INITIAL_FACTORY_EVENTS, EVENT_TYPE_CONFIG } from '../modules/events/events-data';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { EventDetailsPage } from '../modules/events/EventDetailsPage';
import { EventEntryPage } from '../modules/events/EventEntryPage';
import { DeleteEventModal } from '../modules/events/DeleteEventModal';

type EventSubView =
  | { type: 'none' }
  | { type: 'details'; event: FactoryEventItem }
  | { type: 'add' }
  | { type: 'edit'; event: FactoryEventItem };

export function EventsView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [subView, setSubView] = useState<EventSubView>({ type: 'none' });
  const [events, setEvents] = useLiveModuleData<FactoryEventItem[]>(
    'factory_events',
    INITIAL_FACTORY_EVENTS,
    'erp_factory_events_v1'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [buyerFilter, setBuyerFilter] = useState<string>('ALL');

  // Deletion Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    events: FactoryEventItem[];
  }>({
    isOpen: false,
    events: [],
  });

  const saveEvents = (updated: FactoryEventItem[]) => {
    setEvents(updated);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Calculations for KPIs
  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => e.status === 'UPCOMING').length;
  const inProgressCount = events.filter((e) => e.status === 'IN_PROGRESS').length;
  const concludedCount = events.filter((e) => e.status === 'CONCLUDED').length;

  // Cross-Event Checklist Items
  const allChecklistItems = events.flatMap((e) =>
    (e.preparationChecklist || []).map((chk) => ({
      ...chk,
      eventId: e.id,
      eventCode: e.eventCode,
      eventTitle: e.title,
      eventDate: e.eventDate,
      buyerName: e.buyerName,
    }))
  );
  const pendingChecklistCount = allChecklistItems.filter((c) => !c.completed).length;

  // Available unique buyers for filter
  const uniqueBuyers = Array.from(
    new Set(
      events
        .map((e) => e.buyerName)
        .filter((b): b is string => Boolean(b && b.trim()))
    )
  );

  // Filtered Events for Register Table
  const filteredEvents = events.filter((e) => {
    if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (buyerFilter !== 'ALL' && e.buyerName && !e.buyerName.toLowerCase().includes(buyerFilter.toLowerCase()))
      return false;
    return true;
  });

  // Duplicate Event Handler
  const handleDuplicateEvent = (source: FactoryEventItem) => {
    const duplicated: FactoryEventItem = {
      ...source,
      id: `evt-${Date.now()}`,
      eventCode: `EVT-2026-${String(Math.floor(Math.random() * 90) + 10)}`,
      title: `${source.title} (Copy)`,
      status: 'UPCOMING',
      readinessPercentage: 0,
      itinerary: (source.itinerary || []).map((it, i) => ({
        ...it,
        id: `itin-${Date.now()}-${i}`,
        completed: false,
      })),
      preparationChecklist: (source.preparationChecklist || []).map((c, i) => ({
        ...c,
        id: `chk-${Date.now()}-${i}`,
        completed: false,
        completedDate: undefined,
      })),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [duplicated, ...events];
    saveEvents(updated);
    showToast(`Created duplicate event ${duplicated.eventCode}`);
  };

  // Delete Handler
  const handleConfirmDelete = () => {
    const idsToDelete = new Set(deleteModalState.events.map((e) => e.id));
    const updated = events.filter((e) => !idsToDelete.has(e.id));
    saveEvents(updated);
    setDeleteModalState({ isOpen: false, events: [] });
    if (subView.type === 'details' && idsToDelete.has(subView.event.id)) {
      setSubView({ type: 'none' });
    }
    showToast(`Successfully deleted ${idsToDelete.size} event(s)`);
  };

  // Update Single Event
  const handleUpdateEvent = (updatedEvent: FactoryEventItem) => {
    const updated = events.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
    saveEvents(updated);
  };

  // Toggle Checklist Task from Cross-Event Checklist Tab
  const handleToggleChecklistAcrossEvents = (eventId: string, checklistId: string) => {
    const targetEvent = events.find((e) => e.id === eventId);
    if (!targetEvent) return;

    const updatedChecklist = (targetEvent.preparationChecklist || []).map((chk) => {
      if (chk.id !== checklistId) return chk;
      const isNowDone = !chk.completed;
      return {
        ...chk,
        completed: isNowDone,
        completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
      };
    });

    const completedCount = updatedChecklist.filter((c) => c.completed).length;
    const newReadiness = Math.round((completedCount / (updatedChecklist.length || 1)) * 100);

    const updatedEvent: FactoryEventItem = {
      ...targetEvent,
      preparationChecklist: updatedChecklist,
      readinessPercentage: newReadiness,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    handleUpdateEvent(updatedEvent);
    showToast('Updated preparation task completion status');
  };

  // Columns for Events Calendar Table - Specially fitted to reduce horizontal scroll
  const columns: ColumnDef<FactoryEventItem>[] = [
    {
      key: 'eventCode',
      header: 'Event Ref & Type',
      sortable: true,
      accessor: (item) => item.eventCode,
      render: (item) => {
        const typeCfg = EVENT_TYPE_CONFIG[item.type] || {
          label: item.type,
          badgeClass: 'bg-slate-100 text-slate-700',
        };

        return (
          <div className="space-y-1 max-w-[260px]">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => setSubView({ type: 'details', event: item })}
                className="font-mono font-bold text-blue-700 text-xs hover:underline cursor-pointer"
              >
                {item.eventCode}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${typeCfg.badgeClass}`}>
                {typeCfg.label}
              </span>
            </div>
            <span
              onClick={() => setSubView({ type: 'details', event: item })}
              className="font-semibold text-slate-900 text-xs hover:text-blue-600 cursor-pointer line-clamp-1"
              title={item.title}
            >
              {item.title}
            </span>
          </div>
        );
      },
    },
    {
      key: 'eventDate',
      header: 'Date & Time Slot',
      sortable: true,
      accessor: (item) => item.eventDate,
      render: (item) => (
        <div className="text-xs">
          <span className="font-mono font-bold text-slate-900 block">
            {item.eventDate}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[140px] mt-0.5">
            {item.timeSlot || 'Full Day'}
          </span>
        </div>
      ),
    },
    {
      key: 'buyerName',
      header: 'Buyer / Department',
      render: (item) => (
        <div className="text-xs max-w-[160px]">
          <span className="font-semibold text-slate-800 block truncate">
            {item.buyerName || 'Plant-Wide Event'}
          </span>
          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
            {item.department ? item.department.split('&')[0] : 'Quality Assurance'}
          </span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Plant Venue',
      render: (item) => (
        <div className="text-xs max-w-[170px]">
          <span className="text-slate-800 flex items-center gap-1 font-medium truncate" title={item.location}>
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </span>
          <span className="text-[10px] text-slate-400 block truncate mt-0.5 pl-4.5">
            Lead: {item.leadOrganizer.split('(')[0]}
          </span>
        </div>
      ),
    },
    {
      key: 'readiness',
      header: 'Audit Readiness',
      render: (item) => {
        const readiness = item.readinessPercentage ?? 80;
        return (
          <div className="w-24">
            <div className="flex justify-between text-[11px] font-mono font-semibold text-slate-700 mb-0.5">
              <span>{readiness}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  readiness >= 100
                    ? 'bg-emerald-500'
                    : readiness >= 75
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(readiness, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => item.status,
      align: 'center',
      render: (item) => {
        const variantMap: Record<string, any> = {
          UPCOMING: 'blue',
          IN_PROGRESS: 'amber',
          CONCLUDED: 'emerald',
          POSTPONED: 'rose',
          CANCELLED: 'neutral',
        };
        return (
          <StatusBadge
            label={item.status.replace(/_/g, ' ')}
            variant={variantMap[item.status] || 'neutral'}
          />
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', event: item })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            title="View Event Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', event: item })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Event"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicateEvent(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer hidden sm:inline-flex"
            title="Duplicate Event"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalState({ isOpen: true, events: [item] })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            title="Delete Event"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions
  const batchActions: BatchAction<FactoryEventItem>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModalState({
          isOpen: true,
          events: selected,
        });
      },
    },
    {
      label: 'Export Selected',
      onClick: (selected) => {
        showToast(`Exported ${selected.length} event records`);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      {subView.type !== 'details' && (
        <ModuleHeader
          id="events-module"
          title="Delegations & Events"
          activeView={subView.type !== 'none' ? 'list' : viewMode}
          onViewChange={(mode) => {
            setSubView({ type: 'none' });
            setViewMode(mode);
          }}
          customTabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'list', label: 'Events Calendar', count: events.length },
            { id: 'checklist', label: 'Preparation Checklist', count: pendingChecklistCount },
          ]}
        />
      )}

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <EventDetailsPage
          event={subView.event}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(e) => setSubView({ type: 'edit', event: e })}
          onDuplicate={(e) => {
            handleDuplicateEvent(e);
            setSubView({ type: 'none' });
          }}
          onDelete={(e) => {
            setDeleteModalState({ isOpen: true, events: [e] });
          }}
          onUpdateEvent={(updated) => {
            handleUpdateEvent(updated);
            setSubView({ type: 'details', event: updated });
          }}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <EventEntryPage
          onSave={(newEvent) => {
            const updated = [newEvent, ...events];
            saveEvents(updated);
            setSubView({ type: 'details', event: newEvent });
            showToast(`Created plant event ${newEvent.eventCode}`);
          }}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <EventEntryPage
          initialEvent={subView.event}
          onSave={(updatedEvent) => {
            handleUpdateEvent(updatedEvent);
            setSubView({ type: 'details', event: updatedEvent });
            showToast(`Updated event ${updatedEvent.eventCode}`);
          }}
          onCancel={() => setSubView({ type: 'details', event: subView.event })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards matching Buyer and Order style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Scheduled Quality Events"
                  value={totalEvents.toString()}
                  subtitle="Audits, Seminars & Walkthroughs"
                  icon={Calendar}
                  tone="blue"
                />
                <StatCard
                  title="Major Buyer Audits"
                  value="H&M / PVH"
                  subtitle="Technical Factory Evaluations"
                  icon={Users}
                  tone="indigo"
                />
                <StatCard
                  title="Upcoming Scheduled"
                  value={`${upcomingCount} Events`}
                  subtitle="Pre-Pro Line Inspections"
                  icon={Clock}
                  tone="amber"
                />
                <StatCard
                  title="Attendance Readiness"
                  value="100% Prepared"
                  subtitle="CAPAs and Files Ready"
                  icon={CheckCircle2}
                  tone="emerald"
                />
              </div>

              {/* 2-Column Summary Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Event Status Distribution */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Event Execution Lifecycle
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Current Qtr</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div
                      onClick={() => {
                        setStatusFilter('UPCOMING');
                        setViewMode('list');
                      }}
                      className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 hover:bg-blue-100/60 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-blue-700 font-semibold block">Upcoming</span>
                      <div className="text-lg font-bold font-mono text-blue-900 mt-1">{upcomingCount}</div>
                      <span className="text-[10px] text-slate-500">Pending arrival</span>
                    </div>
                    <div
                      onClick={() => {
                        setStatusFilter('IN_PROGRESS');
                        setViewMode('list');
                      }}
                      className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 hover:bg-amber-100/60 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-amber-700 font-semibold block">In Progress</span>
                      <div className="text-lg font-bold font-mono text-amber-900 mt-1">{inProgressCount}</div>
                      <span className="text-[10px] text-slate-500">Active on floor</span>
                    </div>
                    <div
                      onClick={() => {
                        setStatusFilter('CONCLUDED');
                        setViewMode('list');
                      }}
                      className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-emerald-700 font-semibold block">Concluded</span>
                      <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{concludedCount}</div>
                      <span className="text-[10px] text-slate-500">Minutes archived</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Agenda Schedule */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Upcoming Calendar Schedule
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    {events.slice(0, 3).map((e) => (
                      <div
                        key={e.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">
                            {e.title}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {e.location.split(',')[0]} • {e.leadOrganizer.split('(')[0]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSubView({ type: 'details', event: e })}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <SwitchToListBanner
                label="Open Complete Quality Events Schedule &amp; Calendar"
                recordCount={events.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: EVENTS CALENDAR REGISTER TABLE */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="events-table"
                data={filteredEvents}
                columns={columns}
                searchPlaceholder="Search event code, title, organizer, buyer, or venue..."
                searchableKeys={[
                  'eventCode',
                  'title',
                  'type',
                  'location',
                  'leadOrganizer',
                  'buyerName',
                  'department',
                ]}
                secondaryAction={
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Event Type Filter */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Event Types</option>
                      <option value="BUYER_VISIT">Buyer Delegation Visit</option>
                      <option value="PRE_PRODUCTION_MEETING">PP Meeting &amp; Pilot Run</option>
                      <option value="AUDIT_INSPECTION">Audit &amp; Certification</option>
                      <option value="QUALITY_MONTH">Quality Month</option>
                      <option value="MAINTENANCE_SHUTDOWN">Maintenance &amp; Calib.</option>
                      <option value="TRAINING_SEMINAR">Technical Workshop</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="UPCOMING">Upcoming</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="CONCLUDED">Concluded</option>
                      <option value="POSTPONED">Postponed</option>
                    </select>

                    {/* Buyer Filter */}
                    {uniqueBuyers.length > 0 && (
                      <select
                        value={buyerFilter}
                        onChange={(e) => setBuyerFilter(e.target.value)}
                        className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors max-w-[150px]"
                      >
                        <option value="ALL">All Buyers</option>
                        {uniqueBuyers.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                }
                primaryAction={
                  <button
                    type="button"
                    onClick={() => setSubView({ type: 'add' })}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: PREPARATION CHECKLIST */}
          {viewMode === 'checklist' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Pre-Event &amp; Audit Preparation Task Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live readiness checklist across all scheduled buyer delegations, pilot runs, and surveillance audits.
                  </p>
                </div>
              </div>

              {/* Checklist Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">Done</th>
                        <th className="py-3 px-3">Preparation Task</th>
                        <th className="py-3 px-3">Associated Event</th>
                        <th className="py-3 px-3">Responsible Person</th>
                        <th className="py-3 px-3">Due Date</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allChecklistItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                            No preparation tasks recorded across current scheduled events.
                          </td>
                        </tr>
                      ) : (
                        allChecklistItems.map((chk) => (
                          <tr
                            key={`${chk.eventId}-${chk.id}`}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              chk.completed ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleChecklistAcrossEvents(chk.eventId, chk.id)
                                }
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer mx-auto ${
                                  chk.completed
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-slate-300 hover:border-blue-500 bg-white'
                                }`}
                                title={chk.completed ? 'Click to reopen task' : 'Click to complete task'}
                              >
                                {chk.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            </td>
                            <td className="py-3 px-3 max-w-sm">
                              <span
                                className={`font-semibold block ${
                                  chk.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {chk.task}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono">
                              <button
                                type="button"
                                onClick={() => {
                                  const ev = events.find((x) => x.id === chk.eventId);
                                  if (ev) setSubView({ type: 'details', event: ev });
                                }}
                                className="text-blue-600 hover:underline font-bold block"
                              >
                                {chk.eventCode}
                              </button>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                                {chk.eventTitle}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-800 font-medium">
                              {chk.responsiblePerson}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-700">
                              {chk.dueDate}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  chk.completed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {chk.completed ? 'Completed' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteEventModal
        isOpen={deleteModalState.isOpen}
        events={deleteModalState.events}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, events: [] })}
      />
    </div>
  );
}
