import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { Radio, Clock, Zap, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

const PHASE_CONFIG = {
  red:    { color: '#ff4757', label: 'RED',    grad: 'rgba(255,71,87,0.08)' },
  yellow: { color: '#e6a800', label: 'YELLOW', grad: 'rgba(255,211,42,0.08)' },
  green:  { color: '#16a34a', label: 'GREEN',  grad: 'rgba(46,213,115,0.08)' },
};

function TrafficSignalCard({ signal, onSetPhase, onToggleAuto, isAdmin, emergencyMode }) {
  const phase = PHASE_CONFIG[signal.phase] || PHASE_CONFIG.red;

  return (
    <div className="city-card p-4 stat-card relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none rounded-xl" style={{ background: phase.grad }} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{signal.name}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{signal.area} · {signal.signalId}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {!signal.autoMode && !emergencyMode && (
              <span className="text-xs px-2 py-0.5 rounded-full text-yellow-600 border border-yellow-400/30 bg-yellow-400/10">Manual</span>
            )}
          </div>
        </div>

        {/* Signal + info */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            {['red', 'yellow', 'green'].map(p => (
              <div key={p} className="w-6 h-6 rounded-full transition-all duration-500"
                style={{
                  background: signal.phase === p ? PHASE_CONFIG[p].color : 'var(--border)',
                  boxShadow:  signal.phase === p ? `0 0 12px ${PHASE_CONFIG[p].color}` : 'none',
                }} />
            ))}
          </div>

          <div className="flex-1">
            <div className="text-2xl font-bold mb-1" style={{ color: phase.color }}>{phase.label}</div>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3 h-3" />
              {signal.timer > 900 ? '∞' : `${signal.timer}s`} remaining
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Load</div>
            <div className="text-lg font-bold" style={{
              color: signal.density >= 70 ? '#ff4757' : signal.density >= 35 ? '#e6a800' : '#16a34a'
            }}>{signal.density}%</div>
            <div className="w-16 h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{
                width: `${signal.density}%`,
                background: signal.density >= 70 ? '#ff4757' : signal.density >= 35 ? '#e6a800' : '#16a34a',
              }} />
            </div>
          </div>
        </div>

        {signal.timer < 900 && (
          <div className="mb-4">
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100,(signal.timer/60)*100)}%`, background: phase.color }} />
            </div>
          </div>
        )}

        {isAdmin && !emergencyMode ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Auto Mode</span>
              <button onClick={() => onToggleAuto(signal.id)} className="flex items-center gap-1.5">
                {signal.autoMode
                  ? <ToggleRight className="w-5 h-5 text-blue-500" />
                  : <ToggleLeft  className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                <span className="text-xs" style={{ color: signal.autoMode ? '#1d6ef5' : 'var(--text-muted)' }}>
                  {signal.autoMode ? 'AUTO' : 'MANUAL'}
                </span>
              </button>
            </div>
            <div className="flex gap-1.5">
              {['red','green','yellow'].map(p => (
                <button key={p} onClick={() => onSetPhase(signal.id, p)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all hover:scale-105"
                  style={{
                    background: `${PHASE_CONFIG[p].color}18`,
                    border: `1px solid ${PHASE_CONFIG[p].color}40`,
                    color: PHASE_CONFIG[p].color,
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <Zap className="w-3 h-3" />
            {emergencyMode ? 'Emergency override' : 'AI-controlled signal'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignalsPage() {
  const { signals, setSignalPhase, toggleSignalAuto, emergencyMode, activateEmergency, deactivateEmergency } = useCityData();
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState('all');

  const filtered = signals.filter(s =>
    filter === 'all' ? true : filter === 'manual' ? !s.autoMode : s.phase === filter
  );

  const counts = {
    green:  signals.filter(s => s.phase === 'green').length,
    yellow: signals.filter(s => s.phase === 'yellow').length,
    red:    signals.filter(s => s.phase === 'red').length,
    manual: signals.filter(s => !s.autoMode).length,
  };

  const FilterBtn = ({ val, label }) => (
    <button onClick={() => setFilter(val)}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
      style={{
        background: filter === val ? 'rgba(29,110,245,0.15)' : 'var(--bg-surface)',
        border:     `1px solid ${filter === val ? 'rgba(29,110,245,0.5)' : 'var(--border)'}`,
        color:      filter === val ? '#1d6ef5' : 'var(--text-muted)',
      }}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Smart Signal Control</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>AI-adaptive traffic signal management · {signals.length} signals active</p>
        </div>
        {isAdmin && (
          <button
            onClick={emergencyMode ? deactivateEmergency : activateEmergency}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105"
            style={{
              background: emergencyMode ? '#374151' : 'linear-gradient(135deg,#ff4757,#c0392b)',
              boxShadow: emergencyMode ? 'none' : '0 4px 20px rgba(255,71,87,0.4)',
            }}>
            {emergencyMode ? <><CheckCircle2 className="w-4 h-4" />Deactivate Emergency</> : <><AlertTriangle className="w-4 h-4" />Activate Emergency</>}
          </button>
        )}
      </div>

      {emergencyMode && (
        <div className="p-4 rounded-xl text-center emergency-mode border border-red-500/40">
          <p className="text-red-500 font-bold text-lg">🚨 EMERGENCY CORRIDOR ACTIVE – All Signals GREEN</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Green',  count: counts.green,  color: '#16a34a' },
          { label: 'Yellow', count: counts.yellow, color: '#e6a800' },
          { label: 'Red',    count: counts.red,    color: '#ff4757' },
          { label: 'Manual', count: counts.manual, color: '#1d6ef5' },
        ].map(item => (
          <div key={item.label} className="city-card p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
            <div className="w-full h-1 rounded-full mt-2" style={{ background: `${item.color}20` }}>
              <div className="h-full rounded-full" style={{ width: `${(item.count/signals.length)*100}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',    label: 'All Signals' },
          { key: 'green',  label: 'Green' },
          { key: 'yellow', label: 'Yellow' },
          { key: 'red',    label: 'Red' },
          { key: 'manual', label: 'Manual Override' },
        ].map(f => <FilterBtn key={f.key} val={f.key} label={f.label} />)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(sig => (
          <TrafficSignalCard key={sig.id} signal={sig} onSetPhase={setSignalPhase} onToggleAuto={toggleSignalAuto} isAdmin={isAdmin} emergencyMode={emergencyMode} />
        ))}
      </div>
    </div>
  );
}
