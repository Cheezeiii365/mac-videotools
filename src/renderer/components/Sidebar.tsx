import React from 'react';
import { Page } from '../hooks/useStore';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  jobCount: number;
}

function ConvertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3l3 3-3 3M6 17l-3-3 3-3M17 6H8M3 14h9" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3v10m0 0l-3.5-3.5M10 13l3.5-3.5M4 16h12" />
    </svg>
  );
}

function QueueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h14M3 10h14M3 15h10" />
    </svg>
  );
}

function PresetsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h2.5M9 5h8M3 10h8.5M15 10h2M3 15h4.5M11 15h6" />
      <circle cx="7" cy="5" r="1.5" fill="currentColor" strokeWidth="0" />
      <circle cx="13" cy="10" r="1.5" fill="currentColor" strokeWidth="0" />
      <circle cx="9" cy="15" r="1.5" fill="currentColor" strokeWidth="0" />
    </svg>
  );
}

const navItems: { id: Page; label: string; icon: React.FC }[] = [
  { id: 'convert', label: 'Convert', icon: ConvertIcon },
  { id: 'download', label: 'Download', icon: DownloadIcon },
  { id: 'queue', label: 'Queue', icon: QueueIcon },
  { id: 'presets', label: 'Presets', icon: PresetsIcon },
];

export default function Sidebar({ currentPage, onNavigate, jobCount }: SidebarProps) {
  return (
    <aside className="w-56 bg-surface-1 border-r border-surface-3/60 flex flex-col select-none">
      {/* Drag region / title */}
      <div className="drag-region h-14 flex items-end px-5 pb-2">
        <h1 className="text-[13px] font-extrabold tracking-tight text-gray-400 uppercase">
          VideoTools
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {navItems.map((item) => {
          const active = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 relative group ${
                active
                  ? 'bg-accent/12 text-white'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-surface-2/80'
              }`}
            >
              {/* Active indicator bar */}
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-accent rounded-r-full" />
              )}
              <span className={`transition-colors duration-200 ${active ? 'text-accent-hover' : 'text-gray-600 group-hover:text-gray-400'}`}>
                <Icon />
              </span>
              <span>{item.label}</span>
              {item.id === 'queue' && jobCount > 0 && (
                <span className="ml-auto min-w-[20px] text-center badge bg-accent/20 text-accent-hover text-[10px]">
                  {jobCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-surface-3/40">
        <p className="text-[10px] font-medium text-gray-700 tracking-wide">v0.1.0</p>
      </div>
    </aside>
  );
}
