'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Send,
  MessageCircle,
  Mail,
  Copy,
  Check,
  Building2,
  Phone,
  Layers,
  Cpu,
  Globe2,
  Award,
  ChevronRight,
  Download,
} from 'lucide-react';

interface CommercialInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommercialInquiryModal({ isOpen, onClose }: CommercialInquiryModalProps) {
  const [selectedTier, setSelectedTier] = useState<'single' | 'enterprise' | 'source'>('enterprise');
  const [fullName, setFullName] = useState('');
  const [factoryName, setFactoryName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linesCount, setLinesCount] = useState('15-30 Lines');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'single' as const,
      name: 'Single Plant License',
      subtitle: 'For independent garment manufacturing units',
      badge: 'Most Popular for Factories',
      highlights: [
        'Up to 30 Sewing Lines & 100 Tablet stations',
        'All 34 Quality & Production Modules',
        'Local Wi-Fi Host + Cloud Sync',
        'Lifetime Perpetual Plant License',
      ],
    },
    {
      id: 'enterprise' as const,
      name: 'Enterprise Multi-Plant',
      subtitle: 'For garment groups, conglomerates & buying houses',
      badge: 'Best Value',
      highlights: [
        'Unlimited Factories, Lines & Users',
        'Central HQ Command Center & Group Analytics',
        'Buyer Portal (Nike, H&M, Zara, Inditex)',
        'Priority 24/7 SLA & Custom Integrations',
      ],
    },
    {
      id: 'source' as const,
      name: 'Full Source Code & White-Label',
      subtitle: 'For software distributors & enterprise IT teams',
      badge: 'Full Ownership',
      highlights: [
        '100% Full Source Code (Next.js, TypeScript, Tailwind)',
        'White-label with your own brand & logo',
        'Deploy on unlimited client servers without royalties',
        'Complete database migration scripts & architecture doc',
      ],
    },
  ];

  const generateInquiryText = () => {
    return `Hello, I am interested in purchasing Project ULTRA Garments QMS & ERP.
- Name: ${fullName || 'Prospective Buyer'}
- Factory / Organization: ${factoryName || 'Garment Factory'}
- Email: ${email || 'Not provided'}
- Phone / WhatsApp: ${phone || 'Not provided'}
- Estimated Sewing Lines / Capacity: ${linesCount}
- Selected Package: ${selectedTier.toUpperCase()} LICENSE
- Additional Requirements: ${notes || 'Please provide quotation and deployment schedule.'}`;
  };

  const handleCopyInquiry = () => {
    const text = generateInquiryText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateInquiryText());
    // Direct WhatsApp link
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Project ULTRA ERP Commercial License Inquiry - ${factoryName || fullName || 'Factory'}`);
    const body = encodeURIComponent(generateInquiryText());
    window.location.href = `mailto:sales@projectultra-erp.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-100 flex flex-col">
        {/* Header Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Project ULTRA — Commercial Licensing
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready to Deploy
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enterprise Garments Quality Management & Floor ERP Software
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 sm:p-8 space-y-6">
          {/* Key Differentiators / Selling Points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-1.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Zero Per-User Fees</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Unlimited tablet & PC seats without recurring charges</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Local Wi-Fi Host</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Runs on factory intranet even when internet drops</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5">
                <Layers className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">34 Full Modules</div>
              <div className="text-[11px] text-slate-400 mt-0.5">AQL 2.5, 4-Point, Cutting, Lines, Lab & ISO 9001</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
                <Award className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Buyer Compliant</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Audit-ready for Nike, H&M, Inditex & M&S standards</div>
            </div>
          </div>

          {/* License Tier Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              1. Select Commercial Package
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {tiers.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`relative p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isSelected
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {tier.badge}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-400 bg-blue-500 text-white' : 'border-slate-600'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="text-sm font-bold text-white mt-1">{tier.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-snug">{tier.subtitle}</div>

                      <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                        {tier.highlights.map((h, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inquiry / Contact Form */}
          <div className="space-y-4 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              2. Your Organization & Implementation Details
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Your Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe / Engr. Rahman"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Factory / Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Apparels Ltd."
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  placeholder="+880 1700-000000 / +1 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Plant Sewing Lines / Capacity</label>
                <select
                  value={linesCount}
                  onChange={(e) => setLinesCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="1-10 Lines">1-10 Lines (Pilot Unit)</option>
                  <option value="15-30 Lines">15-30 Lines (Medium Factory)</option>
                  <option value="30-60 Lines">30-60 Lines (Large Plant)</option>
                  <option value="60+ Lines">60+ Lines (Composite Complex / Multiple Plants)</option>
                  <option value="Buying House / Third-party QA">Buying House / Inspection Agency</option>
                  <option value="Software Vendor / Reseller">Software Vendor / Solution Reseller</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Specific Requirements / Notes</label>
                <input
                  type="text"
                  placeholder="Need on-site training / Barcode printers / Cloud setup"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: WhatsApp / Email / Copy */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={handleCopyInquiry}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Inquiry Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy Inquiry Summary</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contact via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Submit Email Inquiry</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
