'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  Layers,
  Check,
  User,
  Users,
  Image as ImageIcon,
  Upload,
  Camera,
  Sparkles,
} from 'lucide-react';
import { TrainingMatrixItem, TrainingStatus, TrainingFrequency, TrainingAttendee } from '@/lib/types/modules';

interface TrainingEntryPageProps {
  initialCourse?: TrainingMatrixItem | null;
  onSave: (course: TrainingMatrixItem) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const SECTIONS = [
  { value: 'SEWING_SECTION', label: 'Sewing Production Lines' },
  { value: 'CUTTING_SECTION', label: 'Cutting Division' },
  { value: 'FINISHING_PACKING', label: 'Finishing & Export Packing' },
  { value: 'FABRIC_LAB', label: 'Fabric Warehouse & Lab' },
  { value: 'QUALITY_ASSURANCE', label: 'Quality Assurance & QMS' },
  { value: 'MAINTENANCE_SAFETY', label: 'Maintenance & Chemical Safety' },
];

const DEPARTMENTS = [
  'Quality Assurance',
  'Sewing Production Lines',
  'Cutting Division',
  'Fabric Warehouse & Lab',
  'Finishing & Export Packing',
  'Washing Plant & Chemical Safety',
  'Internal Audit & Compliance',
  'Industrial Engineering',
  'Maintenance & Utilities',
  'Sample Development',
];

const CATEGORIES = [
  { value: 'TECHNICAL_QMS', label: 'Technical QMS & Quality Standards' },
  { value: 'SAFETY_COMPLIANCE', label: 'Safety & Needle Contamination Policy' },
  { value: 'MACHINE_OPERATION', label: 'Machinery & Equipment Operation' },
  { value: 'CHEMICAL_ENVIRONMENTAL', label: 'Chemical Safety & ZDHC MRSL' },
  { value: 'MANAGEMENT_AUDITING', label: 'Internal Auditing & ISO 19011' },
];

const FREQUENCIES: { value: TrainingFrequency; label: string }[] = [
  { value: 'ONBOARDING', label: 'New Hire Onboarding' },
  { value: 'WEEKLY', label: 'Weekly Cadence' },
  { value: 'MONTHLY', label: 'Monthly Mandatory' },
  { value: 'QUARTERLY', label: 'Quarterly Refresher' },
  { value: 'SEMI_ANNUAL', label: 'Semi-Annual Recertification' },
  { value: 'ANNUAL', label: 'Annual Master Audit' },
];

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function TrainingEntryPage({
  initialCourse,
  onSave,
  onCancel,
  showToast,
}: TrainingEntryPageProps) {
  const isEditing = Boolean(initialCourse);

  const [activeTab, setActiveTab] = useState<'profile' | 'syllabus' | 'attendees' | 'preview'>('profile');

  // Form State - strictly focused on topic, logistics, curriculum, and attendee enrollment (NO exam fields)
  const [formData, setFormData] = useState<TrainingMatrixItem>(() => {
    if (initialCourse) {
      return JSON.parse(JSON.stringify(initialCourse));
    }
    return {
      id: `trn-${Date.now()}`,
      courseCode: 'TRN-NDL-06',
      title: '',
      category: 'SAFETY_COMPLIANCE',
      section: 'Sewing Production Lines',
      department: 'Sewing Production Lines',
      scheduledDay: 'Monday',
      timeSlot: '09:30 AM - 01:00 PM',
      targetAudience: 'Sewing Operators, Line Supervisors, Metal Detector Operators',
      trainerName: 'Engr. Tariqul Islam',
      frequency: 'MONTHLY',
      durationHours: 3.5,
      venue: 'Training Hall A (Floor 2)',
      maxCapacity: 35,
      trainedCount: 0,
      passRatePercent: 100,
      nextScheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'SCHEDULED',
      isoClause: 'ISO 9001:2015 Clause 7.2 (Competence)',
      prerequisites: 'Basic sewing machine operation orientation',
      syllabusTopics: [
        '9-point broken needle recovery protocol: mandatory 100% fragment matching',
        'Red lockbox quarantine procedure and supervisor sign-off',
        'Conveyor tunnel metal detector 1.0mm ferrous test card hourly calibration',
        'Handheld magnetic wand scanning techniques for alarmed garments',
      ],
      attendees: [],
      imageUrl: '',
      evidenceImages: [],
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
  });

  const PRESET_SAMPLE_IMAGES = [
    {
      title: 'Needle & Metal Safety Drill',
      url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Fabric 4-Point Lab Swatch Inspection',
      url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Active Sewing Demonstration',
      url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Chemical PPE & ZDHC Practical',
      url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=60',
    },
  ];

  const handlePrimaryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      if (uploadEvt.target?.result) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: uploadEvt.target!.result as string,
        }));
        showToast('Training session photo attached successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEvidenceImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileList.length === 0) {
      showToast('Please select valid image files');
      return;
    }

    const readers = fileList.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          if (evt.target?.result) {
            resolve(evt.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((newUrls) => {
      setFormData((prev) => ({
        ...prev,
        evidenceImages: [...(prev.evidenceImages || []), ...newUrls],
      }));
      showToast(`Added ${newUrls.length} classroom evidence photo(s)`);
    });
  };

  const handleRemoveEvidenceImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      evidenceImages: (prev.evidenceImages || []).filter((_, i) => i !== index),
    }));
    showToast('Removed evidence image');
  };

  const [newTopic, setNewTopic] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Trainee enrollment state
  const [enrolledEmpId, setEnrolledEmpId] = useState('');
  const [enrolledName, setEnrolledName] = useState('');
  const [enrolledSection, setEnrolledSection] = useState(formData.section || 'Sewing Line 1-4');
  const [enrolledDesig, setEnrolledDesig] = useState('Senior Sewing Operator');
  const [enrolledCheckIn, setEnrolledCheckIn] = useState('09:15 AM');

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.courseCode.trim()) errs.courseCode = 'Course code is required (e.g. TRN-NDL-01)';
    if (!formData.title.trim()) errs.title = 'Topic title is required';
    if (!formData.trainerName.trim()) errs.trainerName = 'Lead trainer name is required';
    if (!formData.targetAudience.trim()) errs.targetAudience = 'Target audience is required';
    if (!formData.nextScheduledDate) errs.nextScheduledDate = 'Session scheduled date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (statusOverride?: TrainingStatus) => {
    if (!validate()) {
      showToast('Please fix required fields before saving');
      setActiveTab('profile');
      return;
    }

    const toSave: TrainingMatrixItem = {
      ...formData,
      status: statusOverride || formData.status,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onSave(toSave);
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    setFormData((prev) => ({
      ...prev,
      syllabusTopics: [...(prev.syllabusTopics || []), newTopic.trim()],
    }));
    setNewTopic('');
  };

  const handleRemoveTopic = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      syllabusTopics: (prev.syllabusTopics || []).filter((_, i) => i !== index),
    }));
  };

  const handleAddTrainee = () => {
    if (!enrolledEmpId.trim() || !enrolledName.trim()) {
      showToast('Please provide Trainee Employee ID and Full Name');
      return;
    }
    const newAttendee: TrainingAttendee = {
      id: `att-${Date.now()}`,
      employeeId: enrolledEmpId.trim().toUpperCase(),
      name: enrolledName.trim(),
      department: formData.department || 'Production',
      sectionLine: enrolledSection.trim() || (formData.section || 'Line 1'),
      designation: enrolledDesig.trim() || 'Operator',
      attendanceStatus: 'PRESENT',
      checkInTime: enrolledCheckIn || '09:15 AM',
      signatureVerified: true,
    };
    setFormData((prev) => ({
      ...prev,
      attendees: [...(prev.attendees || []), newAttendee],
    }));
    setEnrolledEmpId('');
    setEnrolledName('');
    showToast(`Added ${newAttendee.name} to attendance roster`);
  };

  const handleRemoveTrainee = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      attendees: (prev.attendees || []).filter((a) => a.id !== id),
    }));
    showToast('Removed trainee from roster');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP ACTION BAR: Buyer & Order Styling */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Cancel and return"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {isEditing ? 'Editing Training Record' : 'Create Training Record & Attendance'}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {formData.title ? formData.title : 'Schedule Training Session'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => handleSave('SCHEDULED')}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Save Training Record' : 'Confirm & Schedule Record'}</span>
          </button>
        </div>
      </div>

      {/* STEP TABS: Strictly Topic, Logistics, Syllabus & Attendance Roster (NO exam tabs) */}
      <div className="flex items-center flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          1. Topic &amp; Session Logistics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('syllabus')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'syllabus'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          2. Curriculum Syllabus Topics
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendees')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'attendees'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          3. Trainee Details &amp; Attendance ({formData.attendees?.length || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          4. Record Preview &amp; Save
        </button>
      </div>

      {/* TAB 1: PROFILE & LOGISTICS */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Topic Title, Section Mapping &amp; Scheduling Logistics
            </h2>
            <p className="text-xs text-slate-500">
              Provide course identification, section allocation, exact date, day of training, time slot, and instructor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Course Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                placeholder="e.g. TRN-NDL-01"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.courseCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } font-mono font-bold`}
              />
              {errors.courseCode && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.courseCode}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topic Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. 9-Point Broken Needle Policy & Metal Contamination Prevention"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.title ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } font-medium`}
              />
              {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Section Mapping <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.section || 'Sewing Production Lines'}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec.value} value={sec.label}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Custodian Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Training Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Scheduled Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.nextScheduledDate}
                onChange={(e) => setFormData({ ...formData, nextScheduledDate: e.target.value })}
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.nextScheduledDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                } font-mono`}
              />
              {errors.nextScheduledDate && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.nextScheduledDate}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Day of Training Schedule
              </label>
              <select
                value={formData.scheduledDay || 'Monday'}
                onChange={(e) => setFormData({ ...formData, scheduledDay: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-semibold"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Time Slot
              </label>
              <input
                type="text"
                value={formData.timeSlot || '09:30 AM - 01:00 PM'}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                placeholder="e.g. 09:30 AM - 01:00 PM"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lead Trainer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.trainerName}
                onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
                placeholder="e.g. Engr. Tariqul Islam & Kamal Hossain"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.trainerName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.trainerName && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.trainerName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={formData.durationHours || 3.5}
                onChange={(e) => setFormData({ ...formData, durationHours: Number(e.target.value) || 3.5 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Training Venue / Room
              </label>
              <input
                type="text"
                value={formData.venue || ''}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                placeholder="e.g. Training Hall A (Floor 2)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Capacity (Target Seats)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={formData.maxCapacity || 35}
                onChange={(e) => setFormData({ ...formData, maxCapacity: Number(e.target.value) || 35 })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Recurrence Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ISO Clause Reference
              </label>
              <input
                type="text"
                value={formData.isoClause || 'ISO 9001:2015 Clause 7.2'}
                onChange={(e) => setFormData({ ...formData, isoClause: e.target.value })}
                placeholder="e.g. ISO 9001:2015 Clause 7.2"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Trainee Audience <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="e.g. Sewing Operators, Line Supervisors, Metal Detector Operators"
                className={`w-full px-3 py-2 text-xs rounded-lg border ${
                  errors.targetAudience ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 bg-slate-50'
                }`}
              />
              {errors.targetAudience && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.targetAudience}</p>
              )}
            </div>
          </div>

          {/* OFFICIAL TRAINING SESSION PHOTO & PHOTOGRAPHIC EVIDENCE UPLOAD */}
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Session Media & Photographic Training Evidence
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload practical demonstration photos, classroom sessions, or machine calibration records. These automatically appear on the official export dossier.
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                Appears on PDF & Export Page
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* PRIMARY TRAINING BANNER / PHOTO */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Primary Training Session Photo / Poster</span>
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {formData.imageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 aspect-video sm:h-44 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Primary training session preview"
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-900 text-xs font-semibold cursor-pointer shadow-sm">
                        Replace Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePrimaryImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer group text-center">
                    <div className="p-3 rounded-full bg-blue-50 group-hover:bg-blue-100 text-blue-600 mb-2 transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to upload session photo
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1">
                      PNG, JPG, WEBP up to 5MB • Formatted for A4 Export
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePrimaryImageUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Preset Sample Banners */}
                <div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mb-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick presets for training demo:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_SAMPLE_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, imageUrl: preset.url });
                          showToast(`Selected "${preset.title}" photo`);
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          formData.imageUrl === preset.url
                            ? 'bg-blue-600 text-white border-blue-600 font-bold'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {preset.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SUPPORTING EVIDENCE GALLERY PHOTOS */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Classroom &amp; Practical Activity Photos</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-slate-500">
                    {formData.evidenceImages?.length || 0} Photos Attached
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(formData.evidenceImages || []).map((imgUrl, i) => (
                    <div
                      key={i}
                      className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Evidence thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidenceImage(i)}
                        className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700 cursor-pointer shadow-xs"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add evidence button */}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg aspect-square bg-slate-50/50 hover:bg-indigo-50/20 transition-all cursor-pointer text-center p-2">
                    <Upload className="w-4 h-4 text-indigo-500 mb-1" />
                    <span className="text-[10px] font-bold text-slate-700">+ Add Evidence</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEvidenceImagesUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  Multiple photos supported (classroom attendance photo, trainee practical drills, test specimens).
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('syllabus')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Next: Syllabus Topics &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SYLLABUS */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Curriculum Syllabus Topics Builder
              </h2>
              <p className="text-xs text-slate-500">
                Itemize specific lecture topics, practical demonstrations, and operational standards covered in this session.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder="Add syllabus topic (e.g. 9-point broken needle recovery protocol)..."
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Topic</span>
              </button>
            </div>

            <div className="space-y-2">
              {(formData.syllabusTopics || []).map((topic, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-mono text-[10px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 font-medium leading-relaxed">{topic}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(idx)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Prerequisites &amp; Notes
              </h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prerequisites / Experience Requirement
              </label>
              <input
                type="text"
                value={formData.prerequisites || ''}
                onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                placeholder="e.g. Basic machine operation orientation and metal detector safety brief"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                &larr; Back to Logistics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attendees')}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                Next: Trainee Attendance &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRAINEE DETAILS & ATTENDANCE ROSTER (NO EXAM/EVALUATION MARKS) */}
      {activeTab === 'attendees' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Trainee Details &amp; Attendance Roster Enrollment
              </h2>
              <p className="text-xs text-slate-500">
                Enroll attendees for this specific training session: Company ID, Name, Section/Line, Designation, and Check-in Time.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
              {formData.attendees?.length || 0} Trainees Enrolled
            </span>
          </div>

          {/* Quick Trainee Enrollment Form */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <span className="font-bold text-slate-800 block">Enroll Staff into Roster:</span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Company ID</label>
                <input
                  type="text"
                  value={enrolledEmpId}
                  onChange={(e) => setEnrolledEmpId(e.target.value)}
                  placeholder="e.g. EMP-2024-010"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Trainee Name</label>
                <input
                  type="text"
                  value={enrolledName}
                  onChange={(e) => setEnrolledName(e.target.value)}
                  placeholder="e.g. Nasrin Sultana"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Section / Line</label>
                <input
                  type="text"
                  value={enrolledSection}
                  onChange={(e) => setEnrolledSection(e.target.value)}
                  placeholder="e.g. Sewing Line 4"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Designation</label>
                <input
                  type="text"
                  value={enrolledDesig}
                  onChange={(e) => setEnrolledDesig(e.target.value)}
                  placeholder="e.g. Senior Sewing Operator"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Check-in Time</label>
                <input
                  type="text"
                  value={enrolledCheckIn}
                  onChange={(e) => setEnrolledCheckIn(e.target.value)}
                  placeholder="e.g. 09:15 AM"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddTrainee}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Trainee to Attendance Roster</span>
              </button>
            </div>
          </div>

          {/* Enrolled Trainees Table */}
          {(!formData.attendees || formData.attendees.length === 0) ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">No attendees enrolled yet</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Use the enrollment inputs above to register staff attending this session. You can also add more during or after the session.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Company ID</th>
                    <th className="py-2 px-3">Trainee Name</th>
                    <th className="py-2 px-3">Section / Line</th>
                    <th className="py-2 px-3">Designation</th>
                    <th className="py-2 px-3 text-center">Check-in Time</th>
                    <th className="py-2 px-3 text-center">Attendance</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.attendees.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{att.employeeId}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{att.name}</td>
                      <td className="py-2.5 px-3 text-slate-700">{att.sectionLine || 'Sewing Line'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{att.designation}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">{att.checkInTime || '09:15 AM'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {att.attendanceStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveTrainee(att.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
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

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('syllabus')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              &larr; Back to Syllabus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Next: Review &amp; Confirm &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE PREVIEW & SAVE */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Training Record Confirmation Preview
              </span>
              <p className="text-xs text-slate-500">
                Review complete session logistics, syllabus, and attendee roster before confirming.
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {formData.courseCode} • {formData.frequency}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block text-sm">{formData.title || 'Untitled Session'}</span>
              <div>
                <span className="text-slate-500">Section:</span>{' '}
                <strong className="text-slate-800">{formData.section || formData.department}</strong>
              </div>
              <div>
                <span className="text-slate-500">Scheduled Date &amp; Day:</span>{' '}
                <strong className="text-blue-700 font-mono">{formData.nextScheduledDate} ({formData.scheduledDay || 'Monday'})</strong>
              </div>
              <div>
                <span className="text-slate-500">Time Slot &amp; Venue:</span>{' '}
                <span>{formData.timeSlot || '09:30 AM - 01:00 PM'} • {formData.venue}</span>
              </div>
              <div>
                <span className="text-slate-500">Trainer:</span>{' '}
                <strong className="text-slate-800">{formData.trainerName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Target Trainees:</span>{' '}
                <span>{formData.targetAudience}</span>
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-950 block">Attendance &amp; Syllabus:</span>
              <div>
                <span className="text-slate-600 font-medium">Enrolled Trainees:</span>{' '}
                <strong className="font-mono text-blue-800">{formData.attendees?.length || 0} Workers</strong>
              </div>
              <ul className="space-y-1 pt-1">
                {(formData.syllabusTopics || []).slice(0, 4).map((top, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{top}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 text-slate-500 font-mono text-[11px]">
                Governing Clause: {formData.isoClause || 'ISO 9001:2015 Clause 7.2'}
              </div>
            </div>
          </div>

          {/* PREVIEW OF ATTACHED TRAINING SESSION PHOTOS */}
          {(formData.imageUrl || (formData.evidenceImages && formData.evidenceImages.length > 0)) && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Photographic Media Attached (Will Appear on Export Dossier)</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {(formData.imageUrl ? 1 : 0) + (formData.evidenceImages?.length || 0)} Media Ready
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {formData.imageUrl && (
                  <div className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Primary banner"
                      className="w-16 h-12 object-cover rounded border border-slate-100"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Primary Session Photo</span>
                      <span className="text-[10px] text-slate-400">A4 Header Banner</span>
                    </div>
                  </div>
                )}

                {(formData.evidenceImages || []).slice(0, 4).map((url, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Evidence ${i + 1}`}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </div>
                ))}
                {(formData.evidenceImages?.length || 0) > 4 && (
                  <span className="text-xs font-mono text-slate-500 font-bold">
                    +{(formData.evidenceImages?.length || 0) - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('attendees')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              &larr; Back to Attendance
            </button>

            <button
              type="button"
              onClick={() => handleSave('SCHEDULED')}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save & Update Training Record' : 'Confirm & Schedule Record'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
