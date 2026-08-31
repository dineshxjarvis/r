'use client';

import React, { useState } from 'react';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';

interface ShellLayoutProps {
  children: React.ReactNode;
}

export function ShellLayout({ children }: ShellLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex-1 flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeItem={activeItem}
          onSelectItem={(id) => setActiveItem(id)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 bg-slate-50 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
