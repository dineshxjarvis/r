'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  currentRole?: string;
}

const AUTHORISED_MINES = [
  { id: 'gevra', name: 'Gevra OCP', subsidiary: 'SECL', region: 'Korba Area', type: 'Mega Opencast' },
  { id: 'kusmunda', name: 'Kusmunda OCP', subsidiary: 'SECL', region: 'Korba Area', type: 'Opencast' },
  { id: 'dipka', name: 'Dipka OCP', subsidiary: 'SECL', region: 'Korba Area', type: 'Opencast' },
  { id: 'jharia-4', name: 'Jharia OC #4', subsidiary: 'BCCL', region: 'Dhanbad', type: 'Opencast/UG' },
  { id: 'all-korba', name: 'All Mines (Korba Area)', subsidiary: 'SECL', region: 'Regional Scope', type: 'Area Portfolio' },
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
  const [selectedMine, setSelectedMine] = useState(AUTHORISED_MINES[0]);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMineOpen, setIsMineOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(unreadNotificationsCount);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');

  const mineRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-40 w-full bg-[#8B0000] text-white select-none shadow-md font-sans">
      {/* Official Government Top Header - Theme Secondary #5D0000 */}
      <div className="bg-[#5D0000] px-4 sm:px-6 py-1.5 flex items-center justify-between text-xs text-white/90 border-b border-[#4A0000]">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight">भारत सरकार | Government of India</span>
          <span className="text-white/30">|</span>
          <span className="hidden sm:inline font-medium tracking-tight text-white/80">कोयला मंत्रालय | Ministry of Coal</span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="bg-[#1E3A8A] text-white px-2.5 py-0.5 rounded font-semibold tracking-wide shadow-xs border border-blue-400/30">
            DGMS COMPLIANT
          </span>
          <span className="hidden md:inline text-white/80 font-medium">Coal India Limited</span>
        </div>
      </div>

      {/* Main Bar - Theme Primary #8B0000 */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3 bg-[#8B0000]">
        {/* Left: Menu & Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle Menu"
            className="p-1.5 rounded-lg hover:bg-[#730000] text-white transition focus:outline-none focus:ring-1 focus:ring-white/40"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-95 transition font-bold group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] border border-white/20 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Shield className="w-4.5 h-4.5 fill-current" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-wider text-white">STRATA</span>
              <span className="text-[9px] font-medium tracking-widest text-white/70 uppercase">Gov. Portal</span>
            </div>
          </Link>
        </div>

        {/* Center: Search Bar & Scope Selectors */}
        <div className="hidden lg:flex items-center gap-3 flex-1 max-w-2xl mx-4">
          {/* Theme Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search mines, circulars, statutory orders..."
              className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-[#EEF2F8] text-[#1F2937] placeholder-slate-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mine/Scope Selector */}
          <div className="relative shrink-0" ref={mineRef}>
            <button
              onClick={() => setIsMineOpen(!isMineOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5D0000] hover:bg-[#4A0000] border border-[#730000] text-xs text-white transition shadow-inner"
            >
              <Building2 className="w-3.5 h-3.5 text-white/90" />
              <span className="text-white/70 font-normal">Scope:</span>
              <span className="font-bold text-white tracking-wide truncate max-w-[110px]">{selectedMine.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isMineOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMineOpen && (
              <div className="absolute left-0 mt-1.5 w-64 rounded-xl bg-white text-[#1F2937] border border-slate-200 shadow-xl z-50 py-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-1.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Authorized Scope</span>
                  <span className="text-[10px] text-[#1E3A8A] font-semibold">Active</span>
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
                        <div className="text-[10px] text-slate-500">{mine.subsidiary} • {mine.region}</div>
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

          {/* Period Selector */}
          <div className="relative shrink-0" ref={periodRef}>
            <button
              onClick={() => setIsPeriodOpen(!isPeriodOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5D0000] hover:bg-[#4A0000] border border-[#730000] text-xs text-white transition shadow-inner"
            >
              <Calendar className="w-3.5 h-3.5 text-white/90" />
              <span className="font-bold text-white tracking-wide">{selectedPeriod.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPeriodOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white text-[#1F2937] border border-slate-200 shadow-xl z-50 py-1.5 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
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
                href="/"
                title="Home"
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
                  <span className="absolute top-0.5 right-0.5 bg-[#1E3A8A] text-white font-extrabold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center ring-1 ring-[#8B0000]">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Anchored Real Notification Dropdown */}
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
                RV
              </div>
              <div className="hidden md:flex flex-col text-left leading-tight">
                <span className="font-bold text-white tracking-wide">Er. Rajesh Verma</span>
                <span className="text-[10px] text-white/70 font-medium">Safety Officer</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white text-[#1F2937] border border-slate-200 shadow-xl z-50 py-1.5 text-xs divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5">
                  <div className="font-bold text-[#1F2937] text-sm">Er. Rajesh Verma</div>
                  <div className="text-slate-600 text-xs mt-0.5">Safety Officer • Gevra OCP</div>
                  <div className="inline-block bg-blue-50 text-[#1E3A8A] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200 mt-1.5">
                    Statutory Appt: Valid till 31 Mar 2027
                  </div>
                </div>

                <div className="py-1.5">
                  <button
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-[#1F2937] font-medium transition text-left"
                  >
                    <User className="w-4 h-4 text-slate-500" />
                    <span>My Profile & Credentials</span>
                  </button>

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
                    onClick={() => setIsUserMenuOpen(false)}
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
