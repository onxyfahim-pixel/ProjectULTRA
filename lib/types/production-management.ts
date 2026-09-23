export interface ProductionUnit {
  id: string;
  name: string;
  unitCode: string;
  location: string;
  managerName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  createdAt?: string;
}

export interface ProductionSection {
  id: string;
  name: string;
  sectionCode: string;
  unitId: string;
  unitName: string;
  inchargeName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  createdAt?: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  lineCode: string;
  unitId: string;
  unitName: string;
  sectionId: string;
  sectionName: string;
  lineChief: string; // Line Chief / Supervisor / Incharge
  qualityController: string; // Quality Controller / QC Auditor / Inspector
  targetCapacityPerHour?: number;
  operatorCount?: number;
  machineCount?: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  remarks?: string;
  createdAt?: string;
}
