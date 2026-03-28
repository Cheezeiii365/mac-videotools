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
    const cancelled = await window.api.cancelJob(jobId);
    if (cancelled) {
      store.updateJob(jobId, { status: 'cancelled' });
    }
  };

  const handleClearCompleted = () => {
    for (const job of completed) {
      store.removeJob(job.id);
    }
  };

  if (store.jobs.length === 0) {
    return (
      <div className="px-8 pb-8 -mt-2 max-w-4xl mx-auto">
        <h2 className="page-title mb-8">Job Queue</h2>
        <div className="card flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-gray-600">
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
          </div>
          <p className="text-[14px] font-semibold text-gray-400">No jobs yet</p>
          <p className="text-[12px] text-gray-600 mt-1.5">Start a conversion or download to see jobs here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-8 -mt-2 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="page-title">Job Queue</h2>
        {completed.length > 0 && (
          <button onClick={handleClearCompleted} className="text-[12px] font-medium text-gray-600 hover:text-gray-300 transition-colors">
            Clear completed ({completed.length})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-2.5">
        {running.length > 0 && (
          <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-soft mr-1.5" />
            {running.length} running
          </span>
        )}
        {queued.length > 0 && (
          <span className="badge bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
            {queued.length} queued
          </span>
        )}
        {completed.length > 0 && (
          <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            {completed.length} completed
          </span>
        )}
        {failed.length > 0 && (
          <span className="badge bg-red-500/15 text-red-400 border border-red-500/20">
            {failed.length} failed
          </span>
        )}
      </div>

      {/* Job list */}
      <div className="space-y-2.5">
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
  return (
    <div className={`card transition-all duration-200 ${job.status === 'running' ? 'border-accent/20' : ''}`}>
      <div className="flex items-center gap-3.5">
        {/* Status indicator */}
        <div className="flex-shrink-0">
          {job.status === 'running' ? (
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse-soft" />
            </div>
          ) : job.status === 'completed' ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 10l3.5 3.5L15 7" />
              </svg>
            </div>
          ) : job.status === 'failed' ? (
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l8 8M14 6l-8 8" />
              </svg>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-gray-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <p className="text-[13px] font-semibold truncate text-gray-200">{job.name}</p>
            <span className={`text-[11px] font-medium ${
              job.status === 'running' ? 'text-accent-hover' :
              job.status === 'completed' ? 'text-emerald-400' :
              job.status === 'failed' ? 'text-red-400' :
              'text-gray-600'
            }`}>
              {job.status}
            </span>
          </div>
          {job.status === 'running' && (
            <div className="mt-2">
              <div className="flex items-center gap-2.5">
                <div className="flex-1 bg-surface-3 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out relative"
                    style={{
                      width: `${job.progress}%`,
                      background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)',
                    }}
                  >
                    <div className="absolute inset-0 rounded-full animate-progress-glow" style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    }} />
                  </div>
                </div>
                <span className="text-[11px] font-mono font-medium text-gray-400 w-12 text-right tabular-nums">
                  {job.progress.toFixed(1)}%
                </span>
              </div>
              {job.speed && (
                <p className="text-[11px] text-gray-600 mt-1 font-mono">
                  {job.speed}
                  {job.eta ? ` \u2022 ETA: ${job.eta}` : ''}
                </p>
              )}
            </div>
          )}
          {job.status === 'failed' && job.error && (
            <p className="text-[12px] text-red-400/70 mt-1 truncate">{job.error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {(job.status === 'running' || job.status === 'queued') && (
            <button onClick={onCancel} className="btn-danger text-[11px] px-2.5 py-1.5">
              Cancel
            </button>
          )}
          {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
            <button onClick={onRemove} className="text-gray-700 hover:text-gray-400 transition-colors p-1.5 rounded-lg hover:bg-surface-3">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 6l8 8M14 6l-8 8" />
              </svg>
            </button>
          )}
          <button
            onClick={onToggle}
            className="text-gray-700 hover:text-gray-400 transition-colors p-1.5 rounded-lg hover:bg-surface-3"
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            >
              <path d="M6 8l4 4 4-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded log view */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-surface-3/60 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h4 className="section-label">Log Output</h4>
            {job.inputPath && (
              <p className="text-[10px] font-mono text-gray-700 truncate max-w-xs">
                {job.inputPath}
              </p>
            )}
          </div>
          <div className="bg-surface-0 rounded-lg p-4 max-h-52 overflow-y-auto font-mono text-[10px] text-gray-500 leading-relaxed border border-surface-3/40">
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
