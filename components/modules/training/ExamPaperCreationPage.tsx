'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  HelpCircle,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  Check,
  Building2,
  Printer,
} from 'lucide-react';
import { TrainingExamPaper, TrainingExamQuestion } from '@/lib/types/modules';

interface ExamPaperCreationPageProps {
  initialExam?: TrainingExamPaper | null;
  onSaveExam: (exam: TrainingExamPaper) => void;
  onCancel: () => void;
  showToast: (msg: string) => void;
}

const QUESTION_TYPES = [
  { value: 'MCQ', label: 'Multiple Choice Question (MCQ)' },
  { value: 'TRUE_FALSE', label: 'True / False Question' },
  { value: 'PRACTICAL_CHECK', label: 'Practical Skill Demonstration' },
  { value: 'VIVA', label: 'Oral Viva / Audit Question' },
];

export function ExamPaperCreationPage({
  initialExam,
  onSaveExam,
  onCancel,
  showToast,
}: ExamPaperCreationPageProps) {
  const isEditing = Boolean(initialExam);

  const [formData, setFormData] = useState<TrainingExamPaper>(() => {
    if (initialExam) {
      return JSON.parse(JSON.stringify(initialExam));
    }
    return {
      id: `exam-${Date.now()}`,
      examCode: 'EXAM-QMS-02',
      title: 'Garments Quality Inspection & Defect Classification Exam',
      courseCode: 'TRN-AQL-03',
      courseTitle: 'ISO 2859-1 / AQL 1.5 Final Random Inspection Standards',
      targetDepartment: 'Quality Assurance & Finishing',
      durationMinutes: 45,
      totalMarks: 100,
      passingPercentage: 80,
      instructions:
        'Read all questions carefully. Both theory and practical questions must satisfy the minimum competency passing mark.',
      status: 'ACTIVE',
      createdBy: 'Tanzim Ahmed (QA Director)',
      questions: [
        {
          id: `q-${Date.now()}-1`,
          questionNumber: 1,
          questionText:
            'What is the maximum allowable Critical Defect limit during final AQL inspection for export shipments?',
          type: 'MCQ',
          options: ['A) Zero (0)', 'B) One (1)', 'C) Two (2)', 'D) Depends on lot size'],
          correctAnswer: 'A',
          points: 25,
          evaluationCriteria: 'Understanding zero-tolerance policy for critical defects',
        },
        {
          id: `q-${Date.now()}-2`,
          questionNumber: 2,
          questionText:
            'True or False: Broken needle fragments must be collected and 100% physically accounted for before a replacement needle can be issued.',
          type: 'TRUE_FALSE',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 25,
          evaluationCriteria: 'Strict adherence to 9-point broken needle policy',
        },
        {
          id: `q-${Date.now()}-3`,
          questionNumber: 3,
          questionText:
            'Practical Assessment: Demonstrate 7-piece roving in-line quality inspection on active sewing line and complete the traffic light log.',
          type: 'PRACTICAL_CHECK',
          points: 50,
          evaluationCriteria: 'Inspection speed, defect detection, and accurate record logging',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
  });

  // Builder inputs for adding questions
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<TrainingExamQuestion['type']>('MCQ');
  const [qPoints, setQPoints] = useState<number>(20);
  const [qCriteria, setQCriteria] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');

  const totalCalculatedPoints = formData.questions.reduce((sum, q) => sum + q.points, 0);

  const handleAddQuestion = () => {
    if (!qText.trim()) {
      showToast('Please enter the question text');
      return;
    }

    let options: string[] | undefined = undefined;
    if (qType === 'MCQ') {
      options = [
        `A) ${optA || 'Option A'}`,
        `B) ${optB || 'Option B'}`,
        `C) ${optC || 'Option C'}`,
        `D) ${optD || 'Option D'}`,
      ];
    } else if (qType === 'TRUE_FALSE') {
      options = ['True', 'False'];
    }

    const newQuestion: TrainingExamQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: formData.questions.length + 1,
      questionText: qText.trim(),
      type: qType,
      options,
      correctAnswer: qType === 'MCQ' || qType === 'TRUE_FALSE' ? correctAnswer : undefined,
      points: Number(qPoints) || 10,
      evaluationCriteria: qCriteria.trim() || 'Accurate demonstration of QMS knowledge',
    };

    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      totalMarks: totalCalculatedPoints + newQuestion.points,
    }));

    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setQCriteria('');
    showToast('Question added to exam paper');
  };

  const handleRemoveQuestion = (id: string) => {
    const remaining = formData.questions.filter((q) => q.id !== id);
    const renumbered = remaining.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setFormData((prev) => ({
      ...prev,
      questions: renumbered,
      totalMarks: renumbered.reduce((sum, q) => sum + q.points, 0),
    }));
  };

  const handleSave = () => {
    if (!formData.examCode.trim() || !formData.title.trim()) {
      showToast('Please enter Exam Code and Title');
      return;
    }
    if (formData.questions.length === 0) {
      showToast('Please add at least one question to the exam paper');
      return;
    }

    onSaveExam({
      ...formData,
      totalMarks: totalCalculatedPoints,
      updatedAt: new Date().toISOString().split('T')[0],
    });
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
              {isEditing ? 'Editing Technical Exam Paper' : 'Compose Technical Examination Paper'}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              {formData.title ? formData.title : 'Create QMS Examination Paper'}
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
            <span>{isEditing ? 'Save Changes' : 'Publish Exam Paper'}</span>
          </button>
        </div>
      </div>

      {/* METADATA HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Total Questions</span>
          <div className="font-bold text-slate-900 text-xl font-mono">
            {formData.questions.length} Items
          </div>
          <div className="text-[11px] text-slate-500">Theory, Practical &amp; Viva</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Total Marks</span>
          <div className="font-bold text-blue-700 text-xl font-mono">{totalCalculatedPoints} Points</div>
          <div className="text-[11px] text-blue-600 font-semibold">
            Passing: {formData.passingPercentage}% ({Math.round((totalCalculatedPoints * formData.passingPercentage) / 100)} Marks)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Duration</span>
          <div className="font-bold text-slate-900 text-xl font-mono">
            {formData.durationMinutes} Minutes
          </div>
          <div className="text-[11px] text-slate-500 font-mono">Standard Exam Time</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-slate-500 text-xs font-medium block">Author &amp; Sign-off</span>
          <div className="font-bold text-slate-900 text-sm truncate">{formData.createdBy}</div>
          <div className="text-[11px] text-emerald-700 font-semibold">ISO 9001 Clause 7.2 Aligned</div>
        </div>
      </div>

      {/* SECTION 1: EXAM SPECIFICATION & LOGISTICS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Exam Header Specifications
          </h2>
          <p className="text-xs text-slate-500">
            Define exam paper code, linked curriculum, and candidate instructions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Exam Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.examCode}
              onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
              placeholder="e.g. EXAM-NDL-01"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Exam Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 9-Point Broken Needle & Metal Detection Competency Examination"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Linked Course Code</label>
            <input
              type="text"
              value={formData.courseCode}
              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
              placeholder="e.g. TRN-NDL-01"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
            <input
              type="number"
              min="10"
              max="180"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) || 45 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Passing Mark (%)</label>
            <input
              type="number"
              min="50"
              max="100"
              value={formData.passingPercentage}
              onChange={(e) => setFormData({ ...formData, passingPercentage: Number(e.target.value) || 80 })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-blue-700"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block font-semibold text-slate-700 mb-1">
              Instructions for Candidates
            </label>
            <textarea
              rows={2}
              value={formData.instructions || ''}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: QUESTION BUILDER */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Add New Examination Question
          </h2>
          <p className="text-xs text-slate-500">
            Compose Multiple Choice, True/False, Practical Skill Check, or Oral Viva questions.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Question Statement</label>
              <input
                type="text"
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="Enter technical question text..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Question Type</label>
              <select
                value={qType}
                onChange={(e) => setQType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Points / Marks</label>
              <input
                type="number"
                min="5"
                max="100"
                value={qPoints}
                onChange={(e) => setQPoints(Number(e.target.value) || 10)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">
                Auditor Evaluation Criteria
              </label>
              <input
                type="text"
                value={qCriteria}
                onChange={(e) => setQCriteria(e.target.value)}
                placeholder="e.g. Accurate reading of 4-point calculation table"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* MCQ Options if MCQ */}
          {qType === 'MCQ' && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-700 block">Multiple Choice Options:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  placeholder="Option A"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  placeholder="Option B"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  placeholder="Option C"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="text"
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  placeholder="Option D"
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="font-semibold text-slate-700">Correct Answer Key:</span>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question to Paper</span>
            </button>
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Questions in this Paper ({formData.questions.length}):
          </span>

          {formData.questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{q.questionText}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        {q.type}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">
                        {q.points} Points
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                  title="Remove Question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Options */}
              {q.options && q.options.length > 0 && (
                <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700"
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {q.correctAnswer && (
                <div className="pl-8 text-[11px] text-emerald-700 font-mono font-bold">
                  Answer Key: {q.correctAnswer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
