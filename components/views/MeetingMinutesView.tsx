'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckSquare,
  Clock,
  Eye,
  Plus,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  ListTodo,
  Check,
} from 'lucide-react';
import { DataTable, ColumnDef, BatchAction } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MeetingMinutesItem, MeetingStatus, MeetingType } from '@/lib/types/modules';
import { INITIAL_MEETING_MINUTES, MEETING_TYPE_LABELS } from '../modules/meeting-minutes/meeting-minutes-data';
import { MeetingMinutesDetailsPage } from '../modules/meeting-minutes/MeetingMinutesDetailsPage';
import { MeetingMinutesEntryPage } from '../modules/meeting-minutes/MeetingMinutesEntryPage';
import { DeleteMeetingModal } from '../modules/meeting-minutes/DeleteMeetingModal';

type MeetingSubView =
  | { type: 'none' }
  | { type: 'details'; meeting: MeetingMinutesItem }
  | { type: 'add' }
  | { type: 'edit'; meeting: MeetingMinutesItem };

export function MeetingMinutesView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [subView, setSubView] = useState<MeetingSubView>({ type: 'none' });
  const [meetings, setMeetings] = useState<MeetingMinutesItem[]>(INITIAL_MEETING_MINUTES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [buyerFilter, setBuyerFilter] = useState<string>('ALL');

  // Action Tracker Filter
  const [actionPriorityFilter, setActionPriorityFilter] = useState<string>('ALL');
  const [actionStatusFilter, setActionStatusFilter] = useState<string>('PENDING');

  // Deletion Modal
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    meetings: MeetingMinutesItem[];
  }>({
    isOpen: false,
    meetings: [],
  });

  // LocalStorage Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('erp_meeting_minutes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMeetings(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveMeetings = (updated: MeetingMinutesItem[]) => {
    setMeetings(updated);
    try {
      localStorage.setItem('erp_meeting_minutes_v1', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Calculations for KPIs
  const totalMeetings = meetings.length;
  const totalActions = meetings.reduce((acc, m) => acc + (m.actionItems?.length || 0), 0);
  const completedActions = meetings.reduce(
    (acc, m) => acc + (m.actionItems?.filter((a) => a.completed).length || 0),
    0
  );
  const pendingActions = totalActions - completedActions;
  const closedMeetings = meetings.filter((m) => m.status === 'CLOSED').length;
  const pendingMeetings = meetings.filter((m) => m.status === 'ACTIONS_PENDING').length;
  const totalAttendeesLogged = meetings.reduce(
    (acc, m) => acc + (m.attendees?.length || m.attendeesCount || 0),
    0
  );
  const avgAttendance = totalMeetings > 0 ? (totalAttendeesLogged / totalMeetings).toFixed(1) : '0';

  // Filtered Meetings for Register Table
  const filteredMeetings = meetings.filter((m) => {
    if (typeFilter !== 'ALL' && m.meetingType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (buyerFilter !== 'ALL' && m.buyerName && !m.buyerName.toLowerCase().includes(buyerFilter.toLowerCase()))
      return false;
    return true;
  });

  // Duplicate Meeting
  const handleDuplicateMeeting = (source: MeetingMinutesItem) => {
    const duplicated: MeetingMinutesItem = {
      ...source,
      id: `mtg-${Date.now()}`,
      meetingCode: `MOM-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      title: `${source.title} (Copy)`,
      meetingDate: new Date().toISOString().split('T')[0],
      status: 'DRAFT',
      actionItems: (source.actionItems || []).map((a, i) => ({
        ...a,
        id: `act-${Date.now()}-${i}`,
        completed: false,
        completedDate: undefined,
      })),
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [duplicated, ...meetings];
    saveMeetings(updated);
    showToast(`Created duplicate template ${duplicated.meetingCode}`);
  };

  // Delete Handlers
  const handleConfirmDelete = () => {
    const idsToDelete = new Set(deleteModalState.meetings.map((m) => m.id));
    const updated = meetings.filter((m) => !idsToDelete.has(m.id));
    saveMeetings(updated);
    setDeleteModalState({ isOpen: false, meetings: [] });
    if (subView.type === 'details' && idsToDelete.has(subView.meeting.id)) {
      setSubView({ type: 'none' });
    }
    showToast(`Successfully deleted ${idsToDelete.size} meeting record(s)`);
  };

  // Update single meeting
  const handleUpdateMeeting = (updatedMeeting: MeetingMinutesItem) => {
    const updatedList = meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m));
    saveMeetings(updatedList);
  };

  // Toggle Action item from Cross-Meeting Action Tracker
  const handleToggleActionAcrossMeetings = (meetingId: string, actionId?: string, taskText?: string) => {
    const targetMeeting = meetings.find((m) => m.id === meetingId);
    if (!targetMeeting) return;

    const updatedActions = (targetMeeting.actionItems || []).map((act) => {
      const match = (actionId && act.id === actionId) || act.task === taskText;
      if (!match) return act;
      const isNowDone = !act.completed;
      return {
        ...act,
        completed: isNowDone,
        completedDate: isNowDone ? new Date().toISOString().split('T')[0] : undefined,
      };
    });

    const allDone = updatedActions.every((a) => a.completed);
    const updatedMeeting: MeetingMinutesItem = {
      ...targetMeeting,
      actionItems: updatedActions,
      status: allDone ? 'CLOSED' : 'ACTIONS_PENDING',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    handleUpdateMeeting(updatedMeeting);
    showToast('Updated action task completion status');
  };

  // Available unique buyers for filter
  const uniqueBuyers = Array.from(
    new Set(
      meetings
        .map((m) => m.buyerName)
        .filter((b): b is string => Boolean(b && b.trim()))
    )
  );

  // Table Columns - Designed specifically for FIT and REDUCED HORIZONTAL SCROLL
  const columns: ColumnDef<MeetingMinutesItem>[] = [
    {
      key: 'meetingCode',
      header: 'Minutes Ref & Type',
      sortable: true,
      accessor: (item) => item.meetingCode,
      render: (item) => {
        const typeCfg = item.meetingType
          ? MEETING_TYPE_LABELS[item.meetingType] || { label: item.meetingType, badgeClass: 'bg-slate-100 text-slate-700' }
          : { label: 'General QMS', badgeClass: 'bg-slate-100 text-slate-700' };

        return (
          <div className="space-y-1">
            <span className="font-mono font-bold text-blue-700 text-xs hover:underline cursor-pointer block"
              onClick={() => setSubView({ type: 'details', meeting: item })}>
              {item.meetingCode}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border inline-block ${typeCfg.badgeClass}`}>
              {typeCfg.label}
            </span>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Meeting Purpose & Chair',
      sortable: true,
      accessor: (item) => item.title,
      render: (item) => (
        <div className="max-w-[280px]">
          <span
            onClick={() => setSubView({ type: 'details', meeting: item })}
            className="font-semibold text-slate-900 text-xs hover:text-blue-600 cursor-pointer line-clamp-1"
            title={item.title}
          >
            {item.title}
          </span>
          <div className="text-[11px] text-slate-500 truncate mt-0.5">
            Chair: <span className="text-slate-700 font-medium">{item.chairperson.split('(')[0]}</span>
            {item.venue && ` • ${item.venue.split('&')[0]}`}
          </div>
        </div>
      ),
    },
    {
      key: 'meetingDate',
      header: 'Date & Time',
      sortable: true,
      accessor: (item) => item.meetingDate,
      render: (item) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-800 block">
            {item.meetingDate}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            {item.meetingTime ? item.meetingTime.split('-')[0].trim() : `${item.durationMinutes || 60}m`}
          </span>
        </div>
      ),
    },
    {
      key: 'context',
      header: 'Buyer / Order Context',
      render: (item) => (
        <div className="text-xs">
          <span className="font-medium text-slate-800 block truncate max-w-[150px]">
            {item.buyerName || 'Factory Quality'}
          </span>
          {(item.orderPoNumber || item.styleNumber) && (
            <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[150px]">
              {item.styleNumber || item.orderPoNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actionItems',
      header: 'Action Tasks',
      align: 'center',
      render: (item) => {
        const total = item.actionItems?.length || 0;
        const done = item.actionItems?.filter((a) => a.completed).length || 0;
        const isAllDone = total > 0 && done === total;

        return (
          <div className="flex flex-col items-center">
            <span
              className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                isAllDone
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : total > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              {done}/{total} Done
            </span>
            {total > 0 && (
              <div className="w-16 bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            )}
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
          CLOSED: 'emerald',
          ACTIONS_PENDING: 'amber',
          IN_REVIEW: 'blue',
          DRAFT: 'neutral',
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
            onClick={() => setSubView({ type: 'details', meeting: item })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
            title="View Meeting Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit', meeting: item })}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200 transition-colors cursor-pointer"
            title="Edit Minutes"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDuplicateMeeting(item)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer hidden sm:inline-flex"
            title="Duplicate as Template"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalState({ isOpen: true, meetings: [item] })}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            title="Delete Minutes"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // Batch actions for Data Table
  const batchActions: BatchAction<MeetingMinutesItem>[] = [
    {
      label: 'Delete Selected',
      variant: 'danger',
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onClick: (selected) => {
        setDeleteModalState({
          isOpen: true,
          meetings: selected,
        });
      },
    },
    {
      label: 'Export Selected',
      onClick: (selected) => {
        showToast(`Exported ${selected.length} meeting records`);
      },
    },
  ];

  // Compile all action items across all meetings for the Action Tracker tab
  const allActionItemsAcrossMeetings = meetings.flatMap((m) =>
    (m.actionItems || []).map((act) => ({
      ...act,
      meetingId: m.id,
      meetingCode: m.meetingCode,
      meetingTitle: m.title,
      meetingDate: m.meetingDate,
      buyerName: m.buyerName,
    }))
  );

  const filteredActionItems = allActionItemsAcrossMeetings.filter((act) => {
    if (actionPriorityFilter !== 'ALL' && act.priority !== actionPriorityFilter) return false;
    if (actionStatusFilter === 'PENDING' && act.completed) return false;
    if (actionStatusFilter === 'COMPLETED' && !act.completed) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Clean 3-tab layout matching Buyer & Order module */}
      <ModuleHeader
        id="meeting-minutes-module"
        moduleCode="MOD-21"
        badge="Quality Governance"
        title="Quality Assurance Meeting Minutes (MOM) & Action Tracker"
        subtitle="Weekly quality reviews, buyer pre-production (PP) meetings, customer claim reviews, and assigned action deadlines"
        activeView={subView.type !== 'none' ? 'list' : viewMode}
        onViewChange={(mode) => {
          setSubView({ type: 'none' });
          setViewMode(mode);
        }}
        customTabs={[
          { id: 'summary', label: 'Summary' },
          { id: 'list', label: 'Meeting Minutes', count: meetings.length },
          { id: 'actions', label: 'Action Tracker', count: pendingActions },
        ]}
      />

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <MeetingMinutesDetailsPage
          meeting={subView.meeting}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(mtg) => setSubView({ type: 'edit', meeting: mtg })}
          onDuplicate={(mtg) => {
            handleDuplicateMeeting(mtg);
            setSubView({ type: 'none' });
          }}
          onDelete={(mtg) => {
            setDeleteModalState({ isOpen: true, meetings: [mtg] });
          }}
          onUpdateMeeting={(updated) => {
            handleUpdateMeeting(updated);
            setSubView({ type: 'details', meeting: updated });
          }}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <MeetingMinutesEntryPage
          onSave={(newMeeting) => {
            const updated = [newMeeting, ...meetings];
            saveMeetings(updated);
            setSubView({ type: 'details', meeting: newMeeting });
            showToast(`Created meeting minutes ${newMeeting.meetingCode}`);
          }}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <MeetingMinutesEntryPage
          initialMeeting={subView.meeting}
          onSave={(updatedMeeting) => {
            handleUpdateMeeting(updatedMeeting);
            setSubView({ type: 'details', meeting: updatedMeeting });
            showToast(`Updated meeting minutes ${updatedMeeting.meetingCode}`);
          }}
          onCancel={() => setSubView({ type: 'details', meeting: subView.meeting })}
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
                  title="Recorded Meetings"
                  value={totalMeetings.toString()}
                  subtitle="Quality Governance Reviews"
                  icon={Calendar}
                  tone="blue"
                />
                <StatCard
                  title="Action Item Follow-up"
                  value={`${totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 100}% Done`}
                  subtitle={`${completedActions} of ${totalActions} actions closed`}
                  icon={CheckSquare}
                  tone="emerald"
                />
                <StatCard
                  title="Pending Action Meetings"
                  value={pendingMeetings.toString()}
                  subtitle="Open corrective action gates"
                  icon={Clock}
                  tone="amber"
                />
                <StatCard
                  title="Average Attendance"
                  value={`${avgAttendance} Leads`}
                  subtitle="Cross-Functional Heads"
                  icon={Users}
                  tone="indigo"
                />
              </div>

              {/* 2-Column Summary Widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Meeting Breakdown by Type */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Meetings by Category &amp; Focus
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">ISO 9001 / Buyer</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(MEETING_TYPE_LABELS).map(([typeKey, cfg]) => {
                      const count = meetings.filter((m) => m.meetingType === typeKey).length;
                      return (
                        <div
                          key={typeKey}
                          onClick={() => {
                            setTypeFilter(typeKey);
                            setViewMode('list');
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-blue-50/50 hover:border-blue-200 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {cfg.label}
                            </span>
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Latest Minutes & Quick View */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Recent Quality Minutes Log
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
                    {meetings.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">
                            {m.title}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {m.meetingCode} • {m.meetingDate} • Chair: {m.chairperson.split('(')[0]}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSubView({ type: 'details', meeting: m })}
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
                label="Open Complete QA Meeting Minutes Register &amp; Action Tracker"
                recordCount={meetings.length}
                onSwitchToList={() => setViewMode('list')}
              />
            </div>
          )}

          {/* TAB 2: MEETING MINUTES REGISTER TABLE */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DataTable
                id="meeting-minutes-table"
                data={filteredMeetings}
                columns={columns}
                searchPlaceholder="Search meeting code, title, chairperson, buyer, or style..."
                searchableKeys={[
                  'meetingCode',
                  'title',
                  'chairperson',
                  'buyerName',
                  'orderPoNumber',
                  'styleNumber',
                  'agenda',
                ]}
                secondaryAction={
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Meeting Type Filter */}
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Meeting Types</option>
                      <option value="PRE_PRODUCTION">Pre-Production (PP)</option>
                      <option value="BUYER_QUALITY_REVIEW">Buyer Quality Review</option>
                      <option value="WEEKLY_QMS">Weekly QA / Defect Reduction</option>
                      <option value="NEEDLE_SAFETY">Needle Safety &amp; Metal Det.</option>
                      <option value="CUSTOMER_CLAIM_CAPA">Customer Claim &amp; CAPA</option>
                      <option value="MANAGEMENT_REVIEW">ISO Management Review</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIONS_PENDING">Actions Pending</option>
                      <option value="CLOSED">Closed</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DRAFT">Draft</option>
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
                    <span>Add Minutes</span>
                  </button>
                }
                batchActions={batchActions}
              />
            </div>
          )}

          {/* TAB 3: CROSS-MEETING ACTION TRACKER */}
          {viewMode === 'actions' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-blue-600" />
                    <span>Cross-Meeting Corrective &amp; Preventative Action Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live accountability tracker across all PP meetings, quality audits, and claim reviews.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={actionStatusFilter}
                    onChange={(e) => setActionStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="PENDING">Pending Actions Only</option>
                    <option value="COMPLETED">Completed Actions Only</option>
                  </select>

                  <select
                    value={actionPriorityFilter}
                    onChange={(e) => setActionPriorityFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-semibold"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              {/* Action Items List Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">Done</th>
                        <th className="py-3 px-3">Task Description</th>
                        <th className="py-3 px-3">Meeting Source</th>
                        <th className="py-3 px-3">Assignee &amp; Dept</th>
                        <th className="py-3 px-3">Due Date</th>
                        <th className="py-3 px-3 text-center">Priority</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredActionItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                            No action items match the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredActionItems.map((act, idx) => {
                          const priorityBadgeClass =
                            act.priority === 'HIGH'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : act.priority === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200';

                          return (
                            <tr
                              key={`${act.meetingId}-${act.id || idx}`}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                act.completed ? 'bg-emerald-50/20' : ''
                              }`}
                            >
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleActionAcrossMeetings(act.meetingId, act.id, act.task)
                                  }
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer mx-auto ${
                                    act.completed
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-300 hover:border-blue-500 bg-white'
                                  }`}
                                  title={act.completed ? 'Click to reopen' : 'Click to complete'}
                                >
                                  {act.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              </td>
                              <td className="py-3 px-3 max-w-sm">
                                <span
                                  className={`font-semibold block ${
                                    act.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                  }`}
                                >
                                  {act.task}
                                </span>
                                {act.verificationNotes && (
                                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                    Notes: {act.verificationNotes}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const m = meetings.find((x) => x.id === act.meetingId);
                                    if (m) setSubView({ type: 'details', meeting: m });
                                  }}
                                  className="text-blue-600 hover:underline font-bold block"
                                >
                                  {act.meetingCode}
                                </button>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                                  {act.meetingTitle}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-800 block">
                                  {act.assignee}
                                </span>
                                <span className="text-[10px] text-slate-500 block">
                                  {act.department || 'Quality Assurance'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-700">
                                {act.dueDate}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${priorityBadgeClass}`}
                                >
                                  {act.priority || 'MEDIUM'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                    act.completed
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {act.completed ? 'Done' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
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
      <DeleteMeetingModal
        isOpen={deleteModalState.isOpen}
        meetings={deleteModalState.meetings}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalState({ isOpen: false, meetings: [] })}
      />
    </div>
  );
}
