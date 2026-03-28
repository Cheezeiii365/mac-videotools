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
    <div className="flex h-screen">
      <Sidebar
        currentPage={store.currentPage}
        onNavigate={store.setPage}
        jobCount={runningCount + queuedCount}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="drag-region h-8 flex-shrink-0" />
        {store.currentPage === 'convert' && <ConvertPage store={store} />}
        {store.currentPage === 'download' && <DownloadPage store={store} />}
        {store.currentPage === 'queue' && <QueuePage store={store} />}
        {store.currentPage === 'presets' && <PresetsPage store={store} />}
      </main>
    </div>
  );
}
