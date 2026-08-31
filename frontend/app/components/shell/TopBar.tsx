'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  Globe,
  LogOut,
  User,
  Building2,
  Calendar,
  CheckCircle2,
  Shield,
  Home,
  X
} from 'lucide-react';
import { NotificationDrawer } from './NotificationDrawer';

interface TopBarProps {
  onToggleSidebar?: () => void;
  onToggleNotifications?: () => void;
  unreadNotificationsCount?: number;
  currentRole?: 'field' | 'mine' | 'corporate' | 'regulatory' | 'contractor';
}

const AUTHORISED_MINES = [
  { id: 'gevra-ocp', name: 'Gevra OCP', company: 'SECL', region: 'Korba Coalfield' },
  { id: 'dipka-ocp', name: 'Dipka OCP', company: 'SECL', region: 'Korba Coalfield' },
  { id: 'kusmunda-ocp', name: 'Kusmunda OCP', company: 'SECL', region: 'Korba Coalfield' },
  { id: 'korba-ug', name: 'Korba Underground', company: 'SECL', region: 'Korba Coalfield' },
];

const PERIODS = [
  { id: 'fy-26-27', label: 'FY 2026-27', note: 'Active Financial Year' },
  { id: 'q1-fy-27', label: 'Q1 FY 2026-27', note: 'Apr 2026 - Jun 2026' },
  { id: 'fy-25-26', label: 'FY 2025-26', note: 'Audited Prior Year' },
  { id: 'curr-month', label: 'Current Month', note: 'August 2026' },
];

export function TopBar({
  onToggleSidebar,
  onToggleNotifications,
  unreadNotificationsCount = 3,
  currentRole = 'field'
}: TopBarProps) {
  const router = useRouter();
  const [selectedMine, setSelectedMine] = useState(AUTHORISED_MINES[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMineOpen, setIsMineOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(unreadNotificationsCount);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  const [persona, setPersona] = useState({
    id: 'safety-officer',
    name: 'Er. Rajesh Verma',
    postTitle: 'Safety Officer',
    scope: 'Gevra OCP (SECL)',
    appointmentPeriod: '01 Apr 2024 – 31 Mar 2027',
    route: '/field/safety/dashboard'
  });

  const mineRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadPersona = () => {
    try {
      const saved = localStorage.getItem('strata_current_persona');
      if (saved) {
        setPersona(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadPersona();
    window.addEventListener('strata_persona_changed', loadPersona);
    window.addEventListener('storage', loadPersona);
    return () => {
      window.removeEventListener('strata_persona_changed', loadPersona);
      window.removeEventListener('storage', loadPersona);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mineRef.current && !mineRef.current.contains(event.target as Node)) {
        setIsMineOpen(false);
      }
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setIsPeriodOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.replace(/^Er\.\s+|^Shri\s+|^Dr\.\s+|^Ms\.\s+/, '').split(' ');
    return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'SO';
  };

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('strata_current_persona');
    }
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full flex flex-col font-sans bg-[#8B0000] border-b border-[#5D0000] text-white select-none shadow-md">
      
      {/* 1. Official Government Header Strip (Accessibility & Identity) */}
      <div className="bg-[#5D0000] px-4 py-1 flex items-center justify-between text-[11px] text-white/90 border-b border-[#4A0000]">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-wide">भारत सरकार | Government of India</span>
          <span className="text-white/40">|</span>
          <span className="font-normal opacity-90 hidden sm:inline">कोयला मंत्रालय | Ministry of Coal</span>
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span className="bg-[#1E3A8A] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider border border-white/20">
            DGMS COMPLIANT
          </span>
          <span className="hidden md:inline text-white/80">CMR 2017 PORTAL</span>
        </div>
      </div>

      {/* 2. Main Executive Top Bar */}
      <div className="h-14 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Sidebar Toggle + STRATA Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-white hover:bg-[#5D0000] active:bg-[#4A0000] transition"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href={persona.route || "/field/dashboard"} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] flex items-center justify-center text-white shadow-xs border border-white/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base tracking-wider leading-none text-white">
                STRATA
              </span>
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest leading-tight">
                GOV. PORTAL
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar Component */}
        <div className="flex-1 max-w-md hidden md:block mx-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mines, circulars, statutory orders..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#EEF2F8] text-[#1F2937] text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition border border-slate-300 font-medium"
            />
          </div>
        </div>

        {/* Middle Selectors: Mine/Scope & Financial Year */}
        <div className="flex items-center gap-2">
          {/* Mine / Scope Selector Dropdown */}
          <div className="relative" ref={mineRef}>
            <button
              onClick={() => {
                setIsMineOpen(!isMineOpen);
                setIsPeriodOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5D0000] hover:bg-[#4A0000] border border-[#730000] text-xs transition shadow-inner"
            >
              <Building2 className="w-3.5 h-3.5 text-white/90" />
              <span className="font-bold text-white tracking-wide">
                <span className="hidden sm:inline font-normal text-white/70">Scope: </span>
                {selectedMine.name}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isMineOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMineOpen && (
              <div className="absolute right-0 sm:left-0 mt-1.5 w-64 rounded-xl bg-white text-[#1F2937] border border-slate-200 shadow-xl z-50 py-1.5 text-xs animate-in fade-in slide-from-top-1 duration-150">
                <div className="px-3.5 py-1.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                  Authorised Mine Scopes
                </div>
                <div className="py-1">
                  {AUTHORISED_MINES.map((mine) => (
                    <button
                      key={mine.id}
                      onClick={() => {
                        setSelectedMine(mine);
                        setIsMineOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition ${
                        selectedMine.id === mine.id ? 'bg-[#8B0000]/10 text-[#8B0000] font-bold border-l-4 border-[#8B0000]' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{mine.name}</div>
                        <div className="text-[10px] text-slate-500">{mine.company} • {mine.region}</div>
                      </div>
                      {selectedMine.id === mine.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#8B0000]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Period Selector Dropdown */}
          <div className="relative hidden sm:block" ref={periodRef}>
            <button
              onClick={() => {
                setIsPeriodOpen(!isPeriodOpen);
                setIsMineOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#5D0000] hover:bg-[#4A0000] border border-[#730000] text-xs transition shadow-inner"
            >
              <Calendar className="w-3.5 h-3.5 text-white/90" />
              <span className="font-bold text-white tracking-wide">{selectedPeriod.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPeriodOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white text-[#1F2937] border border-slate-200 shadow-xl z-50 py-1.5 text-xs animate-in fade-in slide-from-top-1 duration-150">
                <div className="px-3.5 py-1.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                  Compliance Period
                </div>
                <div className="py-1">
                  {PERIODS.map((period) => (
                    <button
                      key={period.id}
                      onClick={() => {
                        setSelectedPeriod(period);
                        setIsPeriodOpen(false);
                      }}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition ${
                        selectedPeriod.id === period.id ? 'bg-[#8B0000]/10 text-[#8B0000] font-bold border-l-4 border-[#8B0000]' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{period.label}</div>
                        <div className="text-[10px] text-slate-500">{period.note}</div>
                      </div>
                      {selectedPeriod.id === period.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#8B0000]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Pill Controls & Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <div className="hidden sm:flex items-center bg-[#5D0000] p-1 rounded-xl border border-[#730000] gap-1 shadow-inner">
              <Link
                href={persona.route || "/field/dashboard"}
                title="Home Dashboard"
                className="w-7 h-7 rounded-lg bg-[#8B0000] text-white flex items-center justify-center hover:opacity-90 transition shadow-xs"
              >
                <Home className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => {
                  if (onToggleNotifications) onToggleNotifications();
                  setIsNotificationsOpen(!isNotificationsOpen);
                }}
                title="Notifications"
                className="relative w-7 h-7 rounded-lg hover:bg-[#4A0000] text-white flex items-center justify-center transition"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#1E3A8A] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs border border-white/80 font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Notification Drawer Component */}
            <NotificationDrawer
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              onCountChange={setUnreadCount}
            />
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#5D0000] hover:bg-[#4A0000] border border-[#730000] text-xs text-white transition shadow-inner"
            >
              <div className="w-6 h-6 rounded bg-[#1E3A8A] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                {getInitials(persona.name)}
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="font-bold text-white tracking-wide">{persona.name}</span>
                <span className="text-[10px] text-white/70 font-medium">{persona.postTitle}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white text-[#1F2937] border border-slate-200 shadow-xl z-50 py-1.5 text-xs divide-y divide-slate-100 animate-in fade-in slide-from-top-1 duration-150">
                <div className="px-4 py-2.5">
                  <div className="font-bold text-[#1F2937] text-sm">{persona.name}</div>
                  <div className="text-slate-600 text-xs mt-0.5">{persona.postTitle} • {persona.scope}</div>
                  <div className="inline-block bg-blue-50 text-[#1E3A8A] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200 mt-1.5">
                    Statutory Appt: Valid till {persona.appointmentPeriod?.split('–')[1] || '2027'}
                  </div>
                </div>

                <div className="py-1.5">
                  <Link
                    href="/login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-[#1F2937] font-medium transition text-left"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Switch Role / End-User Persona</span>
                  </Link>

                  <button
                    onClick={() => setLanguage(language === 'EN' ? 'HI' : 'EN')}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 text-[#1F2937] font-medium transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span>Language</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#8B0000] bg-[#8B0000]/10 px-2 py-0.5 rounded">
                      {language === 'EN' ? 'English (EN)' : 'हिन्दी (HI)'}
                    </span>
                  </button>
                </div>

                <div className="py-1.5">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-red-50 text-[#8B0000] font-semibold transition text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
