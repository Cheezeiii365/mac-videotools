import React from 'react';
import { useStore } from './hooks/useStore';
import Sidebar from './components/Sidebar';
import ConvertPage from './pages/ConvertPage';
import DownloadPage from './pages/DownloadPage';
import QueuePage from './pages/QueuePage';
import PresetsPage from './pages/PresetsPage';

export default function App() {
  const store = useStore();

  const runningCount = store.jobs.filter((j) => j.status === 'running').length;
  const queuedCount = store.jobs.filter((j) => j.status === 'queued').length;

  return (
    <div className="flex h-screen bg-surface-0">
      <Sidebar
        currentPage={store.currentPage}
        onNavigate={store.setPage}
        jobCount={runningCount + queuedCount}
      />
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle top gradient for depth */}
        <div className="drag-region h-10 flex-shrink-0 sticky top-0 z-10 bg-gradient-to-b from-surface-0/80 to-transparent pointer-events-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <div className="animate-fade-in">
          {store.currentPage === 'convert' && <ConvertPage store={store} />}
          {store.currentPage === 'download' && <DownloadPage store={store} />}
          {store.currentPage === 'queue' && <QueuePage store={store} />}
          {store.currentPage === 'presets' && <PresetsPage store={store} />}
        </div>
      </main>
    </div>
  );
}
