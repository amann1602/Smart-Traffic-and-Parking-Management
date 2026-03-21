import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { Siren, CheckCircle2, AlertTriangle, Radio, Clock, Activity, Zap, Shield } from 'lucide-react';

const PROTOCOL_STEPS = [
  { step: 1, title: 'Emergency Detected',   desc: 'System receives emergency signal from dispatch' },
  { step: 2, title: 'Corridor Calculation', desc: 'AI calculates optimal route through city' },
  { step: 3, title: 'Signals Override',     desc: 'All traffic signals forced to GREEN state' },
  { step: 4, title: 'Traffic Rerouting',    desc: 'Citizens rerouted via app notifications' },
  { step: 5, title: 'Escort Initiated',     desc: 'Emergency vehicle dispatched with clear corridor' },
];

export default function EmergencyPage() {
  const { emergencyMode, activateEmergency, deactivateEmergency, signals, avgDensity, trafficData } = useCityData();
  const { isAdmin } = useAuth();
  const [activating, setActivating] = useState(false);
  const [showProtocol, setShowProtocol] = useState(false);
  const greenSignals = signals.filter(s => s.phase === 'green').length;

  const handleActivate = async () => {
    setActivating(true); setShowProtocol(true);
    setTimeout(() => { activateEmergency(); setActivating(false); }, 1500);
  };
  const handleDeactivate = () => { deactivateEmergency(); setShowProtocol(false); };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Emergency Mode Control</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {isAdmin ? 'Activate emergency corridor for priority vehicle clearance' : 'Emergency status monitoring'}
        </p>
      </div>

      {/* Big status card */}
      <div className={`rounded-2xl p-6 text-center relative overflow-hidden transition-all duration-500 ${emergencyMode ? 'emergency-mode' : ''}`}
        style={{
          background:   emergencyMode ? 'rgba(255,71,87,0.08)' : 'var(--bg-card)',
          border:       `2px solid ${emergencyMode ? 'rgba(255,71,87,0.4)' : 'var(--border)'}`,
          boxShadow:    emergencyMode ? '0 0 40px rgba(255,71,87,0.15)' : 'none',
        }}>
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mx-auto mb-5"
          style={{
            background: emergencyMode ? 'rgba(255,71,87,0.15)' : 'rgba(29,110,245,0.1)',
            border: `2px solid ${emergencyMode ? 'rgba(255,71,87,0.5)' : 'rgba(29,110,245,0.3)'}`,
            boxShadow: emergencyMode ? '0 0 30px rgba(255,71,87,0.3)' : '0 0 20px rgba(29,110,245,0.15)',
          }}>
          <Siren className={`w-12 h-12 ${emergencyMode ? 'text-red-500 blink' : 'text-blue-500'}`} />
        </div>

        <h2 className="text-2xl font-bold mb-2" style={{ color: emergencyMode ? '#ff4757' : 'var(--text-primary)' }}>
          {emergencyMode ? '🚨 EMERGENCY MODE ACTIVE' : 'System Normal'}
        </h2>
        <p className="text-sm mb-6" style={{ color: emergencyMode ? '#ff4757' : 'var(--text-muted)' }}>
          {emergencyMode
            ? 'Emergency corridor active. All signals GREEN. Citizens have been alerted.'
            : 'No active emergency. All systems operating normally.'}
        </p>

        {emergencyMode && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Signals Green', value: `${greenSignals}/${signals.length}`, color: '#16a34a' },
              { label: 'Avg Density',   value: `${avgDensity}%`, color: '#e6a800' },
              { label: 'Zones Cleared', value: trafficData.filter(t => t.density < 50).length, color: '#1d6ef5' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {isAdmin ? (
          <button
            onClick={emergencyMode ? handleDeactivate : handleActivate}
            disabled={activating}
            className="px-8 py-3.5 rounded-xl font-bold text-base text-white transition-all hover:scale-105 disabled:opacity-60"
            style={{
              background: emergencyMode ? '#374151' : 'linear-gradient(135deg, #ff4757, #c0392b)',
              boxShadow:  emergencyMode ? 'none' : '0 8px 30px rgba(255,71,87,0.4)',
            }}>
            {activating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                Activating...
              </span>
            ) : emergencyMode ? (
              <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />Deactivate Emergency</span>
            ) : (
              <span className="flex items-center gap-2"><Siren className="w-5 h-5" />Activate Emergency Mode</span>
            )}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: emergencyMode ? 'rgba(255,71,87,0.12)' : 'rgba(22,163,74,0.1)',
              color:      emergencyMode ? '#ff4757' : '#16a34a',
            }}>
            {emergencyMode ? <><Siren className="w-4 h-4" />Emergency in Progress</> : <><CheckCircle2 className="w-4 h-4" />All Clear</>}
          </div>
        )}
      </div>

      {/* Protocol */}
      {(showProtocol || emergencyMode) && (
        <div className="city-card p-5 animate-fade-in">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Activity className="w-4 h-4 text-red-500" />Emergency Protocol Execution
          </h3>
          <div className="space-y-3">
            {PROTOCOL_STEPS.map(step => (
              <div key={step.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: emergencyMode ? 'rgba(22,163,74,0.15)' : 'rgba(30,58,95,0.3)',
                    border:     `1px solid ${emergencyMode ? 'rgba(22,163,74,0.4)' : 'var(--border)'}`,
                    color:      emergencyMode ? '#16a34a' : 'var(--text-muted)',
                  }}>
                  {emergencyMode ? '✓' : step.step}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{step.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: emergencyMode ? 'rgba(22,163,74,0.1)' : 'var(--bg-surface)',
                    color:      emergencyMode ? '#16a34a' : 'var(--text-muted)',
                  }}>
                  {emergencyMode ? 'Done' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Radio,  title: 'IoT Signal Network',    desc: 'All 8 signals connected via IoT. Emergency override takes <2s.',    color: '#1d6ef5' },
          { icon: Zap,    title: 'AI Route Optimization', desc: 'ML algorithms compute fastest emergency corridor in real-time.',      color: '#e6a800' },
          { icon: Shield, title: 'Citizen Notification',  desc: 'Smart app sends push notifications to all citizens in affected zones.', color: '#a78bfa' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="city-card p-4">
              <div className="p-2.5 rounded-xl inline-flex mb-3" style={{ background: `${card.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{card.title}</h4>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
