import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle, CheckCircle2, Clock, Car, MapPin, Filter,
  IndianRupee, Camera, CreditCard, QrCode, Smartphone, X,
  ShieldAlert, Download, CheckCheck, Zap
} from 'lucide-react';

// ── UPI QR Payment Modal ──────────────────────────────────────────────────────
function PaymentModal({ fine, onClose, onSuccess }) {
  const [step, setStep] = useState('method'); // method | qr | processing | done
  const [method, setMethod] = useState(null);

  const handleMethodSelect = (m) => {
    setMethod(m);
    setStep('qr');
  };

  const handlePayNow = () => {
    setStep('processing');
    setTimeout(() => setStep('done'), 2000);
  };

  const handleDone = () => {
    onSuccess(fine.id);
    onClose();
  };

  // UPI QR Code (Google Pay style QR - in a real app this would be generated dynamically)
  const UPI_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=punesmartcity@okaxis%26pn=Pune+Smart+City%26am=${fine?.fineAmount}%26tn=TrafficFine-${fine?.vehicle}%26cu=INR`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-md rounded-3xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>💳 Pay Traffic Fine</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Vehicle: <span className="font-mono font-bold text-blue-400">{fine?.vehicle}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-red-500/10 transition-all text-red-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {/* Fine summary */}
          <div className="p-4 rounded-2xl mb-5 flex items-center justify-between"
            style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.15)' }}>
            <div>
              <p className="text-xs font-bold text-red-400 uppercase">{fine?.type}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{fine?.location} · {fine?.vehicle}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-red-500">₹{fine?.fineAmount?.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-red-400">UNPAID</p>
            </div>
          </div>

          {/* Step: Method Selection */}
          {step === 'method' && (
            <div className="space-y-3">
              <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>SELECT PAYMENT METHOD</p>
              {[
                { id: 'gpay',    label: 'Google Pay',   emoji: '🟢', desc: 'Pay via UPI QR code',         color: '#2ed573' },
                { id: 'phonepe', label: 'PhonePe',      emoji: '🟣', desc: 'Scan & pay instantly',        color: '#a78bfa' },
                { id: 'paytm',   label: 'Paytm',        emoji: '🔵', desc: 'Paytm UPI / Wallet',          color: '#60a5fa' },
                { id: 'card',    label: 'Debit / Credit Card', emoji: '💳', desc: 'Visa, Mastercard, RuPay', color: '#ffd32a' },
              ].map(m => (
                <button key={m.id} onClick={() => handleMethodSelect(m.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.01] text-left"
                  style={{ background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                  <span className="text-2xl">{m.emoji}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{m.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.desc}</p>
                  </div>
                  <span className="ml-auto text-lg font-black" style={{ color: m.color }}>→</span>
                </button>
              ))}
            </div>
          )}

          {/* Step: QR Code */}
          {step === 'qr' && (
            <div className="text-center space-y-4">
              <div className="p-1.5 rounded-2xl inline-block mx-auto"
                style={{ background: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }}>
                <img src={UPI_QR_URL} alt="UPI QR Code"
                  className="w-48 h-48 rounded-xl" />
              </div>
              <div>
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Scan UPI QR Code</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Open Google Pay / PhonePe / Paytm and scan
                </p>
                <div className="mt-2 py-2 px-4 rounded-xl inline-block"
                  style={{ background: 'rgba(29,110,245,0.1)', border: '1px solid rgba(29,110,245,0.2)' }}>
                  <p className="text-sm font-mono font-bold text-blue-400">punesmartcity@okaxis</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Amount: ₹{fine?.fineAmount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('method')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  ← Back
                </button>
                <button onClick={handlePayNow}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #2ed573, #00c87a)', boxShadow: '0 4px 15px rgba(46,213,115,0.3)' }}>
                  ✅ I've Paid
                </button>
              </div>
            </div>
          )}

          {/* Step: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-blue-500/20 border-t-blue-500 spinner" />
              <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Verifying Payment...</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Checking UPI transaction</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                style={{ background: 'rgba(46,213,115,0.15)', border: '2px solid rgba(46,213,115,0.4)' }}>
                <CheckCheck size={36} className="text-green-400" />
              </div>
              <div>
                <p className="font-black text-2xl text-green-400">Payment Successful! 🎉</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  ₹{fine?.fineAmount?.toLocaleString('en-IN')} paid for {fine?.vehicle}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Reference: TXN-{Math.random().toString(36).slice(2, 10).toUpperCase()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                  <Download size={14} /> Receipt
                </button>
                <button onClick={handleDone}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #2ed573, #00c87a)' }}>
                  Done ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Violation Row ─────────────────────────────────────────────────────────────
function ViolationRow({ violation, isAdmin, onClear, onPay, userId }) {
  const isActive  = violation.status === 'Active';
  const isPaid    = violation.status === 'Paid';
  const isResolved= violation.status === 'Resolved';
  const statusColor = isActive ? '#ff4757' : '#2ed573';
  const statusBg    = isActive ? 'rgba(255,71,87,0.06)' : 'rgba(46,213,115,0.06)';
  const borderColor = isActive ? 'rgba(255,71,87,0.15)' : 'rgba(46,213,115,0.12)';
  const timeDiff = Math.round((Date.now() - new Date(violation.time).getTime()) / 60000);

  // For User view: only show their vehicle fine
  const isTheirVehicle = !isAdmin && (violation.vehicle?.includes('1234') || violation.userId === userId);

  return (
    <div className="p-4 rounded-2xl transition-all hover:scale-[1.002] animate-fade-in"
      style={{ background: statusBg, border: `1px solid ${borderColor}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl flex-shrink-0" style={{ background: `${statusColor}12` }}>
            {isActive
              ? <AlertTriangle className="w-4 h-4" style={{ color: statusColor }} />
              : <CheckCircle2  className="w-4 h-4" style={{ color: statusColor }} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{violation.type}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: `${statusColor}12`, color: statusColor, border: `1px solid ${statusColor}25` }}>
                {isPaid ? '✅ PAID' : isResolved ? '✅ RESOLVED' : '🔴 UNPAID'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MapPin className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span className="truncate">{violation.location}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Car className="w-3 h-3 flex-shrink-0" style={{ color: '#a78bfa' }} />
                <span className="font-mono">{violation.vehicle}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3 flex-shrink-0" />
                {timeDiff < 1 ? 'Just now' : `${timeDiff}m ago`}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-600">
                <IndianRupee className="w-3 h-3 flex-shrink-0" />
                ₹{violation.fineAmount?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Admin: Resolve button */}
        {isAdmin && isActive && (
          <button onClick={() => onClear(violation.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 hover:scale-105"
            style={{ background: 'rgba(46,213,115,0.12)', border: '1px solid rgba(46,213,115,0.3)', color: '#2ed573' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
          </button>
        )}

        {/* User: Pay Now button */}
        {!isAdmin && isActive && (
          <button onClick={() => onPay(violation)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex-shrink-0 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #ff4757, #c0392b)', boxShadow: '0 4px 12px rgba(255,71,87,0.3)' }}>
            <CreditCard className="w-3.5 h-3.5" /> Pay ₹{violation.fineAmount?.toLocaleString('en-IN')}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ViolationsPage() {
  const { violations, clearViolation, clearAllViolations, activeViolations, addViolation } = useCityData();
  const { isAdmin, user } = useAuth();

  const [filter,     setFilter]     = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [payingFine, setPayingFine] = useState(null);
  const [paidFines,  setPaidFines]  = useState([]);

  // For users: mock fine data specific to the logged-in user
  const USER_FINES = [
    {
      id: 'user-fine-1',
      type: 'No Parking Zone',
      vehicle: 'MH12 AB 1234',
      location: 'Deccan Hub, Pune',
      status: paidFines.includes('user-fine-1') ? 'Paid' : 'Active',
      fineAmount: 500,
      time: new Date(Date.now() - 3600000),
      userId: user?.id,
    },
    {
      id: 'user-fine-2',
      type: 'Signal Jumping',
      vehicle: 'MH12 AB 1234',
      location: 'FC Road Junction',
      status: paidFines.includes('user-fine-2') ? 'Paid' : 'Active',
      fineAmount: 1000,
      time: new Date(Date.now() - 7200000),
      userId: user?.id,
    },
  ];

  const displayedViolations = isAdmin ? violations : USER_FINES;
  const violationTypes     = [...new Set(displayedViolations.map(v => v.type))];
  const filtered           = displayedViolations.filter(v => {
    const statusMatch = filter === 'all' || v.status.toLowerCase().includes(filter);
    const typeMatch   = typeFilter === 'all' || v.type === typeFilter;
    return statusMatch && typeMatch;
  });

  const totalFines    = displayedViolations.filter(v => v.status === 'Active').reduce((a, v) => a + (v.fineAmount || 0), 0);
  const unpaidCount   = displayedViolations.filter(v => v.status === 'Active').length;

  const handlePaySuccess = (id) => {
    setPaidFines(prev => [...prev, id]);
  };

  const FilterBtn = ({ val, label }) => (
    <button onClick={() => setFilter(val)}
      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
      style={{
        background: filter === val ? 'rgba(29,110,245,0.15)' : 'var(--bg-surface)',
        border:     `1px solid ${filter === val ? 'rgba(29,110,245,0.5)' : 'var(--border)'}`,
        color:      filter === val ? '#1d6ef5' : 'var(--text-muted)',
      }}>
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isAdmin ? '🚫 Violation Management' : '💰 My Traffic Fines'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isAdmin
              ? 'AI-powered illegal parking & traffic violation monitoring'
              : `Showing fines for your registered vehicle · ${unpaidCount} unpaid`}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={clearAllViolations}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(46,213,115,0.1)', border: '1px solid rgba(46,213,115,0.25)', color: '#2ed573' }}>
              <CheckCircle2 className="w-3.5 h-3.5" /> Resolve All
            </button>
            <button onClick={() => addViolation(null)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.25)', color: '#ff4757' }}>
              <Camera className="w-3.5 h-3.5" /> Simulate
            </button>
          </div>
        )}
      </div>

      {/* ── USER: Pay All Banner ─────────────────────────────────────────── */}
      {!isAdmin && unpaidCount > 0 && (
        <div className="city-card p-5 flex items-center gap-4 animate-fade-in"
          style={{ borderLeft: '4px solid #ff4757' }}>
          <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: 'rgba(255,71,87,0.12)' }}>
            <ShieldAlert size={24} className="text-red-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              You have <span className="text-red-400">{unpaidCount} unpaid fine{unpaidCount > 1 ? 's' : ''}</span>
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Total pending: <span className="font-bold text-red-400">₹{totalFines.toLocaleString('en-IN')}</span>
              {' '}· Pay before 30-Apr-2026 to avoid suspension
            </p>
          </div>
          <button onClick={() => setPayingFine(USER_FINES.find(f => f.status === 'Active'))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white flex-shrink-0 transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #ff4757, #c0392b)', boxShadow: '0 4px 15px rgba(255,71,87,0.3)' }}>
            <CreditCard size={16} /> Pay Now
          </button>
        </div>
      )}

      {/* ── ADMIN: Summary cards ─────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isAdmin ? [
          { label: 'Active Violations', value: activeViolations, color: '#ff4757' },
          { label: 'Resolved Today',    value: violations.filter(v => v.status === 'Resolved').length, color: '#2ed573' },
          { label: 'Total Detected',    value: violations.length, color: '#1d6ef5' },
          { label: 'Pending Fines',     value: `₹${(totalFines/1000).toFixed(1)}K`, color: '#e6a800' },
        ] : [
          { label: 'My Vehicle',   value: 'MH12 AB 1234', color: '#1d6ef5' },
          { label: 'Unpaid Fines', value: unpaidCount.toString(), color: '#ff4757' },
          { label: 'Total Due',    value: `₹${totalFines.toLocaleString('en-IN')}`, color: '#ff4757' },
          { label: 'Paid This Year', value: paidFines.length.toString(), color: '#2ed573' },
        ].map((item, i) => (
          <div key={i} className="city-card p-4">
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* AI Camera indicator (Admin) */}
      {isAdmin && (
        <div className="city-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-2xl" style={{ background: 'rgba(29,110,245,0.12)', border: '1px solid rgba(29,110,245,0.25)' }}>
            <Camera className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI Camera Network Active</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>10 IoT cameras · Real-time violation detection · Auto-fine generation</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-400 blink" /> Live
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          <FilterBtn val="all"      label="All" />
          <FilterBtn val="active"   label="🔴 Unpaid" />
          <FilterBtn val="resolved" label="✅ Resolved" />
          {!isAdmin && <FilterBtn val="paid" label="💳 Paid" />}
        </div>
        {isAdmin && (
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: 'var(--text-muted)' }} />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="city-input pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none appearance-none">
              <option value="all">All Types</option>
              {violationTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Violations list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-semibold">{isAdmin ? 'No violations found' : '🎉 No fines! Drive safe.'}</p>
          </div>
        ) : (
          filtered.map(v => (
            <ViolationRow
              key={v.id}
              violation={{ ...v, status: paidFines.includes(v.id) ? 'Paid' : v.status }}
              isAdmin={isAdmin}
              onClear={clearViolation}
              onPay={(fine) => setPayingFine(fine)}
              userId={user?.id}
            />
          ))
        )}
      </div>

      {/* Payment Modal */}
      {payingFine && (
        <PaymentModal
          fine={payingFine}
          onClose={() => setPayingFine(null)}
          onSuccess={handlePaySuccess}
        />
      )}
    </div>
  );
}
