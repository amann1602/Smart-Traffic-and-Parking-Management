import React, { useState } from 'react';
import { useCityData } from '../context/CityContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, Cell
} from 'recharts';
import {
  Car, ParkingSquare, AlertTriangle, Zap, TrendingUp, TrendingDown, Minus,
  Activity, Radio, Map, ArrowRight, Siren, CheckCircle2, ShieldAlert,
  CreditCard, MapPin, Sparkles, Clock, Calendar, Bookmark, Info
} from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-effect px-3 py-2 rounded-lg text-xs border border-white/10 shadow-xl">
      <p className="mb-1 opacity-70">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const {
    avgDensity, totalVehicles, totalParking, availableParking,
    activeViolations, emergencyMode, trendHistory, trafficData, parkingData,
    signals, getDensityLabel, violations, toggleEmergencyMode
  } = useCityData();
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const densityLabel = getDensityLabel(avgDensity);
  const densityColor = avgDensity >= 70 ? '#ff4757' : avgDensity >= 35 ? '#ffd32a' : '#2ed573';
  const parkingPct = Math.round(((totalParking - availableParking) / totalParking) * 100);
  
  // --- Admin Specific Logic ---
  const handleManualOverride = (id) => {
    alert(`Manual override activated for Signal ${id}. Timing adjusted by +15s.`);
  };

  // --- User Specific Logic ---
  const [bookedSlots, setBookedSlots] = useState([]);
  const handleBookSlot = (slot) => {
    if (bookedSlots.includes(slot)) {
      setBookedSlots(prev => prev.filter(s => s !== slot));
    } else {
      setBookedSlots(prev => [...prev, slot]);
      alert(`Slot ${slot} successfully reserved for 2 hours.`);
    }
  };

  const statCards = isAdmin ? [
    { label: 'System Density', value: `${avgDensity}%`, sub: densityLabel, icon: Activity, color: densityColor, trend: 'up' },
    { label: 'Traffic Load', value: totalVehicles, sub: 'Active vehicles', icon: Car, color: '#1d6ef5', trend: 'stable' },
    { label: 'Violations', value: activeViolations, sub: 'Requires Review', icon: ShieldAlert, color: '#ff4757', trend: 'up' },
    { label: 'Emergency Status', value: emergencyMode ? 'ACTIVE' : 'IDLE', sub: 'System Corridor', icon: Siren, color: emergencyMode ? '#ff4757' : '#2ed573', trend: 'stable' },
  ] : [
    { label: 'Local Traffic', value: `${avgDensity}%`, sub: 'Relatively Clear', icon: MapPin, color: '#2ed573', trend: 'down' },
    { label: 'Parking Near Me', value: availableParking, sub: 'Slots available', icon: ParkingSquare, color: '#1d6ef5', trend: 'up' },
    { label: 'My Unpaid Fines', value: '₹500', sub: 'MH12 AB 1234', icon: CreditCard, color: '#ff4757', trend: 'stable' },
    { label: 'Safe Routes', value: '4 Active', sub: 'No congestion', icon: TrendingDown, color: '#2ed573', trend: 'down' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 🟢 Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-500 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-green-500 blink" /> LIVE DATA
             </span>
             <span className="text-[10px] opacity-50">Pune Smart City Infrastructure v4.2</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm opacity-60 mt-1">
            {isAdmin ? '🛡️ Admin: Full system control enabled' : '👥 Citizen: Live traffic monitoring & services'}
          </p>
        </div>

        <div className="flex items-center gap-3">
           <div className="text-right hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-wider opacity-40">System Time</p>
              <p className="text-lg font-mono font-bold">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
           </div>
           {isAdmin && (
             <button 
                onClick={toggleEmergencyMode}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${emergencyMode ? 'bg-red-500 text-white animate-pulse shadow-red-500/20' : 'bg-city-card border border-red-500/30 text-red-500 hover:bg-red-500/10'}`}
             >
                <Siren size={20} />
                {emergencyMode ? 'DEACTIVATE EMERGENCY' : 'EMERGENCY OVERRIDE'}
             </button>
           )}
        </div>
      </div>

      {/* 🟢 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="city-card p-5 group hover:translate-y-[-4px] transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl" style={{ background: `${card.color}15` }}>
                <card.icon size={24} style={{ color: card.color }} />
              </div>
              <div className="flex flex-col items-end">
                {card.trend === 'up' && <TrendingUp size={16} className="text-red-500" />}
                {card.trend === 'down' && <TrendingDown size={16} className="text-green-500" />}
                <span className="text-[10px] font-bold opacity-40 mt-1 uppercase">24H Trend</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1 tracking-tight">{card.value}</h3>
            <p className="text-xs opacity-50 font-medium mb-1">{card.label}</p>
            <p className="text-xs font-bold" style={{ color: card.color }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* 🟢 Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (Admin Control / User Booking) */}
        <div className="lg:col-span-8 space-y-6">
          
          {isAdmin ? (
            /* --- ADMIN: SIGNAL CONTROL --- */
            <div className="city-card p-6 overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                       <Radio size={20} className="text-blue-500" /> Signal Control Center
                    </h2>
                    <p className="text-xs opacity-50">Real-time status and manual override</p>
                  </div>
                  <button className="text-xs font-bold text-blue-500 hover:underline">Full Traffic Map</button>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {signals.slice(0, 4).map(sig => (
                    <div key={sig.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1 items-center p-1.5 bg-black/40 rounded-full border border-white/10">
                             <div className={`w-3 h-3 rounded-full ${sig.phase === 'red' ? 'bg-red-500 shadow-[0_0_10px_#ff4757]' : 'bg-red-900/50'}`} />
                             <div className={`w-3 h-3 rounded-full ${sig.phase === 'yellow' ? 'bg-yellow-500 shadow-[0_0_10px_#ffd32a]' : 'bg-yellow-900/50'}`} />
                             <div className={`w-3 h-3 rounded-full ${sig.phase === 'green' ? 'bg-green-500 shadow-[0_0_10px_#2ed573]' : 'bg-green-900/50'}`} />
                          </div>
                          <div>
                             <p className="font-bold text-sm tracking-tight">{sig.name}</p>
                             <p className="text-xs opacity-50">Timer: <span className="font-mono text-blue-500 font-bold">{sig.timer}s</span></p>
                          </div>
                       </div>
                       <button 
                          onClick={() => handleManualOverride(sig.id)}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-blue-500 text-white hover:bg-blue-600 transition-all"
                       >
                          MANUAL OVERRIDE
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            /* --- USER: SMART PARKING --- */
            <div className="city-card p-6">
               <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                       <ParkingSquare size={20} className="text-blue-500" /> Reserve Parking Slot 🅿️
                    </h2>
                    <p className="text-xs opacity-50">FC Road Multi-level Parking Hub</p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold">
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Available</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Booked</span>
                  </div>
               </div>

               <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                  {['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6'].map((slot, i) => {
                    const isOccupied = i % 5 === 0;
                    const isMine = bookedSlots.includes(slot);
                    return (
                      <button 
                        key={slot}
                        disabled={isOccupied && !isMine}
                        onClick={() => handleBookSlot(slot)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                          isMine ? 'bg-blue-500 border-blue-400 text-white scale-105 shadow-lg shadow-blue-500/20' :
                          isOccupied ? 'bg-red-500/10 border-red-500/20 text-red-500 opacity-50 cursor-not-allowed' :
                          'bg-green-500/10 border-green-500/20 text-green-500 hover:border-green-500 hover:bg-green-500/20'
                        }`}
                      >
                         <span className="text-xs font-bold">{slot}</span>
                         {isMine ? <CheckCircle2 size={12} /> : isOccupied ? <Minus size={12} /> : <Zap size={10} />}
                      </button>
                    )
                  })}
               </div>
            </div>
          )}

          {/* 📊 Traffic Trend Graph (Shared) */}
          <div className="city-card p-6">
             <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                     <Activity size={18} className="text-blue-500" /> Density Analytics & Forecast
                  </h3>
                </div>
                <div className="flex gap-2">
                   <button className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold">LIVE</button>
                   <button className="px-2 py-1 rounded bg-white/10 text-white text-[10px] font-bold">24H</button>
                </div>
             </div>
             <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={trendHistory.slice(-15)}>
                      <defs>
                        <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1d6ef5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1d6ef5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="density" stroke="#1d6ef5" fillOpacity={1} fill="url(#areaColor)" strokeWidth={3} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN (AI Insights & Alerts) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 🤖 AI INSIGHTS PANEL (Premium Touch) */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-all">
                <Sparkles size={120} />
             </div>
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
                   <Sparkles size={14} className="text-yellow-300" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Gemini Traffic AI</span>
                </div>
                <h3 className="text-xl font-bold mb-4 leading-tight">AI Traffic Insights</h3>
                <div className="space-y-4">
                   <div className="p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                      <p className="text-[10px] opacity-70 font-bold mb-1">PREDICTION</p>
                      <p className="text-xs font-medium uppercase">Peak traffic expected at **6:15 PM** around Shivaji Nagar.</p>
                   </div>
                   <div className="p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                      <p className="text-[10px] opacity-70 font-bold mb-1">OPTIMIZATION</p>
                      <p className="text-xs font-medium uppercase">Redirecting 15% traffic to FC Road bypass to reduce load.</p>
                   </div>
                   <div className="p-3 bg-white/10 rounded-2xl border border-white/10 hover:bg-white/15 transition-all">
                      <p className="text-[10px] opacity-70 font-bold mb-1">ALERT</p>
                      <p className="text-xs font-medium uppercase">Air quality improved by 4% due to signal sync optimizations.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* VIOLATIONS / FINES PANEL */}
          <div className="city-card p-6">
             <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold flex items-center gap-2">
                   {isAdmin ? <ShieldAlert size={18} className="text-red-500" /> : <CreditCard size={18} className="text-blue-500" />}
                   {isAdmin ? 'System Violations' : 'My Traffic Fines'}
                </h3>
                <span className="text-[10px] font-bold opacity-50 underline">View History</span>
             </div>
             
             <div className="space-y-3">
                {isAdmin ? (
                  /* Admin: List of all violations */
                  violations.slice(0, 3).map(v => (
                    <div key={v.id} className="p-3 rounded-2xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-between group">
                       <div className="min-w-0">
                          <p className="text-[10px] font-bold text-red-500 uppercase">{v.type}</p>
                          <p className="text-xs font-bold truncate">{v.vehicle}</p>
                          <p className="text-[10px] opacity-50 italic">Pune Central · {v.id.toString().slice(-4)}</p>
                       </div>
                       <button className="p-2 rounded-xl bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all"><CheckCircle2 size={14} /></button>
                    </div>
                  ))
                ) : (
                  /* User: Specific unpaid fine */
                  <div className="p-5 rounded-3xl bg-blue-500/5 border border-blue-500/10 space-y-4">
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-bold opacity-50 uppercase mb-1">Pending Amount</p>
                           <p className="text-2xl font-black">₹500.00</p>
                        </div>
                        <div className="p-3 rounded-full bg-red-500/20 text-red-500">
                           <Info size={20} />
                        </div>
                     </div>
                     <div className="text-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-[10px] font-bold">MH12 AB 1234 · No Parking Zone</p>
                        <p className="text-[10px] opacity-50">Captured at Deccan Hub · 11:45 AM</p>
                     </div>
                     <button className="w-full py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                        PAY FINE NOW
                     </button>
                  </div>
                )}
             </div>
          </div>

          {/* CITY MAP PREVIEW */}
          <div className="city-card p-4 h-[200px] overflow-hidden relative group cursor-pointer">
             <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] group-hover:scale-110" 
                  style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80)' }}>
             </div>
             <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
             <div className="absolute bottom-6 left-6 text-white group-hover:translate-x-2 transition-transform">
                <p className="text-xs font-bold opacity-70">Interactive View</p>
                <h4 className="text-lg font-black tracking-tight">CITY TRAFFIC MAP</h4>
                <div className="flex items-center gap-2 mt-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 blink" />
                   <span className="text-[10px] font-bold">Live Tracking Active</span>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
