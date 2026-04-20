import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import {
  Route, MapPin, Clock, TrendingDown, Navigation, Zap,
  AlertTriangle, CheckCircle2, Star, ArrowRight, RefreshCw, Car
} from 'lucide-react';

const ROUTES = [
  {
    id: 1,
    from: 'FC Road',
    to: 'Hinjewadi IT Park',
    duration: '22 min',
    distance: '14.2 km',
    via: 'Baner Road → Wakad Bridge',
    status: 'RECOMMENDED',
    density: 28,
    saved: '18 min faster than usual',
    type: 'fastest',
    color: '#2ed573',
    rating: 4.8,
  },
  {
    id: 2,
    from: 'Shivaji Nagar',
    to: 'Kothrud',
    duration: '15 min',
    distance: '7.8 km',
    via: 'Karve Road → Law College Road',
    status: 'CLEAR',
    density: 32,
    saved: 'Low traffic now',
    type: 'shortest',
    color: '#2ed573',
    rating: 4.5,
  },
  {
    id: 3,
    from: 'Pune Station',
    to: 'Viman Nagar',
    duration: '35 min',
    distance: '11.5 km',
    via: 'Nagar Road → Airport Road',
    status: 'MODERATE',
    density: 58,
    saved: 'Avoid Kalyani Nagar',
    type: 'alternate',
    color: '#ffd32a',
    rating: 3.9,
  },
  {
    id: 4,
    from: 'Swargate',
    to: 'Hadapsar',
    duration: '28 min',
    distance: '9.3 km',
    via: 'NIBM Road → Fatima Nagar',
    status: 'BUSY',
    density: 74,
    saved: 'Heavy traffic on bypass',
    type: 'alternate',
    color: '#ff4757',
    rating: 2.8,
  },
];

const POPULAR_SEARCHES = [
  'Pune Station → Airport', 'FC Road → IT Park', 'Kothrud → Wakad', 'Deccan → Swargate'
];

const STATUS_CONFIG = {
  RECOMMENDED: { bg: 'rgba(46,213,115,0.12)', border: 'rgba(46,213,115,0.3)', text: '#2ed573', emoji: '🟢' },
  CLEAR:        { bg: 'rgba(46,213,115,0.08)', border: 'rgba(46,213,115,0.2)', text: '#2ed573', emoji: '🟢' },
  MODERATE:     { bg: 'rgba(255,211,42,0.1)',  border: 'rgba(255,211,42,0.3)', text: '#e6a800', emoji: '🟡' },
  BUSY:         { bg: 'rgba(255,71,87,0.1)',   border: 'rgba(255,71,87,0.3)', text: '#ff4757', emoji: '🔴' },
};

export default function RouteSuggestionsPage() {
  const { avgDensity, trafficData } = useCityData();
  const [activeRoute, setActiveRoute] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const densityColor = avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#ffd32a' : '#2ed573';
  const densityEmoji = avgDensity >= 70 ? '🔴' : avgDensity >= 35 ? '🟡' : '🟢';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
            style={{ background: 'rgba(29,110,245,0.12)', color: '#1d6ef5', border: '1px solid rgba(29,110,245,0.3)' }}>
            <div className="w-1 h-1 rounded-full bg-blue-500 blink" /> AI ROUTES
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🗺️ Smart Route Suggestions</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          AI-powered optimal routes based on real-time Pune traffic data
        </p>
      </div>

      {/* Current City Density Bar */}
      <div className="city-card p-4 flex items-center gap-4">
        <div className="p-2.5 rounded-xl" style={{ background: `${densityColor}15` }}>
          <Car size={20} style={{ color: densityColor }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {densityEmoji} City Traffic Right Now
            </span>
            <span className="text-sm font-bold" style={{ color: densityColor }}>{avgDensity}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${avgDensity}%`, background: densityColor }} />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {avgDensity >= 70 ? 'Heavy traffic — avoid main roads' : avgDensity >= 35 ? 'Moderate — use suggested routes' : 'Clear city roads — good time to travel'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="city-card p-5">
        <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Navigation size={18} className="text-blue-500" /> Plan Your Journey
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            <input type="text" placeholder="From: Your location..." value={from} onChange={e => setFrom(e.target.value)}
              className="city-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            <input type="text" placeholder="To: Destination..." value={to} onChange={e => setTo(e.target.value)}
              className="city-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" />
          </div>
          <button
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #1d6ef5, #0d4ed8)', boxShadow: '0 4px 15px rgba(29,110,245,0.3)' }}
          >
            <Route size={16} /> Get Routes
          </button>
        </div>

        {/* Popular searches */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Popular:</span>
          {POPULAR_SEARCHES.map((s, i) => (
            <button key={i} className="text-xs px-2.5 py-1 rounded-full transition-all hover:scale-105"
              style={{ background: 'rgba(29,110,245,0.08)', border: '1px solid rgba(29,110,245,0.2)', color: '#60a5fa' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* AI Route Cards */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap size={16} className="text-yellow-500" /> AI Suggested Routes — Right Now
        </h3>
        <div className="space-y-3">
          {ROUTES.map(route => {
            const cfg = STATUS_CONFIG[route.status];
            const isActive = activeRoute === route.id;
            return (
              <div
                key={route.id}
                onClick={() => setActiveRoute(isActive ? null : route.id)}
                className="city-card p-5 cursor-pointer hover:shadow-xl transition-all"
                style={{
                  borderLeft: `4px solid ${route.color}`,
                  background: isActive ? `${route.color}08` : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-black uppercase px-2 py-0.5 rounded"
                        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}>
                        {cfg.emoji} {route.status}
                      </span>
                      <span className="text-xs text-yellow-500 flex items-center gap-0.5">
                        <Star size={10} fill="currentColor" />{route.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {route.from}
                      </p>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                      <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {route.to}
                      </p>
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      via {route.via}
                    </p>

                    {/* Density bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>TRAFFIC</span>
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${route.density}%`, background: route.color }} />
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: route.color }}>{route.density}%</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black" style={{ color: route.color }}>{route.duration}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{route.distance}</p>
                    <p className="text-[10px] mt-1 font-semibold" style={{ color: route.color }}>{route.saved}</p>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 pt-4 border-t animate-fade-in" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex flex-wrap gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${route.color}, ${route.color}bb)`, boxShadow: `0 4px 15px ${route.color}30` }}>
                        <Navigation size={14} /> Start Navigation
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={14} /> Share Route
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Tips */}
      <div className="city-card p-5">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap size={16} className="text-purple-400" /> AI Travel Tips — Today
        </h3>
        <div className="space-y-3">
          {[
            { icon: '🕕', tip: 'Peak hours 5:30–7:30 PM today. Leave before 5 PM or after 8 PM.', color: '#ffd32a' },
            { icon: '⚠️', tip: 'Avoid Hinjewadi main gate. Use Wakad flyover alternate entry.', color: '#ff4757' },
            { icon: '✅', tip: 'Baner–Balewadi route is currently smooth. ETA 30% lower than usual.', color: '#2ed573' },
            { icon: '🌧️', tip: 'Light rain expected at 7 PM. Allow extra 10–15 min travel buffer.', color: '#60a5fa' },
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
              style={{ background: `${tip.color}08`, border: `1px solid ${tip.color}20` }}>
              <span className="text-base flex-shrink-0">{tip.icon}</span>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tip.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
