import React from 'react';
import { Page } from '../hooks/useStore';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  jobCount: number;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'convert', label: 'Convert', icon: '⚡' },
  { id: 'download', label: 'Download', icon: '↓' },
  { id: 'queue', label: 'Queue', icon: '☰' },
  { id: 'presets', label: 'Presets', icon: '✦' },
];

export default function Sidebar({ currentPage, onNavigate, jobCount }: SidebarProps) {
  return (
    <aside className="w-52 bg-surface-1 border-r border-surface-3 flex flex-col">
      {/* Drag region / title */}
      <div className="drag-region h-12 flex items-end px-4 pb-1">
        <h1 className="text-sm font-bold tracking-wide text-gray-300">
          VideoTools
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-accent/15 text-accent-hover'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-surface-2'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.id === 'queue' && jobCount > 0 && (
                <span className="ml-auto badge bg-accent/20 text-accent-hover">
                  {jobCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-surface-3">
        <p className="text-[10px] text-gray-600">v0.1.0 — POC</p>
      </div>
    </aside>
  );
}
