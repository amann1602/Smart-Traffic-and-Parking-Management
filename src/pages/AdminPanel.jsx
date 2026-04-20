import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import {
  Settings, Activity, Radio, ParkingSquare, AlertTriangle,
  Siren, RefreshCw, Download, Plus, Minus, TrendingUp, Database, Shield,
  CheckCircle2, Camera, Sparkles, Lock, ShieldAlert, Cpu, Layers,
  Clock, BarChart3, Brain, Zap
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs"
      style={{ background: 'rgba(5,13,26,0.95)', border: '1px solid rgba(30,58,95,0.8)' }}>
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

const PIE_COLORS = ['#2ed573', '#ffd32a', '#ff4757'];

export default function AdminPanel() {
  const {
    trafficData, signals, parkingData, violations, systemLogs,
    avgDensity, totalVehicles, totalParking, availableParking, activeViolations,
    activateEmergency, deactivateEmergency, emergencyMode,
    clearAllViolations, clearViolation, addViolation, updateParkingSlots,
    setSignalPhase, trendHistory, getDensityLabel
  } = useCityData();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [signalTimings, setSignalTimings] = useState({});

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96 flex-col gap-4">
        <Lock className="w-16 h-16 text-red-400 opacity-40" />
        <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Access Denied</p>
        <p style={{ color: 'var(--text-muted)' }}>Admin privileges required to view this panel</p>
      </div>
    );
  }

  const trafficDistribution = [
    { name: 'Low', value: trafficData.filter(t => t.density < 35).length },
    { name: 'Medium', value: trafficData.filter(t => t.density >= 35 && t.density < 70).length },
    { name: 'High', value: trafficData.filter(t => t.density >= 70).length },
  ];

  const densityColor = avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#ffd32a' : '#2ed573';
  const densityEmoji = avgDensity >= 70 ? '🔴' : avgDensity >= 35 ? '🟡' : '🟢';

  const TABS = [
    { key: 'overview',    label: 'Overview',        icon: BarChart3 },
    { key: 'signals',     label: 'Signal Control',  icon: Radio },
    { key: 'violations',  label: 'Violations',       icon: ShieldAlert },
    { key: 'parking',     label: 'Parking Mgmt',    icon: ParkingSquare },
    { key: 'traffic',     label: 'Traffic Zones',   icon: Activity },
    { key: 'ai',          label: 'AI Engine',        icon: Brain },
  ];

  const handleTimingChange = (id, delta) => {
    setSignalTimings(prev => ({
      ...prev,
      [id]: Math.max(10, Math.min(120, (prev[id] || 30) + delta)
      )
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'rgba(255,71,87,0.12)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)' }}>
              <Shield size={10} /> ADMIN CONTROL
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>⚙️ Admin Control Panel</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Logged in as <span className="text-red-400 font-semibold">{user?.name}</span> · {user?.designation}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={{ background: 'rgba(29,110,245,0.1)', border: '1px solid rgba(29,110,245,0.2)', color: '#1d6ef5' }}>
            <Download className="w-3.5 h-3.5" /> Export Report
          </button>
          <button
            onClick={emergencyMode ? deactivateEmergency : activateEmergency}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all`}
            style={emergencyMode
              ? { background: 'rgba(55,65,81,0.8)', color: '#9ca3af', border: '1px solid rgba(75,85,99,0.3)' }
              : { background: 'linear-gradient(135deg, #ff4757, #c0392b)', color: 'white', boxShadow: '0 4px 15px rgba(255,71,87,0.35)' }}>
            <Siren className="w-3.5 h-3.5" />
            {emergencyMode ? '🔘 End Emergency' : '🚨 Emergency Mode'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Traffic Density', value: `${densityEmoji} ${avgDensity}%`, color: densityColor },
          { label: 'Total Vehicles', value: totalVehicles.toLocaleString(), color: '#60a5fa' },
          { label: 'Parking Free', value: availableParking, color: '#2ed573' },
          { label: 'Violations', value: activeViolations, color: '#ff4757' },
          { label: 'Signals Online', value: `${signals.length}/${signals.length}`, color: '#2ed573' },
          { label: 'System Health', value: '100% ✅', color: '#2ed573' },
        ].map((item, i) => (
          <div key={i} className="city-card p-3 text-center" style={{ borderTop: `2px solid ${item.color}` }}>
            <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: 'rgba(255,71,87,0.15)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'text-red-400 border-red-400' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Traffic Distribution Pie */}
            <div className="city-card p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <BarChart3 size={16} className="text-blue-500" /> Traffic Distribution
              </h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={140}>
                  <PieChart>
                    <Pie data={trafficDistribution} dataKey="value" innerRadius={35} outerRadius={60} paddingAngle={3}>
                      {trafficDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2.5">
                  {trafficDistribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.name}: </span>
                      <span className="font-bold text-xs" style={{ color: PIE_COLORS[i] }}>{d.value} zones</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Parking Bar Chart */}
            <div className="city-card p-5">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ParkingSquare size={16} className="text-green-500" /> Parking Status
              </h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={parkingData.map(p => ({ name: p.name.split(' ')[0], Free: p.available, Occupied: p.total - p.available }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,58,95,0.3)" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Free" fill="#2ed573" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Occupied" fill="#ff4757" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="city-card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Zap size={16} className="text-yellow-500" /> Quick Admin Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: '🚨 Emergency Mode', action: emergencyMode ? deactivateEmergency : activateEmergency, color: '#ff4757' },
                { label: '✅ Resolve All Fines', action: clearAllViolations, color: '#2ed573' },
                { label: '📸 Simulate Violation', action: () => addViolation(null), color: '#ffd32a' },
                { label: '🤖 View AI Alerts', action: () => navigate('/ai-alerts'), color: '#a78bfa' },
                { label: '🚦 Signal Map', action: () => navigate('/signals'), color: '#1d6ef5' },
                { label: '📊 System Logs', action: () => navigate('/logs'), color: '#00d4ff' },
                { label: '🅿️ Parking Mgmt', action: () => navigate('/parking'), color: '#2ed573' },
                { label: '⚙️ Signal Override', action: () => setActiveTab('signals'), color: '#ff9f43' },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action}
                  className="p-3.5 rounded-xl text-xs font-bold transition-all hover:scale-105 text-left"
                  style={{ background: `${btn.color}10`, border: `1px solid ${btn.color}25`, color: btn.color }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SIGNAL CONTROL TAB ── */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          {/* Emergency note */}
          {emergencyMode && (
            <div className="p-4 rounded-xl flex items-center gap-3 animate-fade-in"
              style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <Siren size={18} className="text-red-400 blink" />
              <div>
                <p className="font-bold text-sm text-red-400">Emergency Mode Active</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All signals forced GREEN. Manual override disabled.</p>
              </div>
            </div>
          )}

          <div className="city-card p-5">
            <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Radio size={16} className="text-blue-500" /> Signal Override & Timing Control
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Click phase buttons to override. Use +/- to adjust timing (seconds).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {signals.map(sig => {
                const timing = signalTimings[sig.id] || 30;
                return (
                  <div key={sig.id} className="p-4 rounded-2xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{sig.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sig.signalId || `SIG-00${sig.id}`}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{
                          background: sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757',
                          boxShadow: `0 0 8px ${sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757'}`,
                        }} />
                        <span className="text-xs font-bold uppercase" style={{
                          color: sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757',
                        }}>{sig.phase}</span>
                      </div>
                    </div>

                    {/* Phase buttons */}
                    <div className="flex gap-1.5 mb-3">
                      {['red', 'yellow', 'green'].map(phase => (
                        <button key={phase}
                          onClick={() => setSignalPhase(sig.id, phase)}
                          disabled={emergencyMode}
                          className="flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all hover:scale-105 disabled:opacity-40"
                          style={{
                            background: `${phase === 'green' ? '#2ed573' : phase === 'yellow' ? '#ffd32a' : '#ff4757'}18`,
                            border: `1px solid ${phase === 'green' ? '#2ed573' : phase === 'yellow' ? '#ffd32a' : '#ff4757'}35`,
                            color: phase === 'green' ? '#2ed573' : phase === 'yellow' ? '#ffd32a' : '#ff4757',
                          }}>
                          {phase}
                        </button>
                      ))}
                    </div>

                    {/* Timing control */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Timing:</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleTimingChange(sig.id, -5)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-all text-red-400"
                          style={{ border: '1px solid rgba(255,71,87,0.3)' }}>
                          <Minus size={10} />
                        </button>
                        <span className="font-mono font-bold text-sm" style={{ color: '#1d6ef5', minWidth: 40, textAlign: 'center' }}>{timing}s</span>
                        <button onClick={() => handleTimingChange(sig.id, 5)}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-green-500/20 transition-all text-green-400"
                          style={{ border: '1px solid rgba(46,213,115,0.3)' }}>
                          <Plus size={10} />
                        </button>
                      </div>
                      <button
                        onClick={() => alert(`✅ Signal ${sig.name} timing set to ${timing}s`)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        style={{ background: 'rgba(29,110,245,0.15)', color: '#1d6ef5', border: '1px solid rgba(29,110,245,0.3)' }}>
                        APPLY
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── VIOLATIONS TAB ── */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Active', value: activeViolations, color: '#ff4757' },
              { label: 'Resolved', value: violations.filter(v => v.status === 'Resolved').length, color: '#2ed573' },
              { label: 'Pending Fines', value: `₹${(violations.filter(v => v.status === 'Active').reduce((a, b) => a + (b.fineAmount || 0), 0) / 1000).toFixed(1)}K`, color: '#e6a800' },
            ].map((s, i) => (
              <div key={i} className="city-card p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={clearAllViolations}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573' }}>
              <CheckCircle2 size={14} /> Resolve All Violations
            </button>
            <button onClick={() => addViolation(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,71,87,0.12)', border: '1px solid rgba(255,71,87,0.3)', color: '#ff4757' }}>
              <Camera size={14} /> Simulate Violation
            </button>
          </div>

          {/* Violation list */}
          <div className="city-card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ShieldAlert size={16} className="text-red-500" /> All Active Violations
            </h3>
            <div className="space-y-2">
              {violations.filter(v => v.status === 'Active').length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 size={32} className="mx-auto text-green-500 mb-2" />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No active violations 🎉</p>
                </div>
              ) : (
                violations.filter(v => v.status === 'Active').map(v => (
                  <div key={v.id} className="p-3.5 rounded-xl flex items-center justify-between group"
                    style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.15)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-red-500 uppercase">{v.type}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: 'rgba(255,71,87,0.15)', color: '#ff4757' }}>ACTIVE</span>
                      </div>
                      <p className="text-xs font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{v.vehicle}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{v.location}</span>
                        <span className="text-yellow-500 font-bold">₹{v.fineAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <button onClick={() => clearViolation(v.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ml-3"
                      style={{ background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573' }}>
                      <CheckCircle2 size={12} /> Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PARKING MANAGEMENT TAB ── */}
      {activeTab === 'parking' && (
        <div className="space-y-4">
          <div className="city-card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <ParkingSquare size={16} className="text-green-500" /> Parking Management
            </h3>
            <div className="space-y-3">
              {parkingData.map(p => (
                <div key={p.id} className="p-4 rounded-xl"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{p.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm font-bold">{p.available}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ {p.total} free</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${((p.total - p.available) / p.total) * 100}%`,
                        background: 'linear-gradient(90deg, #ff4757, #ff6b35)',
                      }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateParkingSlots(p.id, 20)}
                        className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 border border-green-500/20 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => updateParkingSlots(p.id, -20)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TRAFFIC ZONES TAB ── */}
      {activeTab === 'traffic' && (
        <div className="space-y-4">
          <div className="city-card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Activity size={16} className="text-blue-500" /> Traffic Zone Management
            </h3>
            <div className="space-y-2">
              {trafficData.map(t => {
                const zoneColor = t.density >= 70 ? '#ff4757' : t.density >= 35 ? '#ffd32a' : '#2ed573';
                const zoneEmoji = t.density >= 70 ? '🔴' : t.density >= 35 ? '🟡' : '🟢';
                return (
                  <div key={t.id} className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{zoneEmoji}</span>
                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.area}</span>
                      </div>
                    </div>
                    <div className="w-24">
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${t.density}%`, background: zoneColor }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color: zoneColor }}>{t.density}%</span>
                    <span className="text-xs w-12" style={{ color: 'var(--text-muted)' }}>{t.vehicles} V</span>
                    <span className="text-xs w-16" style={{ color: 'var(--text-muted)' }}>{t.speed} km/h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AI ENGINE TAB ── */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(135deg, #1a0a2e, #2d1b69)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl" style={{ background: 'rgba(167,139,250,0.15)' }}>
                <Brain size={24} style={{ color: '#a78bfa' }} />
              </div>
              <div>
                <h3 className="font-bold text-white">Gemini AI Traffic Intelligence</h3>
                <p className="text-xs text-white/60">Powered by Google Gemini · Processing {trafficData.length} zones</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 blink" /> ONLINE
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Active Predictions', value: '6', color: '#a78bfa' },
                { label: 'Avg Confidence', value: '91%', color: '#2ed573' },
                { label: 'Actions Taken', value: '14', color: '#00d4ff' },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-white/50">{s.label}</p>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/ai-alerts')}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(29,110,245,0.2))', border: '1px solid rgba(167,139,250,0.3)' }}>
              🤖 View All AI Alerts & Predictions →
            </button>
          </div>

          {/* AI Summary Items */}
          <div className="city-card p-5">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Sparkles size={16} className="text-yellow-400" /> Latest AI Decisions
            </h3>
            <div className="space-y-3">
              {[
                { action: 'Signal Sync Optimization', result: 'Applied to 8 intersections', time: '2m ago', color: '#2ed573' },
                { action: 'Traffic Rerouting', result: '18% load shifted to bypass', time: '6m ago', color: '#1d6ef5' },
                { action: 'Violation Detection', result: 'MH12XX9923 — fine issued', time: '11m ago', color: '#ff4757' },
                { action: 'Parking Prediction', result: 'Deccan area full by 5 PM', time: '18m ago', color: '#ffd32a' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `${item.color}08`, border: `1px solid ${item.color}18` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0 blink" style={{ background: item.color }} />
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.action}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.result}</p>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
