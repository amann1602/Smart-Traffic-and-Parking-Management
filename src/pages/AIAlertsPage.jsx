import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCityData } from '../context/CityContext';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Brain, TrendingUp, AlertTriangle, Clock, Zap,
  Shield, Activity, MapPin, ChevronRight, RefreshCw, BarChart3
} from 'lucide-react';

const AI_INSIGHTS = [
  {
    id: 1, category: 'PREDICTION', icon: TrendingUp, color: '#a78bfa',
    title: 'Peak Traffic Alert — 6:15 PM',
    desc: 'Traffic density expected to surge 78% around Shivaji Nagar & FC Road zones. Recommend signal timing adjustment +20s.',
    time: '2 min ago', impact: 'HIGH', confidence: 94,
  },
  {
    id: 2, category: 'OPTIMIZATION', icon: Zap, color: '#2ed573',
    title: 'Route Bypass Activated',
    desc: 'AI redirected 18% of Swargate load to Karve Road bypass. 1,200 vehicles diverted. Travel time reduced by ~12 min.',
    time: '5 min ago', impact: 'MEDIUM', confidence: 88,
  },
  {
    id: 3, category: 'ANOMALY', icon: AlertTriangle, color: '#ff4757',
    title: 'Unusual Congestion — Baner Road',
    desc: 'Density 92% at Baner–Balewadi junction. Possible accident or event. IoT cameras dispatched for visual confirmation.',
    time: '8 min ago', impact: 'HIGH', confidence: 97,
  },
  {
    id: 4, category: 'ENVIRONMENT', icon: Activity, color: '#00d4ff',
    title: 'Air Quality Improved +4%',
    desc: 'Signal sync optimization across 8 nodes reduced idle time by 340 vehicle-minutes. AQI index improved from 142 to 136.',
    time: '12 min ago', impact: 'LOW', confidence: 82,
  },
  {
    id: 5, category: 'SECURITY', icon: Shield, color: '#ffd32a',
    title: 'Automated Violation Detected',
    desc: 'License plate MH12XX9923 captured jumping red signal at Deccan Hub. Fine ₹1,000 issued automatically via AI camera.',
    time: '18 min ago', impact: 'MEDIUM', confidence: 99,
  },
  {
    id: 6, category: 'PREDICTION', icon: Brain, color: '#a78bfa',
    title: 'Avoid Hinjewadi — Next 2 Hours',
    desc: 'IT park shift-change will create bottleneck 5:30–7:30 PM. AI suggests enabling Wakad flyover bypass protocol.',
    time: '25 min ago', impact: 'HIGH', confidence: 91,
  },
];

const IMPACT_COLORS = {
  HIGH: { bg: 'rgba(255,71,87,0.12)', border: 'rgba(255,71,87,0.3)', text: '#ff4757' },
  MEDIUM: { bg: 'rgba(255,211,42,0.1)', border: 'rgba(255,211,42,0.3)', text: '#e6a800' },
  LOW: { bg: 'rgba(46,213,115,0.1)', border: 'rgba(46,213,115,0.3)', text: '#2ed573' },
};

const CATEGORY_COLORS = {
  PREDICTION:   '#a78bfa',
  OPTIMIZATION: '#2ed573',
  ANOMALY:      '#ff4757',
  ENVIRONMENT:  '#00d4ff',
  SECURITY:     '#ffd32a',
};

export default function AIAlertsPage() {
  const { isAdmin } = useAuth();
  const { avgDensity, trafficData } = useCityData();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96 flex-col gap-4">
        <Shield className="w-16 h-16 text-red-400 opacity-40" />
        <p style={{ color: 'var(--text-muted)' }}>Access Denied – Admin privileges required</p>
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setLastRefresh(new Date()); }, 1200);
  };

  const categories = ['ALL', 'PREDICTION', 'OPTIMIZATION', 'ANOMALY', 'ENVIRONMENT', 'SECURITY'];
  const filtered = filter === 'ALL' ? AI_INSIGHTS : AI_INSIGHTS.filter(a => a.category === filter);

  const highCount = AI_INSIGHTS.filter(a => a.impact === 'HIGH').length;
  const avgConfidence = Math.round(AI_INSIGHTS.reduce((a, b) => a + b.confidence, 0) / AI_INSIGHTS.length);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
              <Sparkles size={10} /> GEMINI AI ENGINE
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Last updated: {lastRefresh.toLocaleTimeString('en-IN')}
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🤖 AI Alerts & Insights</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Real-time AI predictions, anomalies & traffic intelligence for admin review
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa' }}
        >
          <RefreshCw size={16} className={refreshing ? 'spinner' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh AI'}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Alerts', value: AI_INSIGHTS.length, color: '#a78bfa', icon: Brain },
          { label: 'High Impact', value: highCount, color: '#ff4757', icon: AlertTriangle },
          { label: 'Avg Confidence', value: `${avgConfidence}%`, color: '#2ed573', icon: Activity },
          { label: 'Traffic Density', value: `${avgDensity}%`, color: avgDensity > 70 ? '#ff4757' : avgDensity > 40 ? '#ffd32a' : '#2ed573', icon: BarChart3 },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="city-card p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${s.color}15` }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI System Banner */}
      <div className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(29,110,245,0.1))', border: '1px solid rgba(167,139,250,0.25)' }}>
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Brain size={120} />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-3 rounded-2xl" style={{ background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <Sparkles size={24} style={{ color: '#a78bfa' }} />
          </div>
          <div>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Gemini AI Traffic Intelligence Active</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Processing {trafficData.length} zones · {AI_INSIGHTS.length} active predictions · {avgConfidence}% average confidence score
            </p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 blink" />
            ONLINE
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={{
              background: filter === cat
                ? (cat === 'ALL' ? 'rgba(167,139,250,0.2)' : `${CATEGORY_COLORS[cat]}20`)
                : 'var(--bg-surface)',
              border: filter === cat
                ? `1px solid ${cat === 'ALL' ? '#a78bfa' : CATEGORY_COLORS[cat]}`
                : '1px solid var(--border)',
              color: filter === cat
                ? (cat === 'ALL' ? '#a78bfa' : CATEGORY_COLORS[cat])
                : 'var(--text-muted)',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const Icon = alert.icon;
          const impact = IMPACT_COLORS[alert.impact];
          return (
            <div
              key={alert.id}
              className="city-card p-5 group hover:shadow-xl transition-all"
              style={{ borderLeft: `4px solid ${alert.color}` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl flex-shrink-0 mt-0.5" style={{ background: `${alert.color}15` }}>
                  <Icon size={18} style={{ color: alert.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded"
                        style={{ background: `${CATEGORY_COLORS[alert.category]}15`, color: CATEGORY_COLORS[alert.category], border: `1px solid ${CATEGORY_COLORS[alert.category]}30` }}>
                        {alert.category}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                        style={{ background: impact.bg, color: impact.text, border: `1px solid ${impact.border}` }}>
                        {alert.impact} IMPACT
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={11} />
                      {alert.time}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{alert.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{alert.desc}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>AI CONFIDENCE</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)', maxWidth: 80 }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${alert.confidence}%`, background: `${alert.color}` }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: alert.color }}>{alert.confidence}%</span>
                    </div>
                    <button className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                      style={{ color: alert.color }}>
                      Act on this <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
