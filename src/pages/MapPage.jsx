import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { Map, Car, ParkingSquare, AlertTriangle, Info, X, Navigation2 } from 'lucide-react';

// Simple SVG-based map of Pune zones
const PUNE_ZONES = [
  { id: 'central', x: 400, y: 280, name: 'Central Pune', width: 120, height: 80 },
  { id: 'camp', x: 460, y: 340, name: 'Camp', width: 100, height: 70 },
  { id: 'deccan', x: 310, y: 280, name: 'Deccan', width: 90, height: 70 },
  { id: 'kothrud', x: 240, y: 320, name: 'Kothrud', width: 100, height: 80 },
  { id: 'baner', x: 240, y: 200, name: 'Baner', width: 90, height: 70 },
  { id: 'hinjewadi', x: 140, y: 160, name: 'Hinjewadi', width: 100, height: 70 },
  { id: 'viman', x: 520, y: 200, name: 'Viman Nagar', width: 110, height: 70 },
  { id: 'hadapsar', x: 480, y: 400, name: 'Hadapsar', width: 100, height: 70 },
];

const ROAD_PATHS = [
  'M 150 180 L 280 220', // Hinjewadi to Baner
  'M 280 220 L 350 260', // Baner to Deccan
  'M 350 280 L 420 290', // Deccan to Central
  'M 420 290 L 540 210', // Central to Viman Nagar
  'M 440 360 L 500 360', // Central to Camp/Hadapsar
  'M 340 320 L 280 340', // Deccan to Kothrud
  'M 500 360 L 520 420', // Camp to Hadapsar
];

function MapMarker({ type, x, y, label, data, onClick, selected }) {
  const config = {
    traffic: { color: data?.density >= 70 ? '#ff4757' : data?.density >= 35 ? '#ffd32a' : '#2ed573', icon: '🚗', size: 10 },
    parking: { color: '#60a5fa', icon: '🅿️', size: 10 },
    violation: { color: '#ff4757', icon: '⚠️', size: 8 },
    signal: { color: data?.phase === 'green' ? '#2ed573' : data?.phase === 'yellow' ? '#ffd32a' : '#ff4757', icon: '🚦', size: 8 },
  };
  const c = config[type] || config.traffic;

  return (
    <g onClick={() => onClick({ type, label, data })} style={{ cursor: 'pointer' }}>
      {selected && (
        <circle cx={x} cy={y} r={c.size + 8} fill={c.color} opacity={0.2}>
          <animate attributeName="r" values={`${c.size + 5};${c.size + 12};${c.size + 5}`} dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={x} cy={y} r={c.size} fill={c.color} opacity={0.9}>
        <animate attributeName="opacity" values="0.9;0.6;0.9" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={x} cy={y} r={c.size - 3} fill="#050d1a" />
      <circle cx={x} cy={y} r={c.size - 5} fill={c.color} />
    </g>
  );
}

export default function MapPage() {
  const { trafficData, parkingData, signals, violations, emergencyMode, avgDensity } = useCityData();
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [layerFilter, setLayerFilter] = useState({ traffic: true, parking: true, signals: true, violations: true });
  const [viewBox, setViewBox] = useState('100 130 580 350');

  const toggleLayer = (layer) => {
    setLayerFilter(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Assign positions to data
  const trafficMarkers = trafficData.map((t, i) => ({
    ...t,
    x: [150, 200, 300, 360, 430, 480, 540, 490, 430, 310][i] || 300,
    y: [175, 240, 230, 290, 290, 350, 210, 420, 400, 350][i] || 300,
  }));

  const parkingMarkers = parkingData.map((p, i) => ({
    ...p,
    x: [430, 330, 490, 260, 175, 550][i] || 300,
    y: [270, 340, 355, 300, 195, 215][i] || 300,
  }));

  const signalMarkers = signals.map((s, i) => ({
    ...s,
    x: [440, 480, 200, 370, 290, 530, 500, 330][i] || 350,
    y: [300, 370, 230, 270, 300, 210, 430, 320][i] || 280,
  }));

  const activeViolationMarkers = violations.filter(v => v.status === 'Active').slice(0, 5).map((v, i) => ({
    ...v,
    x: [420, 460, 350, 500, 280][i] || 400,
    y: [320, 380, 290, 340, 330][i] || 320,
  }));

  const handleMarkerClick = (info) => {
    setSelectedMarker(info);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">City Map Overview</h1>
          <p className="text-gray-400 text-sm mt-1">Live traffic & parking visualization across Pune zones</p>
        </div>
        {emergencyMode && (
          <div className="px-4 py-2 rounded-xl text-red-400 font-bold text-sm border border-red-500/30 emergency-mode">
            🚨 Emergency Corridor Active
          </div>
        )}
      </div>

      {/* Layer controls */}
      <div className="flex flex-wrap gap-2">
        <span className="text-gray-400 text-xs self-center">Layers:</span>
        {[
          { key: 'traffic', label: 'Traffic', color: '#2ed573' },
          { key: 'parking', label: 'Parking', color: '#60a5fa' },
          { key: 'signals', label: 'Signals', color: '#ffd32a' },
          { key: 'violations', label: 'Violations', color: '#ff4757' },
        ].map(layer => (
          <button
            key={layer.key}
            onClick={() => toggleLayer(layer.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: layerFilter[layer.key] ? `${layer.color}20` : 'rgba(10,22,40,0.8)',
              border: `1px solid ${layerFilter[layer.key] ? layer.color + '50' : 'rgba(30,58,95,0.4)'}`,
              color: layerFilter[layer.key] ? layer.color : '#6b7280',
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: layerFilter[layer.key] ? layer.color : '#6b7280' }} />
            {layer.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map canvas */}
        <div className="lg:col-span-3 glass-light rounded-xl overflow-hidden relative map-container" style={{ minHeight: '480px' }}>
          {/* Map grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(29,110,245,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(29,110,245,0.04) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />

          <svg
            viewBox={viewBox}
            className="w-full h-full"
            style={{ minHeight: '480px' }}
          >
            {/* Zone boundaries */}
            {PUNE_ZONES.map(zone => (
              <g key={zone.id}>
                <rect
                  x={zone.x - zone.width / 2}
                  y={zone.y - zone.height / 2}
                  width={zone.width}
                  height={zone.height}
                  rx="8"
                  fill="rgba(29,110,245,0.04)"
                  stroke="rgba(29,110,245,0.15)"
                  strokeWidth="1"
                />
                <text
                  x={zone.x}
                  y={zone.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="rgba(168,196,232,0.5)"
                  fontSize="8"
                  fontFamily="Inter, sans-serif"
                >
                  {zone.name}
                </text>
              </g>
            ))}

            {/* Roads */}
            {ROAD_PATHS.map((d, i) => (
              <path
                key={i}
                d={d}
                stroke="rgba(29,110,245,0.3)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            ))}

            {/* Emergency corridor overlay */}
            {emergencyMode && ROAD_PATHS.slice(0, 4).map((d, i) => (
              <path
                key={`emerg-${i}`}
                d={d}
                stroke="#2ed573"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
                opacity={0.6}
              >
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
              </path>
            ))}

            {/* Traffic markers */}
            {layerFilter.traffic && trafficMarkers.map((t, i) => (
              <MapMarker
                key={`tr-${t.id}`}
                type="traffic"
                x={t.x}
                y={t.y}
                label={t.name}
                data={t}
                onClick={handleMarkerClick}
                selected={selectedMarker?.label === t.name}
              />
            ))}

            {/* Parking markers */}
            {layerFilter.parking && parkingMarkers.map((p, i) => (
              <MapMarker
                key={`pk-${p.id}`}
                type="parking"
                x={p.x}
                y={p.y}
                label={p.name}
                data={p}
                onClick={handleMarkerClick}
                selected={selectedMarker?.label === p.name}
              />
            ))}

            {/* Signal markers */}
            {layerFilter.signals && signalMarkers.map((s, i) => (
              <MapMarker
                key={`sg-${s.id}`}
                type="signal"
                x={s.x}
                y={s.y}
                label={s.name}
                data={s}
                onClick={handleMarkerClick}
                selected={selectedMarker?.label === s.name}
              />
            ))}

            {/* Violation markers */}
            {layerFilter.violations && activeViolationMarkers.map((v, i) => (
              <MapMarker
                key={`vl-${v.id}`}
                type="violation"
                x={v.x}
                y={v.y}
                label={v.type}
                data={v}
                onClick={handleMarkerClick}
                selected={selectedMarker?.label === v.type}
              />
            ))}
          </svg>

          {/* Map labels */}
          <div className="absolute top-3 left-3 text-xs text-gray-600 font-medium">Pune Metropolitan Area</div>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />
            Live Map
          </div>

          {/* Selected marker info */}
          {selectedMarker && (
            <div className="absolute top-3 right-3 w-56 animate-fade-in"
              style={{ background: 'rgba(5,13,26,0.95)', border: '1px solid rgba(30,58,95,0.8)', borderRadius: '12px', padding: '12px' }}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-semibold text-xs">{selectedMarker.label}</h4>
                <button onClick={() => setSelectedMarker(null)} className="text-gray-500 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </div>
              {selectedMarker.type === 'traffic' && (
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Density: <span className="text-white font-semibold">{selectedMarker.data?.density}%</span></div>
                  <div>Vehicles: <span className="text-white font-semibold">{selectedMarker.data?.vehicles}</span></div>
                  <div>Speed: <span className="text-white font-semibold">{selectedMarker.data?.speed} km/h</span></div>
                </div>
              )}
              {selectedMarker.type === 'parking' && (
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Available: <span className="text-green-400 font-semibold">{selectedMarker.data?.available}</span></div>
                  <div>Total: <span className="text-white font-semibold">{selectedMarker.data?.total}</span></div>
                </div>
              )}
              {selectedMarker.type === 'signal' && (
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Phase: <span className="font-semibold" style={{ color: selectedMarker.data?.phase === 'green' ? '#2ed573' : selectedMarker.data?.phase === 'yellow' ? '#ffd32a' : '#ff4757' }}>{selectedMarker.data?.phase?.toUpperCase()}</span></div>
                  <div>Timer: <span className="text-white font-semibold">{selectedMarker.data?.timer}s</span></div>
                </div>
              )}
              {selectedMarker.type === 'violation' && (
                <div className="space-y-1 text-xs text-gray-400">
                  <div>Type: <span className="text-red-400 font-semibold">{selectedMarker.label}</span></div>
                  <div>Location: <span className="text-white font-semibold">{selectedMarker.data?.location}</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map legend / stats panel */}
        <div className="space-y-3">
          {/* Legend */}
          <div className="glass-light rounded-xl p-4">
            <h3 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Legend</h3>
            {[
              { color: '#2ed573', label: 'Low Traffic' },
              { color: '#ffd32a', label: 'Medium Traffic' },
              { color: '#ff4757', label: 'High Traffic' },
              { color: '#60a5fa', label: 'Parking' },
              { color: '#ffd32a', label: 'Traffic Signal' },
              { color: '#ff4757', label: 'Violation' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                <span className="text-gray-400 text-xs">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="glass-light rounded-xl p-4">
            <h3 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Zone Summary</h3>
            <div className="space-y-3">
              {[
                { label: 'High Traffic', value: trafficData.filter(t => t.density >= 70).length, color: '#ff4757', icon: Car },
                { label: 'Available Parking', value: parkingData.reduce((s, p) => s + p.available, 0), color: '#60a5fa', icon: ParkingSquare },
                { label: 'Active Alerts', value: violations.filter(v => v.status === 'Active').length, color: '#ffd32a', icon: AlertTriangle },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                      <span className="text-gray-400 text-xs">{s.label}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: s.color }}>{s.value}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation helper */}
          <div className="glass-light rounded-xl p-4">
            <h3 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">Route Helper</h3>
            <p className="text-gray-500 text-xs mb-3">Based on current traffic, best routes:</p>
            {[
              { from: 'Hinjewadi', to: 'Camp', via: 'Baner', status: 'Clear' },
              { from: 'Kothrud', to: 'Hadapsar', via: 'FC Road', status: 'Heavy' },
            ].map((r, i) => (
              <div key={i} className="mb-2 p-2 rounded-lg text-xs" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(30,58,95,0.3)' }}>
                <div className="flex items-center gap-1 text-gray-300">
                  <Navigation2 className="w-3 h-3 text-blue-400" />
                  {r.from} → {r.to}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">via {r.via}</span>
                  <span style={{ color: r.status === 'Clear' ? '#2ed573' : '#ff4757' }}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
