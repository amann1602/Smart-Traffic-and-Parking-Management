import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, CheckCircle2, Clock, Car, MapPin, Filter, IndianRupee, Camera } from 'lucide-react';

function ViolationRow({ violation, isAdmin, onClear }) {
  const isActive = violation.status === 'Active';
  const statusColor = isActive ? '#ff4757' : '#16a34a';
  const statusBg    = isActive ? 'rgba(255,71,87,0.08)' : 'rgba(46,213,115,0.08)';
  const borderColor = isActive ? 'rgba(255,71,87,0.2)' : 'rgba(46,213,115,0.15)';
  const timeDiff = Math.round((Date.now() - new Date(violation.time).getTime()) / 60000);

  return (
    <div className="p-4 rounded-xl transition-all hover:scale-[1.005] animate-fade-in"
      style={{ background: statusBg, border: `1px solid ${borderColor}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${statusColor}12` }}>
            {isActive
              ? <AlertTriangle className="w-4 h-4" style={{ color: statusColor }} />
              : <CheckCircle2  className="w-4 h-4" style={{ color: statusColor }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{violation.type}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                {violation.status}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span className="truncate">{violation.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Car className="w-3 h-3 flex-shrink-0" style={{ color: '#a78bfa' }} />
                <span className="font-mono">{violation.vehicle}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3 flex-shrink-0" />
                {timeDiff < 1 ? 'Just now' : `${timeDiff}m ago`}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-yellow-600">
                <IndianRupee className="w-3 h-3 flex-shrink-0" />
                ₹{violation.fineAmount?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
        {isAdmin && isActive && (
          <button onClick={() => onClear(violation.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-600 border border-green-500/20 hover:bg-green-500/10 transition-colors flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />Resolve
          </button>
        )}
      </div>
    </div>
  );
}

export default function ViolationsPage() {
  const { violations, clearViolation, clearAllViolations, activeViolations, addViolation } = useCityData();
  const { isAdmin } = useAuth();
  const [filter, setFilter]     = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const violationTypes = [...new Set(violations.map(v => v.type))];
  const filtered = violations.filter(v => {
    const statusMatch = filter === 'all' || v.status.toLowerCase() === filter;
    const typeMatch   = typeFilter === 'all' || v.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const totalFines = violations.filter(v => v.status === 'Active').reduce((acc, v) => acc + (v.fineAmount || 0), 0);

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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Violation Detection</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>AI-powered illegal parking & traffic violation monitoring</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={clearAllViolations}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-green-600 border border-green-500/20 hover:bg-green-500/10 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />Resolve All
            </button>
            <button onClick={() => addViolation(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-500 border border-red-500/20 hover:bg-red-500/10 transition-colors">
              <Camera className="w-3.5 h-3.5" />Simulate
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active Violations', value: activeViolations, color: '#ff4757' },
          { label: 'Resolved Today',   value: violations.filter(v => v.status === 'Resolved').length, color: '#16a34a' },
          { label: 'Total Detected',   value: violations.length, color: '#1d6ef5' },
          { label: 'Pending Fines',    value: `₹${(totalFines/1000).toFixed(1)}K`, color: '#e6a800' },
        ].map((item, i) => (
          <div key={i} className="city-card p-4">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* AI indicator */}
      <div className="city-card p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(29,110,245,0.12)', border: '1px solid rgba(29,110,245,0.25)' }}>
          <Camera className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>AI Camera Network Active</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>10 IoT cameras monitoring all zones · Real-time violation detection enabled</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-600">
          <div className="w-2 h-2 rounded-full bg-green-400 blink" />Live
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {[{ key: 'all', label: 'All' }, { key: 'active', label: 'Active' }, { key: 'resolved', label: 'Resolved' }].map(f => (
            <FilterBtn key={f.key} val={f.key} label={f.label} />
          ))}
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="city-input pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none appearance-none">
            <option value="all">All Types</option>
            {violationTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No violations found</p>
          </div>
        ) : (
          filtered.map(v => <ViolationRow key={v.id} violation={v} isAdmin={isAdmin} onClear={clearViolation} />)
        )}
      </div>
    </div>
  );
}
