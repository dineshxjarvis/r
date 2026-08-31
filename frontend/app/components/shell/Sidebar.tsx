'use client';

import React from 'react';
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
  Bell
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotifications?: () => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard (My Queue)', href: '/field/dashboard', icon: Home },
  { id: 'inspections', label: 'Inspections', href: '/field/inspections', icon: Search },
  { id: 'defects', label: 'Defects & Findings', href: '/field/findings', icon: AlertTriangle },
  { id: 'obligations', label: 'Obligations', href: '/field/obligations', icon: ClipboardList },
  { id: 'evidence', label: 'Evidence', href: '/field/safety/documents', icon: Folder },
  { id: 'gis-map', label: 'GIS Map', href: '/field/map', icon: MapPin },
  { id: 'documents', label: 'Documents', href: '/field/documents', icon: FileText },
  { id: 'notifications', label: 'Notifications', href: '#', icon: Bell, isNotificationTrigger: true },
];

export function Sidebar({
  isOpen,
  onClose,
  onOpenNotifications
}: SidebarProps) {
  const pathname = usePathname();

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
              <span>Er. Rajesh Verma</span>
            </div>
            <div className="text-slate-700 font-medium pl-3.5">
              Safety Officer
            </div>
            <div className="text-slate-600 pl-3.5">
              Gevra OCP (SECL)
            </div>
            <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-200 pl-3.5">
              Appt: <span className="font-mono text-slate-700">01 Apr 2024 – 31 Mar 2027</span>
            </div>
          </div>
        </div>

        {/* Navigation Items List with Next.js Links */}
        <nav className="flex-1 overflow-y-auto py-2 divide-y divide-slate-100">
          <div className="px-2 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.href !== '#' && (
                item.href === '/field/dashboard'
                  ? pathname === '/field/dashboard'
                  : item.href === '/field/documents'
                  ? pathname === '/field/documents'
                  : item.href === '/field/safety/documents'
                  ? pathname === '/field/safety/documents'
                  : pathname?.startsWith(item.href)
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
          <span>DGMS Form B Scope</span>
          <span className="text-slate-400 font-mono">v1.0</span>
        </div>
      </aside>
    </>
  );
}
