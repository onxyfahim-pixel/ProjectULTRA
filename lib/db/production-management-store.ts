import { ProductionUnit, ProductionSection, ProductionLine } from '@/lib/types/production-management';

export const INITIAL_PRODUCTION_UNITS: ProductionUnit[] = [
  {
    id: 'unit-01',
    name: 'Unit 01 (Dhaka Complex)',
    unitCode: 'UNIT-01',
    location: 'Tongi Industrial Area, Gazipur, Dhaka',
    managerName: 'Engr. M. A. Hasan',
    status: 'ACTIVE',
    description: 'Main manufacturing facility for high-volume knit and denim production.',
    createdAt: '2026-01-10',
  },
  {
    id: 'unit-02',
    name: 'Unit 02 (Chittagong SEZ)',
    unitCode: 'UNIT-02',
    location: 'Chittagong Export Processing Zone',
    managerName: 'K. M. Tareq',
    status: 'ACTIVE',
    description: 'Special Economic Zone plant dedicated to woven bottoms and activewear.',
    createdAt: '2026-02-15',
  },
  {
    id: 'unit-03',
    name: 'Unit 03 (Ashulia Modern Plant)',
    unitCode: 'UNIT-03',
    location: 'Ashulia, Savar, Dhaka',
    managerName: 'Farhan Chowdhury',
    status: 'ACTIVE',
    description: 'Specialized plant for premium fleece, sweaters, and jacquard knits.',
    createdAt: '2026-03-01',
  },
  {
    id: 'unit-04',
    name: 'Unit 04 (Gazipur Export Zone)',
    unitCode: 'UNIT-04',
    location: 'Kashimpur, Gazipur',
    managerName: 'Nazmul Huq',
    status: 'ACTIVE',
    description: 'Modern eco-friendly LEED Platinum certified woven garment facility.',
    createdAt: '2026-04-12',
  },
];

export const INITIAL_PRODUCTION_SECTIONS: ProductionSection[] = [
  {
    id: 'sec-01',
    name: 'Sewing Floor',
    sectionCode: 'SEC-SEW',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    inchargeName: 'Kabir Hossain',
    status: 'ACTIVE',
    description: 'Primary sewing assembly floor featuring high-speed lockstitch & overlock lines.',
    createdAt: '2026-01-10',
  },
  {
    id: 'sec-02',
    name: 'Cutting Floor',
    sectionCode: 'SEC-CUT',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    inchargeName: 'Monir Hossain',
    status: 'ACTIVE',
    description: 'Automated spreading tables, Gerber CNC computerized cutters, and bundling stations.',
    createdAt: '2026-01-10',
  },
  {
    id: 'sec-03',
    name: 'Finishing & Packing',
    sectionCode: 'SEC-FIN',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    inchargeName: 'Golam Rabbani',
    status: 'ACTIVE',
    description: 'Thread trimming, steam tunnel pressing, needle detectors, and carton packaging.',
    createdAt: '2026-01-10',
  },
  {
    id: 'sec-04',
    name: 'Industrial Washing',
    sectionCode: 'SEC-WASH',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    inchargeName: 'Shah Alam',
    status: 'ACTIVE',
    description: 'Enzyme wash, stone wash, laser whisker patterning, and ozone eco-bleaching.',
    createdAt: '2026-01-10',
  },
  {
    id: 'sec-05',
    name: 'Quality Assurance (AQL)',
    sectionCode: 'SEC-QA',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    inchargeName: 'Md. Rafiqul Islam',
    status: 'ACTIVE',
    description: 'AQL 1.5/2.5 pre-final & final audit room, shade checking & measurement calibration.',
    createdAt: '2026-01-10',
  },
  {
    id: 'sec-06',
    name: 'Sewing Floor',
    sectionCode: 'SEC-SEW-02',
    unitId: 'unit-02',
    unitName: 'Unit 02 (Chittagong SEZ)',
    inchargeName: 'Delowar Hossain',
    status: 'ACTIVE',
    description: 'Specialized sewing assembly for outerwear and active fleece.',
    createdAt: '2026-02-15',
  },
  {
    id: 'sec-07',
    name: 'Cutting Floor',
    sectionCode: 'SEC-CUT-02',
    unitId: 'unit-02',
    unitName: 'Unit 02 (Chittagong SEZ)',
    inchargeName: 'Tariqul Islam',
    status: 'ACTIVE',
    description: 'Automated spreading and precision knife cutting facility.',
    createdAt: '2026-02-15',
  },
  {
    id: 'sec-08',
    name: 'Finishing & Packing',
    sectionCode: 'SEC-FIN-02',
    unitId: 'unit-02',
    unitName: 'Unit 02 (Chittagong SEZ)',
    inchargeName: 'Anisur Rahman',
    status: 'ACTIVE',
    description: 'Steam pressing, needle inspection and export packing facility.',
    createdAt: '2026-02-15',
  },
  {
    id: 'sec-09',
    name: 'Sewing Floor',
    sectionCode: 'SEC-SEW-03',
    unitId: 'unit-03',
    unitName: 'Unit 03 (Ashulia Modern Plant)',
    inchargeName: 'Shahadat Hossain',
    status: 'ACTIVE',
    description: 'High-speed assembly for premium modal knits and activewear.',
    createdAt: '2026-03-01',
  },
  {
    id: 'sec-10',
    name: 'Finishing & Packing',
    sectionCode: 'SEC-FIN-03',
    unitId: 'unit-03',
    unitName: 'Unit 03 (Ashulia Modern Plant)',
    inchargeName: 'Rezaul Karim',
    status: 'ACTIVE',
    description: 'Quality finishing and branded retail carton packing.',
    createdAt: '2026-03-01',
  },
  {
    id: 'sec-11',
    name: 'Sewing Floor',
    sectionCode: 'SEC-SEW-04',
    unitId: 'unit-04',
    unitName: 'Unit 04 (Gazipur Export Zone)',
    inchargeName: 'Nazmul Huq',
    status: 'ACTIVE',
    description: 'LEED platinum sewing facility for export woven lines.',
    createdAt: '2026-04-12',
  },
  {
    id: 'sec-12',
    name: 'Finishing & Packing',
    sectionCode: 'SEC-FIN-04',
    unitId: 'unit-04',
    unitName: 'Unit 04 (Gazipur Export Zone)',
    inchargeName: 'Farhad Ahmed',
    status: 'ACTIVE',
    description: 'Eco steam tunnel and final retail packaging lines.',
    createdAt: '2026-04-12',
  },
];

export const INITIAL_PRODUCTION_LINES: ProductionLine[] = [
  {
    id: 'line-01',
    name: 'Sewing Line 01 (Knit Tops)',
    lineCode: 'L-01',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-01',
    sectionName: 'Sewing Floor',
    lineChief: 'Kabir Hossain',
    qualityController: 'Md. Rafiqul Islam',
    targetCapacityPerHour: 160,
    operatorCount: 48,
    machineCount: 52,
    status: 'ACTIVE',
    remarks: 'Dedicated to Zara and H&M knit tees.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-02',
    name: 'Sewing Line 02 (Knit Polo & Fleece)',
    lineCode: 'L-02',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-01',
    sectionName: 'Sewing Floor',
    lineChief: 'Jahangir Alam',
    qualityController: 'Mizanur Rahman',
    targetCapacityPerHour: 140,
    operatorCount: 52,
    machineCount: 56,
    status: 'ACTIVE',
    remarks: 'Polo collar placket & rib cuff assembly.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-03',
    name: 'Sewing Line 03 (Woven Bottoms)',
    lineCode: 'L-03',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-01',
    sectionName: 'Sewing Floor',
    lineChief: 'Abul Kashem',
    qualityController: 'Nasir Uddin',
    targetCapacityPerHour: 130,
    operatorCount: 54,
    machineCount: 58,
    status: 'ACTIVE',
    remarks: 'Chino pants and twill shorts assembly.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-04',
    name: 'Sewing Line 04 (Heavy Denim)',
    lineCode: 'L-04',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-01',
    sectionName: 'Sewing Floor',
    lineChief: 'Shahidul Islam',
    qualityController: 'Kamal Ahmed',
    targetCapacityPerHour: 120,
    operatorCount: 50,
    machineCount: 54,
    status: 'ACTIVE',
    remarks: 'Heavyweight 12-14oz denim felling & waistband.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-05',
    name: 'Sewing Line 05 (Precision Knit)',
    lineCode: 'L-05',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-01',
    sectionName: 'Sewing Floor',
    lineChief: 'Faruk Ahmed',
    qualityController: 'Tanvir Hasan',
    targetCapacityPerHour: 170,
    operatorCount: 44,
    machineCount: 48,
    status: 'ACTIVE',
    remarks: 'Nike and Adidas seamless performance wear.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-06',
    name: 'Sewing Line 06 (Fleece Assembly)',
    lineCode: 'L-06',
    unitId: 'unit-02',
    unitName: 'Unit 02 (Chittagong SEZ)',
    sectionId: 'sec-06',
    sectionName: 'Sewing Floor',
    lineChief: 'Delowar Hossain',
    qualityController: 'Rokonuzzaman',
    targetCapacityPerHour: 140,
    operatorCount: 46,
    machineCount: 50,
    status: 'ACTIVE',
    remarks: 'Specialized outerwear and softshell fleece.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-07',
    name: 'Sewing Line 07 (Cargo & Utility)',
    lineCode: 'L-07',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-01',
    sectionName: 'Sewing Floor',
    lineChief: 'Kamrul Hasan',
    qualityController: 'Mehedi Hasan',
    targetCapacityPerHour: 130,
    operatorCount: 52,
    machineCount: 56,
    status: 'ACTIVE',
    remarks: 'Multi-pocket cargo pants and utility jackets.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-08',
    name: 'Sewing Line 08 (Intimates & Activewear)',
    lineCode: 'L-08',
    unitId: 'unit-03',
    unitName: 'Unit 03 (Ashulia Modern Plant)',
    sectionId: 'sec-09',
    sectionName: 'Sewing Floor',
    lineChief: 'Shahadat Hossain',
    qualityController: 'Anisur Rahman',
    targetCapacityPerHour: 180,
    operatorCount: 44,
    machineCount: 48,
    status: 'ACTIVE',
    remarks: 'Micro-modal and elastane performance wear.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-09',
    name: 'Cutting Table 01 (Gerber CNC Auto-Cutter)',
    lineCode: 'CUT-01',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-02',
    sectionName: 'Cutting Floor',
    lineChief: 'Monir Hossain',
    qualityController: 'Harunur Rashid',
    targetCapacityPerHour: 500,
    operatorCount: 18,
    machineCount: 6,
    status: 'ACTIVE',
    remarks: 'Computerized spreading & band knife cutting.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-10',
    name: 'Cutting Table 02 (Manual Spreader & Band Knife)',
    lineCode: 'CUT-02',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-02',
    sectionName: 'Cutting Floor',
    lineChief: 'Selim Reza',
    qualityController: 'Biplob Hossain',
    targetCapacityPerHour: 450,
    operatorCount: 16,
    machineCount: 8,
    status: 'ACTIVE',
    remarks: 'Manual spreading tables and precision band knife.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-11',
    name: 'Finishing Line 01 (Steam Tunnel Pressing)',
    lineCode: 'FIN-01',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-03',
    sectionName: 'Finishing & Packing',
    lineChief: 'Golam Rabbani',
    qualityController: 'Zahirul Islam',
    targetCapacityPerHour: 220,
    operatorCount: 32,
    machineCount: 16,
    status: 'ACTIVE',
    remarks: 'Steam tunnel, hand ironing & metal detection.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-12',
    name: 'Finishing Line 02 (Thread Trimming & Ironing)',
    lineCode: 'FIN-02',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-03',
    sectionName: 'Finishing & Packing',
    lineChief: 'Moklesur Rahman',
    qualityController: 'Shakil Khan',
    targetCapacityPerHour: 200,
    operatorCount: 28,
    machineCount: 14,
    status: 'ACTIVE',
    remarks: 'Thread suction trimming stations and vacuum boards.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-13',
    name: 'Industrial Washing Bay 01 (Enzyme & Stone)',
    lineCode: 'WASH-01',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-04',
    sectionName: 'Industrial Washing',
    lineChief: 'Shah Alam',
    qualityController: 'Babul Akter',
    targetCapacityPerHour: 300,
    operatorCount: 22,
    machineCount: 12,
    status: 'ACTIVE',
    remarks: 'Hydro-extractors and industrial belly washers.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-14',
    name: 'Carton Boxing & Barcode Packing Line 01',
    lineCode: 'PACK-01',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-03',
    sectionName: 'Finishing & Packing',
    lineChief: 'Saiful Islam',
    qualityController: 'Ashikur Rahman',
    targetCapacityPerHour: 350,
    operatorCount: 24,
    machineCount: 10,
    status: 'ACTIVE',
    remarks: 'Automated carton taping and barcode verification.',
    createdAt: '2026-01-10',
  },
  {
    id: 'line-15',
    name: 'AQL Pre-Final & Final Audit Chamber 01',
    lineCode: 'QA-01',
    unitId: 'unit-01',
    unitName: 'Unit 01 (Dhaka Complex)',
    sectionId: 'sec-05',
    sectionName: 'Quality Assurance (QA)',
    lineChief: 'Md. Rafiqul Islam',
    qualityController: 'Senior QA Manager',
    targetCapacityPerHour: 150,
    operatorCount: 12,
    machineCount: 4,
    status: 'ACTIVE',
    remarks: 'Final carton audit and shade verification.',
    createdAt: '2026-01-10',
  },
];

const STORAGE_KEYS = {
  UNITS: 'erp_production_units_v1',
  SECTIONS: 'erp_production_sections_v1',
  LINES: 'erp_production_lines_v1',
};

// Dispatch custom event when management changes
function notifyManagementUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('erp_production_management_updated'));
  }
}

// -------------------------------------------------------------
// UNITS API
// -------------------------------------------------------------
export function getProductionUnits(): ProductionUnit[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTION_UNITS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNITS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(INITIAL_PRODUCTION_UNITS));
      return INITIAL_PRODUCTION_UNITS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTION_UNITS;
  } catch {
    return INITIAL_PRODUCTION_UNITS;
  }
}

export function saveProductionUnits(units: ProductionUnit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    localStorage.setItem('erp_module_production_units', JSON.stringify(units));
    notifyManagementUpdate();
    fetch('/api/modules/production_units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: units }),
    }).catch(() => { });
  } catch (err) {
    console.error('Failed to save production units to localStorage', err);
  }
}

// -------------------------------------------------------------
// SECTIONS API
// -------------------------------------------------------------
export function getProductionSections(): ProductionSection[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTION_SECTIONS;
  try {
    const raw = localStorage.getItem('erp_module_production_sections') || localStorage.getItem(STORAGE_KEYS.SECTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(INITIAL_PRODUCTION_SECTIONS));
      return INITIAL_PRODUCTION_SECTIONS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTION_SECTIONS;
  } catch {
    return INITIAL_PRODUCTION_SECTIONS;
  }
}

export function saveProductionSections(sections: ProductionSection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
    localStorage.setItem('erp_module_production_sections', JSON.stringify(sections));
    notifyManagementUpdate();
    fetch('/api/modules/production_sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: sections }),
    }).catch(() => { });
  } catch (err) {
    console.error('Failed to save production sections to localStorage', err);
  }
}

// -------------------------------------------------------------
// LINES API
// -------------------------------------------------------------
export function getProductionLines(): ProductionLine[] {
  if (typeof window === 'undefined') return INITIAL_PRODUCTION_LINES;
  try {
    const raw = localStorage.getItem('erp_module_production_lines') || localStorage.getItem(STORAGE_KEYS.LINES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LINES, JSON.stringify(INITIAL_PRODUCTION_LINES));
      return INITIAL_PRODUCTION_LINES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PRODUCTION_LINES;
  } catch {
    return INITIAL_PRODUCTION_LINES;
  }
}

export function saveProductionLines(lines: ProductionLine[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LINES, JSON.stringify(lines));
    localStorage.setItem('erp_module_production_lines', JSON.stringify(lines));
    notifyManagementUpdate();
    fetch('/api/modules/production_lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: lines }),
    }).catch(() => { });
  } catch (err) {
    console.error('Failed to save production lines to localStorage', err);
  }
}

// -------------------------------------------------------------
// CASCADE MANAGEMENT UPDATES TO PRODUCTION RECORDS
// -------------------------------------------------------------
export function cascadeManagementUpdateToRecords(
  type: 'line' | 'section' | 'unit',
  updatedItem: any,
  prevItem?: any
): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('erp_production_orders_v1');
    if (!raw) return;
    const orders: any[] = JSON.parse(raw);
    if (!Array.isArray(orders) || orders.length === 0) return;

    let hasChanges = false;
    const updatedOrders = orders.map((o) => {
      if (type === 'line') {
        const matchesLine =
          (prevItem && (o.lineId === prevItem.id || o.lineId === prevItem.lineCode || o.sewingLine === prevItem.name)) ||
          o.lineId === updatedItem.id ||
          o.lineId === updatedItem.lineCode ||
          o.sewingLine === updatedItem.name;

        if (matchesLine) {
          hasChanges = true;
          return {
            ...o,
            lineId: updatedItem.lineCode || updatedItem.id || o.lineId,
            sewingLine: updatedItem.name || o.sewingLine,
            unit: updatedItem.unitName || o.unit,
            section: updatedItem.sectionName || o.section,
            supervisorName: updatedItem.lineChief || o.supervisorName,
            qualityInspector: updatedItem.qualityController || o.qualityInspector,
          };
        }
      } else if (type === 'section') {
        const matchesSection =
          (prevItem && (o.section === prevItem.name || o.section === prevItem.sectionCode)) ||
          o.section === updatedItem.name;
        if (matchesSection) {
          hasChanges = true;
          return {
            ...o,
            section: updatedItem.name || o.section,
            unit: updatedItem.unitName || o.unit,
          };
        }
      } else if (type === 'unit') {
        const matchesUnit =
          (prevItem && (o.unit === prevItem.name || o.unit === prevItem.unitCode)) ||
          o.unit === updatedItem.name;
        if (matchesUnit) {
          hasChanges = true;
          return {
            ...o,
            unit: updatedItem.name || o.unit,
          };
        }
      }
      return o;
    });

    if (hasChanges) {
      localStorage.setItem('erp_production_orders_v1', JSON.stringify(updatedOrders));
      window.dispatchEvent(new CustomEvent('erp_production_records_updated'));
      window.dispatchEvent(new CustomEvent('erp_production_orders_updated'));
    }
  } catch (err) {
    console.error('Failed to cascade management update to records:', err);
  }
}

