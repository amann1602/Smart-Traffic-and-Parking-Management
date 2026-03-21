import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import {
  Settings, Users, Activity, Radio, ParkingSquare, AlertTriangle,
  Siren, RefreshCw, Download, Plus, Minus, TrendingUp, Database, Shield
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(5,13,26,0.95)', border: '1px solid rgba(30,58,95,0.8)' }}>
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
    clearAllViolations, addViolation, updateParkingSlots,
    setSignalPhase, trendHistory, getDensityLabel
  } = useCityData();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96 flex-col gap-4">
        <Shield className="w-16 h-16 text-red-400 opacity-40" />
        <p className="text-gray-400">Access Denied – Admin privileges required</p>
      </div>
    );
  }

  const trafficDistribution = [
    { name: 'Low', value: trafficData.filter(t => t.density < 35).length },
    { name: 'Medium', value: trafficData.filter(t => t.density >= 35 && t.density < 70).length },
    { name: 'High', value: trafficData.filter(t => t.density >= 70).length },
  ];

  const TABS = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'traffic', label: 'Traffic', icon: TrendingUp },
    { key: 'parking', label: 'Parking', icon: ParkingSquare },
    { key: 'signals', label: 'Signals', icon: Radio },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Control Panel</h1>
          <p className="text-gray-400 text-sm mt-1">
            Logged in as <span className="text-blue-400 font-semibold">{user?.name}</span> · {user?.designation}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
          <button
            onClick={emergencyMode ? deactivateEmergency : activateEmergency}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${emergencyMode ? 'text-gray-200 bg-gray-700' : 'text-white'}`}
            style={!emergencyMode ? { background: 'linear-gradient(135deg, #ff4757, #c0392b)', boxShadow: '0 4px 15px rgba(255,71,87,0.3)' } : undefined}
          >
            <Siren className="w-3.5 h-3.5" />
            {emergencyMode ? 'End Emergency' : 'Emergency Mode'}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Traffic Density', value: `${avgDensity}%`, color: avgDensity > 70 ? '#ff4757' : '#2ed573' },
          { label: 'Total Vehicles', value: totalVehicles.toLocaleString(), color: '#60a5fa' },
          { label: 'Parking Free', value: availableParking, color: '#2ed573' },
          { label: 'Active Violations', value: activeViolations, color: '#ff4757' },
          { label: 'Signals Online', value: `${signals.length}/${signals.length}`, color: '#2ed573' },
          { label: 'System Health', value: '100%', color: '#2ed573' },
        ].map((item, i) => (
          <div key={i} className="glass-light rounded-xl p-3 text-center">
            <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-gray-500 text-xs mt-0.5 leading-tight">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b overflow-x-auto" style={{ borderColor: 'rgba(30,58,95,0.4)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'text-blue-400 border-blue-400' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Traffic distribution pie */}
            <div className="glass-light rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Traffic Distribution</h3>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={trafficDistribution} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={3}>
                      {trafficDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {trafficDistribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-gray-400 text-xs">{d.name}: </span>
                      <span className="text-white font-semibold text-xs">{d.value} zones</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Parking by location */}
            <div className="glass-light rounded-xl p-5">
              <h3 className="text-white font-semibold text-sm mb-4">Parking Status</h3>
              <ResponsiveContainer width="100%" height={160}>
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

          {/* Admin quick actions */}
          <div className="glass-light rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Resolve All Violations', action: clearAllViolations, color: '#2ed573', icon: AlertTriangle },
                { label: 'Simulate Violation', action: () => addViolation(null), color: '#ffd32a', icon: AlertTriangle },
                { label: 'View Live Traffic', action: () => navigate('/traffic'), color: '#60a5fa', icon: Activity },
                { label: 'Manage Signals', action: () => navigate('/signals'), color: '#a78bfa', icon: Radio },
              ].map((btn, i) => {
                const Icon = btn.icon;
                return (
                  <button key={i} onClick={btn.action}
                    className="p-3 rounded-xl text-xs font-medium transition-all hover:scale-105 text-left"
                    style={{ background: `${btn.color}15`, border: `1px solid ${btn.color}30`, color: btn.color }}>
                    <Icon className="w-4 h-4 mb-2" />
                    {btn.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'traffic' && (
        <div className="space-y-4">
          <div className="glass-light rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Traffic Zone Management</h3>
            <div className="space-y-2">
              {trafficData.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg"
                  style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="flex-1">
                    <span className="text-white text-sm font-medium">{t.name}</span>
                    <span className="text-gray-500 text-xs ml-2">{t.area}</span>
                  </div>
                  <div className="w-24">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,58,95,0.5)' }}>
                      <div className="h-full rounded-full" style={{
                        width: `${t.density}%`,
                        background: t.density >= 70 ? '#ff4757' : t.density >= 35 ? '#ffd32a' : '#2ed573',
                      }} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold w-10 text-right" style={{
                    color: t.density >= 70 ? '#ff4757' : t.density >= 35 ? '#ffd32a' : '#2ed573'
                  }}>{t.density}%</span>
                  <span className="text-gray-500 text-xs w-12">{t.vehicles} V</span>
                  <span className="text-gray-500 text-xs w-16">{t.speed} km/h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'parking' && (
        <div className="space-y-4">
          <div className="glass-light rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Parking Management</h3>
            <div className="space-y-3">
              {parkingData.map(p => (
                <div key={p.id} className="p-4 rounded-xl"
                  style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-white font-medium text-sm">{p.name}</span>
                      <span className="text-gray-500 text-xs ml-2">{p.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm font-bold">{p.available}</span>
                      <span className="text-gray-500 text-xs">/ {p.total} free</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(30,58,95,0.5)' }}>
                      <div className="h-full rounded-full" style={{
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

      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="glass-light rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Signal Override Control</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {signals.map(sig => (
                <div key={sig.id} className="p-4 rounded-xl"
                  style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(30,58,95,0.4)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white text-sm font-medium">{sig.name}</p>
                      <p className="text-gray-500 text-xs">{sig.signalId}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full" style={{
                        background: sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757',
                        boxShadow: `0 0 6px ${sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757'}`,
                      }} />
                      <span className="text-xs uppercase font-bold" style={{
                        color: sig.phase === 'green' ? '#2ed573' : sig.phase === 'yellow' ? '#ffd32a' : '#ff4757',
                      }}>{sig.phase}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {['red', 'green', 'yellow'].map(phase => (
                      <button
                        key={phase}
                        onClick={() => setSignalPhase(sig.id, phase)}
                        disabled={emergencyMode}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all hover:scale-105 disabled:opacity-40"
                        style={{
                          background: `${phase === 'green' ? '#2ed573' : phase === 'yellow' ? '#ffd32a' : '#ff4757'}20`,
                          border: `1px solid ${phase === 'green' ? '#2ed573' : phase === 'yellow' ? '#ffd32a' : '#ff4757'}40`,
                          color: phase === 'green' ? '#2ed573' : phase === 'yellow' ? '#ffd32a' : '#ff4757',
                        }}
                      >{phase}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
