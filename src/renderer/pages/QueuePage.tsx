import React, { useState } from 'react';
import { AppState } from '../hooks/useStore';
import { Job } from '../../shared/types';

interface Props {
  store: AppState;
}

export default function QueuePage({ store }: Props) {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  const running = store.jobs.filter((j) => j.status === 'running');
  const queued = store.jobs.filter((j) => j.status === 'queued');
  const completed = store.jobs.filter((j) => j.status === 'completed');
  const failed = store.jobs.filter((j) => j.status === 'failed');

  const handleCancel = async (jobId: string) => {
    if (!window.api) return;
    await window.api.cancelJob(jobId);
    store.updateJob(jobId, { status: 'cancelled' });
  };

  const handleClearCompleted = () => {
    for (const job of completed) {
      store.removeJob(job.id);
    }
  };

  if (store.jobs.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">Job Queue</h2>
        <div className="card flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="text-4xl mb-3">☰</div>
          <p className="text-sm">No jobs yet</p>
          <p className="text-xs mt-1">Start a conversion or download to see jobs here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Job Queue</h2>
        {completed.length > 0 && (
          <button onClick={handleClearCompleted} className="text-xs text-gray-500 hover:text-gray-300">
            Clear completed ({completed.length})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs">
        {running.length > 0 && (
          <span className="badge bg-blue-500/20 text-blue-400">
            {running.length} running
          </span>
        )}
        {queued.length > 0 && (
          <span className="badge bg-yellow-500/20 text-yellow-400">
            {queued.length} queued
          </span>
        )}
        {completed.length > 0 && (
          <span className="badge bg-green-500/20 text-green-400">
            {completed.length} completed
          </span>
        )}
        {failed.length > 0 && (
          <span className="badge bg-red-500/20 text-red-400">
            {failed.length} failed
          </span>
        )}
      </div>

      {/* Job list */}
      <div className="space-y-2">
        {store.jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            expanded={expandedJobId === job.id}
            onToggle={() =>
              setExpandedJobId(expandedJobId === job.id ? null : job.id)
            }
            onCancel={() => handleCancel(job.id)}
            onRemove={() => store.removeJob(job.id)}
          />
        ))}
      </div>
    </div>
  );
}

function JobCard({
  job,
  expanded,
  onToggle,
  onCancel,
  onRemove,
}: {
  job: Job;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const statusColors: Record<string, string> = {
    queued: 'text-yellow-400',
    running: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    cancelled: 'text-gray-500',
    paused: 'text-orange-400',
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            job.status === 'running'
              ? 'bg-blue-400 animate-pulse'
              : job.status === 'completed'
              ? 'bg-green-400'
              : job.status === 'failed'
              ? 'bg-red-400'
              : 'bg-gray-500'
          }`}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{job.name}</p>
            <span className={`text-xs ${statusColors[job.status] || 'text-gray-500'}`}>
              {job.status}
            </span>
          </div>
          {job.status === 'running' && (
            <div className="mt-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-full rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-10 text-right">
                  {job.progress.toFixed(1)}%
                </span>
              </div>
              {job.speed && (
                <p className="text-[10px] text-gray-600 mt-0.5">
                  Speed: {job.speed}
                  {job.eta ? ` · ETA: ${job.eta}` : ''}
                </p>
              )}
            </div>
          )}
          {job.status === 'failed' && job.error && (
            <p className="text-xs text-red-400/80 mt-0.5 truncate">{job.error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {(job.status === 'running' || job.status === 'queued') && (
            <button onClick={onCancel} className="btn-danger text-xs px-2 py-1">
              Cancel
            </button>
          )}
          {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
            <button onClick={onRemove} className="text-gray-600 hover:text-gray-400 text-sm">
              ×
            </button>
          )}
          <button
            onClick={onToggle}
            className="text-gray-600 hover:text-gray-400 text-xs px-1"
          >
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded log view */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-surface-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-medium text-gray-500">Log Output</h4>
            {job.inputPath && (
              <p className="text-[10px] text-gray-600 truncate max-w-xs">
                {job.inputPath}
              </p>
            )}
          </div>
          <div className="bg-surface-0 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[10px] text-gray-500 leading-relaxed">
            {job.logs.length > 0 ? (
              job.logs.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap break-all">
                  {line}
                </div>
              ))
            ) : (
              <p className="text-gray-700">No output yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
