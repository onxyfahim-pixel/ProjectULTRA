'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Zap,
  Info,
} from 'lucide-react';
import { RiskSectionType, RiskSectionItem } from '@/lib/types/modules';
import {
  RISK_SECTIONS,
  RISK_SECTION_PRESETS,
  RiskSectionPreset,
  RISK_SECTION_ORDER,
} from './riskAssessmentSections';
import { computeRpn, getRiskLevel, getRiskLevelBadge } from './riskAssessmentData';

interface RiskSectionPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection?: RiskSectionType;
  existingRisks: RiskSectionItem[];
  onAddPreset: (preset: RiskSectionPreset) => void;
}

export function RiskSectionPresetModal({
  isOpen,
  onClose,
  activeSection = 'RAW_MATERIAL',
  existingRisks,
  onAddPreset,
}: RiskSectionPresetModalProps) {
  const [selectedSection, setSelectedSection] = useState<RiskSectionType | 'ALL'>(activeSection);
  const [searchQuery, setSearchQuery] = useState('');

  // Update selectedSection if activeSection changes
  React.useEffect(() => {
    if (activeSection) {
      setSelectedSection(activeSection);
    }
  }, [activeSection]);

  const filteredPresets = useMemo(() => {
    return RISK_SECTION_PRESETS.filter((preset) => {
      if (selectedSection !== 'ALL' && preset.section !== selectedSection) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesMode = preset.potentialFailureMode.toLowerCase().includes(q);
        const matchesStep = preset.processStep.toLowerCase().includes(q);
        const matchesEffect = preset.potentialEffect.toLowerCase().includes(q);
        const matchesMitigation = preset.mitigationAction.toLowerCase().includes(q);
        if (!matchesMode && !matchesStep && !matchesEffect && !matchesMitigation) {
          return false;
        }
      }
      return true;
    });
  }, [selectedSection, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Garment Risk Library &amp; Section Presets
              </h3>
              <p className="text-xs text-slate-500">
                Select industry-standard FMEA failure modes for Raw Material, Embellishment, Testing &amp; Legal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Tabs & Search */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search failure modes (e.g., fabric shrinkage, print cracking, 90N pull test, care label)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Section Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSection('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSection === 'ALL'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Sections ({RISK_SECTION_PRESETS.length})
            </button>
            {RISK_SECTION_ORDER.map((secKey) => {
              const meta = RISK_SECTIONS[secKey];
              const count = RISK_SECTION_PRESETS.filter((p) => p.section === secKey).length;
              if (count === 0) return null;
              const isSelected = selectedSection === secKey;

              return (
                <button
                  key={secKey}
                  type="button"
                  onClick={() => setSelectedSection(secKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeText} border-2 ${meta.borderColor} shadow-2xs`
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{meta.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-white/80' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Preset Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-h-[58vh]">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">No preset matches search</h4>
              <p className="text-xs text-slate-400">Try changing keywords or clearing the filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPresets.map((preset) => {
                const secMeta = RISK_SECTIONS[preset.section] || RISK_SECTIONS.OTHER;
                const rpn = computeRpn(preset.severity, preset.occurrence, preset.detection);
                const level = getRiskLevel(rpn, preset.severity);
                const levelBadge = getRiskLevelBadge(level);

                const alreadyAdded = existingRisks.some(
                  (r) =>
                    r.potentialFailureMode?.trim().toLowerCase() ===
                    preset.potentialFailureMode.trim().toLowerCase()
                );

                return (
                  <div
                    key={preset.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4.5 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 text-left"
                  >
                    <div className="space-y-2">
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${secMeta.badgeBg} ${secMeta.badgeText} ${secMeta.borderColor}`}
                        >
                          {secMeta.label.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${levelBadge.badgeClass}`}
                          >
                            RPN {rpn}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            S{preset.severity}·O{preset.occurrence}·D{preset.detection}
                          </span>
                        </div>
                      </div>

                      {/* Process Step */}
                      <div className="text-[11px] font-mono text-slate-500 font-semibold truncate">
                        {preset.processStep}
                      </div>

                      {/* Failure Mode Title */}
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {preset.potentialFailureMode}
                      </h4>

                      {/* Potential Effect */}
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        <strong className="text-slate-700">Effect:</strong> {preset.potentialEffect}
                      </p>

                      {/* Mitigation Action Preview */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700 line-clamp-2 leading-snug">
                        <strong className="text-indigo-900">Mitigation:</strong>{' '}
                        {preset.mitigationAction}
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 truncate max-w-[170px]">
                        Lead: {preset.responsibleLead}
                      </span>

                      <button
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          onAddPreset(preset);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          alreadyAdded
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                        }`}
                      >
                        {alreadyAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Risk</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 text-xs">
          <span className="text-slate-500">
            Showing <strong className="text-slate-800">{filteredPresets.length}</strong> standard apparel risk presets
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
