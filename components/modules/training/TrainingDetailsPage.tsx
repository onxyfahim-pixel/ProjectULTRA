'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  Edit,
  Trash2,
  Copy,
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Check,
  User,
  Plus,
  Layers,
  XCircle,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { TrainingMatrixItem, TrainingStatus, TrainingAttendee } from '@/lib/types/modules';

interface TrainingDetailsPageProps {
  course: TrainingMatrixItem;
  onBack: () => void;
  onEdit: (course: TrainingMatrixItem) => void;
  onDuplicate: (course: TrainingMatrixItem) => void;
  onDelete: (course: TrainingMatrixItem) => void;
  onUpdateStatus?: (updated: TrainingMatrixItem) => void;
  onUpdateAttendees?: (updatedAttendees: TrainingAttendee[]) => void;
  showToast: (msg: string) => void;
}

export function TrainingDetailsPage({
  course,
  onBack,
  onEdit,
  onDuplicate,
  onDelete,
  onUpdateStatus,
  onUpdateAttendees,
  showToast,
}: TrainingDetailsPageProps) {
  const [attendees, setAttendees] = useState<TrainingAttendee[]>(course.attendees || []);

  // Quick add trainee form state
  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newName, setNewName] = useState('');
  const [newSection, setNewSection] = useState(course.section || 'Sewing Line 1-4');
  const [newDesig, setNewDesig] = useState('Machine Operator');

  const handleStatusChange = (newStatus: TrainingStatus) => {
    const updated: TrainingMatrixItem = {
      ...course,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onUpdateStatus?.(updated);
    showToast(`Session status updated to ${newStatus}`);
  };

  const handleAttendanceToggle = (id: string, status: TrainingAttendee['attendanceStatus']) => {
    const updated = attendees.map((a) =>
      a.id === id
        ? {
            ...a,
            attendanceStatus: status,
            checkInTime: status === 'PRESENT' ? a.checkInTime || '09:15 AM' : undefined,
          }
        : a
    );
    setAttendees(updated);
    onUpdateAttendees?.(updated);
    showToast(`Updated attendance status`);
  };

  const handleAddTrainee = () => {
    if (!newEmpId.trim() || !newName.trim()) {
      showToast('Please provide Employee ID and Name');
      return;
    }
    const newAttendee: TrainingAttendee = {
      id: `att-${Date.now()}`,
      employeeId: newEmpId.trim().toUpperCase(),
      name: newName.trim(),
      department: course.department || 'Production',
      sectionLine: newSection.trim(),
      designation: newDesig.trim(),
      attendanceStatus: 'PRESENT',
      checkInTime: '09:20 AM',
      signatureVerified: true,
    };
    const updated = [...attendees, newAttendee];
    setAttendees(updated);
    onUpdateAttendees?.(updated);
    setNewEmpId('');
    setNewName('');
    setShowAddTrainee(false);
    showToast(`Enrolled ${newName} into attendance roster`);
  };

  const handleRemoveTrainee = (id: string) => {
    const updated = attendees.filter((a) => a.id !== id);
    setAttendees(updated);
    onUpdateAttendees?.(updated);
    showToast('Removed trainee from roster');
  };

  const handlePrint = () => {
    window.print();
  };

  const presentCount = attendees.filter((a) => a.attendanceStatus === 'PRESENT').length;
  const absentCount = attendees.filter((a) => a.attendanceStatus === 'ABSENT').length;
  const excusedCount = attendees.filter((a) => a.attendanceStatus === 'EXCUSED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP ACTION BAR: Buyer & Order Styling */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Back to Training Record"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">
                {course.courseCode}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {course.frequency}
              </span>
              <span className="font-mono text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                {course.category || 'TECHNICAL_QMS'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">{course.title}</h1>
          </div>
        </div>

        {/* Action Buttons: Buyer & Order Style */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Status selector */}
          <select
            value={course.status}
            onChange={(e) => handleStatusChange(e.target.value as TrainingStatus)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 cursor-pointer transition-colors"
          >
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print Attendance Sheet</span>
          </button>

          {/* Duplicate Button */}
          <button
            type="button"
            onClick={() => onDuplicate(course)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => onEdit(course)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Record</span>
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDelete(course)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* METADATA HIGHLIGHT CARDS (All clean light styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date, Day & Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Scheduled Training Day &amp; Date</span>
          </div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            {course.nextScheduledDate}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {course.scheduledDay || 'Monday'} • {course.timeSlot || '09:30 AM - 01:00 PM'} ({course.durationHours || 3.5}h)
          </div>
        </div>

        {/* Lead Trainer & Venue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <User className="w-4 h-4 text-indigo-600" />
            <span>Designated Lead Instructor</span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">{course.trainerName}</div>
          <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{course.venue || 'Training Hall A (Floor 2)'}</span>
          </div>
        </div>

        {/* Section & Department Mapping */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Section &amp; Target Trainees</span>
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">
            {course.section || course.department || 'Sewing Production'}
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            Audience: {course.targetAudience}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Trainee Attendance Status</span>
          </div>
          <div className="font-mono font-bold text-emerald-700 text-sm">
            {presentCount} Present / {attendees.length} Enrolled
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {absentCount} Absent • {excusedCount} Excused
          </div>
        </div>
      </div>

      {/* SECTION 1: TOPIC TITLE & CURRICULUM SYLLABUS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Curriculum Topics Covered in Session
            </h2>
            <p className="text-xs text-slate-500">
              Detailed instruction modules and practical demonstration exercises delivered during this training.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 self-start sm:self-auto">
            {course.isoClause || 'ISO 9001:2015 Clause 7.2'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(course.syllabusTopics && course.syllabusTopics.length > 0
            ? course.syllabusTopics
            : [
                'Understanding buyer quality standards and acceptable defect limits',
                'Demonstration of defect identification on active manufacturing stations',
                'Practical execution of quality audit checklists and log sheets',
                'Workplace safety guidelines and line-stop reporting protocol',
              ]
          ).map((topic, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs"
            >
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-mono text-[10px] font-bold">
                0{idx + 1}
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">{topic}</p>
            </div>
          ))}
        </div>

        {course.prerequisites && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
            <span className="font-bold text-slate-900">Session Prerequisite:</span>
            <span>{course.prerequisites}</span>
          </div>
        )}
      </div>

      {/* SECTION 2: TRAINEE DETAILS & ATTENDANCE ROSTER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Trainee Details &amp; Attendance Roster
            </h2>
            <p className="text-xs text-slate-500">
              Complete attendance register with company employee IDs, designated section/line, check-in times, and verification status.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {presentCount} / {attendees.length} Present
            </span>
            <button
              type="button"
              onClick={() => setShowAddTrainee(!showAddTrainee)}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddTrainee ? 'Close Form' : '+ Add Trainee'}</span>
            </button>
          </div>
        </div>

        {/* Quick Add Trainee Form */}
        {showAddTrainee && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150 text-xs">
            <span className="font-bold text-slate-900 block">
              Enroll New Trainee into this Session:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                value={newEmpId}
                onChange={(e) => setNewEmpId(e.target.value)}
                placeholder="Company ID (e.g. EMP-2024-099)"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full Employee Name"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
              />
              <input
                type="text"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                placeholder="Section / Line (e.g. Sewing Line 4)"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
              <input
                type="text"
                value={newDesig}
                onChange={(e) => setNewDesig(e.target.value)}
                placeholder="Designation (e.g. Operator)"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddTrainee(false)}
                className="px-3 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddTrainee}
                className="px-4 py-1 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 cursor-pointer"
              >
                Confirm Enrollment
              </button>
            </div>
          </div>
        )}

        {/* Trainees Attendance Table (Compact & Fitted, No Horizontal Scroll) */}
        {attendees.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-semibold text-slate-700">No trainees enrolled yet</div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Click &quot;+ Add Trainee&quot; above to enroll staff, assign their company ID numbers, and track check-in attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Company ID</th>
                  <th className="py-2.5 px-3">Trainee Name</th>
                  <th className="py-2.5 px-3">Section / Line</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3 text-center">Check-in Time</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3 text-center">Verification</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendees.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">{att.employeeId}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{att.name}</td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {att.sectionLine || course.section || 'Sewing Line 1-4'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{att.designation}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {att.checkInTime || (att.attendanceStatus === 'PRESENT' ? '09:15 AM' : '—')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAttendanceToggle(att.id, 'PRESENT')}
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors ${
                            att.attendanceStatus === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendanceToggle(att.id, 'ABSENT')}
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors ${
                            att.attendanceStatus === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50'
                          }`}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendanceToggle(att.id, 'EXCUSED')}
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors ${
                            att.attendanceStatus === 'EXCUSED'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50'
                          }`}
                        >
                          E
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Signed</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveTrainee(att.id)}
                        className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Remove from session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: ATTENDANCE SHEET GOVERNANCE SIGN-OFF */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Attendance Sheet Verification &amp; Session Sign-Off
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory tri-party verification required for ISO 9001 Clause 7.2 compliance records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Lead Instructor Signature:
            </span>
            <div className="font-bold text-slate-900">{course.trainerName}</div>
            <div className="text-[10px] text-slate-500 font-mono">Date: {course.nextScheduledDate}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">
              Section In-Charge Verification:
            </span>
            <div className="font-bold text-slate-900">
              {course.section || 'Production Line Head'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Verified Worker Attendance</div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-1">
            <span className="text-[10px] font-mono text-blue-700 uppercase font-bold block">
              HR / QMS Document Controller:
            </span>
            <div className="font-bold text-blue-950">Training Records Custodian</div>
            <div className="text-[10px] text-blue-700 font-medium">Logged in ERP QMS Archive</div>
          </div>
        </div>
      </div>
    </div>
  );
}
