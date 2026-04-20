import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import {
  MapPin, Navigation, Route, X, ChevronRight, Activity,
  Car, ParkingSquare, AlertTriangle, Radio, Layers,
  RefreshCw, Clock, Gauge, Zap
} from 'lucide-react';

// ── Pune reference coordinates ────────────────────────────────────────────────
const PUNE_CENTER = [18.5204, 73.8567];
const PUNE_ZOOM   = 13;

// ── Tile layer definitions ────────────────────────────────────────────────────
const TILE_LAYERS = {
  satellite: {
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr:  '© Esri World Imagery',
    label: '🛰️ Satellite',
  },
  hybrid: {
    url:   'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr:  '© Esri',
    label: '🌍 Hybrid',
    labels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
  },
  road: {
    url:   'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attr:  '© OpenStreetMap © CartoDB',
    label: '🗺️ Road',
  },
  osm: {
    url:   'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attr:  '© OpenStreetMap',
    label: '📍 Street',
  },
};

// ── Colour helpers ─────────────────────────────────────────────────────────────
const densityColor  = d => d >= 70 ? '#ff4757' : d >= 35 ? '#ffd32a' : '#2ed573';
const densityEmoji  = d => d >= 70 ? '🔴' : d >= 35 ? '🟡' : '🟢';
const signalColor   = p => p === 'green' ? '#2ed573' : p === 'yellow' ? '#ffd32a' : '#ff4757';

// ── SVG circle icon factory ───────────────────────────────────────────────────
function makeIcon(L, color, emoji, size = 34) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}">
    <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/></filter>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" opacity="0.95" filter="url(#sh)"/>
    <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 6}" fill="rgba(0,0,0,0.35)"/>
    <text x="${size/2}" y="${size/2 + 5}" font-size="${size * 0.38}" text-anchor="middle">${emoji}</text>
    <polygon points="${size/2 - 5},${size - 2} ${size/2 + 5},${size - 2} ${size/2},${size + 6}" fill="${color}"/>
  </svg>`;
  return L.icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
    iconSize:   [size, size + 8],
    iconAnchor: [size / 2, size + 6],
    popupAnchor:[0, -(size + 6)],
  });
}

// ── Popup HTML builders ────────────────────────────────────────────────────────
const trafficPopup = t => `
  <div style="font-family:Inter,sans-serif;min-width:160px;padding:2px">
    <div style="font-weight:800;font-size:13px;margin-bottom:6px;color:${densityColor(t.density)}">${densityEmoji(t.density)} ${t.name}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:#aaa">
      <span>🚗 <b style="color:#fff">${t.vehicles}</b> vehicles</span>
      <span>⚡ <b style="color:#fff">${t.speed} km/h</b></span>
      <span>📊 <b style="color:${densityColor(t.density)}">${t.density}%</b> density</span>
    </div>
    <div style="margin-top:6px;height:4px;border-radius:999px;background:rgba(255,255,255,0.1)">
      <div style="width:${t.density}%;height:100%;border-radius:999px;background:${densityColor(t.density)}"></div>
    </div>
    <div style="font-size:10px;color:${densityColor(t.density)};margin-top:4px;font-weight:700">
      ${t.density >= 70 ? '⚠️ HIGH — Avoid if possible' : t.density >= 35 ? '🟡 MODERATE — Some delays' : '✅ CLEAR — Good to go!'}
    </div>
  </div>`;

const parkingPopup = p => {
  const pct = Math.round(((p.total - p.available) / p.total) * 100);
  const col  = p.available === 0 ? '#ff4757' : p.available < 30 ? '#ffd32a' : '#2ed573';
  return `
  <div style="font-family:Inter,sans-serif;min-width:150px;padding:2px">
    <div style="font-weight:800;font-size:13px;margin-bottom:4px;color:${col}">🅿️ ${p.name}</div>
    <div style="font-size:11px;color:#aaa;margin-bottom:6px">${p.area}</div>
    <div style="display:flex;justify-content:space-between;font-size:12px">
      <span style="color:#2ed573">✅ Free: <b>${p.available}</b></span>
      <span style="color:#ff4757">🚫 Used: <b>${p.total - p.available}</b></span>
    </div>
    <div style="margin-top:6px;height:4px;border-radius:999px;background:rgba(255,255,255,0.1)">
      <div style="width:${pct}%;height:100%;border-radius:999px;background:${col}"></div>
    </div>
    <div style="font-size:10px;color:${col};margin-top:4px;font-weight:700;">
      ${pct}% occupied ${p.available === 0 ? '— FULL 🔴' : ''}
    </div>
  </div>`;
};

const signalPopup = s => `
  <div style="font-family:Inter,sans-serif;min-width:140px;padding:2px">
    <div style="font-weight:800;font-size:13px;margin-bottom:6px;color:#fff">🚦 ${s.name}</div>
    <div style="display:flex;gap:8px;align-items:center;font-size:12px;flex-wrap:wrap">
      <span>Phase: <b style="color:${signalColor(s.phase)}">${(s.phase||'').toUpperCase()}</b></span>
      <span style="color:#aaa">⏱ ${s.timer}s</span>
      <span style="color:#aaa">${s.autoMode ? '🤖 Auto' : '⚙️ Manual'}</span>
    </div>
    <div style="margin-top:6px;width:12px;height:12px;border-radius:50%;background:${signalColor(s.phase)};box-shadow:0 0 10px ${signalColor(s.phase)};display:inline-block"></div>
  </div>`;

const violationPopup = v => `
  <div style="font-family:Inter,sans-serif;min-width:150px;padding:2px">
    <div style="font-weight:800;font-size:12px;color:#ff4757;margin-bottom:4px">⚠️ ${v.type}</div>
    <div style="font-size:11px;color:#aaa">Vehicle: <b style="color:#fff;font-family:monospace">${v.vehicle}</b></div>
    <div style="font-size:11px;color:#aaa">Location: <b style="color:#fff">${v.location}</b></div>
    <div style="font-size:12px;color:#ffd32a;font-weight:700;margin-top:4px">Fine: ₹${(v.fineAmount||0).toLocaleString('en-IN')}</div>
  </div>`;

// ── OSRM geocoding (Nominatim) ───────────────────────────────────────────────
async function geocode(place) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place + ', Pune, Maharashtra, India')}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name };
    return null;
  } catch { return null; }
}

// ── OSRM routing ─────────────────────────────────────────────────────────────
async function getRoute(fromCoord, toCoord) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromCoord.lng},${fromCoord.lat};${toCoord.lng},${toCoord.lat}?overview=full&geometries=geojson&steps=true`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    const route = data.routes[0];
    return {
      coords:   route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: (route.distance / 1000).toFixed(1) + ' km',
      duration: Math.round(route.duration / 60) + ' min',
      steps:    route.legs[0]?.steps?.length || 0,
    };
  } catch { return null; }
}

// ── Leaflet popup dark style ──────────────────────────────────────────────────
const POPUP_CSS = `
  .leaflet-popup-content-wrapper {
    background: rgba(10,20,40,0.97) !important;
    border: 1px solid rgba(29,110,245,0.25) !important;
    border-radius: 12px !important;
    color: #f0f6ff !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
    backdrop-filter: blur(12px) !important;
  }
  .leaflet-popup-tip { background: rgba(10,20,40,0.97) !important; }
  .leaflet-popup-close-button { color: #60a5fa !important; font-size: 16px !important; }
  .leaflet-bar a { background: rgba(10,20,40,0.95) !important; color: #60a5fa !important; border-color: rgba(29,110,245,0.25) !important; }
  .leaflet-bar a:hover { background: rgba(29,110,245,0.2) !important; }
  .leaflet-control-attribution { background: rgba(5,13,26,0.8) !important; color: #4a6888 !important; font-size: 9px !important; }
  .leaflet-container { background: #0a1628; }
`;

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MapPage() {
  const { trafficData, parkingData, signals, violations, emergencyMode, avgDensity } = useCityData();
  const { isAdmin } = useAuth();

  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const tileLayerRef    = useRef(null);
  const markersRef      = useRef([]);
  const routeLayerRef   = useRef(null);
  const fromMarkerRef   = useRef(null);
  const toMarkerRef     = useRef(null);

  const [mapType,      setMapType]      = useState('satellite');
  const [layers,       setLayers]       = useState({ traffic: true, signals: true, parking: true, violations: true });
  const [routeFrom,    setRouteFrom]    = useState('');
  const [routeTo,      setRouteTo]      = useState('');
  const [routeInfo,    setRouteInfo]    = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError,   setRouteError]   = useState('');
  const [mapLoaded,    setMapLoaded]    = useState(false);

  const densityCol   = densityColor(avgDensity);
  const densityEm    = densityEmoji(avgDensity);

  // ── Inject popup CSS once ──────────────────────────────────────────────────
  useEffect(() => {
    if (document.getElementById('leaflet-dark-style')) return;
    const s = document.createElement('style');
    s.id = 'leaflet-dark-style';
    s.textContent = POPUP_CSS;
    document.head.appendChild(s);
  }, []);

  // ── Initialise map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    import('leaflet').then(({ default: L }) => {
      // Fix Leaflet's default icon paths (broken in Vite)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        center:            PUNE_CENTER,
        zoom:              PUNE_ZOOM,
        zoomControl:       true,
        attributionControl: true,
        scrollWheelZoom:   true,
        preferCanvas:      true,
      });

      // Satellite tile layer (Esri — completely free)
      const tl = L.tileLayer(TILE_LAYERS.satellite.url, {
        attribution: TILE_LAYERS.satellite.attr,
        maxZoom:     19,
      });
      tl.addTo(map);
      tileLayerRef.current = tl;
      mapRef.current = map;

      setMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ── Switch tile layer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    import('leaflet').then(({ default: L }) => {
      tileLayerRef.current?.remove();
      const cfg = TILE_LAYERS[mapType];
      const tl  = L.tileLayer(cfg.url, { attribution: cfg.attr, maxZoom: 19 });
      tl.addTo(mapRef.current);
      tileLayerRef.current = tl;
      tl.bringToBack();
    });
  }, [mapType, mapLoaded]);

  // ── Redraw markers when data or layer toggles change ───────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    import('leaflet').then(({ default: L }) => {
      const map = mapRef.current;

      // Clear old markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      const add = (coords, icon, html) => {
        if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;
        const m = L.marker(coords, { icon })
          .bindPopup(html, { maxWidth: 240, className: 'dark-popup' })
          .addTo(map);
        markersRef.current.push(m);
      };

      // Traffic markers
      if (layers.traffic) {
        trafficData.forEach(t => {
          if (!t.lat || !t.lng) return;
          const col   = densityColor(t.density);
          const emoji = densityEmoji(t.density);
          add([t.lat, t.lng], makeIcon(L, col, emoji), trafficPopup(t));
        });
      }

      // Signal markers
      if (layers.signals) {
        signals.forEach(s => {
          if (!s.lat || !s.lng) return;
          add([s.lat, s.lng], makeIcon(L, signalColor(s.phase), '🚦', 30), signalPopup(s));
        });
      }

      // Parking markers
      if (layers.parking) {
        parkingData.forEach(p => {
          if (!p.lat || !p.lng) return;
          const col = p.available === 0 ? '#ff4757' : p.available < 30 ? '#ffd32a' : '#2ed573';
          add([p.lat, p.lng], makeIcon(L, col, '🅿️', 30), parkingPopup(p));
        });
      }

      // Violation markers
      if (layers.violations) {
        violations.filter(v => v.status === 'Active').slice(0, 8).forEach((v, i) => {
          const jitter = (Math.sin(i * 97) * 0.008);
          const lat    = PUNE_CENTER[0] + (Math.sin(i * 1.3) * 0.03) + jitter;
          const lng    = PUNE_CENTER[1] + (Math.cos(i * 1.3) * 0.03) + jitter;
          add([lat, lng], makeIcon(L, '#ff4757', '⚠️', 28), violationPopup(v));
        });
      }

      // Emergency marker
      if (emergencyMode) {
        add(PUNE_CENTER, makeIcon(L, '#ff4757', '🚨', 40),
          `<div style="font-family:Inter,sans-serif;color:#ff4757;font-weight:800">🚨 EMERGENCY MODE ACTIVE<br/><span style="color:#aaa;font-size:11px;font-weight:400">All signals GREEN · Corridor Live</span></div>`
        );
      }
    });
  }, [mapLoaded, trafficData, signals, parkingData, violations, emergencyMode, layers]);

  // ── Route calculator ───────────────────────────────────────────────────────
  const calculateRoute = useCallback(async () => {
    if (!routeFrom.trim() || !routeTo.trim()) return;
    setRouteLoading(true);
    setRouteError('');
    setRouteInfo(null);

    // Clear existing route
    if (routeLayerRef.current)  { mapRef.current?.removeLayer(routeLayerRef.current);  routeLayerRef.current  = null; }
    if (fromMarkerRef.current)  { mapRef.current?.removeLayer(fromMarkerRef.current);  fromMarkerRef.current  = null; }
    if (toMarkerRef.current)    { mapRef.current?.removeLayer(toMarkerRef.current);    toMarkerRef.current    = null; }

    // Geocode both places
    const [fromCoord, toCoord] = await Promise.all([
      geocode(routeFrom),
      geocode(routeTo),
    ]);

    if (!fromCoord) { setRouteError(`❌ Could not find "${routeFrom}". Try a known Pune location.`); setRouteLoading(false); return; }
    if (!toCoord)   { setRouteError(`❌ Could not find "${routeTo}". Try a known Pune location.`);   setRouteLoading(false); return; }

    // Get driving route from OSRM
    const route = await getRoute(fromCoord, toCoord);
    if (!route) { setRouteError('❌ Could not calculate route. Please try again.'); setRouteLoading(false); return; }

    // Draw route + markers on map
    const L = (await import('leaflet')).default;
    const map = mapRef.current;

    // Route polyline with glow effect
    const glow = L.polyline(route.coords, { color: 'rgba(29,110,245,0.25)', weight: 12, lineCap: 'round' }).addTo(map);
    const line = L.polyline(route.coords, { color: '#1d6ef5',               weight: 5,  lineCap: 'round', dashArray: null }).addTo(map);
    routeLayerRef.current = L.layerGroup([glow, line]);
    markersRef.current.push(glow, line);

    // Start marker (green)
    fromMarkerRef.current = L.marker([fromCoord.lat, fromCoord.lng], {
      icon: makeIcon(L, '#2ed573', '🟢', 32),
    }).bindPopup(`<b style="color:#2ed573">📍 Start</b><br/><span style="font-size:11px;color:#aaa">${routeFrom}</span>`).addTo(map);
    markersRef.current.push(fromMarkerRef.current);

    // End marker (red)
    toMarkerRef.current = L.marker([toCoord.lat, toCoord.lng], {
      icon: makeIcon(L, '#ff4757', '🏁', 32),
    }).bindPopup(`<b style="color:#ff4757">🏁 Destination</b><br/><span style="font-size:11px;color:#aaa">${routeTo}</span>`).addTo(map);
    markersRef.current.push(toMarkerRef.current);

    // Fit bounds
    const bounds = L.latLngBounds(route.coords);
    map.fitBounds(bounds, { padding: [60, 60] });

    setRouteInfo({
      distance: route.distance,
      duration: route.duration,
      steps:    route.steps,
      from:     routeFrom,
      to:       routeTo,
    });
    setRouteLoading(false);
  }, [routeFrom, routeTo]);

  const clearRoute = useCallback(async () => {
    const L = (await import('leaflet')).default;
    if (routeLayerRef.current) { mapRef.current?.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
    if (fromMarkerRef.current) { mapRef.current?.removeLayer(fromMarkerRef.current); fromMarkerRef.current = null; }
    if (toMarkerRef.current)   { mapRef.current?.removeLayer(toMarkerRef.current);   toMarkerRef.current   = null; }
    markersRef.current = markersRef.current.filter(m => {
      if (m._url) return true; // keep markers
      return true;
    });
    setRouteInfo(null);
    setRouteError('');
    setRouteFrom('');
    setRouteTo('');
    mapRef.current?.setView(PUNE_CENTER, PUNE_ZOOM);
  }, []);

  const quickRoute = (f, t) => { setRouteFrom(f); setRouteTo(t); };

  const toggleLayer = k => setLayers(p => ({ ...p, [k]: !p[k] }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      <div className="space-y-4 animate-fade-in pb-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                style={{ background: 'rgba(46,213,115,0.1)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.25)' }}>
                <div className="w-1 h-1 rounded-full bg-green-500 blink" /> LIVE MAP
              </span>
              {emergencyMode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold animate-pulse"
                  style={{ background: 'rgba(255,71,87,0.12)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)' }}>
                  🚨 EMERGENCY ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>🌍 City Traffic Map</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Real-time Satellite Map · OSRM Routing · {densityEm} Traffic: {avgDensity}%
            </p>
          </div>

          {/* Map type switcher */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            {Object.entries(TILE_LAYERS).map(([key, tl]) => (
              <button key={key} onClick={() => setMapType(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: mapType === key ? 'rgba(29,110,245,0.2)' : 'transparent',
                  color:      mapType === key ? '#60a5fa' : 'var(--text-muted)',
                  border:     mapType === key ? '1px solid rgba(29,110,245,0.4)' : '1px solid transparent',
                }}>
                {tl.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Layer toggles ── */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs self-center font-semibold" style={{ color: 'var(--text-muted)' }}>Layers:</span>
          {[
            { key: 'traffic',    label: '🚗 Traffic',    color: '#2ed573' },
            { key: 'signals',    label: '🚦 Signals',    color: '#ffd32a' },
            { key: 'parking',    label: '🅿️ Parking',   color: '#60a5fa' },
            { key: 'violations', label: '⚠️ Violations', color: '#ff4757' },
          ].map(l => (
            <button key={l.key} onClick={() => toggleLayer(l.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: layers[l.key] ? `${l.color}18` : 'var(--bg-surface)',
                border:     `1px solid ${layers[l.key] ? l.color + '50' : 'var(--border)'}`,
                color:      layers[l.key] ? l.color : 'var(--text-muted)',
              }}>
              <div className="w-2 h-2 rounded-full" style={{ background: layers[l.key] ? l.color : 'var(--text-muted)' }} />
              {l.label}
            </button>
          ))}
        </div>

        {/* ── Map + Right panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* ── Leaflet Map ── */}
          <div className="lg:col-span-3 relative rounded-2xl overflow-hidden"
            style={{ minHeight: 520, border: '1px solid var(--border)', background: '#0a1628' }}>

            {/* Loading overlay */}
            {!mapLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"
                style={{ background: '#0a1628' }}>
                <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 border-t-blue-500 mb-4"
                  style={{ animation: 'spin 0.8s linear infinite' }} />
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Loading Satellite Map...</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Esri World Imagery · Powered by OpenStreetMap</p>
              </div>
            )}

            {/* Map container */}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: 520 }} />

            {/* Badge overlays */}
            {mapLoaded && (
              <>
                <div className="absolute top-3 left-3 z-[400] flex gap-2 flex-wrap pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-sm"
                    style={{ background: 'rgba(5,13,26,0.85)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.3)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 blink" /> LIVE · Pune
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-sm"
                    style={{ background: 'rgba(5,13,26,0.85)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                    {TILE_LAYERS[mapType]?.label}
                  </span>
                </div>
                <div className="absolute bottom-6 right-3 z-[400] text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm pointer-events-none"
                  style={{ background: 'rgba(5,13,26,0.8)', color: densityCol }}>
                  {densityEm} Traffic {avgDensity}%
                </div>
              </>
            )}
          </div>

          {/* ── Right Panel ── */}
          <div className="space-y-4">

            {/* Route Planner */}
            <div className="city-card p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Route size={16} className="text-blue-500" /> Plan Your Journey 🗺️
              </h3>

              <div className="space-y-2.5 mb-3">
                {/* From */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="From: e.g. FC Road"
                    value={routeFrom}
                    onChange={e => setRouteFrom(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && calculateRoute()}
                    className="city-input w-full pl-8 pr-3 py-2.5 rounded-xl text-sm"
                  />
                </div>
                {/* To */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="To: e.g. Hinjewadi"
                    value={routeTo}
                    onChange={e => setRouteTo(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && calculateRoute()}
                    className="city-input w-full pl-8 pr-3 py-2.5 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={calculateRoute}
                  disabled={routeLoading || !routeFrom.trim() || !routeTo.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 hover:scale-[1.02] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#1d6ef5,#0d4ed8)', boxShadow: '0 4px 14px rgba(29,110,245,0.35)' }}>
                  {routeLoading
                    ? <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} /> Routing...</>
                    : <><Navigation size={13} /> Get Route</>}
                </button>
                {(routeInfo || routeFrom || routeTo) && (
                  <button onClick={clearRoute}
                    className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', color: '#ff4757' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Quick Routes */}
              <div>
                <p className="text-[10px] font-bold mb-2 tracking-wider" style={{ color: 'var(--text-muted)' }}>QUICK ROUTES</p>
                {[
                  ['FC Road',      'Hinjewadi IT Park'],
                  ['Shivajinagar', 'Hadapsar'],
                  ['Kothrud',      'Viman Nagar'],
                  ['Swargate',     'Baner Road'],
                ].map(([f, t]) => (
                  <button key={f + t} onClick={() => { quickRoute(f, t); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl mb-1.5 text-xs transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <span className="font-mono">{f} → {t}</span>
                    <ChevronRight size={10} style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>

              {/* Route Result */}
              {routeInfo && (
                <div className="mt-3 p-3.5 rounded-xl animate-fade-in"
                  style={{ background: 'rgba(29,110,245,0.08)', border: '1px solid rgba(29,110,245,0.25)' }}>
                  <p className="text-[10px] font-black text-blue-400 mb-2">✅ ROUTE FOUND · OSRM</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Gauge,  label: 'Distance', val: routeInfo.distance, color: '#60a5fa' },
                      { icon: Clock,  label: 'Duration', val: routeInfo.duration, color: '#2ed573' },
                    ].map(({ icon: Icon, label, val, color }) => (
                      <div key={label} className="p-2 rounded-lg text-center"
                        style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                        <p className="font-bold text-sm" style={{ color }}>{val}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] mt-2 font-bold text-center" style={{ color: 'var(--text-muted)' }}>
                    {routeInfo.from} → {routeInfo.to}
                  </p>
                  <p className="text-[10px] text-center mt-1" style={{ color: 'var(--text-muted)' }}>
                    {routeInfo.steps} turn-by-turn steps · via OSRM
                  </p>
                </div>
              )}

              {/* Error */}
              {routeError && (
                <div className="mt-3 p-3 rounded-xl text-xs animate-fade-in"
                  style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)', color: '#ff6b7a' }}>
                  {routeError}
                </div>
              )}
            </div>

            {/* Live Stats */}
            <div className="city-card p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Activity size={16} className="text-green-500" /> Live City Stats
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Avg Traffic',   value: `${densityEm} ${avgDensity}%`, color: densityCol,  Icon: Car },
                  { label: 'Free Parking',  value: `🅿️ ${parkingData.reduce((s, p) => s + p.available, 0)}`, color: '#60a5fa', Icon: ParkingSquare },
                  { label: 'Signals Live',  value: `🚦 ${signals.length}/8`,      color: '#2ed573',   Icon: Radio },
                  { label: 'Violations',    value: `⚠️ ${violations.filter(v => v.status === 'Active').length}`, color: '#ff4757', Icon: AlertTriangle },
                ].map(({ label, value, color, Icon }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} style={{ color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    </div>
                    <span className="font-bold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="city-card p-4">
              <h3 className="font-bold text-xs mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <Layers size={11} className="inline mr-1" />Map Legend
              </h3>
              {[
                { emoji: '🟢', label: 'Low Traffic  (< 35%)' },
                { emoji: '🟡', label: 'Moderate  (35–70%)'   },
                { emoji: '🔴', label: 'Heavy  (> 70%)'       },
                { emoji: '🅿️', label: 'Parking Hub'          },
                { emoji: '🚦', label: 'Traffic Signal'       },
                { emoji: '⚠️', label: 'Active Violation'     },
                { emoji: '🚨', label: 'Emergency Zone'       },
                { emoji: '🟢', label: 'Route Start'          },
                { emoji: '🏁', label: 'Route End'            },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5 text-xs">
                  <span style={{ fontSize: 14 }}>{l.emoji}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
                </div>
              ))}
              <p className="text-[10px] mt-3 pt-2 border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                Click any marker for live details
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
