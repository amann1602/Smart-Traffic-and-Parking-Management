import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { ParkingSquare, Search, Plus, Minus, MapPin, Car, CheckCircle2, XCircle } from 'lucide-react';

function ParkingCard({ parking, isAdmin, onAddSlot, onRemoveSlot, onReserve }) {
  const pct = Math.round(((parking.total - parking.available) / parking.total) * 100);
  const statusColor = parking.available === 0 ? '#ff4757' : parking.available < 20 ? '#e6a800' : '#16a34a';
  const statusLabel = parking.available === 0 ? 'Full' : parking.available < 20 ? 'Almost Full' : 'Available';
  const [reserving, setReserving] = useState(false);

  const handleReserve = () => {
    setReserving(true);
    onReserve(parking.id);
    setTimeout(() => setReserving(false), 1000);
  };

  return (
    <div className="city-card p-5 stat-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: `${statusColor}15` }}>
            <ParkingSquare className="w-5 h-5" style={{ color: statusColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{parking.name}</h3>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="w-3 h-3" />{parking.area}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
          {statusLabel}
        </span>
      </div>

      {/* Occupancy bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: 'var(--text-muted)' }}>Occupancy</span>
          <span className="font-bold" style={{ color: statusColor }}>{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${statusColor}88, ${statusColor})` }} />
        </div>
      </div>

      {/* Slot counts */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        {[
          { label: 'Free',     value: parking.available,               color: '#16a34a', bg: 'rgba(46,213,115,0.08)',  border: 'rgba(46,213,115,0.2)' },
          { label: 'Occupied', value: parking.total - parking.available - parking.reserved, color: '#ff4757', bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.2)' },
          { label: 'Reserved', value: parking.reserved,               color: '#e6a800', bg: 'rgba(255,211,42,0.08)', border: 'rgba(255,211,42,0.2)' },
        ].map(s => (
          <div key={s.label} className="p-2 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
            <div className="font-bold text-lg" style={{ color: s.color }}>{Math.max(0, s.value)}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mini slot map */}
      <div className="mb-4">
        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Slot map (sample)</p>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {Array.from({ length: Math.min(30, parking.total) }).map((_, i) => {
            const isOccupied = i >= parking.available;
            return (
              <div key={i} className="h-2 rounded-sm" style={{
                background: isOccupied ? 'rgba(255,71,87,0.5)' : 'rgba(46,213,115,0.4)',
              }} />
            );
          })}
        </div>
      </div>

      <p className="text-xs mb-4 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        <Car className="w-3 h-3" />
        Total Capacity: <span className="font-semibold ml-1" style={{ color: 'var(--text-primary)' }}>{parking.total} slots</span>
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        {isAdmin ? (
          <>
            <button onClick={() => onAddSlot(parking.id, 10)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors border"
              style={{ color: '#16a34a', borderColor: 'rgba(22,163,74,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,163,74,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Plus className="w-3.5 h-3.5" />Add 10
            </button>
            <button onClick={() => onRemoveSlot(parking.id, 10)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors border"
              style={{ color: '#ff4757', borderColor: 'rgba(255,71,87,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,71,87,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Minus className="w-3.5 h-3.5" />Remove 10
            </button>
          </>
        ) : (
          <button
            onClick={handleReserve}
            disabled={parking.available === 0 || reserving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: parking.available === 0 ? 'var(--bg-surface)' : 'linear-gradient(135deg, #1d6ef5, #0d4ed8)',
              color:      parking.available === 0 ? 'var(--text-muted)' : 'white',
              boxShadow:  parking.available > 0 ? '0 4px 15px rgba(29,110,245,0.3)' : 'none',
              border:     parking.available === 0 ? '1px solid var(--border)' : 'none',
            }}>
            {reserving ? (
              <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full spinner" /> Reserving...</>
            ) : parking.available === 0 ? (
              <><XCircle className="w-3.5 h-3.5" /> Parking Full</>
            ) : (
              <><CheckCircle2 className="w-3.5 h-3.5" /> Reserve Slot</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ParkingPage() {
  const { parkingData, updateParkingSlots, reserveSlot, totalParking, availableParking } = useCityData();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = parkingData.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.area.toLowerCase().includes(search.toLowerCase())
  );

  const occupiedPct = Math.round(((totalParking - availableParking) / totalParking) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Smart Parking System</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time parking availability across Pune · Auto-updated</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Capacity', value: totalParking,                   color: '#1d6ef5' },
          { label: 'Available',      value: availableParking,               color: '#16a34a' },
          { label: 'Occupied',       value: totalParking - availableParking, color: '#ff4757' },
          { label: 'Locations',      value: parkingData.length,             color: '#a78bfa' },
        ].map((item, i) => (
          <div key={i} className="city-card p-4">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value.toLocaleString()}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Overall gauge */}
      <div className="city-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Overall Occupancy</h3>
          <span className="text-lg font-bold" style={{
            color: occupiedPct > 80 ? '#ff4757' : occupiedPct > 50 ? '#e6a800' : '#16a34a'
          }}>{occupiedPct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{
            width: `${occupiedPct}%`,
            background: occupiedPct > 80 ? 'linear-gradient(90deg,#ff4757,#ff6b35)' : occupiedPct > 50 ? 'linear-gradient(90deg,#ffd32a,#ff9f43)' : 'linear-gradient(90deg,#2ed573,#00d4ff)',
          }} />
        </div>
        <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          <span>0%</span>
          <span className={occupiedPct > 80 ? 'text-red-500' : occupiedPct > 50 ? 'text-yellow-600' : 'text-green-600'}>
            {occupiedPct > 80 ? 'Critical' : occupiedPct > 50 ? 'Moderate' : 'Comfortable'}
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search parking location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="city-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
        />
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-400/40" />Available</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400/40" />Occupied</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-400/40" />Reserved</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <ParkingCard key={p.id} parking={p} isAdmin={isAdmin}
            onAddSlot={(id, n) => updateParkingSlots(id, n)}
            onRemoveSlot={(id, n) => updateParkingSlots(id, -n)}
            onReserve={reserveSlot} />
        ))}
      </div>
    </div>
  );
}
