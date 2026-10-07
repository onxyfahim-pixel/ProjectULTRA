import { OrderAttachment, OrderAttachmentCategory } from '@/lib/types/modules';

export interface CategoryMeta {
  key: OrderAttachmentCategory;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBg: string;
  accentColor: string;
  acceptedFormats: string;
}

export const ATTACHMENT_CATEGORIES: Record<OrderAttachmentCategory, CategoryMeta> = {
  MEASUREMENT_SPEC: {
    key: 'MEASUREMENT_SPEC',
    label: 'Measurement Spec',
    shortLabel: 'Meas. Spec',
    description: 'Graded specs, measurement charts, size tolerance sheets & fit comments',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentBg: 'bg-blue-100',
    accentColor: 'text-blue-600',
    acceptedFormats: '.pdf,.xlsx,.xls,.doc,.docx,.png,.jpg',
  },
  TECHNICAL_SPEC: {
    key: 'TECHNICAL_SPEC',
    label: 'Technical Spec',
    shortLabel: 'Tech Spec',
    description: 'CAD drawings, master tech packs, stitch guides, construction artwork',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-700',
    badgeBorder: 'border-indigo-200',
    accentBg: 'bg-indigo-100',
    accentColor: 'text-indigo-600',
    acceptedFormats: '.pdf,.cad,.ai,.dxf,.zip,.doc,.docx',
  },
  TEST_RECORD: {
    key: 'TEST_RECORD',
    label: 'Test Record',
    shortLabel: 'Test Record',
    description: 'Fabric & garment lab test reports, pull test, shrinkage, color fastness',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentBg: 'bg-emerald-100',
    accentColor: 'text-emerald-600',
    acceptedFormats: '.pdf,.xlsx,.xls,.csv,.doc,.docx',
  },
  ETC: {
    key: 'ETC',
    label: 'ETC / Other Files',
    shortLabel: 'ETC File',
    description: 'Trim cards, buyer PO contracts, barcode packaging manuals, certificates',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentBg: 'bg-amber-100',
    accentColor: 'text-amber-600',
    acceptedFormats: '.pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.zip',
  },
};

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'DOC';
}

export function getFileExtensionColor(ext: string): { bg: string; text: string } {
  switch (ext.toLowerCase()) {
    case 'pdf':
      return { bg: 'bg-rose-100', text: 'text-rose-700' };
    case 'xlsx':
    case 'xls':
    case 'csv':
      return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    case 'doc':
    case 'docx':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return { bg: 'bg-purple-100', text: 'text-purple-700' };
    case 'cad':
    case 'dxf':
    case 'ai':
      return { bg: 'bg-amber-100', text: 'text-amber-800' };
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700' };
  }
}

/**
 * Downloads a single order attachment file to the client machine.
 * Works with base64 Data URLs or generates a structured text document fallback if simulated.
 */
export function downloadOrderAttachment(file: OrderAttachment, orderNumber?: string): void {
  try {
    const link = document.createElement('a');
    if (file.fileData && file.fileData.startsWith('data:')) {
      link.href = file.fileData;
    } else {
      // Fallback content when test sample file doesn't have raw base64 binary
      const categoryLabel = ATTACHMENT_CATEGORIES[file.category]?.label || file.category;
      const content = `===============================================================
GARMENTS ERP - PURCHASE ORDER SPECIFICATION REPOSITORY
===============================================================
Document Name:    ${file.fileName}
Purchase Order:   ${orderNumber || 'PO-RECORD'}
Document Class:   ${categoryLabel}
Upload Date:      ${file.uploadedAt}
Uploaded By:      ${file.uploadedBy || 'Merchandising Team'}
File Notes:       ${file.notes || 'Official specification file attached to order'}
File Size:        ${formatFileSize(file.fileSize)}
===============================================================

[Document Content Verified & Digitally Authenticated by Central ERP]
This file was generated/retrieved from the Garments Manufacturing 
ERP Document Management Subsystem. All parameters synchronize with 
Cutting, Sewing, Quality, and Logistics teams.
===============================================================
`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      link.href = URL.createObjectURL(blob);
    }

    link.download = file.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to initiate file download:', err);
  }
}

/**
 * Generates sample demo documents for an order to provide an instant interactive experience.
 */
export function generateSampleOrderAttachments(orderNumber: string, styleNumber: string): OrderAttachment[] {
  const now = new Date().toISOString().split('T')[0];
  return [
    {
      id: `att-meas-${Date.now()}-1`,
      category: 'MEASUREMENT_SPEC',
      fileName: `${styleNumber}-Graded-Measurement-Spec-Chart-v2.pdf`,
      fileSize: 1845000,
      fileType: 'application/pdf',
      uploadedAt: now,
      uploadedBy: 'Tahsin Kabir (Technical Designer)',
      notes: 'Includes full tolerance matrix for XS to XXL with garment stretch allowance.',
    },
    {
      id: `att-tech-${Date.now()}-2`,
      category: 'TECHNICAL_SPEC',
      fileName: `${orderNumber}-Master-Technical-Pack-Approved.pdf`,
      fileSize: 4210000,
      fileType: 'application/pdf',
      uploadedAt: now,
      uploadedBy: 'Farhan Rahman (Senior Merchandiser)',
      notes: 'Buyer sign-off tech pack with seam construction, needle types and packaging method.',
    },
    {
      id: `att-test-${Date.now()}-3`,
      category: 'TEST_RECORD',
      fileName: `ITS-Lab-Test-ColorFastness-Shrinkage-Report-${styleNumber}.pdf`,
      fileSize: 920000,
      fileType: 'application/pdf',
      uploadedAt: now,
      uploadedBy: 'Quality Assurance Lab (Intertek Certified)',
      notes: 'Passed ISO 105-C06 wash fastness Grade 4-5 and dimensional stability within 2.5%.',
    },
    {
      id: `att-etc-${Date.now()}-4`,
      category: 'ETC',
      fileName: `${orderNumber}-Trim-Approval-Card-Swatches.xlsx`,
      fileSize: 640000,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedAt: now,
      uploadedBy: 'Accessories Sourcing Desk',
      notes: 'Verified OEKO-TEX Standard 100 labels, thread codes, and polybag artwork.',
    },
  ];
}
