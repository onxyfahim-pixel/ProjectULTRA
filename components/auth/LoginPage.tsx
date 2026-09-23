'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  FileCheck2,
  Cpu,
  BarChart3,
  Factory,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Layers,
  KeyRound,
  Check,
} from 'lucide-react';
import { useErpAuth } from '@/hooks/use-erp-auth';
import { Role } from '@/lib/types/erp';

interface QuickAccount {
  label: string;
  role: Role;
  username: string;
  pass: string;
  badge: string;
  desc: string;
}

const QUICK_ACCOUNTS: QuickAccount[] = [
  {
    label: 'Super Admin',
    role: 'ADMIN',
    username: 'admin',
    pass: 'admin',
    badge: 'Full Privilege',
    desc: 'System admin, RBAC permissions & plant configs',
  },
  {
    label: 'QA Lead',
    role: 'QA_MANAGER',
    username: 'tania.qa',
    pass: 'qa',
    badge: 'AQL Approval',
    desc: 'Approve quality grades, CAPA & sign off lots',
  },
  {
    label: 'Production Head',
    role: 'PRODUCTION_HEAD',
    username: 'mahmud.prod',
    pass: 'prod',
    badge: 'Sewing Floor',
    desc: 'Order targets, line efficiency & DHU defect rates',
  },
  {
    label: 'Warehouse Inspector',
    role: 'WAREHOUSE_INSPECTOR',
    username: 'rafiq.wh',
    pass: 'wh',
    badge: 'Raw Materials',
    desc: 'Fabric roll inward & 4-Point inspection',
  },
  {
    label: 'Floor QC',
    role: 'OPERATOR',
    username: 'shirin.op',
    pass: 'op',
    badge: 'Inline QC',
    desc: 'Inline defect counts & endline 100% checks',
  },
];

// Bilingual translations dictionary
const TRANSLATIONS = {
  en: {
    qualityBuildsTrust: 'QUALITY BUILDS TRUST',
    qms: 'QMS',
    erp: 'ERP',
    tagline: 'Smarter Quality Management for a Stronger Tomorrow',
    steps: 'Monitor • Control • Improve',
    featQuality: 'Quality Management',
    featAudit: 'Audit & CAPA',
    featProduction: 'Production & Inspection',
    featReports: 'Reports & Analysis',
    tagCompliance: 'QUALITY / SAFETY / COMPLIANCE',
    industry: 'Garments | Textile | Manufacturing',
    welcomeBack: 'Welcome Back',
    signInPrompt: 'Sign in to your QMS ERP account',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    loginBtn: 'Login',
    loggingIn: 'Signing in...',
    quickLogin: 'Quick Demo Accounts (1-Click Fill)',
    secureDivider: 'Secure | Reliable | Efficient',
    footerText: 'QMS ERP v1.0 | Powered by FahimTechBD ERP',
  },
  bn: {
    qualityBuildsTrust: 'গুণমান আস্থা তৈরি করে',
    qms: 'কিউএমএস',
    erp: 'ইআরপি',
    tagline: 'উন্নত আগামীকালের জন্য স্মার্টার কোয়ালিটি ম্যানেজমেন্ট',
    steps: 'পর্যবেক্ষণ • নিয়ন্ত্রণ • উন্নতি',
    featQuality: 'কোয়ালিটি ম্যানেজমেন্ট',
    featAudit: 'অডিট ও ক্যাপা (CAPA)',
    featProduction: 'উৎপাদন ও পরিদর্শন',
    featReports: 'রিপোর্ট ও বিশ্লেষণ',
    tagCompliance: 'গুণমান / নিরাপত্তা / কমপ্লায়েন্স',
    industry: 'গার্মেন্টস | টেক্সটাইল | ম্যানুফ্যাকচারিং',
    welcomeBack: 'স্বাগতম',
    signInPrompt: 'আপনার QMS ERP অ্যাকাউন্টে সাইন ইন করুন',
    usernameLabel: 'ব্যবহারকারীর নাম',
    usernamePlaceholder: 'ব্যবহারকারীর নাম লিখুন',
    passwordLabel: 'পাসওয়ার্ড',
    passwordPlaceholder: 'পাসওয়ার্ড লিখুন',
    rememberMe: 'মনে রাখুন',
    forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
    loginBtn: 'লগইন করুন',
    loggingIn: 'প্রবেশ করা হচ্ছে...',
    quickLogin: 'দ্রুত ডেমো অ্যাকাউন্টস (১-ক্লিক)',
    secureDivider: 'সুরক্ষিত | নির্ভরযোগ্য | দক্ষ',
    footerText: 'কিউএমএস ইআরপি সংস্করণ ১.০ | Powered by FahimTechBD ERP',
  },
};

export function LoginPage() {
  const { login } = useErpAuth();

  // State
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickOpen, setIsQuickOpen] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Parallax & 3D Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardTilt, setCardTilt] = useState({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });

  // Antigravity Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: -1000, y: -1000, isOver: false });

  const t = TRANSLATIONS[lang];

  // Mouse Parallax on Card
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle 3D tilt angles (max ±4 deg)
    const rotateY = ((x - centerX) / centerX) * 3.5;
    const rotateX = -((y - centerY) / centerY) * 3.5;

    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    setCardTilt({ rotateX, rotateY, glowX, glowY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setCardTilt({ rotateX: 0, rotateY: 0, glowX: 50, glowY: 50 });
  }, []);

  // Antigravity Particle Engine on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool with antigravity physics
    interface Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      type: 'dot' | 'ring' | 'cross';
      floatSpeed: number;
      floatAngle: number;
    }

    const particles: Particle[] = [];
    const particleCount = 45;
    const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#A5B4FC', '#38BDF8'];

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5 - 0.2, // gentle natural upward float
        size: Math.random() * 3 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.2,
        type: i % 4 === 0 ? 'ring' : i % 7 === 0 ? 'cross' : 'dot',
        floatSpeed: Math.random() * 0.02 + 0.01,
        floatAngle: Math.random() * Math.PI * 2,
      });
    }

    const handleWindowMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY, isOver: true };
    };

    const handleWindowMouseLeave = () => {
      mousePosRef.current.isOver = false;
    };

    const handleWindowClick = (e: MouseEvent) => {
      // Antigravity Shockwave Ripple on click
      particles.forEach((p) => {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 320) {
          const force = (320 - dist) / 18;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force;
          p.vy += Math.sin(angle) * force;
        }
      });
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseleave', handleWindowMouseLeave);
    window.addEventListener('click', handleWindowClick);

    // Animation Loop with Antigravity repulsion & spring restoration
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mousePosRef.current;
      const repulsionRadius = 180;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Antigravity repulsion from cursor
        if (mouse.isOver) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < repulsionRadius && dist > 0) {
            // Inverse gravity force (pushes away in zero-g)
            const force = (repulsionRadius - dist) / repulsionRadius;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * 1.2;
            p.vy += Math.sin(angle) * force * 1.2;
          }
        }

        // 2. Natural floating drift
        p.floatAngle += p.floatSpeed;
        p.x += Math.sin(p.floatAngle) * 0.4 + p.vx;
        p.y += Math.cos(p.floatAngle) * 0.3 + p.vy;

        // 3. Air resistance / damping
        p.vx *= 0.94;
        p.vy *= 0.94;

        // 4. Wrap edges smoothly
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // 5. Draw Particle
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;

        if (p.type === 'ring') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === 'cross') {
          ctx.beginPath();
          ctx.moveTo(p.x - p.size, p.y);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.moveTo(p.x, p.y - p.size);
          ctx.lineTo(p.x, p.y + p.size);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // 6. Connect nearby particles with subtle threads (textile / metrology lattice)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.save();
            ctx.globalAlpha = (1 - dist / 100) * 0.12;
            ctx.strokeStyle = '#60A5FA';
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseleave', handleWindowMouseLeave);
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const result = await login(identifier, password);
    if (!result.success) {
      setErrorMsg(result.error || 'Invalid credentials. Please verify username and password.');
      setIsSubmitting(false);
    }
  };

  const handleSelectQuickAccount = (acc: QuickAccount) => {
    setIdentifier(acc.username);
    setPassword(acc.pass);
    setErrorMsg(null);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="min-h-screen w-full bg-[#EBF1F8] flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden select-none selection:bg-blue-600 selection:text-white"
    >
      {/* 1. Antigravity Physics Interactive Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-80"
      />

      {/* 2. Soft Ambient Atmospheric Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-300/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 3. Main Split-Screen Card with 3D Perspective Tilt */}
      <div
        ref={cardRef}
        style={{
          transform: `perspective(1200px) rotateX(${cardTilt.rotateX}deg) rotateY(${cardTilt.rotateY}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="relative z-10 w-full max-w-5xl rounded-[28px] overflow-hidden shadow-2xl shadow-slate-300/70 border border-white/80 bg-white grid grid-cols-1 lg:grid-cols-2 min-h-[600px] backdrop-blur-xs"
      >
        {/* Dynamic Light Beam Follow Effect */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 z-30 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px circle at ${cardTilt.glowX}% ${cardTilt.glowY}%, rgba(59, 130, 246, 0.12), transparent 70%)`,
          }}
        />

        {/* ========================================================= */}
        {/* LEFT PANEL: BRAND SHOWCASE & GARMENT QA INSPECTION SCENE */}
        {/* ========================================================= */}
        <div className="relative p-6 sm:p-10 flex flex-col justify-between overflow-hidden bg-slate-100 min-h-[460px] lg:min-h-full">
          {/* Background High-End Garment QA Image with soft light overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{
              backgroundImage: 'url(/images/garment_qa_login_bg.jpg)',
            }}
          />

          {/* Luminous Gradient Mask to ensure ultra-crisp readable typography */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/80 to-white/70 backdrop-blur-[2px]" />

          {/* Left Top: Brand Identity & Flow */}
          <div className="relative z-10 space-y-3">
            <span className="text-[11px] font-bold tracking-[0.25em] text-blue-600 uppercase font-mono block">
              {t.qualityBuildsTrust}
            </span>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none">
              <span className="text-slate-900">{t.qms} </span>
              <span className="text-blue-600">{t.erp}</span>
            </h1>

            <p className="text-sm sm:text-base font-semibold text-slate-700 leading-snug max-w-sm">
              {t.tagline}
            </p>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 pt-0.5">
              <span>{t.steps}</span>
            </div>
          </div>

          {/* Left Center: 4 Feature Badge Pills (2x2 Grid) Matching the Reference Image */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            {/* Pill 1: Quality Management (Blue) */}
            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {t.featQuality}
              </span>
            </div>

            {/* Pill 2: Audit & CAPA (Green) */}
            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {t.featAudit}
              </span>
            </div>

            {/* Pill 3: Production & Inspection (Purple) */}
            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {t.featProduction}
              </span>
            </div>

            {/* Pill 4: Reports & Analysis (Amber) */}
            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {t.featReports}
              </span>
            </div>
          </div>

          {/* Left Bottom Footer: Industry Tag */}
          <div className="relative z-10 pt-2 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2 font-medium">
              <Factory className="w-4 h-4 text-blue-600" />
              <span>{t.industry}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
              ISO 9001 / AQL Certified
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANEL: AUTHENTICATION FORM CARD                      */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-10 flex flex-col justify-between bg-white relative z-20">
          {/* Top Row: Language Toggle Switcher (EN / বাংলা) */}
          <div className="flex items-center justify-end pb-2">
            <div className="p-1 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* Center Form Section */}
          <div className="max-w-md w-full mx-auto space-y-6 py-2">
            {/* Logo & QMS ERP Brand Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center gap-2 mb-1">
                {/* Stylized Cog + Checkmark Icon in Vivid Blue */}
                <div className="relative flex items-center justify-center">
                  <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                    <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                  </div>
                </div>
                <div className="text-left leading-none pl-1">
                  <div className="text-2xl font-black tracking-tight">
                    <span className="text-slate-900">QMS </span>
                    <span className="text-blue-600">ERP</span>
                  </div>
                  <div className="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase font-mono mt-0.5">
                    QUALITY MANAGEMENT SYSTEM
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 tracking-tight pt-2">
                {t.welcomeBack}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t.signInPrompt}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>{t.rememberMe}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
                >
                  {t.forgotPassword}
                </button>
              </div>

              {/* Login Button with Shimmer Effect and Arrow */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden group disabled:opacity-70"
              >
                {/* Subtle Shimmer Beam on Hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.loggingIn}</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    <span>{t.loginBtn}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Role Presets Dropdown/Pills */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsQuickOpen(!isQuickOpen)}
                className="w-full py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.quickLogin}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isQuickOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isQuickOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 animate-in fade-in slide-in-from-top-1">
                  {QUICK_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleSelectQuickAccount(acc)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        identifier === acc.username
                          ? 'border-blue-500 bg-blue-50/80 text-blue-900 shadow-2xs font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{acc.label}</div>
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                        u: {acc.username}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Footer Section Matching Reference */}
          <div className="pt-4 text-center space-y-2 border-t border-slate-100">
            <div className="text-[11px] font-medium text-slate-400">
              {t.secureDivider}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {t.footerText}
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">QMS ERP Password Recovery</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Default administrator access for this factory deployment is configured with credentials:
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Super Admin Username:</span>
                <span className="font-bold text-slate-900">admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Default Password:</span>
                <span className="font-bold text-blue-600">admin</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">QA Lead:</span>
                <span className="font-bold text-slate-800">tania.qa / qa</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              For security compliance and custom password resets, please contact your factory IT Security Officer or HR Systems Administrator.
            </p>

            <button
              type="button"
              onClick={() => {
                setIdentifier('admin');
                setPassword('admin');
                setIsForgotModalOpen(false);
              }}
              className="w-full py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              Autofill Admin Credentials &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
