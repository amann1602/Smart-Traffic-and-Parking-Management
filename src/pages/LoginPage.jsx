import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Shield, Eye, EyeOff, Wifi, Activity, Lock, User, Sun, Moon } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin', username: 'admin', password: 'admin123', color: '#1d6ef5', badge: 'Full Access – Aman Inamdar' },
  { label: 'User',  username: 'user',  password: 'user123',  color: '#16a34a', badge: 'Limited – Saniya Tamboli' },
];

export default function LoginPage() {
  const { login, loginError, setLoginError, loading } = useAuth();
  const { isDark, toggle } = useTheme();
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [particles, setParticles]     = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      }))
    );
    // Clear old session so name changes take effect
    localStorage.removeItem('pune_smart_city_session');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setLoginError('Please enter your credentials.'); return; }
    setIsSubmitting(true);
    await login(username, password);
    setIsSubmitting(false);
  };

  const fillDemo = (acc) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setLoginError('');
  };

  // Theme derived values
  const cardBg      = isDark ? 'rgba(10,22,40,0.85)' : 'rgba(255,255,255,0.92)';
  const inputBg     = isDark ? 'rgba(5,13,26,0.8)' : 'rgba(240,248,255,0.9)';
  const inputBorder = isDark ? 'rgba(30,58,95,0.8)' : 'rgba(29,110,245,0.3)';
  const pageBg      = isDark
    ? 'linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #050d1a 100%)'
    : 'linear-gradient(135deg, #ddeeff 0%, #c8dff7 50%, #ddeeff 100%)';
  const textPrimary   = isDark ? '#f0f6ff' : '#0d1e35';
  const textSecondary = isDark ? '#94b4d4' : '#2a4a72';
  const textMuted     = isDark ? '#4a6888' : '#7a9abb';

  return (
    <div className="min-h-screen city-grid flex items-center justify-center relative overflow-hidden"
      style={{ background: pageBg }}>

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            width: `${p.size}px`, height: `${p.size}px`,
            background: isDark ? 'rgba(29,110,245,0.5)' : 'rgba(29,110,245,0.25)',
            animation: `blink ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }} />
      ))}

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(29,110,245,0.08) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />

      {/* Theme toggle – top right */}
      <button
        onClick={toggle}
        className="absolute top-4 right-4 p-2.5 rounded-full transition-all hover:scale-110"
        style={{
          background: isDark ? 'rgba(255,200,50,0.12)' : 'rgba(29,110,245,0.12)',
          border: `1px solid ${isDark ? 'rgba(255,200,50,0.3)' : 'rgba(29,110,245,0.3)'}`,
          color: isDark ? '#fbbf24' : '#1d6ef5',
        }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Main card */}
      <div className="w-full max-w-md mx-4 animate-fade-in">
        {/* Logo area */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative"
            style={{ background: 'linear-gradient(135deg, #1d6ef5, #0d4ed8)', boxShadow: '0 0 40px rgba(29,110,245,0.5)' }}>
            <Shield className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white blink" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-500" />
            <span className="text-blue-500 text-xs tracking-widest font-semibold uppercase">Government of Maharashtra</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-500" />
          </div>

          <h1 className="text-3xl font-bold mb-1">
            <span className="gradient-text">Pune Smart City</span>
          </h1>
          <p className="text-sm" style={{ color: textSecondary }}>AI & IoT Traffic Management System</p>

          <div className="flex items-center justify-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5 text-green-500">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />
              <span>All Systems Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-500">
              <Activity className="w-3 h-3" />
              <span>Secure Connection</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: '#a78bfa' }}>
              <Wifi className="w-3 h-3" />
              <span>IoT Connected</span>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-8 animated-border"
          style={{ background: cardBg, border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>
          <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: textPrimary }}>Secure Login</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textSecondary }}>
                Username / Employee ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
                <input
                  type="text"
                  id="login-username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setLoginError(''); }}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: inputBg,
                    border: `1px solid ${username ? 'rgba(29,110,245,0.5)' : inputBorder}`,
                    color: textPrimary,
                    boxShadow: username ? '0 0 0 3px rgba(29,110,245,0.12)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: textSecondary }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-sm font-medium outline-none transition-all"
                  style={{
                    background: inputBg,
                    border: `1px solid ${password ? 'rgba(29,110,245,0.5)' : inputBorder}`,
                    color: textPrimary,
                    boxShadow: password ? '0 0 0 3px rgba(29,110,245,0.12)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: textMuted }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm text-red-500 animate-fade-in"
                style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)' }}>
                <Shield className="w-4 h-4 flex-shrink-0" />
                {loginError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="btn-login"
              disabled={isSubmitting || loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all relative overflow-hidden"
              style={{
                background: isSubmitting ? 'rgba(29,110,245,0.5)' : 'linear-gradient(135deg, #1d6ef5, #0d4ed8)',
                boxShadow: isSubmitting ? 'none' : '0 4px 20px rgba(29,110,245,0.4)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spinner" />
                  Authenticating...
                </span>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6">
            <p className="text-xs text-center mb-3" style={{ color: textMuted }}>Quick Access (Demo Accounts)</p>
            <div className="flex gap-3">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.label}
                  onClick={() => fillDemo(acc)}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{
                    background: isDark ? 'rgba(10,22,40,0.8)' : 'rgba(240,248,255,0.8)',
                    border: `1px solid ${acc.color}30`,
                  }}
                >
                  <div className="font-bold" style={{ color: acc.color }}>{acc.label}</div>
                  <div className="mt-0.5" style={{ color: textMuted, fontSize: '10px' }}>{acc.badge}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs" style={{ color: textMuted }}>
          <p>Pune Municipal Corporation · Smart City Mission</p>
          <p className="mt-1">v2.4.0 · Secured by Government PKI · 256-bit AES Encryption</p>
        </div>
      </div>
    </div>
  );
}
