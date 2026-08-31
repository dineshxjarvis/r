'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/shell/Sidebar';

export default function MineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex-1 flex min-h-[calc(100vh-84px)] bg-slate-50">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <main className="flex-1 min-w-0 p-4 sm:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
