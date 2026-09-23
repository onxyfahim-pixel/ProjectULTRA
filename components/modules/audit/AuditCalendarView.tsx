'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  Building2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { QualityAudit } from '@/lib/types/modules';

interface AuditCalendarViewProps {
  audits: QualityAudit[];
  onSelectAudit: (audit: QualityAudit) => void;
}

export function AuditCalendarView({ audits, onSelectAudit }: AuditCalendarViewProps) {
  // Current view date (Default: September 2026 to match data)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // September 2026
  const [calendarFilter, setCalendarFilter] = useState<'ALL' | 'SCHEDULED' | 'COMPLETED'>('ALL');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date(2026, 8, 1));
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Map audits to dates in this month
  const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Completed audits this month
  const completedInMonth = audits.filter(
    (a) => a.auditDate && a.auditDate.startsWith(currentMonthPrefix)
  );

  // Scheduled / upcoming audits this month
  const scheduledInMonth = audits.filter(
    (a) => a.nextAuditDate && a.nextAuditDate.startsWith(currentMonthPrefix)
  );

  // All scheduled future audits
  const allScheduled = audits
    .filter((a) => a.nextAuditDate)
    .sort((a, b) => new Date(a.nextAuditDate).getTime() - new Date(b.nextAuditDate).getTime());

  // Recent completed audits
  const allCompleted = audits
    .filter((a) => a.auditDate)
    .sort((a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime());

  const daysArray = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    daysArray.push({
      dayNumber: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: `${year}-${String(month).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const completed = audits.filter((a) => a.auditDate === dayStr);
    const scheduled = audits.filter((a) => a.nextAuditDate === dayStr);

    daysArray.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateString: dayStr,
      completed,
      scheduled,
    });
  }

  // Next month leading days to complete full 35 or 42 grid
  const remainingSlots = 42 - daysArray.length;
  for (let d = 1; d <= remainingSlots; d++) {
    daysArray.push({
      dayNumber: d,
      isCurrentMonth: false,
      dateString: `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ─── CALENDAR CONTROLS & HEADER ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-500">
              Audit schedules, surveillance surveillance reviews, and compliance deadlines
            </p>
          </div>
        </div>

        {/* Filter Pills & Month Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setCalendarFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                calendarFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              All Events
            </button>
            <button
              type="button"
              onClick={() => setCalendarFilter('SCHEDULED')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                calendarFilter === 'SCHEDULED' ? 'bg-white shadow-xs text-amber-700 font-bold' : 'text-slate-600'
              }`}
            >
              Scheduled Audits
            </button>
            <button
              type="button"
              onClick={() => setCalendarFilter('COMPLETED')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                calendarFilter === 'COMPLETED' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Completed Audits
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CALENDAR GRID ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
          {daysArray.map((cell, idx) => {
            const hasCompleted = cell.completed && cell.completed.length > 0 && calendarFilter !== 'SCHEDULED';
            const hasScheduled = cell.scheduled && cell.scheduled.length > 0 && calendarFilter !== 'COMPLETED';

            return (
              <div
                key={idx}
                className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors ${
                  cell.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-md ${
                      cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Event badges on this day */}
                <div className="space-y-1 my-1">
                  {/* Completed Audits */}
                  {hasCompleted &&
                    cell.completed!.map((audit) => (
                      <div
                        key={audit.id}
                        onClick={() => onSelectAudit(audit)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer truncate shadow-2xs"
                        title={`Completed: ${audit.auditCode} - ${audit.standard} (${audit.scorePercentage}%)`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          <span className="font-mono truncate">{audit.auditCode}</span>
                        </div>
                      </div>
                    ))}

                  {/* Scheduled Audits */}
                  {hasScheduled &&
                    cell.scheduled!.map((audit) => (
                      <div
                        key={`sched-${audit.id}`}
                        onClick={() => onSelectAudit(audit)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer truncate shadow-2xs"
                        title={`Scheduled Re-Audit: ${audit.auditCode} - ${audit.standard}`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span className="truncate">Due: {audit.auditCode}</span>
                        </div>
                      </div>
                    ))}
                </div>

                <div />
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── SCHEDULED AUDITS TIMELINE & COMPLETED AUDITS ─────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Upcoming Scheduled Audits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Upcoming Scheduled Re-Audits ({allScheduled.length})</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">Action Due</span>
          </div>

          <div className="space-y-3">
            {allScheduled.map((item) => (
              <div
                key={`due-${item.id}`}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between text-xs cursor-pointer"
                onClick={() => onSelectAudit(item)}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{item.auditCode}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Due: {item.nextAuditDate}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{item.standard}</div>
                  <div className="text-[11px] text-slate-500">
                    Auditor: {item.auditorName} • {item.supplierName || item.auditeeDepartment}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudit(item);
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                  title="View Audit Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Completed Audits */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recently Completed Audits ({allCompleted.length})</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500 font-semibold">Verified</span>
          </div>

          <div className="space-y-3">
            {allCompleted.map((item) => (
              <div
                key={`comp-${item.id}`}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-between text-xs cursor-pointer"
                onClick={() => onSelectAudit(item)}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-700">{item.auditCode}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        (item.obtainedMarks ?? item.scorePercentage) >= 80
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      Score: {item.scorePercentage}%
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">{item.auditDate}</span>
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{item.standard}</div>
                  <div className="text-[11px] text-slate-500">
                    Lead: {item.auditorName} • NCs: {item.nonConformancesCount}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAudit(item);
                  }}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
                  title="View Audit Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
