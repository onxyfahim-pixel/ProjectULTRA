'use client';

import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle2, PieChart } from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/Badge';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import { FactoryEventItem } from '@/lib/types/modules';
import { MOCK_FACTORY_EVENTS } from '@/lib/db/modules-mock-data';

export function EventsView() {
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');
  const [events, setEvents] = useState<FactoryEventItem[]>(MOCK_FACTORY_EVENTS);

  const upcomingCount = events.filter((e) => e.status === 'UPCOMING').length;
  const inProgressCount = events.filter((e) => e.status === 'IN_PROGRESS').length;
  const concludedCount = events.filter((e) => e.status === 'CONCLUDED').length;

  const columns: ColumnDef<FactoryEventItem>[] = [
    {
      key: 'eventCode',
      header: 'Event Ref',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-slate-100 text-slate-800">
          {item.eventCode}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Quality Event Title & Type',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs">{item.title}</span>
          <div className="text-[11px] text-slate-500 font-mono">{item.type.replace(/_/g, ' ')}</div>
        </div>
      ),
    },
    {
      key: 'eventDate',
      header: 'Scheduled Date',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{item.eventDate}</span>
      ),
    },
    {
      key: 'location',
      header: 'Plant Location',
      render: (item) => (
        <span className="text-xs text-slate-700 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {item.location}
        </span>
      ),
    },
    {
      key: 'leadOrganizer',
      header: 'Lead Organizer',
      render: (item) => (
        <span className="text-xs font-medium text-slate-800">{item.leadOrganizer}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => {
        const variantMap: Record<string, any> = {
          UPCOMING: 'blue',
          IN_PROGRESS: 'amber',
          CONCLUDED: 'emerald',
        };
        return <StatusBadge label={item.status} variant={variantMap[item.status] || 'neutral'} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleHeader
        id="events-module"
        moduleCode="MOD-20"
        badge="Quality Scheduling & Visits"
        title="Plant Quality Events, Audits & Buyer Visit Calendar"
        subtitle="Schedule of customer QA delegations, pre-production approvals, 5S floor audits, and ISO surveillance sessions"
        activeView={viewMode}
        onViewChange={setViewMode}
        summaryCount="4 KPIs"
        listCount={`${events.length} Events`}
      />

      {viewMode === 'summary' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Scheduled Quality Events"
              value={events.length}
              subtitle="Audits, Seminars & Walkthroughs"
              icon={<Calendar className="w-5 h-5" />}
              tone="blue"
            />
            <StatCard
              title="Major Buyer Audits"
              value="H&M / Zara"
              subtitle="Technical Factory Evaluation"
              icon={<Users className="w-5 h-5" />}
              tone="indigo"
            />
            <StatCard
              title="Upcoming Scheduled"
              value={`${upcomingCount} Events`}
              subtitle="Pre-Pro Line Inspections"
              icon={<Clock className="w-5 h-5" />}
              tone="amber"
            />
            <StatCard
              title="Attendance Readiness"
              value="100% Prepared"
              subtitle="CAPAs and Files Ready"
              icon={<CheckCircle2 className="w-5 h-5" />}
              tone="emerald"
            />
          </div>

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
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="text-[11px] text-blue-700 font-semibold block">Upcoming</span>
                  <div className="text-lg font-bold font-mono text-blue-900 mt-1">{upcomingCount}</div>
                  <span className="text-[10px] text-slate-500">Pending arrival</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
                  <span className="text-[11px] text-amber-700 font-semibold block">In Progress</span>
                  <div className="text-lg font-bold font-mono text-amber-900 mt-1">{inProgressCount}</div>
                  <span className="text-[10px] text-slate-500">Active on floor</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Concluded</span>
                  <div className="text-lg font-bold font-mono text-emerald-900 mt-1">{concludedCount}</div>
                  <span className="text-[10px] text-slate-500">Minutes archived</span>
                </div>
              </div>
            </div>

            {/* Upcoming Agenda List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Upcoming Calendar Schedule
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Dates</span>
              </div>
              <div className="space-y-2 text-xs">
                {events.slice(0, 3).map((e) => (
                  <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">{e.title}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" /> {e.location} • {e.leadOrganizer}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {e.eventDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SwitchToListBanner
            label="Open Complete Quality Events Schedule & Calendar"
            recordCount={events.length}
            onSwitchToList={() => setViewMode('list')}
          />
        </div>
      ) : (
        <div className="animate-in fade-in duration-200">
          <DataTable
            id="events-table"
            title="Plant Quality Events, Audits & Buyer Visit Calendar"
            subtitle="Schedule of customer QA delegations, pre-production approvals, 5S floor audits, and ISO surveillance sessions"
            data={events}
            columns={columns}
            searchPlaceholder="Search event title, organizer, or location..."
            searchableKeys={['eventCode', 'title', 'type', 'location', 'leadOrganizer']}
          />
        </div>
      )}
    </div>
  );
}
