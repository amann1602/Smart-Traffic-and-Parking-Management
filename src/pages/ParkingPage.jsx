import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import {
  ParkingSquare, Search, Plus, Minus, MapPin, Car, CheckCircle2,
  XCircle, Phone, MessageSquare, Clock, X, Smartphone, Bell, Zap,
  CheckCheck, Navigation, AlertTriangle
} from 'lucide-react';

// ── SMS Confirmation Modal ───────────────────────────────────────────────────
function BookingSuccessModal({ booking, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

        {/* Success Header */}
        <div className="p-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(29,110,245,0.15), rgba(0,212,255,0.08))' }}>
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(46,213,115,0.15)', border: '2px solid rgba(46,213,115,0.4)' }}>
            <CheckCheck size={36} className="text-green-400" />
          </div>
          <h2 className="text-xl font-black text-green-400">Slot Booked! 🎉</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your parking is confirmed</p>
        </div>

        <div className="p-5 space-y-3">
          {/* Booking Details */}
          <div className="rounded-2xl p-4 space-y-2"
            style={{ background: 'rgba(29,110,245,0.06)', border: '1px solid rgba(29,110,245,0.15)' }}>
            {[
              { label: 'Slot',     value: `🅿️ ${booking.slot}`,     color: '#60a5fa' },
              { label: 'Location', value: booking.location,          color: 'var(--text-primary)' },
              { label: 'Vehicle',  value: `🚗 ${booking.carNumber}`, color: '#a78bfa' },
              { label: 'Duration', value: '2 Hours',                 color: '#ffd32a' },
              { label: 'Valid Till',value: booking.validTill,        color: '#2ed573' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span className="font-bold" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* SMS sent confirmation */}
          <div className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: 'rgba(46,213,115,0.08)', border: '1px solid rgba(46,213,115,0.2)' }}>
            <div className="p-2 rounded-xl" style={{ background: 'rgba(46,213,115,0.15)' }}>
              <MessageSquare size={16} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-green-400">SMS Sent! 📱</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Confirmation sent to +91 {booking.phone?.slice(0, 4)}XXXXXX
              </p>
              <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
                "Your slot {booking.slot} is booked at {booking.location} 🚗"
              </p>
            </div>
          </div>

          <button onClick={onClose}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #1d6ef5, #0d4ed8)', boxShadow: '0 4px 15px rgba(29,110,245,0.3)' }}>
            Done ✓
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Slot Picker Grid ─────────────────────────────────────────────────────────
function SlotGrid({ row, slots, occupied, booked, onSelect, selected }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-black mb-2 tracking-widest" style={{ color: 'var(--text-muted)' }}>
        ROW {row}
      </p>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
        {slots.map((slot) => {
          const isOcc  = occupied.includes(slot);
          const isMine = booked.includes(slot);
          const isSel  = selected === slot;
          return (
            <button
              key={slot}
              disabled={isOcc && !isMine}
              onClick={() => onSelect(slot)}
              title={isOcc ? 'Occupied' : isMine ? 'Your booking' : `Book ${slot}`}
              className="aspect-square rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all"
              style={{
                background:   isMine ? 'rgba(29,110,245,0.25)' : isSel ? 'rgba(29,110,245,0.15)' : isOcc ? 'rgba(255,71,87,0.08)' : 'rgba(46,213,115,0.08)',
                borderColor:  isMine ? '#1d6ef5' : isSel ? '#1d6ef5' : isOcc ? 'rgba(255,71,87,0.3)' : 'rgba(46,213,115,0.3)',
                color:        isMine ? '#60a5fa' : isSel ? '#60a5fa' : isOcc ? 'rgba(255,71,87,0.5)' : '#2ed573',
                cursor:       isOcc && !isMine ? 'not-allowed' : 'pointer',
                transform:    isSel ? 'scale(1.1)' : undefined,
                boxShadow:    isSel ? '0 0 12px rgba(29,110,245,0.35)' : undefined,
                opacity:      isOcc && !isMine ? 0.5 : 1,
              }}>
              <span>{slot}</span>
              <span style={{ fontSize: 9 }}>{isMine ? '✓' : isOcc ? '✗' : isSel ? '●' : '○'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Parking Location Card ────────────────────────────────────────────────────
function ParkingCard({ parking, isAdmin, onAddSlot, onRemoveSlot, onOpenBooking }) {
  const pct         = Math.round(((parking.total - parking.available) / parking.total) * 100);
  const statusColor = parking.available === 0 ? '#ff4757' : parking.available < 20 ? '#e6a800' : '#16a34a';
  const statusLabel = parking.available === 0 ? 'Full 🔴' : parking.available < 20 ? 'Almost Full 🟡' : 'Available 🟢';

  return (
    <div className="city-card p-5 stat-card">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: `${statusColor}15` }}>
            <ParkingSquare className="w-5 h-5" style={{ color: statusColor }} />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{parking.name}</h3>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
              <MapPin className="w-3 h-3" />{parking.area}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: `${statusColor}12`, color: statusColor, border: `1px solid ${statusColor}25` }}>
          {statusLabel}
        </span>
      </div>

      {/* Occupancy bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
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
          { label: 'Free',     val: parking.available,                                   color: '#16a34a', bg: 'rgba(46,213,115,0.08)' },
          { label: 'Occupied', val: Math.max(0, parking.total - parking.available - (parking.reserved||0)), color: '#ff4757', bg: 'rgba(255,71,87,0.08)' },
          { label: 'Reserved', val: parking.reserved || 0,                               color: '#e6a800', bg: 'rgba(255,211,42,0.08)' },
        ].map(s => (
          <div key={s.label} className="p-2 rounded-xl" style={{ background: s.bg, border: `1px solid ${s.color}20` }}>
            <div className="font-bold text-lg" style={{ color: s.color }}>{Math.max(0, s.val)}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Mini slot visual */}
      <div className="mb-4">
        <p className="text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>Slot overview</p>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
          {Array.from({ length: Math.min(24, parking.total) }).map((_, i) => (
            <div key={i} className="h-2 rounded-sm" style={{
              background: i < (parking.total - parking.available)
                ? 'rgba(255,71,87,0.5)'
                : 'rgba(46,213,115,0.4)',
            }} />
          ))}
        </div>
      </div>

      {/* Actions */}
      {isAdmin ? (
        <div className="flex gap-2">
          <button onClick={() => onAddSlot(parking.id, 10)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a' }}>
            <Plus className="w-3.5 h-3.5" /> Add 10
          </button>
          <button onClick={() => onRemoveSlot(parking.id, 10)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
            style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', color: '#ff4757' }}>
            <Minus className="w-3.5 h-3.5" /> Remove 10
          </button>
        </div>
      ) : (
        <button
          onClick={() => onOpenBooking(parking)}
          disabled={parking.available === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: parking.available === 0 ? 'var(--bg-surface)' : 'linear-gradient(135deg, #1d6ef5, #0d4ed8)',
            color:      parking.available === 0 ? 'var(--text-muted)' : 'white',
            boxShadow:  parking.available > 0 ? '0 4px 15px rgba(29,110,245,0.3)' : 'none',
            border:     parking.available === 0 ? '1px solid var(--border)' : 'none',
          }}>
          {parking.available === 0
            ? <><XCircle className="w-4 h-4" /> Parking Full</>
            : <><ParkingSquare className="w-4 h-4" /> Book Slot Here</>}
        </button>
      )}
    </div>
  );
}

// ── Booking Drawer ───────────────────────────────────────────────────────────
function BookingDrawer({ parking, onClose, onBook, existingBookings }) {
  const [carNumber, setCarNumber]   = useState('');
  const [phone,     setPhone]       = useState('');
  const [hours,     setHours]       = useState(2);
  const [selSlot,   setSelSlot]     = useState(null);
  const [step,      setStep]        = useState('slots'); // slots | form | confirm
  const [errors,    setErrors]      = useState({});

  const OCCUPIED_A = ['A3', 'A6'];
  const OCCUPIED_B = ['B1', 'B5', 'B8'];
  const ROW_A = ['A1','A2','A3','A4','A5','A6','A7','A8'];
  const ROW_B = ['B1','B2','B3','B4','B5','B6','B7','B8'];
  const bookedSlots = existingBookings.map(b => b.slot);

  const validate = () => {
    const e = {};
    if (!carNumber.trim()) e.car = 'Vehicle number is required';
    else if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/.test(carNumber.replace(/\s/g, '').toUpperCase()))
      e.car = 'Format: MH12AB1234';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, '')))
      e.phone = 'Enter valid 10-digit mobile number';
    return e;
  };

  const handleNext = () => {
    if (!selSlot) { setErrors({ slot: 'Please select a parking slot' }); return; }
    setErrors({});
    setStep('form');
  };

  const handleConfirm = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep('confirm');
  };

  const handleBook = () => {
    const now = new Date();
    const validTill = new Date(now.getTime() + hours * 3600000);
    onBook({
      slot:      selSlot,
      location:  parking.name,
      carNumber: carNumber.replace(/\s/g, '').toUpperCase(),
      phone:     phone.replace(/\s/g, ''),
      hours,
      validTill: validTill.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      parkingId: parking.id,
    });
    onClose();
  };

  const fee = hours * 30; // ₹30/hour

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg animate-slide-up"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '1.5rem 1.5rem 0 0',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}>

        {/* Drawer header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', zIndex: 10 }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              🅿️ Book Parking Slot
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {parking.name} · {parking.available} slots free
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4 flex items-center gap-2">
          {['slots', 'form', 'confirm'].map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all"
                  style={{
                    background: step === s ? '#1d6ef5' : ['slots','form','confirm'].indexOf(step) > i ? 'rgba(46,213,115,0.2)' : 'var(--bg-surface)',
                    color:      step === s ? 'white' : ['slots','form','confirm'].indexOf(step) > i ? '#2ed573' : 'var(--text-muted)',
                    border:     step === s ? 'none' : `1px solid var(--border)`,
                  }}>
                  {['slots','form','confirm'].indexOf(step) > i ? '✓' : i + 1}
                </div>
                <span className="text-[10px] font-bold hidden sm:block" style={{
                  color: step === s ? '#1d6ef5' : 'var(--text-muted)'
                }}>
                  {['Pick Slot', 'Details', 'Confirm'][i]}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>

        <div className="p-5">

          {/* ── STEP 1: Slot Picker ── */}
          {step === 'slots' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Select your preferred slot:
                </p>
                <div className="flex gap-3 text-[10px] font-bold">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" />Free</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" />Taken</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" />Yours</span>
                </div>
              </div>
              <SlotGrid row="A" slots={ROW_A} occupied={OCCUPIED_A} booked={bookedSlots} onSelect={setSelSlot} selected={selSlot} />
              <SlotGrid row="B" slots={ROW_B} occupied={OCCUPIED_B} booked={bookedSlots} onSelect={setSelSlot} selected={selSlot} />

              {errors.slot && <p className="text-xs text-red-400 mb-2">⚠️ {errors.slot}</p>}

              {selSlot && (
                <div className="p-3 rounded-xl mb-4 flex items-center gap-3"
                  style={{ background: 'rgba(29,110,245,0.08)', border: '1px solid rgba(29,110,245,0.2)' }}>
                  <ParkingSquare size={18} className="text-blue-400" />
                  <div>
                    <p className="text-sm font-bold text-blue-400">Slot {selSlot} selected</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Click again to deselect</p>
                  </div>
                </div>
              )}

              <button onClick={handleNext}
                className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #1d6ef5, #0d4ed8)', boxShadow: '0 4px 15px rgba(29,110,245,0.3)' }}>
                Continue → Enter Details
              </button>
            </div>
          )}

          {/* ── STEP 2: Vehicle + Phone Form ── */}
          {step === 'form' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl flex items-center gap-2"
                style={{ background: 'rgba(29,110,245,0.08)', border: '1px solid rgba(29,110,245,0.2)' }}>
                <ParkingSquare size={16} className="text-blue-400" />
                <span className="text-sm font-bold text-blue-400">Slot {selSlot}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {parking.name}</span>
              </div>

              {/* Car Number */}
              <div>
                <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Car size={12} /> Vehicle Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH12AB1234"
                  value={carNumber}
                  onChange={e => setCarNumber(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="city-input w-full px-4 py-3 rounded-xl text-sm outline-none font-mono tracking-widest"
                  style={{ fontSize: 15 }}
                />
                {errors.car && <p className="text-xs text-red-400 mt-1">⚠️ {errors.car}</p>}
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Format: MH12AB1234 (no spaces)</p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Phone size={12} /> Mobile Number * <span className="font-normal opacity-60">(for SMS alert)</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    className="city-input flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-400 mt-1">⚠️ {errors.phone}</p>}
              </div>

              {/* Duration & Fee */}
              <div>
                <label className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Clock size={12} /> Parking Duration
                </label>
                <div className="flex gap-2">
                  {[1, 2, 4, 8].map(h => (
                    <button key={h} onClick={() => setHours(h)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: hours === h ? 'rgba(29,110,245,0.2)' : 'var(--bg-surface)',
                        border: `1px solid ${hours === h ? '#1d6ef5' : 'var(--border)'}`,
                        color:  hours === h ? '#1d6ef5' : 'var(--text-muted)',
                      }}>
                      {h}h
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2 font-semibold" style={{ color: 'var(--text-muted)' }}>
                  Parking fee: <span className="text-green-400 font-bold">₹{fee}</span>
                  <span className="opacity-60"> (₹30/hr)</span>
                </p>
              </div>

              {/* SMS notice */}
              <div className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(46,213,115,0.06)', border: '1px solid rgba(46,213,115,0.15)' }}>
                <Smartphone size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  An <strong className="text-green-400">SMS confirmation</strong> will be sent to your mobile number with slot details and validity time.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('slots')}
                  className="flex-1 py-2.5 rounded-2xl font-bold text-sm transition-all"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  ← Back
                </button>
                <button onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #1d6ef5, #0d4ed8)', boxShadow: '0 4px 15px rgba(29,110,245,0.3)' }}>
                  Review Booking →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl space-y-3"
                style={{ background: 'rgba(29,110,245,0.06)', border: '1px solid rgba(29,110,245,0.15)' }}>
                <p className="text-xs font-black uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)' }}>Booking Summary</p>
                {[
                  { label: 'Slot',     val: `🅿️ ${selSlot}` },
                  { label: 'Location', val: parking.name },
                  { label: 'Vehicle',  val: `🚗 ${carNumber}` },
                  { label: 'Mobile',   val: `📱 +91 ${phone}` },
                  { label: 'Duration', val: `⏱ ${hours} hour${hours > 1 ? 's' : ''}` },
                  { label: 'Fee',      val: `₹${fee}`, color: '#2ed573' },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                    <span className="font-bold" style={{ color: r.color || 'var(--text-primary)' }}>{r.val}</span>
                  </div>
                ))}
                <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 text-xs"
                    style={{ color: 'var(--text-muted)' }}>
                    <MessageSquare size={11} className="text-green-400" />
                    SMS will be sent to +91 {phone}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('form')}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  ← Edit
                </button>
                <button onClick={handleBook}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #2ed573, #00c87a)', boxShadow: '0 4px 15px rgba(46,213,115,0.3)' }}>
                  ✅ Confirm & Book
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ParkingPage() {
  const { parkingData, updateParkingSlots, reserveSlot, totalParking, availableParking } = useCityData();
  const { isAdmin } = useAuth();

  const [search,       setSearch]       = useState('');
  const [bookingTarget,setBookingTarget] = useState(null);
  const [myBookings,   setMyBookings]   = useState([]);
  const [lastBooking,  setLastBooking]  = useState(null);

  const filtered = parkingData.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.area.toLowerCase().includes(search.toLowerCase())
  );

  const occupiedPct = Math.round(((totalParking - availableParking) / totalParking) * 100);
  const occupiedColor = occupiedPct > 80 ? '#ff4757' : occupiedPct > 50 ? '#e6a800' : '#16a34a';

  const handleBook = (bookingData) => {
    // Simulate SMS send & save booking
    const booking = { ...bookingData, id: Date.now(), time: new Date() };
    setMyBookings(prev => [...prev, booking]);
    reserveSlot(bookingData.parkingId);
    setLastBooking(booking);
    console.log('📱 SMS Sent:', `"Your parking slot ${booking.slot} is booked at ${booking.location} 🚗. Valid till ${booking.validTill}. Vehicle: ${booking.carNumber}. Pune Smart City."`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
            style={{ background: 'rgba(29,110,245,0.1)', color: '#1d6ef5', border: '1px solid rgba(29,110,245,0.25)' }}>
            <div className="w-1 h-1 rounded-full bg-blue-500 blink" />
            {isAdmin ? 'ADMIN MANAGEMENT' : 'SMART PARKING'}
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {isAdmin ? '⚙️ Parking Management' : '🅿️ Smart Parking System'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {isAdmin
            ? 'Manage slot capacity across all Pune parking hubs'
            : 'Book a slot instantly · SMS confirmation · Real-time availability'}
        </p>
      </div>

      {/* My Bookings (user) */}
      {!isAdmin && myBookings.length > 0 && (
        <div className="city-card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell size={16} className="text-blue-400" /> My Active Bookings
          </h3>
          <div className="space-y-2">
            {myBookings.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(29,110,245,0.06)', border: '1px solid rgba(29,110,245,0.15)' }}>
                <div className="p-2 rounded-xl" style={{ background: 'rgba(29,110,245,0.12)' }}>
                  <ParkingSquare size={16} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    Slot {b.slot} · {b.location}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    🚗 {b.carNumber} · Valid till {b.validTill}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                  style={{ background: 'rgba(46,213,115,0.12)', color: '#2ed573', border: '1px solid rgba(46,213,115,0.25)' }}>
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Capacity', value: totalParking, color: '#1d6ef5' },
          { label: 'Available Now',  value: availableParking, color: '#16a34a' },
          { label: 'Occupied',       value: totalParking - availableParking, color: '#ff4757' },
          { label: 'Locations',      value: parkingData.length, color: '#a78bfa' },
        ].map((item, i) => (
          <div key={i} className="city-card p-4">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value.toLocaleString()}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Overall Gauge */}
      <div className="city-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Overall Occupancy</h3>
          <span className="text-lg font-bold" style={{ color: occupiedColor }}>{occupiedPct}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${occupiedPct}%`, background: occupiedPct > 80 ? 'linear-gradient(90deg,#ff4757,#ff6b35)' : occupiedPct > 50 ? 'linear-gradient(90deg,#ffd32a,#ff9f43)' : 'linear-gradient(90deg,#2ed573,#00d4ff)' }} />
        </div>
        <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          <span>0%</span>
          <span className="font-bold" style={{ color: occupiedColor }}>
            {occupiedPct > 80 ? '🔴 Critical' : occupiedPct > 50 ? '🟡 Moderate' : '🟢 Comfortable'}
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input type="text" placeholder="Search parking location or area..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="city-input w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-400/40" />Available</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400/40" />Occupied</span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-400/40" />Reserved</span>
        {!isAdmin && <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-400/40" />My Slot</span>}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => (
          <ParkingCard
            key={p.id}
            parking={p}
            isAdmin={isAdmin}
            onAddSlot={(id, n) => updateParkingSlots(id, n)}
            onRemoveSlot={(id, n) => updateParkingSlots(id, -n)}
            onOpenBooking={(park) => setBookingTarget(park)}
          />
        ))}
      </div>

      {/* Booking Drawer */}
      {bookingTarget && (
        <BookingDrawer
          parking={bookingTarget}
          onClose={() => setBookingTarget(null)}
          onBook={handleBook}
          existingBookings={myBookings.filter(b => b.parkingId === bookingTarget.id)}
        />
      )}

      {/* Success Modal */}
      {lastBooking && (
        <BookingSuccessModal
          booking={lastBooking}
          onClose={() => setLastBooking(null)}
        />
      )}
    </div>
  );
}
