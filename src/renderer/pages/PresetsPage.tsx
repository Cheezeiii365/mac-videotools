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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Presets</h2>
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
          className="btn-primary text-sm"
        >
          + New Preset
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
        <h3 className="text-sm font-medium text-gray-400 mb-3">Built-in Presets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {builtIn.map((preset) => (
            <PresetCard key={preset.id} preset={preset} />
          ))}
        </div>
      </div>

      {/* Custom presets */}
      {custom.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-3">Custom Presets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
    <div className="card flex flex-col gap-1.5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-medium">{preset.name}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
        </div>
        {!preset.isBuiltIn && (
          <div className="flex gap-1.5 ml-2">
            {onEdit && (
              <button onClick={onEdit} className="text-xs text-gray-500 hover:text-gray-300">
                Edit
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="text-xs text-red-500/60 hover:text-red-400">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        <span className="badge bg-surface-3 text-gray-400">
          {preset.options.videoCodec === 'copy' ? 'No video' : preset.options.videoCodec}
        </span>
        <span className="badge bg-surface-3 text-gray-400">{preset.options.audioCodec}</span>
        <span className="badge bg-surface-3 text-gray-400">.{preset.options.container}</span>
        {preset.options.crf !== undefined && (
          <span className="badge bg-surface-3 text-gray-400">CRF {preset.options.crf}</span>
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
    <form onSubmit={handleSubmit} className="card space-y-4 border-accent/30">
      <h3 className="text-sm font-medium text-gray-300">
        {preset.name ? 'Edit Preset' : 'New Preset'}
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Custom Preset"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Description</label>
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
          <label className="block text-xs text-gray-500 mb-1">Video Codec</label>
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
          <label className="block text-xs text-gray-500 mb-1">Audio Codec</label>
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
          <label className="block text-xs text-gray-500 mb-1">Container</label>
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
          <label className="block text-xs text-gray-500 mb-1">CRF</label>
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
          <label className="block text-xs text-gray-500 mb-1">Audio Bitrate</label>
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

      <div className="flex gap-2 justify-end">
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
