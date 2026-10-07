'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  BookOpen,
  Plus,
  Eye,
  Edit,
  Copy,
  Trash2,
  Download,
  Building2,
  FileText,
  ClipboardCheck,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  MapPin,
  HelpCircle,
} from 'lucide-react';
import { DataTable, ColumnDef } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { ModuleHeader, SwitchToListBanner, ModuleViewMode } from '@/components/ui/ModuleHeader';
import {
  TrainingMatrixItem,
  TrainingExamPaper,
  TrainingEvaluationRecord,
  TrainingStatus,
  TrainingAttendee,
  AnnualTrainingScheduleItem,
} from '@/lib/types/modules';
import {
  INITIAL_TRAINING_COURSES,
  INITIAL_EXAM_PAPERS,
  INITIAL_EVALUATION_RECORDS,
  INITIAL_ANNUAL_TRAINING_SCHEDULE,
} from '../modules/training/training-data';
import { TrainingDetailsPage } from '../modules/training/TrainingDetailsPage';
import { TrainingEntryPage } from '../modules/training/TrainingEntryPage';
import { TrainingEvaluationPage } from '../modules/training/TrainingEvaluationPage';
import { ExamPaperCreationPage } from '../modules/training/ExamPaperCreationPage';
import { useLiveModuleData } from '@/hooks/use-live-module-data';
import { useModulePermission } from '@/hooks/use-module-permission';
import { AnnualMasterCalendarView } from '../modules/training/AnnualMasterCalendarView';
import { DeleteTrainingModal } from '../modules/training/DeleteTrainingModal';

type TrainingSubView =
  | { type: 'none' }
  | { type: 'details'; course: TrainingMatrixItem }
  | { type: 'add' }
  | { type: 'edit'; course: TrainingMatrixItem }
  | { type: 'evaluation'; course: TrainingMatrixItem }
  | { type: 'create_exam'; initialExam?: TrainingExamPaper }
  | { type: 'edit_exam'; exam: TrainingExamPaper };

export function TrainingView() {
  const { canCreate, canEdit, canDelete, canExport } = useModulePermission('training');
  const [viewMode, setViewMode] = useState<ModuleViewMode>('summary');

  // Real-time Live Synchronized Module Data
  const [courses, setCourses] = useLiveModuleData<TrainingMatrixItem[]>(
    'training_courses',
    INITIAL_TRAINING_COURSES,
    'erp_training_courses_v1'
  );
  const [examPapers, setExamPapers] = useLiveModuleData<TrainingExamPaper[]>(
    'training_exams',
    INITIAL_EXAM_PAPERS,
    'erp_training_exams_v1'
  );
  const [evaluations, setEvaluations] = useLiveModuleData<TrainingEvaluationRecord[]>(
    'training_evaluations',
    INITIAL_EVALUATION_RECORDS,
    'erp_training_evaluations_v1'
  );
  const [annualSchedule, setAnnualSchedule] = useLiveModuleData<AnnualTrainingScheduleItem[]>(
    'training_annual_schedule',
    INITIAL_ANNUAL_TRAINING_SCHEDULE,
    'erp_annual_training_schedule_v1'
  );

  // Subview State
  const [subView, setSubView] = useState<TrainingSubView>({ type: 'none' });

  // Sync subview details if course updates
  useEffect(() => {
    if (subView.type === 'details') {
      const refreshed = courses.find((c) => c.id === subView.course.id);
      if (refreshed && refreshed !== subView.course) {
        setSubView({ type: 'details', course: refreshed });
      }
    }
  }, [courses, subView]);

  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    itemType: 'COURSE' | 'EXAM' | 'EVALUATION';
    items: any[];
  } | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const totalTrained = courses.reduce((sum, c) => sum + c.trainedCount, 0);
  const avgPassRate = (
    courses.reduce((sum, c) => sum + c.passRatePercent, 0) / (courses.length || 1)
  ).toFixed(1);

  // Filtered courses
  const filteredCourses = courses.filter((c) => {
    const matchesCat = categoryFilter === 'ALL' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesCat && matchesStatus;
  });

  // Course CRUD
  const handleCreateCourse = (newCourse: TrainingMatrixItem) => {
    const updated = [newCourse, ...courses];
    setCourses(updated);

    // Also synchronize into annualSchedule if date is present
    if (newCourse.nextScheduledDate) {
      const dateObj = new Date(newCourse.nextScheduledDate);
      const monthIdx = !isNaN(dateObj.getMonth()) ? dateObj.getMonth() + 1 : 10;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const newScheduleItem: AnnualTrainingScheduleItem = {
        id: `sch-${Date.now()}`,
        scheduleCode: `SCH-2026-${String(monthIdx).padStart(2, '0')}-${newCourse.courseCode.slice(-3)}`,
        month: monthNames[monthIdx - 1] || 'October',
        monthIndex: monthIdx,
        dayOfWeek: newCourse.scheduledDay || 'Monday',
        date: newCourse.nextScheduledDate,
        timeSlot: newCourse.timeSlot || '09:30 AM - 01:00 PM',
        durationHours: newCourse.durationHours || 3.5,
        section: (newCourse.section as any) || 'SEWING_SECTION',
        sectionName: newCourse.section || newCourse.department || 'Sewing Production',
        courseCode: newCourse.courseCode,
        topicTitle: newCourse.title,
        trainerName: newCourse.trainerName,
        venue: newCourse.venue || 'Training Hall A (Floor 2)',
        targetSeats: newCourse.maxCapacity || 35,
        status: newCourse.status === 'COMPLETED' ? 'COMPLETED' : 'UPCOMING',
        mandatoryFor: newCourse.targetAudience,
        notes: newCourse.notes,
      };
      setAnnualSchedule((prev) => [newScheduleItem, ...prev]);
    }

    setSubView({ type: 'details', course: newCourse });
    showToast(`Successfully scheduled training course ${newCourse.courseCode}`);
  };

  const handleUpdateCourse = (updatedCourse: TrainingMatrixItem) => {
    const updated = courses.map((c) => (c.id === updatedCourse.id ? updatedCourse : c));
    setCourses(updated);
    if (subView.type === 'edit' || subView.type === 'details') {
      setSubView({ type: 'details', course: updatedCourse });
    }
    showToast(`Saved updates for course ${updatedCourse.courseCode}`);
  };

  const handleDuplicateCourse = (course: TrainingMatrixItem) => {
    const duplicated: TrainingMatrixItem = {
      ...JSON.parse(JSON.stringify(course)),
      id: `trn-${Date.now()}`,
      courseCode: `${course.courseCode}-COPY`,
      title: `${course.title} (Copy)`,
      status: 'SCHEDULED',
      nextScheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [duplicated, ...courses];
    setCourses(updated);
    setSubView({ type: 'details', course: duplicated });
    showToast(`Duplicated course as ${duplicated.courseCode}`);
  };

  // Exam Paper CRUD
  const handleSaveExam = (exam: TrainingExamPaper) => {
    const existingIndex = examPapers.findIndex((e) => e.id === exam.id);
    if (existingIndex >= 0) {
      const updated = [...examPapers];
      updated[existingIndex] = exam;
      setExamPapers(updated);
      showToast(`Updated exam paper ${exam.examCode}`);
    } else {
      setExamPapers([exam, ...examPapers]);
      showToast(`Created new exam paper ${exam.examCode}`);
    }
    setSubView({ type: 'none' });
    setViewMode('exam_papers');
  };

  // Evaluation Save
  const handleSaveEvaluation = (
    evaluation: TrainingEvaluationRecord,
    updatedAttendees: TrainingAttendee[]
  ) => {
    setEvaluations([evaluation, ...evaluations]);

    // Update attendees in matching course
    const updatedCourses = courses.map((c) => {
      if (c.id === evaluation.trainingId || c.courseCode === evaluation.courseCode) {
        const passedCount = updatedAttendees.filter((a) => a.result === 'PASSED').length;
        const passRate =
          updatedAttendees.length > 0
            ? Math.round((passedCount / updatedAttendees.length) * 100)
            : c.passRatePercent;
        return {
          ...c,
          attendees: updatedAttendees,
          trainedCount: c.trainedCount + passedCount,
          passRatePercent: passRate,
          status: 'COMPLETED' as const,
        };
      }
      return c;
    });

    setCourses(updatedCourses);
    setSubView({ type: 'none' });
    setViewMode('evaluations');
    showToast(`Evaluation ${evaluation.evaluationCode} recorded & certificates generated!`);
  };

  // Deletion confirm
  const confirmDelete = () => {
    if (!deleteModal) return;
    const ids = new Set(deleteModal.items.map((i) => i.id));
    if (deleteModal.itemType === 'COURSE') {
      setCourses(courses.filter((c) => !ids.has(c.id)));
      if (subView.type === 'details' && ids.has(subView.course.id)) {
        setSubView({ type: 'none' });
      }
    } else if (deleteModal.itemType === 'EXAM') {
      setExamPapers(examPapers.filter((e) => !ids.has(e.id)));
    } else {
      setEvaluations(evaluations.filter((ev) => !ids.has(ev.id)));
    }
    showToast(`Deleted ${deleteModal.items.length} record(s)`);
    setDeleteModal(null);
  };

  // 1. Table Columns for Training Record Tab (Table fit, NO horizontal scroll)
  const courseColumns: ColumnDef<TrainingMatrixItem>[] = [
    {
      key: 'courseCode',
      header: 'Course & Cadence',
      sortable: true,
      render: (item) => {
        const isScheduled = item.status === 'SCHEDULED';
        const isCompleted = item.status === 'COMPLETED';
        return (
          <div className="space-y-1">
            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 inline-block">
              {item.courseCode}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCompleted ? 'bg-emerald-500' : isScheduled ? 'bg-blue-500' : 'bg-rose-500'
                }`}
              />
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {item.frequency} • {item.status}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'title',
      header: 'Curriculum Topic & Trainer',
      sortable: true,
      render: (item) => (
        <div className="min-w-0 pr-2">
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', course: item })}
            className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors text-left block truncate cursor-pointer"
            title={item.title}
          >
            {item.title}
          </button>
          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
            <span className="truncate">Trainer: {item.trainerName}</span>
            {item.venue && <span className="text-slate-400">• {item.venue}</span>}
          </div>
        </div>
      ),
    },
    {
      key: 'section',
      header: 'Section & Target',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800 block truncate">
            {item.section || item.department || 'Quality Assurance'}
          </span>
          <div className="text-[10px] text-slate-500 truncate">
            {item.targetAudience}
          </div>
        </div>
      ),
    },
    {
      key: 'nextScheduledDate',
      header: 'Day & Schedule',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
            {item.nextScheduledDate}
          </span>
          <div className="text-[10px] text-slate-500 font-mono">
            {item.scheduledDay || 'Monday'} • {item.timeSlot || `${item.durationHours || 4}h`}
          </div>
        </div>
      ),
    },
    {
      key: 'attendees',
      header: 'Attendance Roster',
      sortable: true,
      render: (item) => {
        const total = item.attendees?.length || 0;
        const present = item.attendees?.filter((a) => a.attendanceStatus === 'PRESENT').length || 0;
        return (
          <div className="space-y-0.5">
            <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
              {total > 0 ? `${present}/${total} Present` : `${item.trainedCount} Certified`}
            </span>
            <div className="text-[10px] text-emerald-700 font-mono font-bold">
              {total > 0 ? `${total} Enrolled Staff` : 'Historical Register'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {/* Details */}
          <button
            type="button"
            onClick={() => setSubView({ type: 'details', course: item })}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Open Separate Training Details Page"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Evaluate Trainees */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setSubView({ type: 'evaluation', course: item })}
              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
              title="Conduct Trainee Evaluation"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Edit */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setSubView({ type: 'edit', course: item })}
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
              title="Edit Course"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicate */}
          {canCreate && (
            <button
              type="button"
              onClick={() => handleDuplicateCourse(item)}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              title="Duplicate Course"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete */}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteModal({ isOpen: true, itemType: 'COURSE', items: [item] })}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Course"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // 2. Table Columns for Exam Papers Tab
  const examColumns: ColumnDef<TrainingExamPaper>[] = [
    {
      key: 'examCode',
      header: 'Exam Code & Duration',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
            {item.examCode}
          </span>
          <div className="text-[10px] text-slate-500 font-mono">
            {item.durationMinutes} Minutes • {item.passingPercentage}% Pass
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Examination Title & Linked Course',
      sortable: true,
      render: (item) => (
        <div className="min-w-0 pr-2">
          <button
            type="button"
            onClick={() => setSubView({ type: 'edit_exam', exam: item })}
            className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors text-left block truncate cursor-pointer"
            title={item.title}
          >
            {item.title}
          </button>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
            Course: {item.courseCode} ({item.courseTitle})
          </div>
        </div>
      ),
    },
    {
      key: 'targetDepartment',
      header: 'Department',
      sortable: true,
      render: (item) => (
        <span className="text-xs font-semibold text-slate-800">{item.targetDepartment}</span>
      ),
    },
    {
      key: 'questions',
      header: 'Questions & Marks',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
            {item.questions.length} Questions
          </span>
          <div className="text-[10px] text-slate-500 font-mono">
            Total {item.totalMarks} Marks
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <button
              type="button"
              onClick={() => setSubView({ type: 'edit_exam', exam: item })}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
              title="Open Exam Editor"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteModal({ isOpen: true, itemType: 'EXAM', items: [item] })}
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              title="Delete Exam Paper"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  // 3. Table Columns for Evaluation Records Tab
  const evalColumns: ColumnDef<TrainingEvaluationRecord>[] = [
    {
      key: 'evaluationCode',
      header: 'Evaluation Code & Date',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            {item.evaluationCode}
          </span>
          <div className="text-[10px] text-slate-500 font-mono">{item.sessionDate}</div>
        </div>
      ),
    },
    {
      key: 'courseTitle',
      header: 'Training Curriculum & Assessor',
      sortable: true,
      render: (item) => (
        <div className="min-w-0 pr-2">
          <div className="font-bold text-slate-900 text-xs truncate">{item.courseTitle}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Course: {item.courseCode} • Assessor: {item.evaluatorName}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAttendees',
      header: 'Assessed Trainees',
      sortable: true,
      render: (item) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-xs text-slate-800">
            {item.totalAttendees} Assessed
          </span>
          <div className="text-[10px] text-emerald-700 font-bold">
            {item.passedCount} Certified
          </div>
        </div>
      ),
    },
    {
      key: 'averageScorePercent',
      header: 'Average Score',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
          {item.averageScorePercent}%
        </span>
      ),
    },
    {
      key: 'competencyCertified',
      header: 'ISO 9001 Compliance',
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          <ShieldCheck className="w-3 h-3 text-blue-600" />
          <span>Clause 7.2 Signed</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              const matched = courses.find((c) => c.id === item.trainingId || c.courseCode === item.courseCode);
              if (matched) setSubView({ type: 'details', course: matched });
            }}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
            title="Inspect Training Session"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteModal({ isOpen: true, itemType: 'EVALUATION', items: [item] })}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            title="Delete Evaluation Record"
            style={{ display: canDelete ? undefined : 'none' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      {subView.type !== 'details' && (
        <ModuleHeader
          id="training-module"
          title="Training Matrix"
          activeView={subView.type !== 'none' ? 'records' : viewMode}
          onViewChange={(mode) => {
            setSubView({ type: 'none' });
            setViewMode(mode);
          }}
          customTabs={[
            { id: 'summary', label: 'Summary' },
            { id: 'calendar', label: 'Training Calendar', count: annualSchedule.length },
            { id: 'records', label: 'Training Records', count: courses.length },
            { id: 'exam_papers', label: 'Exam Papers', count: examPapers.length },
            { id: 'evaluations', label: 'Evaluations', count: evaluations.length },
          ]}
        />
      )}

      {/* RENDER DEDICATED SEPARATE SUB-PAGES IF ACTIVE */}
      {subView.type === 'details' ? (
        <TrainingDetailsPage
          course={subView.course}
          onBack={() => setSubView({ type: 'none' })}
          onEdit={(c: TrainingMatrixItem) => setSubView({ type: 'edit', course: c })}
          onDuplicate={(c: TrainingMatrixItem) => handleDuplicateCourse(c)}
          onDelete={(c: TrainingMatrixItem) => setDeleteModal({ isOpen: true, itemType: 'COURSE', items: [c] })}
          onUpdateStatus={handleUpdateCourse}
          onUpdateAttendees={(updatedAttendees: TrainingAttendee[]) => {
            const updated: TrainingMatrixItem = {
              ...subView.course,
              attendees: updatedAttendees,
            };
            handleUpdateCourse(updated);
          }}
          showToast={showToast}
        />
      ) : subView.type === 'add' ? (
        <TrainingEntryPage
          onSave={handleCreateCourse}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : subView.type === 'edit' ? (
        <TrainingEntryPage
          initialCourse={subView.course}
          onSave={handleUpdateCourse}
          onCancel={() => setSubView({ type: 'details', course: subView.course })}
          showToast={showToast}
        />
      ) : subView.type === 'evaluation' ? (
        <TrainingEvaluationPage
          course={subView.course}
          onSaveEvaluation={handleSaveEvaluation}
          onCancel={() => setSubView({ type: 'details', course: subView.course })}
          showToast={showToast}
        />
      ) : subView.type === 'create_exam' || subView.type === 'edit_exam' ? (
        <ExamPaperCreationPage
          initialExam={subView.type === 'edit_exam' ? subView.exam : undefined}
          onSaveExam={handleSaveExam}
          onCancel={() => setSubView({ type: 'none' })}
          showToast={showToast}
        />
      ) : (
        <>
          {/* TAB 1: SUMMARY ("Summery") */}
          {viewMode === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 StatCards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Training Modules"
                  value={courses.length}
                  subtitle="Needle, 4-Pt, Defect ID"
                  icon={GraduationCap}
                  tone="blue"
                  delta={{ value: '+1 Scheduled', isPositive: true }}
                />
                <StatCard
                  title="Total Certified Workers"
                  value={`${totalTrained} Staff`}
                  subtitle="Operators & QCs Trained"
                  icon={Users}
                  tone="emerald"
                />
                <StatCard
                  title="Training Pass Rate"
                  value={`${avgPassRate}%`}
                  subtitle="Practical & Written Score"
                  icon={CheckCircle2}
                  tone="indigo"
                />
                <StatCard
                  title="Upcoming Session"
                  value="Oct 05"
                  subtitle="Needle Safety Recertification"
                  icon={Calendar}
                  tone="amber"
                />
              </div>

              {/* Clean Light-Themed Highlight Banner */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>ISO 9001:2015 Clause 7.2 Competency Standard</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Factory Quality Training Matrix &amp; Skill Licensing
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Systematic human resource development framework governing 9-point broken needle policy,
                    ASTM 4-point fabric inspection, and AQL statistical sampling certifications across all apparel units.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const first = courses[0] || INITIAL_TRAINING_COURSES[0];
                      setSubView({ type: 'details', course: first });
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Needle Policy</span>
                  </button>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'add' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Schedule Training Session</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Training Cadence & Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Active Training Curricula
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {courses.length} Programs
                    </span>
                  </div>
                  <div className="space-y-2">
                    {courses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSubView({ type: 'details', course: c })}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-300 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-mono text-[10px] font-bold text-blue-700 block">
                            {c.courseCode}
                          </span>
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors block truncate">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {c.trainerName} • Next: {c.nextScheduledDate}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                          {c.trainedCount} Staff
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Exam Papers Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Technical Exam Papers &amp; Question Banks
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 font-bold">
                        {examPapers.length} Papers
                      </span>
                    </div>

                    <div className="space-y-2">
                      {examPapers.map((exam) => (
                        <div
                          key={exam.id}
                          onClick={() => setSubView({ type: 'edit_exam', exam })}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-300 transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 block">
                              {exam.examCode}
                            </span>
                            <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors block truncate">
                              {exam.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {exam.questions.length} Questions • {exam.durationMinutes} Min
                            </span>
                          </div>
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                            {exam.passingPercentage}% Pass
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-mono">ISO 9001 Clause 7.2</span>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'create_exam' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Compose Exam Paper</span>
                    </button>
                  )}
                  </div>
                </div>
              </div>

              <SwitchToListBanner
                label="Open Complete Factory Training Matrix & Examination Roster"
                recordCount={courses.length}
                onSwitchToList={() => setViewMode('records')}
              />
            </div>
          )}

          {/* TAB 2: TRAINING CALENDAR ("Training Calander") - Full Year 12-Month Section-Wise Master Schedule */}
          {viewMode === 'calendar' && (
            <AnnualMasterCalendarView
              scheduleItems={annualSchedule}
              courses={courses}
              onSelectCourse={(course) => setSubView({ type: 'details', course })}
              onScheduleNew={() => setSubView({ type: 'add' })}
              showToast={showToast}
            />
          )}

          {/* TAB 3: TRAINING RECORD ("Training Record") */}
          {viewMode === 'records' && (
            <div className="animate-in fade-in duration-200">
              <DataTable
                id="training-courses-table"
                title="Training Records"
                data={filteredCourses}
                columns={courseColumns}
                searchPlaceholder="Search course code, title, trainer, or target audience..."
                searchableKeys={['courseCode', 'title', 'trainerName', 'targetAudience', 'department']}
                secondaryAction={
                  <div className="flex items-center gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="TECHNICAL_QMS">Technical QMS</option>
                      <option value="SAFETY_COMPLIANCE">Safety & Needle</option>
                      <option value="MACHINE_OPERATION">Machine Operation</option>
                      <option value="CHEMICAL_ENVIRONMENTAL">Chemical & ZDHC</option>
                      <option value="MANAGEMENT_AUDITING">Internal Auditing</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="OVERDUE">Overdue</option>
                    </select>
                  </div>
                }
                primaryAction={
                  canCreate ? (
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'add' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Schedule Training Session</span>
                    </button>
                  ) : undefined
                }
                batchActions={[
                  ...(canDelete ? [{
                    label: 'Delete Selected',
                    variant: 'danger' as const,
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: (selected: TrainingMatrixItem[]) => {
                      setDeleteModal({
                        isOpen: true,
                        itemType: 'COURSE',
                        items: selected,
                      });
                    },
                  }] : []),
                  ...(canExport ? [{
                    label: 'Export Matrix',
                    icon: <Download className="w-3.5 h-3.5" />,
                    onClick: (selected: TrainingMatrixItem[]) => {
                      showToast(`Exported ${selected.length} training records`);
                    },
                  }] : []),
                ]}
              />
            </div>
          )}

          {/* TAB 4: EXAM PAPER RECORD ("Exam Paper record") */}
          {viewMode === 'exam_papers' && (
            <div className="animate-in fade-in duration-200">
              <DataTable
                id="exam-papers-table"
                title="Examination Papers"
                data={examPapers}
                columns={examColumns}
                searchPlaceholder="Search exam code, title, linked course, or department..."
                searchableKeys={['examCode', 'title', 'courseCode', 'courseTitle', 'targetDepartment']}
                primaryAction={
                  canCreate ? (
                    <button
                      type="button"
                      onClick={() => setSubView({ type: 'create_exam' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Create Exam Paper</span>
                    </button>
                  ) : undefined
                }
                batchActions={[
                  ...(canDelete ? [{
                    label: 'Delete Selected',
                    variant: 'danger' as const,
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: (selected: TrainingExamPaper[]) => {
                      setDeleteModal({
                        isOpen: true,
                        itemType: 'EXAM',
                        items: selected,
                      });
                    },
                  }] : []),
                ]}
              />
            </div>
          )}

          {/* TAB 5: EVALUATION RECORD ("Evaluation Record") */}
          {viewMode === 'evaluations' && (
            <div className="animate-in fade-in duration-200">
              <DataTable
                id="evaluations-table"
                title="Evaluation Records"
                data={evaluations}
                columns={evalColumns}
                searchPlaceholder="Search evaluation code, course title, assessor, or trainer..."
                searchableKeys={['evaluationCode', 'courseTitle', 'courseCode', 'evaluatorName']}
                primaryAction={
                  canEdit ? (
                    <button
                      type="button"
                      onClick={() => {
                        const c = courses[0] || INITIAL_TRAINING_COURSES[0];
                        setSubView({ type: 'evaluation', course: c });
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>+ Conduct Trainee Evaluation</span>
                    </button>
                  ) : undefined
                }
                batchActions={[
                  ...(canDelete ? [{
                    label: 'Delete Selected',
                    variant: 'danger' as const,
                    icon: <Trash2 className="w-3.5 h-3.5" />,
                    onClick: (selected: TrainingEvaluationRecord[]) => {
                      setDeleteModal({
                        isOpen: true,
                        itemType: 'EVALUATION',
                        items: selected,
                      });
                    },
                  }] : []),
                ]}
              />
            </div>
          )}
        </>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <DeleteTrainingModal
          isOpen={deleteModal.isOpen}
          itemType={deleteModal.itemType}
          items={deleteModal.items}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal(null)}
        />
      )}
    </div>
  );
}
