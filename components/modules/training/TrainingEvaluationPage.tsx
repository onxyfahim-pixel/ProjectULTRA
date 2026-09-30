'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GraduationCap,
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  Award,
  Users,
  Printer,
  User,
  Building2,
  Calendar,
  Check,
} from 'lucide-react';
import {
  TrainingMatrixItem,
  TrainingEvaluationRecord,
  TrainingAttendee,
} from '@/lib/types/modules';

interface TrainingEvaluationPageProps {
  course: TrainingMatrixItem;
  onSaveEvaluation: (evaluation: TrainingEvaluationRecord, updatedAttendees: TrainingAttendee[]) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

export function TrainingEvaluationPage({
  course,
  onSaveEvaluation,
  onCancel,
  showToast,
}: TrainingEvaluationPageProps) {
  const [evaluationCode] = useState(
    `EVAL-${course.courseCode.replace('TRN-', '')}-${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1
    ).padStart(2, '0')}`
  );
  const [evaluatorName, setEvaluatorName] = useState(course.trainerName.split('&')[0].trim());
  const [evaluatorTitle, setEvaluatorTitle] = useState('Head of Quality Assurance (QMS Director)');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [trainerRemarks, setTrainerRemarks] = useState(
    'All attendees demonstrated verified practical competence and successfully satisfied the ISO 9001 Clause 7.2 training threshold.'
  );
  const [competencyCertified, setCompetencyCertified] = useState(true);

  // Attendees list
  const [trainees, setTrainees] = useState<TrainingAttendee[]>(() => {
    if (course.attendees && course.attendees.length > 0) {
      return JSON.parse(JSON.stringify(course.attendees));
    }
    // Default 3 sample trainees if none yet
    return [
      {
        id: `att-${Date.now()}-1`,
        employeeId: 'EMP-2022-0481',
        name: 'Nasrin Sultana',
        department: 'Sewing Production',
        designation: 'Senior Sewing Operator',
        attendanceStatus: 'PRESENT',
        preTestScore: 65,
        postTestScore: 95,
        practicalScore: 98,
        finalScore: 96,
        result: 'PASSED',
        certificateNo: `CERT-${course.courseCode.replace('TRN-', '')}-2026-081`,
        remarks: 'Demonstrated high competence in practical exam.',
      },
      {
        id: `att-${Date.now()}-2`,
        employeeId: 'EMP-2023-0192',
        name: 'Abdur Rahim',
        department: 'Sewing Production',
        designation: 'Line 4 Supervisor',
        attendanceStatus: 'PRESENT',
        preTestScore: 70,
        postTestScore: 100,
        practicalScore: 95,
        finalScore: 98,
        result: 'PASSED',
        certificateNo: `CERT-${course.courseCode.replace('TRN-', '')}-2026-082`,
        remarks: 'Accurately documented quarantine log and line-stop procedures.',
      },
    ];
  });

  // New trainee inputs
  const [newEmpId, setNewEmpId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState(course.department || 'Quality Assurance');
  const [newDesig, setNewDesig] = useState('Quality Controller');

  const handleScoreChange = (
    id: string,
    field: 'preTestScore' | 'postTestScore' | 'practicalScore',
    value: number
  ) => {
    setTrainees((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, [field]: value };
        const post = field === 'postTestScore' ? value : updated.postTestScore || 0;
        const prac = field === 'practicalScore' ? value : updated.practicalScore || 0;
        const finalScore = Math.round(post * 0.4 + prac * 0.6);
        const result = finalScore >= 80 ? ('PASSED' as const) : ('FAILED' as const);
        return {
          ...updated,
          finalScore,
          result,
          certificateNo:
            result === 'PASSED'
              ? updated.certificateNo ||
                `CERT-${course.courseCode.replace('TRN-', '')}-2026-${Math.floor(100 + Math.random() * 900)}`
              : undefined,
        };
      })
    );
  };

  const handleAddTrainee = () => {
    if (!newEmpId.trim() || !newName.trim()) {
      showToast('Please provide employee ID and name');
      return;
    }
    const newTrainee: TrainingAttendee = {
      id: `att-${Date.now()}`,
      employeeId: newEmpId.trim().toUpperCase(),
      name: newName.trim(),
      department: newDept,
      designation: newDesig.trim(),
      attendanceStatus: 'PRESENT',
      preTestScore: 60,
      postTestScore: 90,
      practicalScore: 90,
      finalScore: 90,
      result: 'PASSED',
      certificateNo: `CERT-${course.courseCode.replace('TRN-', '')}-2026-${Math.floor(100 + Math.random() * 900)}`,
      remarks: 'Certified upon evaluation.',
    };
    setTrainees([...trainees, newTrainee]);
    setNewEmpId('');
    setNewName('');
    showToast(`Added ${newName} to evaluation sheet`);
  };

  const handleRemoveTrainee = (id: string) => {
    setTrainees(trainees.filter((t) => t.id !== id));
  };

  // Calculations
  const presentCount = trainees.filter((t) => t.attendanceStatus === 'PRESENT').length;
  const passedCount = trainees.filter((t) => t.result === 'PASSED').length;
  const failedCount = trainees.filter((t) => t.result === 'FAILED').length;
  const avgScore =
    trainees.length > 0
      ? Math.round(trainees.reduce((sum, t) => sum + (t.finalScore || 0), 0) / trainees.length)
      : 0;

  const handleSave = () => {
    if (trainees.length === 0) {
      showToast('Please add at least one trainee to evaluate');
      return;
    }

    const evaluationRecord: TrainingEvaluationRecord = {
      id: `eval-${Date.now()}`,
      evaluationCode,
      trainingId: course.id,
      courseCode: course.courseCode,
      courseTitle: course.title,
      sessionDate,
      trainerName: course.trainerName,
      evaluatorName,
      evaluatorTitle,
      totalAttendees: trainees.length,
      passedCount,
      failedCount,
      averageScorePercent: avgScore,
      trainees,
      trainerRemarks,
      competencyCertified,
      status: 'COMPLETED',
      updatedAt: new Date().toISOString(),
    };

    onSaveEvaluation(evaluationRecord, trainees);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TOP ACTION BAR: Buyer & Order Styling */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {evaluationCode}
              </span>
              <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {course.courseCode}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Trainee Competency Evaluation &amp; Certification Sign-Off
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
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Evaluation &amp; Certify</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Total Trainees Evaluated</span>
          <div className="font-bold text-slate-900 text-xl">{trainees.length} Staff</div>
          <div className="text-[11px] text-slate-500 font-mono">{presentCount} Present &amp; Assessed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Competency Certified</span>
          <div className="font-bold text-emerald-700 text-xl font-mono">{passedCount} Passed</div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            {trainees.length > 0 ? Math.round((passedCount / trainees.length) * 100) : 0}% Pass Rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Retest / Failed</span>
          <div className="font-bold text-rose-600 text-xl font-mono">{failedCount} Trainees</div>
          <div className="text-[11px] text-slate-500 font-mono">Requires 14-day retraining</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Batch Average Score</span>
          <div className="font-bold text-blue-700 text-xl font-mono">{avgScore}%</div>
          <div className="text-[11px] text-blue-600 font-mono">Weighted: 40% Theory + 60% Practical</div>
        </div>
      </div>

      {/* SECTION 1: EVALUATION SESSION METADATA */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Evaluation Session &amp; Authorized Assessor
          </h2>
          <p className="text-xs text-slate-500">
            Designated QMS lead auditor conducting assessment per ISO 9001 Clause 7.2.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Session Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Evaluator / Lead Assessor</label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="e.g. Tanzim Ahmed"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Evaluator Designation</label>
            <input
              type="text"
              value={evaluatorTitle}
              onChange={(e) => setEvaluatorTitle(e.target.value)}
              placeholder="e.g. Head of Quality Assurance"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: TRAINEE SCORING MATRIX */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Trainee Assessment &amp; Marks Register
            </h2>
            <p className="text-xs text-slate-500">
              Input pre-test, post-test, and practical marks. Final score and certificate numbers update automatically.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Passing Threshold: ≥ 80% Final Score
          </span>
        </div>

        {/* Add new trainee row */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-bold text-slate-800 block">
            Enroll Additional Trainee to Assessment:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <input
              type="text"
              value={newEmpId}
              onChange={(e) => setNewEmpId(e.target.value)}
              placeholder="Company ID (e.g. EMP-2024-001)"
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
            />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full Employee Name"
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium sm:col-span-2"
            />
            <input
              type="text"
              value={newDesig}
              onChange={(e) => setNewDesig(e.target.value)}
              placeholder="Designation"
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
            />
            <button
              type="button"
              onClick={handleAddTrainee}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              Add to Sheet
            </button>
          </div>
        </div>

        {/* Scoring Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Company ID</th>
                <th className="py-2.5 px-3">Trainee Name</th>
                <th className="py-2.5 px-3">Attendance</th>
                <th className="py-2.5 px-3 text-center">Pre-Test (0-100)</th>
                <th className="py-2.5 px-3 text-center">Post-Test (40%)</th>
                <th className="py-2.5 px-3 text-center">Practical (60%)</th>
                <th className="py-2.5 px-3 text-center">Final Score</th>
                <th className="py-2.5 px-3">Certificate No.</th>
                <th className="py-2.5 px-3 text-center">Result</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trainees.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{t.employeeId}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{t.name}</div>
                    <div className="text-[10px] text-slate-500">{t.department} • {t.designation}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={t.attendanceStatus}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTrainees(
                          trainees.map((tr) => (tr.id === t.id ? { ...tr, attendanceStatus: val } : tr))
                        );
                      }}
                      className="px-2 py-1 rounded border border-slate-200 bg-white font-mono text-[11px]"
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="EXCUSED">EXCUSED</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={t.preTestScore ?? 0}
                      onChange={(e) =>
                        handleScoreChange(t.id, 'preTestScore', Number(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-center font-mono font-medium text-slate-700"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={t.postTestScore ?? 0}
                      onChange={(e) =>
                        handleScoreChange(t.id, 'postTestScore', Number(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 rounded border border-blue-200 bg-white text-center font-mono font-bold text-blue-800"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={t.practicalScore ?? 0}
                      onChange={(e) =>
                        handleScoreChange(t.id, 'practicalScore', Number(e.target.value) || 0)
                      }
                      className="w-16 px-1.5 py-1 rounded border border-blue-200 bg-white text-center font-mono font-bold text-blue-800"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-sm">
                    <span
                      className={
                        (t.finalScore || 0) >= 80 ? 'text-emerald-700' : 'text-rose-600'
                      }
                    >
                      {t.finalScore || 0}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                    {t.certificateNo || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        t.result === 'PASSED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {t.result || 'PENDING'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveTrainee(t.id)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Remove Trainee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: EVALUATOR REMARKS & ISO SIGN-OFF */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Evaluator Remarks &amp; Competency Certification Declaration
          </h2>
          <p className="text-xs text-slate-500">
            Formal instructor certification required for ISO 9001 Clause 7.2 competence audit trails.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            General Instructor Remarks &amp; Recommendations:
          </label>
          <textarea
            rows={3}
            value={trainerRemarks}
            onChange={(e) => setTrainerRemarks(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>

        <label className="flex items-start gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 cursor-pointer">
          <input
            type="checkbox"
            checked={competencyCertified}
            onChange={(e) => setCompetencyCertified(e.target.checked)}
            className="mt-0.5 rounded text-blue-600 focus:ring-0"
          />
          <div className="text-xs text-blue-950">
            <span className="font-bold block">ISO 9001:2015 Clause 7.2 Competency Sign-Off</span>
            <p className="text-blue-900 text-[11px] leading-relaxed mt-0.5">
              I formally certify that the above personnel have completed the mandatory curriculum, achieved passing scores in theoretical and practical assessments, and are authorized to execute their designated quality roles on active export manufacturing lines.
            </p>
          </div>
        </label>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finalize Evaluation &amp; Issue Certificates</span>
          </button>
        </div>
      </div>
    </div>
  );
}
