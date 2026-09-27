'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
  Filter,
  Plus,
  Eye,
  Check,
  Search,
  Sparkles,
  LayoutGrid,
  ListFilter,
  ArrowRight,
  Download,
} from 'lucide-react';
import { AnnualTrainingScheduleItem, TrainingMatrixItem } from '@/lib/types/modules';

interface AnnualMasterCalendarViewProps {
  scheduleItems: AnnualTrainingScheduleItem[];
  courses: TrainingMatrixItem[];
  onSelectCourse: (course: TrainingMatrixItem) => void;
  onScheduleNew: () => void;
  showToast: (msg: string) => void;
}

const SECTIONS = [
  { key: 'ALL', label: 'All Sections' },
  { key: 'CUTTING_SECTION', label: 'Cutting Division' },
  { key: 'SEWING_SECTION', label: 'Sewing Production' },
  { key: 'FINISHING_PACKING', label: 'Finishing & Packing' },
  { key: 'FABRIC_LAB', label: 'Fabric Warehouse & Lab' },
  { key: 'QUALITY_ASSURANCE', label: 'Quality Assurance' },
  { key: 'MAINTENANCE_SAFETY', label: 'Maintenance & Safety' },
];

const MONTHS = [
  { index: 0, label: 'Full Year (12M)', short: 'All 12M' },
  { index: 1, label: 'January', short: 'Jan' },
  { index: 2, label: 'February', short: 'Feb' },
  { index: 3, label: 'March', short: 'Mar' },
  { index: 4, label: 'April', short: 'Apr' },
  { index: 5, label: 'May', short: 'May' },
  { index: 6, label: 'June', short: 'Jun' },
  { index: 7, label: 'July', short: 'Jul' },
  { index: 8, label: 'August', short: 'Aug' },
  { index: 9, label: 'September', short: 'Sep' },
  { index: 10, label: 'October', short: 'Oct' },
  { index: 11, label: 'November', short: 'Nov' },
  { index: 12, label: 'December', short: 'Dec' },
];

export function AnnualMasterCalendarView({
  scheduleItems,
  courses,
  onSelectCourse,
  onScheduleNew,
  showToast,
}: AnnualMasterCalendarViewProps) {
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = all year
  const [viewStyle, setViewStyle] = useState<'schedule_cards' | 'section_matrix'>('schedule_cards');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter schedule items
  const filteredSchedule = scheduleItems.filter((item) => {
    const matchesSection = selectedSection === 'ALL' || item.section === selectedSection;
    const matchesMonth = selectedMonth === 0 || item.monthIndex === selectedMonth;
    const matchesSearch =
      !searchQuery.trim() ||
      item.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.trainerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sectionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesMonth && matchesSearch;
  });

  // Upcoming sessions
  const upcomingSessions = scheduleItems.filter(
    (item) => item.status === 'UPCOMING' || item.status === 'SCHEDULED'
  );

  // Completed sessions
  const completedCount = scheduleItems.filter((item) => item.status === 'COMPLETED').length;

  const handleOpenCourse = (courseCode: string, fallbackTitle: string) => {
    const match = courses.find((c) => c.courseCode === courseCode);
    if (match) {
      onSelectCourse(match);
    } else {
      // Find by title substring or open first course
      const titleMatch = courses.find(
        (c) => c.title.toLowerCase().includes(fallbackTitle.toLowerCase()) ||
               fallbackTitle.toLowerCase().includes(c.title.toLowerCase())
      );
      if (titleMatch) {
        onSelectCourse(titleMatch);
      } else if (courses.length > 0) {
        onSelectCourse(courses[0]);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & METRIC SUMMARY */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
            <Calendar className="w-3 h-3 text-blue-600" />
            <span>Master Annual Training Schedule (Full Year 2026)</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Section-Wise Annual Training Matrix &amp; Day-of-Training Master Schedule
          </h2>
          <p className="text-xs text-slate-500 max-w-3xl leading-relaxed mt-0.5">
            Complete 12-month master schedule mapping required training days, time slots, lead trainers, and target seats across Cutting, Sewing, Finishing, Lab, QMS, and Maintenance.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewStyle('schedule_cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                viewStyle === 'schedule_cards'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Day-of-Training Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('section_matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                viewStyle === 'section_matrix'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Section Matrix (12M)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onScheduleNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Schedule Training Day</span>
          </button>
        </div>
      </div>

      {/* 2. STAT CARDS FOR ANNUAL PROGRESS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Planned 2026</span>
          <div className="font-mono font-bold text-slate-900 text-lg sm:text-xl">
            {scheduleItems.length} Sessions
          </div>
          <span className="text-[10px] text-slate-400 font-mono">12-Month Master Schedule</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Completed Sessions</span>
          <div className="font-mono font-bold text-emerald-700 text-lg sm:text-xl">
            {completedCount} Done
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">Attended &amp; Logged</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Upcoming Scheduled</span>
          <div className="font-mono font-bold text-blue-700 text-lg sm:text-xl">
            {upcomingSessions.length} Upcoming
          </div>
          <span className="text-[10px] text-blue-600 font-medium">Q4 2026 Target Pipeline</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">Section Coverage</span>
          <div className="font-mono font-bold text-indigo-700 text-lg sm:text-xl">
            6 / 6 Sections
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">100% Units Included</span>
        </div>
      </div>

      {/* 3. FILTER CONTROLS: 12-Month Selector + Section Pills */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Full Year 12-Month Selector Tabs */}
        <div>
          <span className="text-[11px] font-mono uppercase font-bold text-slate-500 tracking-wider block mb-2">
            Filter by Month (Full Year Schedule):
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {MONTHS.map((m) => (
              <button
                key={m.index}
                type="button"
                onClick={() => setSelectedMonth(m.index)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedMonth === m.index
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {m.short}
              </button>
            ))}
          </div>
        </div>

        {/* Section-Wise Filter Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Section:</span>
            </span>
            {SECTIONS.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setSelectedSection(sec.key)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer ${
                  selectedSection === sec.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic, trainer, venue..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 4. ACTIVE VIEW RENDERING */}

      {/* VIEW A: DAY-OF-TRAINING SCHEDULE CARDS & TIMELINE */}
      {viewStyle === 'schedule_cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing <strong>{filteredSchedule.length}</strong> master scheduled sessions
              {selectedMonth > 0 ? ` for ${MONTHS[selectedMonth]?.label}` : ' across 12 months'}
              {selectedSection !== 'ALL' ? ` in ${SECTIONS.find((s) => s.key === selectedSection)?.label}` : ''}
            </span>
            <span className="font-mono text-[11px]">ISO 9001 Clause 7.2 Compliant</span>
          </div>

          {filteredSchedule.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No training sessions found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No scheduled training matches the selected section or month filter. Try clearing filters or schedule a new session.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSection('ALL');
                  setSelectedMonth(0);
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchedule.map((item) => {
                const isCompleted = item.status === 'COMPLETED';
                const isUpcoming = item.status === 'UPCOMING';
                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2.5">
                      {/* Section & Status Top Line */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 truncate">
                          {item.sectionName}
                        </span>
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isUpcoming
                              ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Day of Week & Date */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                          {item.dayOfWeek}
                        </span>
                        <span className="font-mono text-slate-800 font-semibold">{item.date}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-slate-500 text-[11px]">{item.timeSlot}</span>
                      </div>

                      {/* Topic Title */}
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {item.topicTitle}
                      </h4>

                      {/* Trainer & Venue */}
                      <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.trainerName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 truncate text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.venue} • {item.durationHours}h</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Target Capacity: {item.targetSeats} Seats</span>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">
                        {item.courseCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenCourse(item.courseCode, item.topicTitle)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        <span>View Training Record</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW B: SECTION-WISE ANNUAL MASTER MATRIX (ROWS = 6 SECTIONS, COLUMNS = 12 MONTHS) */}
      {viewStyle === 'section_matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-2">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                12-Month Section Mapping Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Cross-mapping of all 6 production sections across each month of 2026. Click any cell to view training session details.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Done
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-blue-700">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Upcoming
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Scheduled
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-3 border-r border-slate-200 min-w-[150px] sticky left-0 bg-slate-50 z-10">
                    Section Name
                  </th>
                  {MONTHS.slice(1).map((m) => (
                    <th key={m.index} className="py-2.5 px-2 text-center border-r border-slate-200 min-w-[95px]">
                      {m.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SECTIONS.slice(1).map((sec) => (
                  <tr key={sec.key} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-900 border-r border-slate-200 sticky left-0 bg-white z-10 shadow-xs">
                      {sec.label}
                    </td>
                    {MONTHS.slice(1).map((m) => {
                      const match = scheduleItems.find(
                        (item) => item.section === sec.key && item.monthIndex === m.index
                      );
                      if (!match) {
                        return (
                          <td key={m.index} className="py-3 px-2 text-center border-r border-slate-100 text-slate-300 font-mono text-[11px]">
                            —
                          </td>
                        );
                      }
                      const isCompleted = match.status === 'COMPLETED';
                      const isUpcoming = match.status === 'UPCOMING';
                      return (
                        <td key={m.index} className="py-2 px-1 border-r border-slate-100 align-top">
                          <button
                            type="button"
                            onClick={() => handleOpenCourse(match.courseCode, match.topicTitle)}
                            className={`w-full p-1.5 rounded-lg text-left transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900'
                                : isUpcoming
                                ? 'bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 font-semibold'
                                : 'bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900'
                            }`}
                            title={`${match.topicTitle} (${match.date} • ${match.dayOfWeek})`}
                          >
                            <div className="font-mono text-[9px] font-bold truncate">
                              {match.dayOfWeek.slice(0, 3)} {match.date.slice(8)}
                            </div>
                            <div className="text-[10px] font-bold truncate leading-tight mt-0.5">
                              {match.topicTitle}
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
