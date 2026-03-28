import React, { useState } from 'react';
import { AppState } from '../hooks/useStore';
import { Preset, ConversionOptions, VideoCodec, AudioCodec, Container } from '../../shared/types';

interface Props {
  store: AppState;
}

export default function PresetsPage({ store }: Props) {
  const [editing, setEditing] = useState<Preset | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const builtIn = store.presets.filter((p) => p.isBuiltIn);
  const custom = store.presets.filter((p) => !p.isBuiltIn);

  const handleDelete = async (presetId: string) => {
    if (!window.api) return;
    const updated = await window.api.deletePreset(presetId);
    store.setPresets(updated);
  };

  const handleSave = async (preset: Preset) => {
    if (!window.api) return;
    const updated = await window.api.savePreset(preset);
    store.setPresets(updated);
    setEditing(null);
    setShowNewForm(false);
  };

  return (
    <div className="px-8 pb-8 -mt-2 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Presets</h2>
          <p className="page-subtitle">Manage transcoding presets for quick conversion</p>
        </div>
        <button
          onClick={() => {
            setShowNewForm(true);
            setEditing({
              id: crypto.randomUUID(),
              name: '',
              description: '',
              options: {
                videoCodec: 'libx264',
                audioCodec: 'aac',
                container: 'mp4',
                crf: 18,
                audioBitrate: '192k',
                hwAccel: 'none',
              },
              createdAt: new Date().toISOString(),
              isBuiltIn: false,
            });
          }}
          className="btn-primary"
        >
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10 4v12M4 10h12" />
            </svg>
            New Preset
          </span>
        </button>
      </div>

      {/* Edit / New form */}
      {editing && (
        <PresetForm
          preset={editing}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setShowNewForm(false);
          }}
        />
      )}

      {/* Built-in presets */}
      <div>
        <h3 className="section-label mb-3">Built-in Presets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {builtIn.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      </div>

      {/* Custom presets */}
      {custom.length > 0 && (
        <div>
          <h3 className="section-label mb-3">Custom Presets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {custom.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onEdit={() => setEditing(preset)}
                onDelete={() => handleDelete(preset.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PresetCard({
  preset,
  onEdit,
  onDelete,
}: {
  preset: Preset;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="card group hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-gray-200">{preset.name}</h4>
          <p className="text-[12px] text-gray-600 mt-0.5 truncate">{preset.description}</p>
        </div>
        {!preset.isBuiltIn && (
          <div className="flex gap-2 ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button onClick={onEdit} className="text-[11px] font-medium text-gray-600 hover:text-gray-300 transition-colors px-1.5 py-0.5 rounded hover:bg-surface-3">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="text-[11px] font-medium text-red-500/50 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-500/10">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className="badge bg-surface-3/80 text-gray-400 border border-surface-4/50">
          {preset.options.videoCodec === 'copy' ? 'Copy' : preset.options.videoCodec}
        </span>
        <span className="badge bg-surface-3/80 text-gray-400 border border-surface-4/50">
          {preset.options.audioCodec}
        </span>
        <span className="badge bg-surface-3/80 text-gray-400 border border-surface-4/50">
          .{preset.options.container}
        </span>
        {preset.options.crf !== undefined && (
          <span className="badge bg-accent/10 text-accent-hover border border-accent/20">
            CRF {preset.options.crf}
          </span>
        )}
      </div>
    </div>
  );
}

function PresetForm({
  preset,
  onSave,
  onCancel,
}: {
  preset: Preset;
  onSave: (p: Preset) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(preset.name);
  const [description, setDescription] = useState(preset.description);
  const [options, setOptions] = useState<ConversionOptions>(preset.options);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...preset, name, description, options });
  };

  return (
    <form onSubmit={handleSubmit} className="card border-accent/30 shadow-glow-sm animate-fade-in space-y-5">
      <h3 className="text-[14px] font-bold text-gray-200">
        {preset.name ? 'Edit Preset' : 'New Preset'}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-medium text-gray-400 mb-2">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Preset"
            required
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-400 mb-2">Description</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description..."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-[12px] font-medium text-gray-400 mb-2">Video Codec</label>
          <select
            className="input"
            value={options.videoCodec}
            onChange={(e) => setOptions({ ...options, videoCodec: e.target.value as VideoCodec })}
          >
            <option value="libx264">H.264</option>
            <option value="libx265">H.265 (HEVC)</option>
            <option value="prores_ks">ProRes</option>
            <option value="dnxhd">DNxHD</option>
            <option value="libaom-av1">AV1</option>
            <option value="copy">No Video / Copy</option>
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-400 mb-2">Audio Codec</label>
          <select
            className="input"
            value={options.audioCodec}
            onChange={(e) => setOptions({ ...options, audioCodec: e.target.value as AudioCodec })}
          >
            <option value="aac">AAC</option>
            <option value="libmp3lame">MP3</option>
            <option value="pcm_s16le">WAV 16-bit</option>
            <option value="pcm_s24le">WAV 24-bit</option>
            <option value="flac">FLAC</option>
            <option value="copy">Copy</option>
          </select>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-400 mb-2">Container</label>
          <select
            className="input"
            value={options.container}
            onChange={(e) => setOptions({ ...options, container: e.target.value as Container })}
          >
            <option value="mp4">MP4</option>
            <option value="mkv">MKV</option>
            <option value="mov">MOV</option>
            <option value="mxf">MXF</option>
            <option value="wav">WAV</option>
            <option value="mp3">MP3</option>
            <option value="flac">FLAC</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-medium text-gray-400 mb-2">CRF</label>
          <input
            type="number"
            className="input"
            min={0}
            max={51}
            value={options.crf ?? ''}
            onChange={(e) =>
              setOptions({ ...options, crf: e.target.value ? parseInt(e.target.value) : undefined })
            }
            placeholder="Leave empty for bitrate mode"
          />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-400 mb-2">Audio Bitrate</label>
          <select
            className="input"
            value={options.audioBitrate ?? ''}
            onChange={(e) => setOptions({ ...options, audioBitrate: e.target.value || undefined })}
          >
            <option value="">Default</option>
            <option value="96k">96k</option>
            <option value="128k">128k</option>
            <option value="192k">192k</option>
            <option value="256k">256k</option>
            <option value="320k">320k</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2.5 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={!name.trim()}>
          Save Preset
        </button>
      </div>
    </form>
  );
}
