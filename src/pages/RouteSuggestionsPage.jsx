import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCityData } from '../context/CityContext';
import {
  MapPin, Navigation, Mic, MicOff, Share2, Clock, Gauge,
  Zap, AlertTriangle, CheckCircle2, TrendingUp, Volume2,
  ExternalLink, ChevronRight, Star, Car, RotateCcw,
  Map, Layers, Radio, Activity, Wifi
} from 'lucide-react';

// ── Pune known locations for autocomplete ─────────────────────────────────────
const PUNE_PLACES = [
  'FC Road, Pune', 'Deccan Gymkhana, Pune', 'Swargate, Pune', 'Shivajinagar, Pune',
  'Hinjewadi IT Park, Pune', 'Viman Nagar, Pune', 'Kothrud, Pune', 'Hadapsar, Pune',
  'Baner Road, Pune', 'Wakad, Pune', 'Kharadi, Pune', 'Magarpatta City, Pune',
  'Aundh, Pune', 'Pimpri, Pune', 'Chinchwad, Pune', 'Yerawada, Pune',
  'Camp, Pune', 'MG Road, Pune', 'JM Road, Pune', 'Karve Road, Pune',
  'Wanowrie, Pune', 'Kondhwa, Pune', 'Pune Railway Station', 'Pune Airport',
  'Sinhagad Road, Pune', 'Market Yard, Pune', 'Katraj, Pune', 'Bibwewadi, Pune',
  'Bavdhan, Pune', 'Sus Road, Pune', 'PCMC, Pune', 'Nigdi, Pune',
];

// ── Colour helpers ─────────────────────────────────────────────────────────────
const trafficColor = (lvl) => lvl === 'Low' ? '#2ed573' : lvl === 'Medium' ? '#ffd32a' : '#ff4757';
const trafficBg    = (lvl) => lvl === 'Low' ? 'rgba(46,213,115,0.1)' : lvl === 'Medium' ? 'rgba(255,211,42,0.1)' : 'rgba(255,71,87,0.1)';
const trafficBorder= (lvl) => lvl === 'Low' ? 'rgba(46,213,115,0.25)' : lvl === 'Medium' ? 'rgba(255,211,42,0.25)' : 'rgba(255,71,87,0.25)';
const trafficPct   = (lvl) => lvl === 'Low' ? 25 : lvl === 'Medium' ? 55 : 85;

// ── Build Google Maps URL ──────────────────────────────────────────────────────
function buildGoogleMapsUrl(origin, destination, mode = 'driving') {
  const base = 'https://www.google.com/maps/dir/?api=1';
  return `${base}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode}`;
}

// ── Generate smart route options based on traffic density ─────────────────────
function generateRoutes(from, to, avgDensity, trafficData) {
  const isHighTraffic = avgDensity >= 70;
  const isMedTraffic  = avgDensity >= 35;

  // Base routes with Pune-specific via points
  const VIA_OPTIONS = [
    { via: 'Baner Road → Wakad', baseMins: 22, baseKm: 14.2 },
    { via: 'Karve Road → Law College Road', baseMins: 18, baseKm: 11.5 },
    { via: 'Sinhagad Road → Satara Road', baseMins: 28, baseKm: 17.8 },
    { via: 'Pune-Mumbai Expressway', baseMins: 35, baseKm: 22.1 },
  ];

  const trafficMult = isHighTraffic ? 1.6 : isMedTraffic ? 1.25 : 1.0;
  const busyZones   = trafficData?.filter(t => t.density >= 70).map(t => t.name).slice(0, 2) || [];

  return [
    {
      id: 1,
      label: 'RECOMMENDED',
      labelColor: '#2ed573',
      star: 4.8,
      from, to,
      via: VIA_OPTIONS[0].via,
      mins: Math.round(VIA_OPTIONS[0].baseMins * (isMedTraffic ? 1.2 : 1.0)),
      km: VIA_OPTIONS[0].baseKm,
      traffic: isHighTraffic ? 'Medium' : 'Low',
      badge: isHighTraffic ? '18 min slower than usual' : '18 min faster than usual',
      badgeGood: !isHighTraffic,
      avoids: isHighTraffic ? busyZones : [],
    },
    {
      id: 2,
      label: 'CLEAR',
      labelColor: '#60a5fa',
      star: 4.5,
      from, to,
      via: VIA_OPTIONS[1].via,
      mins: Math.round(VIA_OPTIONS[1].baseMins * trafficMult),
      km: VIA_OPTIONS[1].baseKm,
      traffic: isMedTraffic ? 'Medium' : 'Low',
      badge: 'Least congestion right now',
      badgeGood: true,
      avoids: [],
    },
    {
      id: 3,
      label: 'ALTERNATE',
      labelColor: '#ffd32a',
      star: 3.9,
      from, to,
      via: VIA_OPTIONS[2].via,
      mins: Math.round(VIA_OPTIONS[2].baseMins * trafficMult),
      km: VIA_OPTIONS[2].baseKm,
      traffic: isHighTraffic ? 'High' : isMedTraffic ? 'Medium' : 'Low',
      badge: isHighTraffic ? 'Heavy traffic expected' : 'Moderate traffic',
      badgeGood: false,
      avoids: [],
    },
  ];
}

// ── Autocomplete input component ───────────────────────────────────────────────
function PlaceInput({ value, onChange, placeholder, icon: Icon, iconColor }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (v) => {
    onChange(v);
    if (v.length >= 2) {
      const matches = PUNE_PLACES.filter(p => p.toLowerCase().includes(v.toLowerCase())).slice(0, 6);
      setSuggestions(matches);
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const select = (place) => {
    onChange(place);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div className="relative flex items-center">
        <Icon size={15} className="absolute left-3 z-10 flex-shrink-0" style={{ color: iconColor }} />
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          className="city-input w-full pl-9 pr-3 py-3 rounded-xl text-sm"
          style={{ fontSize: 14 }}
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => select(s)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all hover:bg-blue-500/10"
              style={{ color: 'var(--text-secondary)', borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <MapPin size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Route Card ──────────────────────────────────────────────────────────────────
function RouteCard({ route, isTop, onNavigate, onShare }) {
  const tCol = trafficColor(route.traffic);
  const tBg  = trafficBg(route.traffic);
  const tBd  = trafficBorder(route.traffic);
  const pct  = trafficPct(route.traffic);

  return (
    <div className="city-card p-5 stat-card animate-fade-in"
      style={{
        borderLeft: `4px solid ${isTop ? '#2ed573' : route.labelColor}`,
        boxShadow: isTop ? `0 4px 30px -8px ${route.labelColor}30` : undefined,
      }}>
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider"
            style={{ background: `${route.labelColor}15`, color: route.labelColor, border: `1px solid ${route.labelColor}30` }}>
            ● {route.label}
          </span>
          <div className="flex items-center gap-1 text-xs">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="font-bold" style={{ color: '#ffd32a' }}>{route.star}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black" style={{ color: route.labelColor }}>
            {route.mins} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>min</span>
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{route.km} km</p>
          {route.badge && (
            <p className="text-[10px] font-bold mt-0.5" style={{ color: route.badgeGood ? '#2ed573' : '#ffd32a' }}>
              {route.badgeGood ? '⚡' : '⚠️'} {route.badge}
            </p>
          )}
        </div>
      </div>

      {/* Route path */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{route.from}</span>
        <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{route.to}</span>
        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
      </div>
      <p className="text-xs mb-4 ml-4" style={{ color: 'var(--text-muted)' }}>via {route.via}</p>

      {/* Traffic bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>TRAFFIC</span>
          <span className="font-bold" style={{ color: tCol }}>{route.traffic} · {pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tCol}80, ${tCol})` }} />
        </div>
      </div>

      {/* Avoids */}
      {route.avoids?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {route.avoids.map(a => (
            <span key={a} className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,71,87,0.1)', color: '#ff6b7a', border: '1px solid rgba(255,71,87,0.2)' }}>
              ⚠️ Avoids {a}
            </span>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onNavigate(route)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${route.labelColor === '#2ed573' ? '#2ed573, #00c87a' : route.labelColor === '#60a5fa' ? '#1d6ef5, #0d4ed8' : '#e6a800, #cc9500'})`,
            boxShadow: `0 4px 14px ${route.labelColor}35`,
          }}>
          <Navigation size={14} />
          Start Navigation
          <ExternalLink size={11} />
        </button>
        <button
          onClick={() => onShare(route)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          <Share2 size={14} />
          Share
        </button>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────
export default function RouteSuggestionsPage() {
  const { avgDensity, trafficData, signals } = useCityData();

  const [from,          setFrom]          = useState('');
  const [to,            setTo]            = useState('');
  const [routes,        setRoutes]        = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [isListening,   setIsListening]   = useState(false);
  const [voiceText,     setVoiceText]     = useState('');
  const [shareToast,    setShareToast]    = useState('');
  const [lastSearch,    setLastSearch]    = useState({ from: 'FC Road', to: 'Hinjewadi IT Park' });

  const recogRef = useRef(null);

  const densityEm  = avgDensity >= 70 ? '🔴' : avgDensity >= 35 ? '🟡' : '🟢';
  const densityLbl = avgDensity >= 70 ? 'Heavy' : avgDensity >= 35 ? 'Moderate' : 'Clear';

  // Load default routes on mount
  useEffect(() => {
    setRoutes(generateRoutes('FC Road', 'Hinjewadi IT Park', avgDensity, trafficData));
    setFrom('FC Road');
    setTo('Hinjewadi IT Park');
  }, []);

  // Setup speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous  = false;
    rec.lang        = 'en-IN';
    rec.interimResults = false;

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setVoiceText(transcript);
      setIsListening(false);
      parseVoiceCommand(transcript);
    };
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
    recogRef.current = rec;
  }, []);

  // Parse voice command: "navigate to X" or "route from X to Y"
  const parseVoiceCommand = (text) => {
    const lower = text.toLowerCase();
    let parsedFrom = from, parsedTo = to;

    // "navigate to PLACE"
    const navMatch = lower.match(/(?:navigate|go)\s+to\s+(.+)/);
    if (navMatch) {
      parsedTo = navMatch[1].trim();
      setTo(parsedTo);
    }

    // "route from X to Y" or "from X to Y"
    const routeMatch = lower.match(/(?:from|route from)\s+(.+?)\s+to\s+(.+)/);
    if (routeMatch) {
      parsedFrom = routeMatch[1].trim();
      parsedTo   = routeMatch[2].trim();
      setFrom(parsedFrom);
      setTo(parsedTo);
    }

    handleGetRoutes(parsedFrom, parsedTo);
  };

  const toggleVoice = () => {
    if (!recogRef.current) {
      alert('Voice not supported in this browser. Try Chrome.');
      return;
    }
    if (isListening) {
      recogRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceText('');
      setIsListening(true);
      recogRef.current.start();
    }
  };

  const handleGetRoutes = useCallback((f = from, t = to) => {
    if (!f.trim() || !t.trim()) return;
    setLoading(true);
    setRoutes(null);
    setLastSearch({ from: f, to: t });

    // Simulate slight AI processing delay
    setTimeout(() => {
      setRoutes(generateRoutes(f, t, avgDensity, trafficData));
      setLoading(false);
    }, 800);
  }, [from, to, avgDensity, trafficData]);

  // "Start Navigation" → open Google Maps directions in new tab
  const handleNavigate = (route) => {
    const url = buildGoogleMapsUrl(
      `${route.from}, Pune, India`,
      `${route.to}, Pune, India`,
      'driving'
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Share route URL
  const handleShare = async (route) => {
    const url  = buildGoogleMapsUrl(`${route.from}, Pune, India`, `${route.to}, Pune, India`);
    const text = `🗺️ Route: ${route.from} → ${route.to}\n⏱ ${route.mins} min · 📏 ${route.km} km\nTraffic: ${route.traffic}\n${url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Pune Smart City Route', text, url });
      } else {
        await navigator.clipboard.writeText(text);
        setShareToast('📋 Route link copied!');
        setTimeout(() => setShareToast(''), 2500);
      }
    } catch { /* user cancelled */ }
  };

  // Open Google Maps with live traffic layer
  const openLiveTraffic = () => {
    window.open(
      `https://www.google.com/maps/@18.5204,73.8567,13z/data=!5m1!1e1`,
      '_blank', 'noopener,noreferrer'
    );
  };

  const POPULAR = [
    ['Pune Station', 'Airport'],
    ['FC Road', 'Hinjewadi IT Park'],
    ['Kothrud', 'Wakad'],
    ['Deccan', 'Swargate'],
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* ── Toast ── */}
      {shareToast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl font-bold text-sm text-white animate-fade-in"
          style={{ background: 'linear-gradient(135deg,#2ed573,#00c87a)', boxShadow: '0 4px 20px rgba(46,213,115,0.4)' }}>
          {shareToast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
              style={{ background: 'rgba(46,213,115,0.1)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.25)' }}>
              <div className="w-1 h-1 rounded-full bg-green-400 blink" /> LIVE AI ROUTING
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold"
              style={{ background: 'rgba(29,110,245,0.1)', color: '#60a5fa', border: '1px solid rgba(29,110,245,0.2)' }}>
              {densityEm} Traffic: {densityLbl} ({avgDensity}%)
            </span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            🗺️ Smart Route Suggestions
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            AI-powered routing · Opens Google Maps navigation · Voice commands supported
          </p>
        </div>

        <button
          onClick={openLiveTraffic}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 flex-shrink-0"
          style={{ background: 'rgba(29,110,245,0.12)', border: '1px solid rgba(29,110,245,0.3)', color: '#60a5fa' }}>
          <Map size={15} />
          Live Traffic Map
          <ExternalLink size={12} />
        </button>
      </div>

      {/* ── Plan Your Journey ── */}
      <div className="city-card p-5">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Navigation size={18} className="text-blue-400" />
          Plan Your Journey
        </h2>

        {/* Input row */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-3">
          {/* From */}
          <PlaceInput
            value={from}
            onChange={setFrom}
            placeholder="From: e.g. Deccan"
            icon={MapPin}
            iconColor="#2ed573"
          />

          {/* Swap button */}
          <button
            onClick={() => { setFrom(to); setTo(from); }}
            className="flex-shrink-0 w-10 h-10 mx-auto sm:mx-0 rounded-xl flex items-center justify-center transition-all hover:rotate-180 hover:scale-110"
            style={{ background: 'rgba(29,110,245,0.1)', border: '1px solid rgba(29,110,245,0.25)', color: '#60a5fa' }}
            title="Swap">
            <RotateCcw size={16} />
          </button>

          {/* To */}
          <PlaceInput
            value={to}
            onChange={setTo}
            placeholder="To: e.g. Hinjewadi"
            icon={MapPin}
            iconColor="#ff4757"
          />

          {/* Get Routes */}
          <button
            onClick={() => handleGetRoutes()}
            disabled={loading || !from.trim() || !to.trim()}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#1d6ef5,#0d4ed8)', boxShadow: '0 4px 16px rgba(29,110,245,0.35)', minWidth: 130 }}>
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" /> Routing...</>
              : <><Navigation size={15} /> Get Routes</>}
          </button>

          {/* Voice */}
          <button
            onClick={toggleVoice}
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all flex items-center justify-center"
            style={{
              background: isListening ? 'rgba(255,71,87,0.15)' : 'var(--bg-surface)',
              border:     `1px solid ${isListening ? '#ff4757' : 'var(--border)'}`,
              color:      isListening ? '#ff4757' : 'var(--text-muted)',
              animation:  isListening ? 'blink 1s infinite' : 'none',
            }}
            title={isListening ? 'Stop listening' : 'Voice command'}>
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        </div>

        {/* Voice indicator */}
        {isListening && (
          <div className="flex items-center gap-2 mb-3 py-2.5 px-4 rounded-xl animate-pulse"
            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-0.5 bg-red-400 rounded-full"
                  style={{ height: `${8 + i * 3}px`, animation: `typing-bounce ${0.6 + i * 0.1}s infinite ease-in-out` }} />
              ))}
            </div>
            <span className="text-xs font-bold text-red-400">Listening... Say "Navigate to Hinjewadi" or "Route from Deccan to Swargate"</span>
          </div>
        )}
        {voiceText && !isListening && (
          <p className="text-xs mb-3 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            🎤 Heard: "<span style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>{voiceText}</span>"
          </p>
        )}

        {/* Popular quick routes */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Popular:</span>
          {POPULAR.map(([f, t]) => (
            <button key={f + t}
              onClick={() => { setFrom(f); setTo(t); handleGetRoutes(f, t); }}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all hover:scale-[1.04]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
              {f} → {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Traffic Overview ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Avg Density',   val: `${avgDensity}%`, color: avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#ffd32a' : '#2ed573', Icon: Activity },
          { label: 'Best Time',     val: avgDensity >= 70 ? 'After 9PM' : avgDensity >= 35 ? 'Now OK' : 'Now ✅', color: '#2ed573', Icon: Clock },
          { label: 'Active Signals',val: `${signals?.length || 8}/8`, color: '#60a5fa', Icon: Radio },
          { label: 'Live Cameras',  val: '10/10', color: '#a78bfa', Icon: Wifi },
        ].map(({ label, val, color, Icon }) => (
          <div key={label} className="city-card p-4 stat-card flex items-center gap-3">
            <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color }}>{val}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Route List ── */}
      <div>
        <h2 className="font-bold text-lg mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap size={18} className="text-yellow-400" />
          AI Suggested Routes
          {routes && <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
            — {lastSearch.from} → {lastSearch.to}
          </span>}
        </h2>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="city-card p-5 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-28 rounded-full" style={{ background: 'var(--border)' }} />
                  <div className="h-7 w-16 rounded" style={{ background: 'var(--border)' }} />
                </div>
                <div className="h-4 w-3/4 rounded mb-2" style={{ background: 'var(--border)' }} />
                <div className="h-2 rounded-full w-full mb-4" style={{ background: 'var(--border)' }} />
                <div className="flex gap-2">
                  <div className="h-10 flex-1 rounded-xl" style={{ background: 'var(--border)' }} />
                  <div className="h-10 w-24 rounded-xl" style={{ background: 'var(--border)' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Route cards */}
        {!loading && routes && (
          <div className="space-y-4">
            {routes.map((r, i) => (
              <RouteCard
                key={r.id}
                route={r}
                isTop={i === 0}
                onNavigate={handleNavigate}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Google Maps Links ── */}
      <div className="city-card p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Map size={16} className="text-blue-400" /> Quick Google Maps Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label:  '🛰️ Open Satellite Map',
              desc:   'View Pune in satellite view',
              url:    'https://www.google.com/maps/@18.5204,73.8567,13z/data=!5m1!1e6',
              color:  '#60a5fa',
            },
            {
              label:  '🚦 Live Traffic Layer',
              desc:   'See real-time traffic on Google Maps',
              url:    'https://www.google.com/maps/@18.5204,73.8567,13z/data=!5m1!1e1',
              color:  '#2ed573',
            },
            {
              label:  '🏢 Hinjewadi IT Park',
              desc:   'Navigate to Pune\'s IT hub',
              url:    buildGoogleMapsUrl('Pune Railway Station', 'Hinjewadi IT Park, Pune'),
              color:  '#a78bfa',
            },
            {
              label:  '✈️ Navigate to Airport',
              desc:   'Directions to Pune Airport',
              url:    buildGoogleMapsUrl('Shivajinagar, Pune', 'Pune Airport'),
              color:  '#ffd32a',
            },
          ].map((item) => (
            <a
              key={item.label}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02]"
              style={{ background: `${item.color}08`, border: `1px solid ${item.color}25`, textDecoration: 'none' }}>
              <div>
                <p className="font-bold text-sm" style={{ color: item.color }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
              <ExternalLink size={14} className="ml-auto flex-shrink-0" style={{ color: item.color }} />
            </a>
          ))}
        </div>
      </div>

      {/* ── AI Traffic Tips ── */}
      <div className="city-card p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={16} className="text-purple-400" /> AI Traffic Intelligence
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: '⏰',
              title: 'Best Travel Window',
              value: avgDensity >= 70 ? 'After 9:00 PM' : avgDensity >= 35 ? '6:00 – 8:00 AM' : 'Now is perfect! ✅',
              color: '#2ed573',
              desc: avgDensity >= 70 ? 'Peak hour congestion detected' : 'Traffic is manageable',
            },
            {
              icon: '🚧',
              title: 'Congested Zones',
              value: trafficData?.filter(t => t.density >= 70).length > 0
                ? trafficData?.filter(t => t.density >= 70).map(t => t.name).slice(0, 2).join(', ')
                : 'None 🟢',
              color: avgDensity >= 70 ? '#ff4757' : '#2ed573',
              desc: 'Based on live IoT sensor data',
            },
            {
              icon: '💡',
              title: 'AI Tip',
              value: avgDensity >= 70 ? 'Use Ring Road' : avgDensity >= 35 ? 'Slight delays expected' : 'All routes clear',
              color: '#a78bfa',
              desc: 'Updated every 60 seconds',
            },
          ].map(t => (
            <div key={t.title} className="p-4 rounded-2xl"
              style={{ background: `${t.color}08`, border: `1px solid ${t.color}20` }}>
              <div className="text-2xl mb-2">{t.icon}</div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t.title}</p>
              <p className="font-bold text-sm mb-1" style={{ color: t.color }}>{t.value}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
