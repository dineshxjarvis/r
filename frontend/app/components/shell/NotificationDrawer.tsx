'use client';

import React, { useState } from 'react';
import { CheckCheck } from 'lucide-react';

export interface NotificationItem {
  id: string;
  type: 'SEVERE' | 'SIGNIFICANT' | 'INFO';
  title: string;
  subtitle?: string;
  read: boolean;
  acknowledged?: boolean;
  actions: Array<{
    label: string;
    action: string;
    isPrimary?: boolean;
  }>;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'DG-2847',
    type: 'SEVERE',
    title: 'SEVERE — Ack by 31 Aug',
    subtitle: 'Finding #DG-2847 awaiting your ack',
    read: false,
    acknowledged: false,
    actions: [
      { label: 'Acknowledge', action: 'ack', isPrimary: true },
      { label: 'View', action: 'view' }
    ]
  },
  {
    id: 'OBL-1092',
    type: 'SIGNIFICANT',
    title: 'SIGNIFICANT — Due in 14 days',
    subtitle: 'Quarterly DGMS Form IV Return Compliance',
    read: false,
    actions: [
      { label: 'View obligation', action: 'view_obl' }
    ]
  },
  {
    id: 'INSP-402',
    type: 'INFO',
    title: 'INFO — Inspection assigned',
    subtitle: 'DGMS Electrical Safety Audit for Korba South Pit',
    read: false,
    actions: [
      { label: 'View inspection', action: 'view_insp' }
    ]
  }
];

export function NotificationDrawer({
  isOpen,
  onClose,
  onCountChange
}: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (onCountChange) onCountChange(0);
  };

  const handleAction = (item: NotificationItem, actionKey: string) => {
    if (actionKey === 'ack') {
      setNotifications(prev =>
        prev.map(n =>
          n.id === item.id ? { ...n, acknowledged: true, read: true } : n
        )
      );
      if (onCountChange) {
        const newCount = notifications.filter(n => n.id !== item.id && !n.read).length;
        onCountChange(newCount);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded bg-white text-slate-800 border border-slate-300 shadow-lg z-50 overflow-hidden font-sans text-left">
      {/* Simple Header */}
      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded">
              ({unreadCount})
            </span>
          )}
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0}
          className="text-xs text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:hover:text-slate-600 font-medium hover:underline flex items-center gap-1"
        >
          [Mark all ✓]
        </button>
      </div>

      {/* Simple Notification List */}
      <div className="divide-y divide-slate-200 bg-white max-h-[380px] overflow-y-auto">
        {notifications.map((item) => {
          const isSevere = item.type === 'SEVERE';
          const isSignificant = item.type === 'SIGNIFICANT';

          return (
            <div
              key={item.id}
              className={`p-3 text-xs ${item.read ? 'opacity-70 bg-slate-50/50' : 'bg-white'}`}
            >
              {/* Dot + Title */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isSevere
                        ? 'bg-red-600'
                        : isSignificant
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                  />
                  <span>{item.title}</span>
                </div>

                {item.acknowledged && (
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    ✓ Acknowledged
                  </span>
                )}
              </div>

              {/* Subtitle / Finding */}
              {item.subtitle && (
                <div className="text-slate-600 font-normal mt-1 pl-4.5">
                  {item.subtitle}
                </div>
              )}

              {/* Simple Action Buttons matching wireframe */}
              <div className="mt-2 pl-4.5 flex items-center gap-2">
                {item.actions.map((act) => {
                  const isAckButton = act.action === 'ack';
                  if (isAckButton && item.acknowledged) return null;

                  return (
                    <button
                      key={act.label}
                      onClick={() => handleAction(item, act.action)}
                      className="px-2 py-0.5 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 transition"
                    >
                      [{act.label}]
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simple Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <span>DGMS Compliance Feed</span>
        <button
          onClick={onClose}
          className="text-slate-700 hover:text-black font-medium hover:underline"
        >
          Close
        </button>
      </div>
    </div>
  );
}
