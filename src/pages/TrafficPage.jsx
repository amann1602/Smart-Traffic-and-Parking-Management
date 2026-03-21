import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Car, Gauge, Zap, Search } from 'lucide-react';

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

export default function TrafficPage() {
  const { trafficData, trendHistory, getDensityLabel, avgDensity, totalVehicles, emergencyMode } = useCityData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = trafficData.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.area.toLowerCase().includes(search.toLowerCase());
    const density = getDensityLabel(t.density).toLowerCase();
    return matchSearch && (filter === 'all' || density === filter);
  });

  const getDensityStyle = (density) => {
    if (density >= 70) return { color: '#ff4757', bg: 'rgba(255,71,87,0.1)',  border: 'rgba(255,71,87,0.3)',  label: 'High' };
    if (density >= 35) return { color: '#e6a800', bg: 'rgba(255,211,42,0.1)', border: 'rgba(255,211,42,0.3)', label: 'Medium' };
    return              { color: '#16a34a', bg: 'rgba(46,213,115,0.1)', border: 'rgba(46,213,115,0.3)', label: 'Low' };
  };

  const TrendIcon = ({ trend }) => {
    if (trend === 'up')   return <TrendingUp   className="w-4 h-4 text-red-500" />;
    if (trend === 'down') return <TrendingDown  className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />;
  };

  const gridBorder = 'var(--border)';

  const FilterBtn = ({ val, label }) => (
    <button onClick={() => setFilter(val)}
      className="px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Live Traffic Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time monitoring across all Pune zones · Updates every 4s</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full bg-green-400 blink" />
          <span className="text-green-600">Live Feed Active</span>
        </div>
      </div>

      {/* Emergency */}
      {emergencyMode && (
        <div className="p-4 rounded-xl text-center emergency-mode border border-red-500/30">
          <p className="text-red-500 font-bold text-lg">🚨 EMERGENCY MODE ACTIVE – All corridors cleared</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Avg Density',       value: `${avgDensity}%`,           color: avgDensity > 70 ? '#ff4757' : avgDensity > 35 ? '#e6a800' : '#16a34a', icon: Gauge },
          { label: 'Active Vehicles',   value: totalVehicles.toLocaleString(), color: '#1d6ef5', icon: Car },
          { label: 'High Traffic Zones',value: trafficData.filter(t => t.density >= 70).length, color: '#ff4757', icon: TrendingUp },
          { label: 'Low Traffic Zones', value: trafficData.filter(t => t.density < 35).length,  color: '#16a34a', icon: TrendingDown },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="city-card p-4 stat-card">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color: item.color }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="city-card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Traffic Density Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendHistory}>
              <defs>
                <linearGradient id="tdGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1d6ef5" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#1d6ef5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridBorder} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={3} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="density" name="Density %" stroke="#1d6ef5" fill="url(#tdGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="city-card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Vehicle Count Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridBorder} />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} interval={3} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="vehicles" name="Vehicles" stroke="#00d4ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search zone or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="city-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'low', 'medium', 'high'].map(f => <FilterBtn key={f} val={f} label={f} />)}
        </div>
      </div>

      {/* Zone cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(loc => {
          const s = getDensityStyle(loc.density);
          return (
            <div key={loc.id} className="city-card p-4 stat-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{loc.name}</h4>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{loc.area}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-muted)' }}>Traffic Density</span>
                  <span className="font-bold" style={{ color: s.color }}>{loc.density}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${loc.density}%`, background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Vehicles', value: loc.vehicles },
                  { label: 'Speed',    value: `${loc.speed} km/h` },
                  { label: 'Trend',    value: <div className="flex justify-center"><TrendIcon trend={loc.trend} /></div> },
                ].map((s2, i) => (
                  <div key={i} className="p-1.5 rounded-lg" style={{ background: 'var(--bg-surface)' }}>
                    <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{s2.value}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s2.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Zap className="w-3 h-3 text-blue-500" />
                <span>IoT Sensor Active</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 blink" />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No zones match your filter</p>
        </div>
      )}
    </div>
  );
}
