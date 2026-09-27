export interface OperationBulletinItem {
  id: string;
  seqNumber: number;
  operationName: string;
  section: 'PREPARATION' | 'ASSEMBLY' | 'FINISHING';
  machineType: string;
  machineCode: string;
  smv: number; // Standard Minute Value
  theoreticalOperators: number;
  allocatedOperators: number;
  cycleTimeSec: number;
  pitchTimeSec: number;
  isBottleneck?: boolean;
  remarks?: string;
}

export interface StyleOperationBulletin {
  id: string;
  styleNumber: string;
  styleDescription: string;
  buyerName: string;
  garmentType: 'T-Shirt' | 'Polo Shirt' | 'Denim Jeans' | 'Jacket' | 'Hoodie';
  totalSmv: number;
  targetLineOperators: number;
  linePitchTimeSec: number;
  targetEfficiency: number;
  plannedDailyOutput: number;
  balancingEfficiency: number; // %
  operations: OperationBulletinItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductionPlanSchedule {
  id: string;
  lineId: string;
  lineName: string;
  orderNumber: string;
  buyerName: string;
  styleNumber: string;
  styleDescription: string;
  orderQuantity: number;
  smv: number;
  allocatedOperators: number;
  plannedDailyTarget: number;
  startDate: string;
  endDate: string;
  daysRequired: number;
  status: 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'DELAYED';
  learningCurveRampUp: {
    day1Percent: number; // e.g. 40
    day2Percent: number; // e.g. 65
    day3Percent: number; // e.g. 85
    day4PlusPercent: number; // e.g. 100
  };
  notes?: string;
}

export interface TimeMotionStudy {
  id: string;
  studyCode: string;
  date: string;
  lineName: string;
  operatorName: string;
  operatorId: string;
  operationName: string;
  machineType: string;
  cycleTimesSec: [number, number, number, number, number]; // 5 cycles
  avgCycleTimeSec: number;
  performanceRatingPercent: number; // e.g. 105%
  basicTimeSec: number;
  allowancePercent: number; // e.g. 15% (Fatigue, Personal, Machine delay)
  standardMinuteValue: number; // Calculated SMV in minutes
  status: 'VERIFIED' | 'NEEDS_TRAINING' | 'BENCHMARK_EXCEEDED';
  studiedBy: string;
}
