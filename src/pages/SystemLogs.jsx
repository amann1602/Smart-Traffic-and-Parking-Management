import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, XCircle, Clock } from 'lucide-react';

const LEVEL_CONFIG = {
  info:     { color: '#1d6ef5', bg: 'rgba(29,110,245,0.12)',  label: 'INFO' },
  warning:  { color: '#e6a800', bg: 'rgba(255,211,42,0.12)',  label: 'WARN' },
  critical: { color: '#ff4757', bg: 'rgba(255,71,87,0.12)',   label: 'CRIT' },
  success:  { color: '#16a34a', bg: 'rgba(22,163,74,0.12)',   label: 'OK' },
  error:    { color: '#ff4757', bg: 'rgba(255,71,87,0.12)',   label: 'ERR' },
};

export default function SystemLogs() {
  const { systemLogs } = useCityData();
  const { isAdmin } = useAuth();
  const [levelFilter,  setLevelFilter]  = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96 flex-col gap-4">
        <XCircle className="w-16 h-16 text-red-500 opacity-40" />
        <p style={{ color: 'var(--text-muted)' }}>Access Denied – Admin privileges required</p>
      </div>
    );
  }

  const modules = [...new Set(systemLogs.map(l => l.module))];
  const filtered = systemLogs.filter(log => {
    const levelOk  = levelFilter  === 'all' || log.level  === levelFilter;
    const moduleOk = moduleFilter === 'all' || log.module === moduleFilter;
    return levelOk && moduleOk;
  });

  const FilterBtn = ({ val, active, onClick, label, color }) => (
    <button onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
      style={{
        background: active ? (color ? `${color}15` : 'rgba(29,110,245,0.15)') : 'var(--bg-surface)',
        border:     `1px solid ${active ? (color || '#1d6ef5') + '50' : 'var(--border)'}`,
        color:      active ? (color || '#1d6ef5') : 'var(--text-muted)',
      }}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>System Activity Logs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Audit trail of all system events and actions</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-blue-500 border border-blue-500/20 hover:bg-blue-500/10 transition-colors">
          <Download className="w-3.5 h-3.5" />Export Logs
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: systemLogs.length,                                    color: '#1d6ef5' },
          { label: 'Critical',     value: systemLogs.filter(l => l.level === 'critical').length, color: '#ff4757' },
          { label: 'Warnings',     value: systemLogs.filter(l => l.level === 'warning').length,  color: '#e6a800' },
          { label: 'Info',         value: systemLogs.filter(l => l.level === 'info').length,     color: '#16a34a' },
        ].map((item, i) => (
          <div key={i} className="city-card p-4">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Level:</span>
          {['all', 'info', 'warning', 'critical'].map(l => {
            const cfg = LEVEL_CONFIG[l] || {};
            return (
              <FilterBtn key={l} val={l} active={levelFilter === l} label={l} color={cfg.color}
                onClick={() => setLevelFilter(l)} />
            );
          })}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Module:</span>
          {['all', ...modules].map(m => (
            <FilterBtn key={m} val={m} active={moduleFilter === m} label={m}
              onClick={() => setModuleFilter(m)} />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="city-card overflow-hidden">
        <div className="grid text-xs font-semibold uppercase tracking-wider px-4 py-3 border-b"
          style={{ gridTemplateColumns: '72px 1fr 100px 160px', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
          <span>Level</span><span>Action</span><span>Module</span><span>Time</span>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {filtered.slice(0, 50).map(log => {
            const cfg = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
            return (
              <div key={log.id} className="grid items-center px-4 py-2.5 transition-colors"
                style={{ gridTemplateColumns: '72px 1fr 100px 160px' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span className="px-2 py-0.5 rounded text-xs font-bold w-fit"
                  style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                <span className="text-xs truncate pr-4" style={{ color: 'var(--text-secondary)' }}>{log.action}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{log.module}</span>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {log.time instanceof Date ? log.time.toLocaleTimeString('en-IN') : new Date(log.time).toLocaleTimeString('en-IN')}
                </span>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No logs match your filter</p>
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Showing {Math.min(50, filtered.length)} of {filtered.length} entries · Logs retained for 7 days
      </p>
    </div>
  );
}
