'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  AlertTriangle,
  ClipboardList,
  Folder,
  MapPin,
  FileText,
  Bell,
  Leaf,
  Users,
  MessageSquare,
  Wrench,
  UserCheck,
  Briefcase,
  ShieldCheck,
  Settings
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotifications?: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onOpenNotifications
}: SidebarProps) {
  const pathname = usePathname();
  const [persona, setPersona] = useState({
    id: 'safety-officer',
    name: 'Er. Rajesh Verma',
    postTitle: 'Safety Officer',
    scope: 'Gevra OCP (SECL)',
    appointmentPeriod: '01 Apr 2024 – 31 Mar 2027'
  });

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

  // Determine Nav Items based on Active End-User Persona (strictly unique hrefs)
  const getNavItems = () => {
    if (persona.id === 'mine-manager') {
      return [
        { id: 'dashboard', label: 'Mine Dashboard', href: '/mine/dashboard', icon: Home },
        { id: 'compliance', label: 'Compliance Register', href: '/mine/compliance', icon: ClipboardList },
        { id: 'staff', label: 'Staff & Appointments', href: '/mine/staff', icon: Users },
        { id: 'capas', label: 'CAPA Management', href: '/mine/capas', icon: ShieldCheck },
        { id: 'contractors', label: 'Contractors', href: '/mine/contractors', icon: Briefcase },
        { id: 'inspections', label: 'Inspections & Audit', href: '/mine/inspections', icon: Search },
        { id: 'documents', label: 'Documents & Reports', href: '/mine/documents', icon: FileText },
        { id: 'gis-map', label: 'GIS Mine Map', href: '/mine/map', icon: MapPin },
        { id: 'grievances', label: 'Grievances', href: '/mine/grievances', icon: MessageSquare },
        { id: 'settings', label: 'Mine Settings', href: '/mine/settings', icon: Settings },
        { id: 'notifications', label: 'Notifications', href: '#', icon: Bell, isNotificationTrigger: true },
      ];
    }

    if (persona.id === 'engineer-supervisor') {
      return [
        { id: 'dashboard', label: 'Assets & HEMM', href: '/field/assets', icon: Wrench },
        { id: 'findings', label: 'Asset Findings', href: '/field/assets/findings', icon: AlertTriangle },
        { id: 'gis-map', label: 'GIS Map', href: '/field/map', icon: MapPin },
        { id: 'notifications', label: 'Notifications', href: '#', icon: Bell, isNotificationTrigger: true },
      ];
    }

    if (persona.id === 'labour-officer') {
      return [
        { id: 'dashboard', label: 'Attendance & Roster', href: '/field/attendance', icon: Home },
        { id: 'obligations', label: 'Labour Obligations', href: '/field/obligations', icon: ClipboardList },
        { id: 'grievances', label: 'Grievance Intake', href: '/field/grievances', icon: MessageSquare },
        { id: 'documents', label: 'Labour Registers', href: '/field/labour/documents', icon: FileText },
        { id: 'notifications', label: 'Notifications', href: '#', icon: Bell, isNotificationTrigger: true },
      ];
    }

    if (persona.id === 'env-officer') {
      return [
        { id: 'dashboard', label: 'Environmental Dashboard', href: '/field/environment', icon: Home },
        { id: 'inspections', label: 'Inspections', href: '/field/inspections', icon: Search },
        { id: 'defects', label: 'Environmental Findings', href: '/field/findings', icon: AlertTriangle },
        { id: 'obligations', label: 'EC Obligations', href: '/field/obligations', icon: ClipboardList },
        { id: 'evidence', label: 'Clearances & Documents', href: '/field/environment/documents', icon: Folder },
        { id: 'gis-map', label: 'GIS Mining Map', href: '/field/map', icon: MapPin },
        { id: 'notifications', label: 'Notifications', href: '#', icon: Bell, isNotificationTrigger: true },
      ];
    }

    if (persona.id === 'safety-officer') {
      return [
        { id: 'dashboard', label: 'Safety Dashboard', href: '/field/safety/dashboard', icon: Home },
        { id: 'inspections', label: 'Safety Inspections', href: '/field/inspections', icon: Search },
        { id: 'defects', label: 'Defects & Findings', href: '/field/findings', icon: AlertTriangle },
        { id: 'obligations', label: 'Safety Obligations', href: '/field/obligations', icon: ClipboardList },
        { id: 'evidence', label: 'Safety Documents & Evidence', href: '/field/safety/documents', icon: Folder },
        { id: 'gis-map', label: 'GIS Map', href: '/field/map', icon: MapPin },
        { id: 'notifications', label: 'Notifications', href: '#', icon: Bell, isNotificationTrigger: true },
      ];
    }

    // Default Field Inspector / Other Field Users
    return [
      { id: 'dashboard', label: 'Dashboard (My Queue)', href: '/field/dashboard', icon: Home },
      { id: 'inspections', label: 'Inspections', href: '/field/inspections', icon: Search },
      { id: 'defects', label: 'Defects & Findings', href: '/field/findings', icon: AlertTriangle },
      { id: 'obligations', label: 'Obligations', href: '/field/obligations', icon: ClipboardList },
      { id: 'documents', label: 'Documents', href: '/field/documents', icon: FileText },
      { id: 'gis-map', label: 'GIS Map', href: '/field/map', icon: MapPin },
      { id: 'notifications', label: 'Notifications', href: '#', icon: Bell, isNotificationTrigger: true },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden top-[84px]"
          onClick={onClose}
          aria-label="Close sidebar backdrop"
        />
      )}

      {/* Sidebar Container - Placed directly below TopBar */}
      <aside
        className={`bg-white text-slate-800 border-r border-slate-300 shadow-sm flex flex-col shrink-0 font-sans z-30 transition-all duration-200 ${
          isOpen
            ? 'w-64 fixed lg:static top-[84px] bottom-0 left-0'
            : 'w-0 hidden'
        }`}
      >
        {/* User Statutory Appointment Box */}
        <div className="p-3 bg-slate-50 border-b border-slate-300">
          <div className="bg-white border border-slate-300 rounded p-2.5 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span>{persona.name}</span>
            </div>
            <div className="text-slate-700 font-medium pl-3.5">
              {persona.postTitle}
            </div>
            <div className="text-slate-600 pl-3.5 text-[11px]">
              {persona.scope}
            </div>
            <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200 pl-3.5">
              Appt: <span className="font-mono text-slate-700">{persona.appointmentPeriod}</span>
            </div>
          </div>
        </div>

        {/* Navigation Items List with Next.js Links */}
        <nav className="flex-1 overflow-y-auto py-2 divide-y divide-slate-100">
          <div className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              
              // Exact active matching with unique paths
              const isActive = item.href !== '#' && (
                pathname === item.href ||
                (item.href !== '/field/dashboard' &&
                 item.href !== '/mine/dashboard' &&
                 item.href !== '/field/safety/dashboard' &&
                 item.href !== '/field/environment' &&
                 item.href !== '/field/attendance' &&
                 item.href !== '/field/assets' &&
                 pathname?.startsWith(item.href))
              );

              if (item.isNotificationTrigger) {
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (onOpenNotifications) onOpenNotifications();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition text-left ${
                    isActive
                      ? 'bg-[#8B0000] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Official Statutory Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-300 text-[11px] text-slate-600 flex items-center justify-between">
          <span>DGMS Statutory System</span>
          <span className="text-slate-400 font-mono">v1.0</span>
        </div>
      </aside>
    </>
  );
}
