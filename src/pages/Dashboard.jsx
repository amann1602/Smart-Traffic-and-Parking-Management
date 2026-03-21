import React from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  Car, ParkingSquare, AlertTriangle, Zap, TrendingUp, TrendingDown, Minus,
  Activity, Radio, Map, ArrowRight, Siren, CheckCircle2
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const {
    avgDensity, totalVehicles, totalParking, availableParking,
    activeViolations, emergencyMode, trendHistory, trafficData, parkingData,
    signals, getDensityLabel, violations
  } = useCityData();
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const densityLabel = getDensityLabel(avgDensity);
  const densityColor = avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#e6a800' : '#16a34a';
  const parkingPct = Math.round(((totalParking - availableParking) / totalParking) * 100);
  const greenSignals = signals.filter(s => s.phase === 'green').length;

  const statCards = [
    {
      id: 'card-density',
      label: 'Avg Traffic Density',
      value: `${avgDensity}%`,
      sub: densityLabel,
      icon: Activity,
      color: densityColor,
      trend: avgDensity > 60 ? 'up' : 'down',
      onClick: () => navigate('/traffic'),
    },
    {
      id: 'card-vehicles',
      label: 'Active Vehicles',
      value: totalVehicles.toLocaleString('en-IN'),
      sub: 'Across all zones',
      icon: Car,
      color: '#1d6ef5',
      trend: 'stable',
      onClick: () => navigate('/traffic'),
    },
    {
      id: 'card-parking',
      label: 'Parking Available',
      value: availableParking,
      sub: `${parkingPct}% occupied`,
      icon: ParkingSquare,
      color: availableParking < 50 ? '#ff4757' : '#16a34a',
      trend: availableParking > 100 ? 'up' : 'down',
      onClick: () => navigate('/parking'),
    },
    {
      id: 'card-violations',
      label: 'Active Violations',
      value: activeViolations,
      sub: 'Requires action',
      icon: AlertTriangle,
      color: activeViolations > 5 ? '#ff4757' : '#e6a800',
      trend: activeViolations > 3 ? 'up' : 'stable',
      onClick: () => navigate('/violations'),
    },
  ];

  const TrendIcon = ({ trend }) => {
    if (trend === 'up')   return <TrendingUp   className="w-3.5 h-3.5 text-red-500" />;
    if (trend === 'down') return <TrendingDown  className="w-3.5 h-3.5 text-green-500" />;
    return <Minus className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />;
  };

  const gridBorder  = isDark ? 'rgba(30,58,95,0.3)' : 'rgba(29,110,245,0.12)';
  const trackBg     = isDark ? 'rgba(30,58,95,0.5)' : 'rgba(29,110,245,0.1)';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},
            <span className="gradient-text ml-2">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? 'Full system control active' : 'Pune Smart City – Live Monitoring'} ·
            <span className="text-blue-500 ml-1">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </p>
        </div>

        {emergencyMode && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 font-bold text-sm border border-red-500/40 emergency-mode">
            <Siren className="w-4 h-4" />
            🚨 EMERGENCY CORRIDOR ACTIVE
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              id={card.id}
              onClick={card.onClick}
              className="city-card p-5 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl" style={{ background: `${card.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <TrendIcon trend={card.trend} />
              </div>
              <div className="count-animate">
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
                <p className="text-xs mt-0.5 font-semibold" style={{ color: card.color }}>{card.sub}</p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
                <span>View details</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Traffic trend */}
        <div className="city-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Traffic Density Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Real-time monitoring</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />
              Live
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendHistory.slice(-12)}>
              <defs>
                <linearGradient id="densGrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d6ef5" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1d6ef5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="parkGrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridBorder} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval={2} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="density"  name="Density %"  stroke="#1d6ef5" fill="url(#densGrd)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="parking"  name="Parking %"  stroke="#00d4ff" fill="url(#parkGrd)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Parking usage */}
        <div className="city-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Parking Occupancy</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>By location</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full badge-warning">
              {parkingPct}% Full
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={parkingData.map(p => ({
              name: p.name.split(' ')[0],
              Available: p.available,
              Occupied: p.total - p.available,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridBorder} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Available" fill="#2ed573" radius={[3,3,0,0]} />
              <Bar dataKey="Occupied"  fill="#ff4757" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traffic by zone */}
        <div className="city-card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Traffic by Zone</h3>
          <div className="space-y-3">
            {trafficData.slice(0, 6).map((loc, i) => (
              <div key={loc.id} className="flex items-center gap-3">
                <span className="text-xs w-4" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{loc.name}</span>
                    <span className="text-xs font-semibold" style={{
                      color: loc.density >= 70 ? '#ff4757' : loc.density >= 35 ? '#e6a800' : '#16a34a'
                    }}>{loc.density}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: trackBg }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{
                      width: `${loc.density}%`,
                      background: loc.density >= 70 ? 'linear-gradient(90deg,#ff4757,#ff6b35)' : loc.density >= 35 ? 'linear-gradient(90deg,#ffd32a,#ff9f43)' : 'linear-gradient(90deg,#2ed573,#00d4ff)',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signal status */}
        <div className="city-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Signal Status</h3>
            <button onClick={() => navigate('/signals')} className="text-blue-500 text-xs hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {signals.slice(0, 6).map(sig => (
              <div key={sig.id} className="p-2.5 rounded-lg flex items-center gap-2 city-card">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
                  background: sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757',
                  boxShadow: `0 0 8px ${sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757'}`,
                }} />
                <div className="min-w-0">
                  <p className="text-xs truncate leading-tight" style={{ color: 'var(--text-secondary)' }}>{sig.name.split(' ')[0]}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sig.timer}s</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Green: <span className="text-green-500 font-semibold">{greenSignals}</span></span>
            <span style={{ color: 'var(--text-muted)' }}>Red: <span className="text-red-500 font-semibold">{signals.filter(s => s.phase === 'red').length}</span></span>
            <span style={{ color: 'var(--text-muted)' }}>Yellow: <span className="text-yellow-500 font-semibold">{signals.filter(s => s.phase === 'yellow').length}</span></span>
          </div>
        </div>

        {/* Recent alerts */}
        <div className="city-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Alerts</h3>
            <button onClick={() => navigate('/violations')} className="text-blue-500 text-xs hover:underline">View All</button>
          </div>
          <div className="space-y-2.5">
            {violations.filter(v => v.status === 'Active').slice(0, 4).map(v => (
              <div key={v.id} className="p-2.5 rounded-lg"
                style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.2)' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-red-500">{v.type}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{v.location} · {v.vehicle}</p>
                  </div>
                </div>
              </div>
            ))}
            {violations.filter(v => v.status === 'Active').length === 0 && (
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                No active violations
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-2" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => navigate('/map')} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-blue-500 hover:bg-blue-500/10 transition-colors">
              <Map className="w-3 h-3" />City Map
            </button>
            <button onClick={() => navigate('/emergency')} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors">
              <Siren className="w-3 h-3" />Emergency
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
