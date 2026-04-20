import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area, Cell
} from 'recharts';
import {
  Car, ParkingSquare, AlertTriangle, Zap, TrendingUp, TrendingDown, Minus,
  Activity, Radio, Map, ArrowRight, Siren, CheckCircle2, ShieldAlert,
  CreditCard, MapPin, Sparkles, Clock, Shield, Route, Brain, Settings,
  BarChart3, Layers, Eye, Lock, Cpu
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-effect px-3 py-2 rounded-lg text-xs border border-white/10 shadow-xl">
      <p className="mb-1 opacity-70">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

// ─── ADMIN DASHBOARD ────────────────────────────────────────────────────────
function AdminDashboard({ data }) {
  const {
    avgDensity, totalVehicles, totalParking, availableParking,
    activeViolations, emergencyMode, trendHistory, trafficData, parkingData,
    signals, getDensityLabel, violations, activateEmergency, deactivateEmergency, setSignalPhase
  } = data;
  const toggleEmergencyMode = () => emergencyMode ? deactivateEmergency() : activateEmergency();
  const { user } = useAuth();
  const navigate = useNavigate();

  const densityLabel = getDensityLabel(avgDensity);
  const densityColor = avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#ffd32a' : '#2ed573';
  const densityEmoji = avgDensity >= 70 ? '🔴' : avgDensity >= 35 ? '🟡' : '🟢';

  const handleManualOverride = (id) => {
    alert(`⚙️ Signal ${id} timing adjusted by +15s. Auto-optimization engaged.`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* ── Admin Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'rgba(255,71,87,0.12)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)' }}>
              <div className="w-1 h-1 rounded-full bg-red-500 blink" /> ADMIN MODE
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'rgba(46,213,115,0.1)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.25)' }}>
              <div className="w-1 h-1 rounded-full bg-green-500 blink" /> LIVE DATA
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Control Center, <span style={{ background: 'linear-gradient(135deg, #ff4757, #ff9f43)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm opacity-70 mt-1">🛡️ Admin: Full system control enabled · {user?.designation}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold uppercase tracking-wider opacity-40">System Time</p>
            <p className="text-lg font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <button
            onClick={toggleEmergencyMode}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-lg ${emergencyMode ? 'text-white' : 'text-red-500 hover:bg-red-500/10'}`}
            style={{
              background: emergencyMode ? 'linear-gradient(135deg,#ff4757,#c0392b)' : 'var(--bg-card)',
              border: emergencyMode ? 'none' : '2px solid rgba(255,71,87,0.4)',
              boxShadow: emergencyMode ? '0 8px 30px rgba(255,71,87,0.4)' : 'none',
              animation: emergencyMode ? 'emergencyPulse 1.5s infinite' : 'none',
            }}
          >
            <Siren size={18} />
            {emergencyMode ? '🚨 DEACTIVATE EMERGENCY' : 'EMERGENCY OVERRIDE 🚑'}
          </button>
        </div>
      </div>

      {/* ── Admin Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'System Density', value: `${densityEmoji} ${avgDensity}%`, sub: densityLabel + ' Density', icon: Activity, color: densityColor, action: () => navigate('/traffic') },
          { label: 'Active Vehicles', value: totalVehicles.toLocaleString(), sub: 'City-wide load', icon: Car, color: '#1d6ef5', action: () => navigate('/traffic') },
          { label: 'Active Violations', value: activeViolations, sub: 'Requires Action 🚫', icon: ShieldAlert, color: '#ff4757', action: () => navigate('/violations') },
          { label: 'Emergency Status', value: emergencyMode ? '🚨 ACTIVE' : '✅ IDLE', sub: emergencyMode ? 'Corridor Live' : 'All Clear', icon: Siren, color: emergencyMode ? '#ff4757' : '#2ed573', action: () => navigate('/emergency') },
        ].map((card, i) => (
          <div key={i} onClick={card.action} className="city-card p-5 group hover:translate-y-[-4px] transition-all cursor-pointer"
            style={{ borderTop: `3px solid ${card.color}` }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl" style={{ background: `${card.color}15` }}>
                <card.icon size={22} style={{ color: card.color }} />
              </div>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: card.color }} />
            </div>
            <h3 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>{card.value}</h3>
            <p className="text-xs opacity-50 font-medium mb-1">{card.label}</p>
            <p className="text-xs font-bold" style={{ color: card.color }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Admin Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Signal Control + Traffic Graph */}
        <div className="lg:col-span-8 space-y-6">

          {/* Signal Control Center */}
          <div className="city-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Radio size={20} className="text-blue-500" /> Signal Control Center ⚙️
                </h2>
                <p className="text-xs opacity-50 mt-0.5">Manual override · Real-time phase control</p>
              </div>
              <button onClick={() => navigate('/signals')}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'rgba(29,110,245,0.1)', color: '#1d6ef5', border: '1px solid rgba(29,110,245,0.2)' }}>
                Full Signal Map →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {signals.slice(0, 4).map(sig => (
                <div key={sig.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1 items-center p-1.5 bg-black/40 rounded-full border border-white/10">
                      <div className={`w-3 h-3 rounded-full ${sig.phase === 'red' ? 'signal-red' : 'bg-red-900/30'}`} />
                      <div className={`w-3 h-3 rounded-full ${sig.phase === 'yellow' ? 'signal-yellow' : 'bg-yellow-900/30'}`} />
                      <div className={`w-3 h-3 rounded-full ${sig.phase === 'green' ? 'signal-green' : 'bg-green-900/30'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{sig.name}</p>
                      <p className="text-xs opacity-50">Timer: <span className="font-mono text-blue-400 font-bold">{sig.timer}s</span></p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button onClick={() => setSignalPhase(sig.id, 'green')}
                      className="px-2 py-1 rounded text-[9px] font-bold transition-all hover:scale-105"
                      style={{ background: 'rgba(46,213,115,0.15)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.3)' }}>
                      GREEN
                    </button>
                    <button onClick={() => handleManualOverride(sig.id)}
                      className="px-2 py-1 rounded text-[9px] font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all">
                      OVERRIDE
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Admin Quick Actions */}
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-3 gap-2">
              {[
                { label: '🚦 Change Timing', action: () => alert('Signal timing override: +15s applied to all signals'), color: '#1d6ef5' },
                { label: '🚑 Emergency Mode', action: toggleEmergencyMode, color: '#ff4757' },
                { label: '📊 View Violations', action: () => navigate('/violations'), color: '#ffd32a' },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold transition-all hover:scale-105 text-center"
                  style={{ background: `${btn.color}12`, border: `1px solid ${btn.color}30`, color: btn.color }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Traffic Trend */}
          <div className="city-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity size={18} className="text-blue-500" /> Network Density Analytics
              </h3>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500 text-white">LIVE</button>
                <button className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>24H</button>
              </div>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendHistory.slice(-15)}>
                  <defs>
                    <linearGradient id="areaAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff4757" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="density" stroke="#ff4757" fillOpacity={1} fill="url(#areaAdmin)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: AI + Violations + System */}
        <div className="lg:col-span-4 space-y-6">

          {/* AI Insights */}
          <div className="rounded-3xl p-6 relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #1a0a2e, #2d1b69)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-all">
              <Brain size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/15">
                <Sparkles size={12} className="text-yellow-300" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white">Gemini AI</span>
              </div>
              <h3 className="text-lg font-bold mb-3 text-white">🤖 AI Admin Insights</h3>
              <div className="space-y-3">
                {[
                  { tag: 'PREDICTION', msg: 'Peak traffic at 6:15 PM — Shivaji Nagar. Signal override recommended.', color: '#a78bfa' },
                  { tag: 'ALERT', msg: 'Baner Road anomaly detected. 92% density. Camera triggered.', color: '#ff4757' },
                  { tag: 'ACTION', msg: '15% traffic redirected to FC Road bypass via AI routing.', color: '#2ed573' },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/8 border border-white/10 hover:bg-white/12 transition-all">
                    <p className="text-[9px] font-black mb-1" style={{ color: item.color }}>{item.tag}</p>
                    <p className="text-xs text-white/80 leading-relaxed">{item.msg}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/ai-alerts')}
                className="w-full mt-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 border border-white/15 hover:bg-white/20 transition-all flex items-center justify-center gap-1">
                View All AI Alerts <ArrowRight size={12} />
              </button>
            </div>
          </div>

          {/* Violations Panel */}
          <div className="city-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <ShieldAlert size={16} className="text-red-500" /> System Violations 🚫
              </h3>
              <button onClick={() => navigate('/violations')} className="text-[10px] font-bold text-red-400 hover:text-red-500">View All →</button>
            </div>
            <div className="space-y-2">
              {violations.slice(0, 3).map(v => (
                <div key={v.id} className="p-3 rounded-xl flex items-center justify-between group"
                  style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.12)' }}>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-red-500 uppercase">{v.type}</p>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{v.vehicle}</p>
                    <p className="text-[10px] opacity-40">₹{v.fineAmount?.toLocaleString('en-IN')}</p>
                  </div>
                  <button className="p-2 rounded-xl bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all">
                    <CheckCircle2 size={12} />
                  </button>
                </div>
              ))}
              {violations.length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle2 size={24} className="mx-auto text-green-500 mb-2" />
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No active violations</p>
                </div>
              )}
            </div>
          </div>

          {/* System Health */}
          <div className="city-card p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Cpu size={16} className="text-green-500" /> System Health
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'AI Engine', value: '100%', color: '#2ed573' },
                { label: 'IoT Sensors', value: '10/10', color: '#2ed573' },
                { label: 'Signal Network', value: `${signals.length} Online`, color: '#1d6ef5' },
                { label: 'Camera Feed', value: 'Active', color: '#a78bfa' },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span className="font-bold flex items-center gap-1" style={{ color: s.color }}>
                    <div className="w-1.5 h-1.5 rounded-full blink" style={{ background: s.color }} />
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/logs')}
              className="w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              View System Logs →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USER DASHBOARD ──────────────────────────────────────────────────────────
function UserDashboard({ data }) {
  const {
    avgDensity, availableParking, trendHistory, trafficData,
    getDensityLabel, violations, reserveSlot, parkingData
  } = data;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedFine, setSelectedFine] = useState(null);

  const densityLabel = getDensityLabel(avgDensity);
  const densityColor = avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#ffd32a' : '#2ed573';
  const densityEmoji = avgDensity >= 70 ? '🔴' : avgDensity >= 35 ? '🟡' : '🟢';

  const handleBookSlot = (slot) => {
    if (bookedSlots.includes(slot)) {
      setBookedSlots(prev => prev.filter(s => s !== slot));
    } else {
      setBookedSlots(prev => [...prev, slot]);
      alert(`✅ Slot ${slot} reserved for 2 hours! You'll get a reminder 15 min before expiry.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* ── User Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'rgba(29,110,245,0.12)', color: '#1d6ef5', border: '1px solid rgba(29,110,245,0.3)' }}>
              <div className="w-1 h-1 rounded-full bg-blue-500 blink" /> CITIZEN PORTAL
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'rgba(46,213,115,0.1)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.25)' }}>
              <div className="w-1 h-1 rounded-full bg-green-500 blink" /> LIVE DATA
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Hello, <span style={{ background: 'linear-gradient(135deg, #60a5fa, #00d4ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm opacity-60 mt-1">👥 Citizen: Live traffic monitoring & services · Pune Smart City</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/parking')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #1d6ef5, #0d4ed8)', color: 'white', boxShadow: '0 4px 15px rgba(29,110,245,0.3)' }}>
            <ParkingSquare size={16} /> Book Parking
          </button>
          <button onClick={() => navigate('/routes')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'rgba(46,213,115,0.12)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.3)' }}>
            <Route size={16} /> Routes
          </button>
        </div>
      </div>

      {/* ── User Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Traffic Near Me', value: `${densityEmoji} ${avgDensity}%`, sub: densityLabel + ' Density', icon: Activity, color: densityColor, action: () => navigate('/traffic') },
          { label: 'Parking Available', value: availableParking, sub: 'Slots near you', icon: ParkingSquare, color: '#2ed573', action: () => navigate('/parking') },
          { label: 'My Pending Fine', value: '₹500', sub: 'MH12 AB 1234 · Unpaid', icon: CreditCard, color: '#ff4757', action: () => navigate('/violations') },
          { label: 'Safe Routes', value: '4 Active', sub: 'AI optimized today', icon: Route, color: '#1d6ef5', action: () => navigate('/routes') },
        ].map((card, i) => (
          <div key={i} onClick={card.action} className="city-card p-5 group hover:translate-y-[-4px] transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl" style={{ background: `${card.color}15` }}>
                <card.icon size={22} style={{ color: card.color }} />
              </div>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: card.color }} />
            </div>
            <h3 className="text-2xl font-bold mb-1 tracking-tight" style={{ color: 'var(--text-primary)' }}>{card.value}</h3>
            <p className="text-xs opacity-50 font-medium mb-1">{card.label}</p>
            <p className="text-xs font-bold" style={{ color: card.color }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── User Quick Actions ── */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {[
          { label: '🅿️ Book Parking', action: () => navigate('/parking'), color: '#1d6ef5', desc: 'Reserve a slot near you' },
          { label: '🚦 Check Traffic', action: () => navigate('/traffic'), color: '#2ed573', desc: 'Live density map' },
          { label: '💰 Pay Fine', action: () => navigate('/violations'), color: '#ff4757', desc: 'Clear pending dues' },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action}
            className="city-card p-4 text-left transition-all hover:scale-[1.02] hover:shadow-xl"
            style={{ borderTop: `3px solid ${btn.color}` }}>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{btn.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{btn.desc}</p>
          </button>
        ))}
      </div>

      {/* ── Main User Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Parking + Chart */}
        <div className="lg:col-span-8 space-y-6">

          {/* Smart Parking Slot Picker */}
          <div className="city-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <ParkingSquare size={20} className="text-blue-500" /> Reserve Parking Slot 🅿️
                </h2>
                <p className="text-xs opacity-50 mt-0.5">FC Road Multi-level Parking Hub · Click to reserve</p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Free</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Taken</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Mine</span>
              </div>
            </div>

            {/* Row A */}
            <div className="mb-4">
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>ROW A</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {['A1','A2','A3','A4','A5','A6','A7','A8'].map((slot, i) => {
                  const isOccupied = [0, 3, 6].includes(i);
                  const isMine = bookedSlots.includes(slot);
                  return (
                    <button key={slot} disabled={isOccupied && !isMine} onClick={() => handleBookSlot(slot)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all text-xs font-bold ${
                        isMine ? 'bg-blue-500 border-blue-400 text-white scale-105 shadow-lg shadow-blue-500/20' :
                        isOccupied ? 'bg-red-500/10 border-red-500/20 text-red-400 opacity-60 cursor-not-allowed' :
                        'bg-green-500/10 border-green-500/20 text-green-500 hover:border-green-500 hover:bg-green-500/20 hover:scale-105'
                      }`}>
                      {slot}
                      {isMine ? '✓' : isOccupied ? '✗' : '●'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row B */}
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>ROW B</p>
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {['B1','B2','B3','B4','B5','B6','B7','B8'].map((slot, i) => {
                  const isOccupied = [1, 4, 7].includes(i);
                  const isMine = bookedSlots.includes(slot);
                  return (
                    <button key={slot} disabled={isOccupied && !isMine} onClick={() => handleBookSlot(slot)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 border-2 transition-all text-xs font-bold ${
                        isMine ? 'bg-blue-500 border-blue-400 text-white scale-105 shadow-lg shadow-blue-500/20' :
                        isOccupied ? 'bg-red-500/10 border-red-500/20 text-red-400 opacity-60 cursor-not-allowed' :
                        'bg-green-500/10 border-green-500/20 text-green-500 hover:border-green-500 hover:bg-green-500/20 hover:scale-105'
                      }`}>
                      {slot}
                      {isMine ? '✓' : isOccupied ? '✗' : '●'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {bookedSlots.length > 0 ? `✅ You reserved: ${bookedSlots.join(', ')}` : 'Click an available slot to reserve'}
              </p>
              {bookedSlots.length > 0 && (
                <button onClick={() => navigate('/parking')}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(29,110,245,0.1)', color: '#1d6ef5', border: '1px solid rgba(29,110,245,0.2)' }}>
                  Manage Bookings
                </button>
              )}
            </div>
          </div>

          {/* Traffic Graph */}
          <div className="city-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity size={18} className="text-blue-500" /> Live Traffic At My Location
              </h3>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500 text-white">LIVE</button>
                <button className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>6H</button>
              </div>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendHistory.slice(-15)}>
                  <defs>
                    <linearGradient id="areaUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d6ef5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1d6ef5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="density" stroke="#1d6ef5" fillOpacity={1} fill="url(#areaUser)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Now', value: `${densityEmoji} ${avgDensity}%`, color: densityColor },
                { label: 'Peak Today', value: '🔴 84%', color: '#ff4757' },
                { label: 'Best Time', value: '🟢 11 AM', color: '#2ed573' },
              ].map((s, i) => (
                <div key={i} className="p-2 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                  <p className="text-xs font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: AI + Pay Fine + Map */}
        <div className="lg:col-span-4 space-y-6">

          {/* AI Insights for User */}
          <div className="rounded-3xl p-5 relative overflow-hidden group"
            style={{ background: 'linear-gradient(135deg, #0a1f4e, #1d3a8f)', border: '1px solid rgba(29,110,245,0.3)' }}>
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Sparkles size={100} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 bg-white/10 w-fit px-2.5 py-1 rounded-full border border-white/15">
                <Sparkles size={11} className="text-yellow-300" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white">AI for You</span>
              </div>
              <h3 className="text-base font-bold text-white mb-3">🤖 AI Traffic Insights</h3>
              <div className="space-y-2">
                {[
                  { msg: '🕕 Traffic will surge at 6 PM. Leave by 5 PM.', color: '#ffd32a' },
                  { msg: '🚫 Avoid Hinjewadi route today — 89% congested.', color: '#ff4757' },
                  { msg: '✅ FC Road → Baner is fastest route now.', color: '#2ed573' },
                ].map((item, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-white/8 border border-white/10">
                    <p className="text-xs text-white/80 leading-relaxed">{item.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pay Fine Panel */}
          <div className="city-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CreditCard size={16} className="text-red-500" /> My Traffic Fine 💰
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.2)' }}>
                UNPAID
              </span>
            </div>
            <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,71,87,0.05)', border: '1px solid rgba(255,71,87,0.15)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold opacity-50 uppercase mb-0.5">Vehicle</p>
                  <p className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>MH12 AB 1234</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold opacity-50 uppercase mb-0.5">Fine Amount</p>
                  <p className="text-2xl font-black text-red-500">₹500</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl text-center" style={{ background: 'var(--bg-surface)' }}>
                <p className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>No Parking Zone Violation</p>
                <p className="text-[10px] opacity-50">Captured: Deccan Hub · 11:45 AM Today</p>
              </div>
              <button onClick={() => navigate('/violations')}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #ff4757, #c0392b)', boxShadow: '0 4px 15px rgba(255,71,87,0.3)' }}>
                💳 PAY NOW — ₹500
              </button>
            </div>
          </div>

          {/* City Map thumbnail */}
          <div className="city-card h-[180px] overflow-hidden relative group cursor-pointer"
            onClick={() => navigate('/map')}>
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80)' }}>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70" />
            <div className="absolute bottom-4 left-4 text-white group-hover:translate-x-1 transition-transform">
              <p className="text-xs font-bold opacity-70">Tap to Explore</p>
              <h4 className="text-base font-black tracking-tight">🗺️ CITY MAP</h4>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 blink" />
                <span className="text-[10px] font-bold">Live Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const cityData = useCityData();
  const { isAdmin } = useAuth();

  return isAdmin ? (
    <AdminDashboard data={cityData} />
  ) : (
    <UserDashboard data={cityData} />
  );
}
