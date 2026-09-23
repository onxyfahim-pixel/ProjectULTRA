'use client';

import React, { useState } from 'react';
import { Calendar, Users, CheckSquare, Clock, Eye, X, PieChart } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { MeetingMinutesItem } from '@/lib/types/modules';
import { MOCK_MEETING_MINUTES } from '@/lib/db/modules-mock-data';

export function MeetingMinutesView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [meetings, setMeetings] = useState<MeetingMinutesItem[]>(MOCK_MEETING_MINUTES);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingMinutesItem | null>(null);

  const totalActions = meetings.reduce((acc, m) => acc + m.actionItems.length, 0);
  const completedActions = meetings.reduce(
    (acc, m) => acc + m.actionItems.filter((a) => a.completed).length,
    0
  );
  const closedMeetings = meetings.filter((m) => m.status === 'CLOSED').length;
  const pendingMeetings = meetings.filter((m) => m.status === 'ACTIONS_PENDING').length;

  const columns: ColumnDef<MeetingMinutesItem>[] = [
    {
      key: 'meetingCode',
      header: 'Minutes Ref',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-mono font-bold text-blue-700 text-xs">{item.meetingCode}</span>
          <div className="text-[11px] text-slate-500 font-mono">{item.meetingDate}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Meeting Purpose & Chairperson',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500">Chair: {item.chairperson} • {item.attendeesCount} Attendees</div>
        </div>
      ),
    },
    {
      key: 'agenda',
      header: 'Agenda Summary',
      render: (item) => (
        <span className="text-xs text-slate-600 truncate max-w-sm block" title={item.agenda}>
          {item.agenda}
        </span>
      ),
    },
    {
      key: 'actionItems',
      header: 'Action Tasks',
      align: 'center',
      render: (item) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
          {item.actionItems.length} Actions ({item.actionItems.filter((a) => a.completed).length} Done)
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => {
        const variantMap: Record<string, any> = {
          CLOSED: 'emerald',
          ACTIONS_PENDING: 'amber',
        };
        return <StatusBadge label={item.status.replace('_', ' ')} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'center',
      render: (item) => (
        <button
          onClick={() => setSelectedMeeting(item)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="View Action Items & Decisions"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="meeting-minutes-module"
        moduleCode="MOD-21"
        badge="Quality Governance"
        title="Quality Assurance Meeting Minutes (MOM) & Action Tracker"
        subtitle="Weekly quality reviews, buyer pre-production (PP) meetings, customer claim reviews, and assigned action deadlines"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${meetings.length} Minutes Records`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Recorded Meetings"
              value={meetings.length}
              subtitle="Management Quality Reviews"
              icon={<Calendar className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Action Item Follow-up"
              value={`${Math.round((completedActions / (totalActions || 1)) * 100)}% Done`}
              subtitle={`${completedActions} of ${totalActions} actions closed`}
              icon={<CheckSquare className="w-5 h-5" />}
              tone="emerald"
            />
            <StatCard
              title="Pending Action Meetings"
              value={pendingMeetings}
              subtitle="Follow-up due this week"
              icon={<Clock className="w-5 h-5" />}
              tone="amber"
            />
            <StatCard
              title="Average Attendance"
              value="10.5 Leads"
              subtitle="Cross-Functional Heads"
              icon={<Users className="w-5 h-5" />}
              tone="indigo"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Item Closure Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Meeting Status &amp; Action Governance
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Action Gate</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Closed Meetings</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{closedMeetings}</div>
                  <span className="text-[10px] text-slate-500">100% action signed</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">Actions Pending</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{pendingMeetings}</div>
                  <span className="text-[10px] text-slate-500">Open assignee tasks</span>
                </div>
              </div>
            </div>

            {/* Latest Meeting Decisions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Recent Minutes Log
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Records</span>
              </div>
              <div className="space-y-2 text-xs">
                {meetings.slice(0, 3).map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">{m.title}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {m.meetingCode} • {m.meetingDate} • Chair: {m.chairperson}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedMeeting(m)}
                      className="px-2 py-1 bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-[11px] font-medium rounded-lg transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete QA Meeting Minutes & Task Matrix"
            recordCount={meetings.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="meeting-minutes-table"
            title="Quality Assurance Meeting Minutes (MOM) & Action Tracker"
            subtitle="Weekly quality reviews, buyer pre-production (PP) meetings, customer claim reviews, and assigned action deadlines"
            data={meetings}
            columns={columns}
            searchPlaceholder="Search meeting code, title, chairperson, or agenda..."
            searchableKeys={['meetingCode', 'title', 'chairperson', 'agenda']}
          />
        </div>
      )}

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedMeeting.meetingCode}</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedMeeting.meetingDate} • {selectedMeeting.chairperson}</p>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Meeting Agenda:</span>
                <p className="text-slate-700 leading-relaxed">{selectedMeeting.agenda}</p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-2">Assigned Action Items:</span>
                <div className="space-y-2">
                  {selectedMeeting.actionItems.map((act, idx) => (
                    <div key={idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{act.task}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          Assignee: <span className="text-blue-800 font-medium">{act.assignee}</span> • Due: {act.dueDate}
                        </p>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        act.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {act.completed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedMeeting(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Minutes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
