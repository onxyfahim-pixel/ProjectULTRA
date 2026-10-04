'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  Clock,
  Gauge,
  Sliders,
  DollarSign,
  Download,
  Plus,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { KaizenImprovementRecord } from '@/lib/types/planning-ie';

interface CalculatorsKaizenTabProps {
  kaizenRecords: KaizenImprovementRecord[];
  onAddKaizen: (rec: KaizenImprovementRecord) => void;
  onExportCsv: (filename: string, rows: any[]) => void;
}

type TabType = 'calculators' | 'kaizen';

export function CalculatorsKaizenTab({
  kaizenRecords,
  onAddKaizen,
  onExportCsv,
}: CalculatorsKaizenTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('calculators');
  const [selectedCalc, setSelectedCalc] = useState<
    | 'smv'
    | 'target'
    | 'efficiency'
    | 'capacity'
    | 'manpower'
    | 'balancing'
    | 'productivity'
    | 'takt'
    | 'machine_req'
  >('target');

  // Calculator States
  // 1. Target Calculator
  const [tgtSmv, setTgtSmv] = useState<number>(18.5);
  const [tgtHours, setTgtHours] = useState<number>(8);
  const [tgtOps, setTgtOps] = useState<number>(48);
  const [tgtEff, setTgtEff] = useState<number>(85);

  const calcTarget = useMemo(() => {
    const hourlyPace = tgtSmv > 0 ? Math.round(((tgtOps * 60) / tgtSmv) * (tgtEff / 100)) : 0;
    const dailyTarget = hourlyPace * tgtHours;
    return { hourlyPace, dailyTarget };
  }, [tgtSmv, tgtHours, tgtOps, tgtEff]);

  // 2. SMV Calculator
  const [basicTimeSec, setBasicTimeSec] = useState<number>(24.0);
  const [ratingPercent, setRatingPercent] = useState<number>(105);
  const [allowancePercent, setAllowancePercent] = useState<number>(14);

  const calcSmvResult = useMemo(() => {
    const normalTime = basicTimeSec * (ratingPercent / 100);
    const standardTime = normalTime * (1 + allowancePercent / 100);
    const smv = Math.round((standardTime / 60) * 100) / 100;
    const sam = Math.round(smv * 1.12 * 100) / 100;
    return { normalTime: Math.round(normalTime * 10) / 10, standardTime: Math.round(standardTime * 10) / 10, smv, sam };
  }, [basicTimeSec, ratingPercent, allowancePercent]);

  // 3. Efficiency Calculator
  const [effProducedQty, setEffProducedQty] = useState<number>(1800);
  const [effGarmentSmv, setEffGarmentSmv] = useState<number>(11.2);
  const [effOperators, setEffOperators] = useState<number>(28);
  const [effWorkHours, setEffWorkHours] = useState<number>(8);

  const calcEfficiencyResult = useMemo(() => {
    const standardMinProduced = effProducedQty * effGarmentSmv;
    const availableMin = effOperators * effWorkHours * 60;
    const efficiency = availableMin > 0 ? Math.round((standardMinProduced / availableMin) * 1000) / 10 : 0;
    return { standardMinProduced, availableMin, efficiency };
  }, [effProducedQty, effGarmentSmv, effOperators, effWorkHours]);

  // 4. Capacity Calculator
  const [capOperators, setCapOperators] = useState<number>(120);
  const [capWorkingDays, setCapWorkingDays] = useState<number>(26);
  const [capOrderSmv, setCapOrderSmv] = useState<number>(15.0);
  const [capFactoryEff, setCapFactoryEff] = useState<number>(80);

  const calcCapacityResult = useMemo(() => {
    const totalAvailMin = capOperators * capWorkingDays * 480;
    const capacityPcs = capOrderSmv > 0
      ? Math.round(((totalAvailMin * (capFactoryEff / 100)) / capOrderSmv))
      : 0;
    return { totalAvailMin, capacityPcs };
  }, [capOperators, capWorkingDays, capOrderSmv, capFactoryEff]);

  // 5. Takt Time Calculator
  const [taktDemand, setTaktDemand] = useState<number>(1400);
  const [taktWorkHours, setTaktWorkHours] = useState<number>(8);

  const calcTaktResult = useMemo(() => {
    const totalWorkSec = taktWorkHours * 3600;
    const taktTimeSec = taktDemand > 0 ? Math.round((totalWorkSec / taktDemand) * 10) / 10 : 0;
    return { totalWorkSec, taktTimeSec };
  }, [taktDemand, taktWorkHours]);

  // Modal for new Kaizen
  const [isKaizenModalOpen, setIsKaizenModalOpen] = useState(false);
  const [kzTitle, setKzTitle] = useState('');
  const [kzLine, setKzLine] = useState('Sewing Line 01');
  const [kzStyle, setKzStyle] = useState('STY-TS-2026');
  const [kzBeforeSmv, setKzBeforeSmv] = useState(12.0);
  const [kzAfterSmv, setKzAfterSmv] = useState(11.0);
  const [kzSavings, setKzSavings] = useState(5000);
  const [kzChampion, setKzChampion] = useState('Kamal Hossain (IE Executive)');

  const handleSaveKaizen = (e: React.FormEvent) => {
    e.preventDefault();
    const newKz: KaizenImprovementRecord = {
      id: `kz-${Date.now()}`,
      kaizenNumber: `KZ-2026-${String(kaizenRecords.length + 6).padStart(3, '0')}`,
      title: kzTitle,
      category: 'SMV_REDUCTION',
      lineName: kzLine,
      style: kzStyle,
      department: 'SEWING',
      beforeSmv: kzBeforeSmv,
      afterSmv: kzAfterSmv,
      beforeManpower: 30,
      afterManpower: 28,
      beforeEfficiency: 78,
      afterEfficiency: 84,
      beforeOutput: 1600,
      afterOutput: 1800,
      estimatedCostSavings: kzSavings,
      champion: kzChampion,
      status: 'IMPLEMENTED',
      date: new Date().toISOString().split('T')[0],
    };
    onAddKaizen(newKz);
    setIsKaizenModalOpen(false);
    setKzTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('calculators')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'calculators'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>34. IE Engineering Calculators (11 Tools)</span>
          </button>
          <button
            onClick={() => setActiveTab('kaizen')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'kaizen'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>35. IE Improvement &amp; Kaizen Register ({kaizenRecords.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'kaizen' && (
            <button
              onClick={() => setIsKaizenModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Kaizen Initiative</span>
            </button>
          )}
          <button
            onClick={() => onExportCsv('IE_Kaizen_Improvements.csv', kaizenRecords)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: IE CALCULATORS SUITE */}
      {activeTab === 'calculators' && (
        <div className="space-y-6">
          {/* Calculator Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/80 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setSelectedCalc('target')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedCalc === 'target' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Target Calculator
            </button>
            <button
              onClick={() => setSelectedCalc('smv')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedCalc === 'smv' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SAM / SMV Calculator
            </button>
            <button
              onClick={() => setSelectedCalc('efficiency')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedCalc === 'efficiency' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Efficiency Calculator
            </button>
            <button
              onClick={() => setSelectedCalc('capacity')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedCalc === 'capacity' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Capacity Calculator
            </button>
            <button
              onClick={() => setSelectedCalc('takt')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                selectedCalc === 'takt' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Takt Time Calculator
            </button>
          </div>

          {/* 1. TARGET CALCULATOR */}
          {selectedCalc === 'target' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Line Output &amp; Target Setting Calculator</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculate realistic hourly pace and daily target based on garment SMV, operator headcount, and target line efficiency.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 flex justify-between">
                      <span>Total Garment SMV (min):</span>
                      <strong className="font-mono text-blue-700">{tgtSmv} min</strong>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="0.5"
                      value={tgtSmv}
                      onChange={(e) => setTgtSmv(Number(e.target.value))}
                      className="w-full mt-2 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 flex justify-between">
                      <span>Allocated Operators:</span>
                      <strong className="font-mono text-blue-700">{tgtOps} Operators</strong>
                    </label>
                    <input
                      type="range"
                      min="15"
                      max="80"
                      value={tgtOps}
                      onChange={(e) => setTgtOps(Number(e.target.value))}
                      className="w-full mt-2 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 flex justify-between">
                      <span>Target Efficiency %:</span>
                      <strong className="font-mono text-blue-700">{tgtEff}%</strong>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={tgtEff}
                      onChange={(e) => setTgtEff(Number(e.target.value))}
                      className="w-full mt-2 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 flex justify-between">
                      <span>Working Hours / Shift:</span>
                      <strong className="font-mono text-blue-700">{tgtHours} Hours</strong>
                    </label>
                    <input
                      type="range"
                      min="4"
                      max="10"
                      value={tgtHours}
                      onChange={(e) => setTgtHours(Number(e.target.value))}
                      className="w-full mt-2 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Outputs Panel */}
                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-6 rounded-2xl border border-blue-200/80 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      Calculated Production Standards
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-white p-4 rounded-xl border border-blue-200/60 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Target / Hour</div>
                        <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
                          {calcTarget.hourlyPace} pcs/h
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Paced output rate</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-blue-200/60 shadow-2xs">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">Target / Day</div>
                        <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                          {calcTarget.dailyTarget.toLocaleString()} pcs
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{tgtHours}-hour standard shift</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-blue-200/60 text-xs text-slate-600">
                    <strong>IE Formulation:</strong> (Operators &times; 60 / SMV) &times; (Efficiency % / 100) = Hourly Pace.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SAM / SMV CALCULATOR */}
          {selectedCalc === 'smv' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Standard Minute Value (SMV) &amp; SAM Calculator</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Converts observed cycle stopwatch times to Basic, Normal, and Standard Minute Values using Rating &amp; Allowances.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">Observed Stopwatch Cycle Time (sec):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={basicTimeSec}
                      onChange={(e) => setBasicTimeSec(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Operator Performance Rating (60% - 130%):</label>
                    <input
                      type="number"
                      value={ratingPercent}
                      onChange={(e) => setRatingPercent(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Total Allowance % (Fatigue + Personal + Delay):</label>
                    <input
                      type="number"
                      value={allowancePercent}
                      onChange={(e) => setAllowancePercent(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-6 rounded-2xl border border-emerald-200/80 flex flex-col justify-between space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-emerald-200/60 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Calculated SMV</div>
                      <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                        {calcSmvResult.smv} min
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Std Time: {calcSmvResult.standardTime}s</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-emerald-200/60 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Calculated SAM</div>
                      <div className="text-2xl font-bold font-mono text-teal-700 mt-1">
                        {calcSmvResult.sam} min
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Incl. 12% contingency</div>
                    </div>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-emerald-200/60 text-xs text-slate-600">
                    Normal Time = {calcSmvResult.normalTime}s &bull; Standard Time = {calcSmvResult.standardTime}s
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. EFFICIENCY CALCULATOR */}
          {selectedCalc === 'efficiency' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Line &amp; Factory Efficiency Calculator</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculate exact production efficiency % from produced garment count and total available working minutes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">Actual Produced Pieces:</label>
                    <input
                      type="number"
                      value={effProducedQty}
                      onChange={(e) => setEffProducedQty(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Garment Total SMV (minutes):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={effGarmentSmv}
                      onChange={(e) => setEffGarmentSmv(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Operator Count on Line:</label>
                    <input
                      type="number"
                      value={effOperators}
                      onChange={(e) => setEffOperators(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 p-6 rounded-2xl border border-indigo-200/80 flex flex-col justify-between space-y-4">
                  <div className="bg-white p-6 rounded-xl border border-indigo-200/60 shadow-2xs text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Calculated Efficiency</div>
                    <div className="text-4xl font-bold font-mono text-indigo-700 mt-1">
                      {calcEfficiencyResult.efficiency}%
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-mono">
                      Std Produced: {calcEfficiencyResult.standardMinProduced.toLocaleString()}m / Available: {calcEfficiencyResult.availableMin.toLocaleString()}m
                    </div>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-indigo-200/60 text-xs text-slate-600">
                    Formula: (Produced Pieces &times; Garment SMV) / (Operators &times; Working Hours &times; 60) &times; 100
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. CAPACITY CALCULATOR */}
          {selectedCalc === 'capacity' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Monthly Factory Capacity Forecaster</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Determine factory order booking capacity in units based on available operator minutes and expected plant efficiency.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">Total Sewing Operators:</label>
                    <input
                      type="number"
                      value={capOperators}
                      onChange={(e) => setCapOperators(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Working Days in Month:</label>
                    <input
                      type="number"
                      value={capWorkingDays}
                      onChange={(e) => setCapWorkingDays(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Average Order Style SMV:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={capOrderSmv}
                      onChange={(e) => setCapOrderSmv(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Planned Factory Efficiency %:</label>
                    <input
                      type="number"
                      value={capFactoryEff}
                      onChange={(e) => setCapFactoryEff(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-6 rounded-2xl border border-amber-200/80 flex flex-col justify-between space-y-4">
                  <div className="bg-white p-6 rounded-xl border border-amber-200/60 shadow-2xs text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Bookable Monthly Capacity</div>
                    <div className="text-3xl font-bold font-mono text-amber-800 mt-1">
                      {calcCapacityResult.capacityPcs.toLocaleString()} pcs
                    </div>
                    <div className="text-xs text-slate-500 mt-2 font-mono">
                      Total Available: {calcCapacityResult.totalAvailMin.toLocaleString()} minutes
                    </div>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-xs text-slate-600">
                    Formula: (Available Minutes &times; Efficiency %) / Style SMV = Bookable Garment Pieces.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. TAKT TIME CALCULATOR */}
          {selectedCalc === 'takt' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Takt Time &amp; Pitch Pace Calculator</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Takt Time = Available Operating Seconds / Customer Demand Pcs per Shift.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700">Daily Demand (Target Pcs):</label>
                    <input
                      type="number"
                      value={taktDemand}
                      onChange={(e) => setTaktDemand(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Shift Working Hours (Net):</label>
                    <input
                      type="number"
                      value={taktWorkHours}
                      onChange={(e) => setTaktWorkHours(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50/80 to-sky-50/80 p-6 rounded-2xl border border-blue-200/80 flex flex-col justify-between space-y-4">
                  <div className="bg-white p-6 rounded-xl border border-blue-200/60 shadow-2xs text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Calculated Takt Time</div>
                    <div className="text-4xl font-bold font-mono text-blue-700 mt-1">
                      {calcTaktResult.taktTimeSec} seconds
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      1 finished garment must exit the line every {calcTaktResult.taktTimeSec} seconds to meet shipment pace.
                    </div>
                  </div>
                  <div className="p-3 bg-white/80 rounded-xl border border-blue-200/60 text-xs text-slate-600">
                    Net Working Seconds: {calcTaktResult.totalWorkSec.toLocaleString()}s / {taktDemand} pcs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: KAIZEN & CONTINUOUS IMPROVEMENT */}
      {activeTab === 'kaizen' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kaizenRecords.map((kz) => (
              <div key={kz.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-bold text-blue-700">{kz.kaizenNumber}</span> &bull;{' '}
                    <span className="font-bold text-slate-900">{kz.title}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {kz.status}
                  </span>
                </div>

                <div className="text-slate-600">
                  Line: <strong className="text-slate-800">{kz.lineName}</strong> &bull; Style: <strong className="text-slate-800">{kz.style}</strong> &bull; Champion: <strong>{kz.champion}</strong>
                </div>

                {/* Before vs After Comparison Grid */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100 space-y-1">
                    <div className="font-bold text-rose-800 uppercase text-[10px]">Before Kaizen</div>
                    <div className="space-y-0.5 font-mono text-[11px] text-slate-700">
                      <div>SMV: <strong>{kz.beforeSmv} min</strong></div>
                      <div>Manpower: <strong>{kz.beforeManpower} Ops</strong></div>
                      <div>Efficiency: <strong>{kz.beforeEfficiency}%</strong></div>
                      <div>Output: <strong>{kz.beforeOutput} pcs/d</strong></div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1">
                    <div className="font-bold text-emerald-800 uppercase text-[10px]">After Kaizen</div>
                    <div className="space-y-0.5 font-mono text-[11px] text-slate-700">
                      <div>SMV: <strong className="text-emerald-700">{kz.afterSmv} min</strong></div>
                      <div>Manpower: <strong className="text-emerald-700">{kz.afterManpower} Ops</strong></div>
                      <div>Efficiency: <strong className="text-emerald-700">{kz.afterEfficiency}%</strong></div>
                      <div>Output: <strong className="text-emerald-700">{kz.afterOutput} pcs/d</strong></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 font-mono">Date: {kz.date}</span>
                  <div className="text-sm font-bold text-emerald-700 font-mono">
                    Estimated Annual Saving: ${kz.estimatedCostSavings.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Register Kaizen Modal */}
      {isKaizenModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Register New Kaizen Improvement</h3>
              <button
                onClick={() => setIsKaizenModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveKaizen} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Kaizen Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Automated tape cutting folder jig"
                  value={kzTitle}
                  onChange={(e) => setKzTitle(e.target.value)}
                  className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Line Name</label>
                  <input
                    type="text"
                    value={kzLine}
                    onChange={(e) => setKzLine(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Style</label>
                  <input
                    type="text"
                    value={kzStyle}
                    onChange={(e) => setKzStyle(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Before SMV (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kzBeforeSmv}
                    onChange={(e) => setKzBeforeSmv(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">After SMV (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={kzAfterSmv}
                    onChange={(e) => setKzAfterSmv(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-emerald-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Est. Cost Savings ($ USD)</label>
                  <input
                    type="number"
                    value={kzSavings}
                    onChange={(e) => setKzSavings(Number(e.target.value))}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200 font-mono text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Champion Name</label>
                  <input
                    type="text"
                    value={kzChampion}
                    onChange={(e) => setKzChampion(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsKaizenModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Save Kaizen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
