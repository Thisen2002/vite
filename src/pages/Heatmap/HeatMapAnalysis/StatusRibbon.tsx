import React from 'react';

type Chip = { id: string; name: string; value: number; tone?: 'ok'|'warn'|'crit'|'info' };

interface Props {
  backendOnline: boolean;
  apiBase: string;
  horizonMin: number;
  lastSync: string;
  crowded: Chip[]; // value as utilization percent
  risers: Chip[];  // value as delta
  onChipClick?: (id: string) => void;
}

const dotClass = (tone?: Chip['tone']) => {
  if (tone === 'crit') return 'bg-red-500';
  if (tone === 'warn') return 'bg-orange-500';
  if (tone === 'info') return 'bg-indigo-500';
  return 'bg-emerald-500';
};

const StatusRibbon: React.FC<Props> = ({ backendOnline, apiBase, horizonMin, lastSync, crowded, risers, onChipClick }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/70 backdrop-blur-md shadow-sm">
      <div className="flex flex-wrap items-center gap-4 px-4 py-3">
        {/* Backend status */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className={`text-sm ${backendOnline ? 'text-emerald-700' : 'text-red-700'}`}>{backendOnline ? 'Backend online' : 'Backend offline'}</span>
          <span className="text-xs text-slate-500">API: {apiBase}</span>
        </div>

        {/* Horizon */}
        <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
          <span className="text-xs uppercase tracking-wider text-slate-500">Horizon</span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-900 text-white text-xs font-medium">{horizonMin} min</span>
        </div>

        {/* Last Sync */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-500">Last Sync</span>
          <span className="text-slate-700 text-sm">{lastSync || '--:--'}</span>
        </div>

        {/* Chips (right-aligned) */}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {crowded.map((c, i) => (
            <button
              key={`crowded-${c.id}`}
              onClick={() => onChipClick?.(c.id)}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium transition hover:bg-slate-200"
              style={{ animation: 'slideIn 0.35s ease-out', animationDelay: `${i * 60}ms` }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotClass(c.tone)}`} />
              {c.name} {Math.round(c.value)}%
            </button>
          ))}
          {risers.map((r, i) => (
            <button
              key={`riser-${r.id}`}
              onClick={() => onChipClick?.(r.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium transition hover:bg-indigo-100"
              style={{ animation: 'slideIn 0.4s ease-out', animationDelay: `${(i + 1) * 80}ms` }}
            >
              ↑ {r.name} +{Math.max(0, Math.round(r.value))}
            </button>
          ))}
        </div>
      </div>

      <style>
        {`@keyframes slideIn { from { opacity: 0; transform: translateY(-6px);} to {opacity:1; transform: translateY(0);} }`}
      </style>
    </div>
  );
};

export default StatusRibbon;
