import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCityData } from '../context/CityContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, TrafficCone, ParkingSquare, AlertTriangle, Siren,
  LogOut, Bell, Menu, X, Sun, Moon, ChevronRight,
  Activity, Radio, Shield, Map, FileText, Zap, Car, ShieldAlert,
  CreditCard, MapPin, MessageSquare, Sparkles, Route, BarChart3
} from 'lucide-react';
import Chatbot from './Chatbot';

// ─── Role-based Navigation ──────────────────────────────────────────────────
const ADMIN_NAV = [
  { path: '/dashboard',   label: 'Dashboard',        icon: LayoutDashboard, badge: null },
  { path: '/traffic',     label: 'Live Traffic',      icon: Activity,        badge: 'LIVE' },
  { path: '/signals',     label: 'Signal Control',    icon: Radio,           badge: '⚙️' },
  { path: '/violations',  label: 'Violations',        icon: ShieldAlert,     badge: null },
  { path: '/emergency',   label: 'Emergency',         icon: Siren,           badge: null },
  { path: '/logs',        label: 'System Logs',       icon: FileText,        badge: null },
  { path: '/ai-alerts',   label: 'AI Alerts',         icon: Sparkles,        badge: '🤖' },
  { path: '/admin',       label: 'Admin Panel',       icon: Shield,          badge: null },
  { path: '/parking',     label: 'Parking Mgmt',      icon: ParkingSquare,   badge: null },
];

const USER_NAV = [
  { path: '/dashboard',   label: 'Dashboard',         icon: LayoutDashboard, badge: null },
  { path: '/traffic',     label: 'Live Traffic 🚦',   icon: Activity,        badge: 'LIVE' },
  { path: '/parking',     label: 'Smart Parking 🅿️',  icon: ParkingSquare,   badge: null },
  { path: '/violations',  label: 'Pay Fine 💰',        icon: CreditCard,      badge: null },
  { path: '/map',         label: 'City Map 🗺️',       icon: Map,             badge: null },
  { path: '/routes',      label: 'Route Suggestions', icon: Route,           badge: null },
  { path: '/emergency',   label: 'Emergency Status',   icon: Siren,           badge: null },
];

// Combined for breadcrumb label lookup
const ALL_NAV = [...ADMIN_NAV, ...USER_NAV];

// ─── Notification helpers ──────────────────────────────────────────────────
const NOTIF_COLOR = { danger: 'text-red-400', warning: 'text-yellow-500', info: 'text-blue-400', success: 'text-green-500' };
const NOTIF_BG    = { danger: 'rgba(255,71,87,0.1)', warning: 'rgba(255,211,42,0.08)', info: 'rgba(29,110,245,0.1)', success: 'rgba(46,213,115,0.08)' };

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const { notifications, unreadNotifications, markAllRead, markNotificationRead, emergencyMode, avgDensity } = useCityData();
  const { isDark, toggle } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const visibleNav = isAdmin ? ADMIN_NAV : USER_NAV;

  const handleNav = (path) => { navigate(path); setMobileOpen(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('#notif-panel') && !e.target.closest('#notif-btn')) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Admin color scheme ────────────────────────────────────────────────────
  const adminAccent = '#ff4757';
  const userAccent  = '#1d6ef5';
  const accentColor = isAdmin ? adminAccent : userAccent;

  // ─── Sidebar component ─────────────────────────────────────────────────────
  const Sidebar = ({ isMobile = false }) => (
    <aside className={`sidebar flex flex-col h-full transition-all duration-300 ${isMobile ? 'w-72' : sidebarOpen ? 'w-64' : 'w-16'}`}>

      {/* Logo + Role Header */}
      <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center relative"
          style={{
            background: isAdmin
              ? 'linear-gradient(135deg, #ff4757, #c0392b)'
              : 'linear-gradient(135deg, #1d6ef5, #0d4ed8)',
            boxShadow: isAdmin
              ? '0 0 15px rgba(255,71,87,0.4)'
              : '0 0 15px rgba(29,110,245,0.4)',
          }}
        >
          {isAdmin ? <Shield className="w-5 h-5 text-white" /> : <MapPin className="w-5 h-5 text-white" />}
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 blink"
            style={{ borderColor: 'var(--sidebar-bg)' }} />
        </div>

        {(sidebarOpen || isMobile) && (
          <div className="min-w-0 animate-fade-in">
            <div className="font-bold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
              Pune Smart City
            </div>
            <div className="text-xs truncate font-semibold" style={{ color: accentColor }}>
              {isAdmin ? '👨‍💼 Admin Control' : '👤 Citizen Portal'}
            </div>
          </div>
        )}

        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto transition-colors hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Role Badge Banner */}
      {(sidebarOpen || isMobile) && (
        <div
          className="mx-3 mt-3 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in"
          style={{
            background: isAdmin ? 'rgba(255,71,87,0.08)' : 'rgba(29,110,245,0.08)',
            border: `1px solid ${isAdmin ? 'rgba(255,71,87,0.25)' : 'rgba(29,110,245,0.25)'}`,
            color: isAdmin ? '#ff4757' : '#1d6ef5',
          }}
        >
          {isAdmin ? (
            <><ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" /> Full system control enabled</>
          ) : (
            <><Zap className="w-3.5 h-3.5 flex-shrink-0" /> Live traffic monitoring & services</>
          )}
        </div>
      )}

      {/* Emergency banner */}
      {emergencyMode && (sidebarOpen || isMobile) && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg text-xs font-bold text-red-400 emergency-mode border border-red-500/30 flex items-center gap-2">
          <Siren className="w-3.5 h-3.5" />
          🚨 EMERGENCY ACTIVE
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 mt-3">
        {(sidebarOpen || isMobile) && (
          <p className="px-2 mb-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {isAdmin ? '⚙️ Control Center' : '🌐 My Services'}
          </p>
        )}
        {visibleNav.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`sidebar-item w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all ${isActive ? 'active' : ''}`}
              style={{
                '--sidebar-active-color': accentColor,
              }}
            >
              <Icon
                className={`flex-shrink-0`}
                style={{ width: 18, height: 18, color: isActive ? accentColor : undefined }}
              />
              {(sidebarOpen || isMobile) && (
                <span className="animate-fade-in font-medium flex-1 text-left">{item.label}</span>
              )}
              {(sidebarOpen || isMobile) && item.badge && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: `${accentColor}20`, color: accentColor, border: `1px solid ${accentColor}40` }}
                >
                  {item.badge}
                </span>
              )}
              {(sidebarOpen || isMobile) && isActive && !item.badge && (
                <ChevronRight className="w-3 h-3 ml-auto" style={{ color: accentColor }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* System status widget */}
      {(sidebarOpen || isMobile) && (
        <div className="mx-3 mb-3 p-3 rounded-xl animate-fade-in city-card">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            System Status
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Traffic Engine</span>
              <span className="text-green-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 blink" />Online
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>Avg. Density</span>
              <span className={`font-semibold ${avgDensity > 70 ? 'text-red-400' : avgDensity > 40 ? 'text-yellow-500' : 'text-green-500'}`}>
                {avgDensity}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-secondary)' }}>IoT Nodes</span>
              <span className="text-green-500">10/10</span>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--text-secondary)' }}>AI Engine</span>
                <span className="text-purple-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />Active
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User profile */}
      <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
            style={{
              background: isAdmin
                ? 'linear-gradient(135deg, #ff4757, #c0392b)'
                : 'linear-gradient(135deg, #1d6ef5, #00d4ff)',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>

          {(sidebarOpen || isMobile) && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              <p className="text-xs capitalize" style={{ color: isAdmin ? '#ff4757' : '#1d6ef5' }}>
                {isAdmin ? '⚙️ Administrator' : '👤 Citizen'}
              </p>
            </div>
          )}

          {(sidebarOpen || isMobile) && (
            <button
              onClick={handleLogout}
              className="transition-colors hover:text-red-400"
              style={{ color: 'var(--text-muted)' }}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 h-full animate-slide-in">
            <Sidebar isMobile />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Topbar ── */}
        <header
          className="topbar flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3"
          style={{
            borderBottom: isAdmin
              ? '1px solid rgba(255,71,87,0.15)'
              : '1px solid var(--border)',
          }}
        >
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden transition-colors hover:opacity-70"
              style={{ color: 'var(--text-secondary)' }}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                {ALL_NAV.find(i => i.path === location.pathname)?.label?.replace(/[🚦🅿️💰🗺️🤖⚙️🚑]/g, '').trim() || 'Dashboard'}
                {/* Role tag in topbar */}
                <span
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                  style={{
                    background: isAdmin ? 'rgba(255,71,87,0.12)' : 'rgba(29,110,245,0.12)',
                    color: isAdmin ? '#ff4757' : '#1d6ef5',
                    border: `1px solid ${isAdmin ? 'rgba(255,71,87,0.3)' : 'rgba(29,110,245,0.3)'}`,
                  }}
                >
                  {isAdmin ? '👨‍💼 ADMIN' : '👤 USER'}
                </span>
              </h2>
              <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Emergency indicator */}
            {emergencyMode && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-red-400 emergency-mode border border-red-500/30">
                <Siren className="w-3.5 h-3.5" />
                Emergency Active
              </div>
            )}

            {/* LIVE indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(46,213,115,0.1)', border: '1px solid rgba(46,213,115,0.25)', color: '#2ed573' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 blink" />
              LIVE
            </div>

            {/* ── Dark / Light toggle ── */}
            <button
              id="theme-toggle"
              onClick={toggle}
              className="p-2 rounded-lg transition-all hover:scale-105"
              style={{
                background: isDark ? 'rgba(255,200,50,0.12)' : 'rgba(29,110,245,0.12)',
                border: `1px solid ${isDark ? 'rgba(255,200,50,0.25)' : 'rgba(29,110,245,0.25)'}`,
                color: isDark ? '#fbbf24' : '#1d6ef5',
              }}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                id="notif-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-lg transition-colors relative"
                style={{ background: 'rgba(29,110,245,0.1)', border: '1px solid rgba(29,110,245,0.2)', color: 'var(--text-secondary)' }}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center notif-badge"
                    style={{ background: '#ff4757', fontSize: '9px' }}
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification panel */}
              {notifOpen && (
                <div
                  id="notif-panel"
                  className="absolute right-0 top-11 w-80 max-h-96 rounded-xl overflow-hidden z-50 animate-fade-in"
                  style={{
                    background: 'var(--notif-bg)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: `0 20px 60px var(--shadow)`,
                  }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                    <button onClick={markAllRead} className="text-blue-400 text-xs hover:text-blue-500">Mark all read</button>
                  </div>
                  <div className="overflow-y-auto max-h-72">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>No notifications</p>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className="px-4 py-3 border-b cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            borderColor: 'var(--border)',
                            background: n.read ? 'transparent' : (NOTIF_BG[n.type] || NOTIF_BG.info),
                          }}
                        >
                          <p className={`text-xs font-medium ${NOTIF_COLOR[n.type] || 'text-blue-400'}`}>{n.message}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {n.time?.toLocaleTimeString?.('en-IN') || ''}
                            {!n.read && <span className="ml-2 text-blue-400">• New</span>}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar chip */}
            <div
              className="flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer transition-colors"
              style={{ border: `1px solid ${isAdmin ? 'rgba(255,71,87,0.2)' : 'var(--border)'}` }}
              onClick={() => navigate('/dashboard')}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{
                  background: isAdmin
                    ? 'linear-gradient(135deg, #ff4757, #c0392b)'
                    : 'linear-gradient(135deg, #1d6ef5, #00d4ff)',
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
                <p className="text-xs capitalize" style={{ color: isAdmin ? '#ff4757' : '#1d6ef5' }}>
                  {isAdmin ? 'Administrator' : 'Citizen'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto city-grid p-4 lg:p-6" style={{ background: 'var(--bg-base)' }}>
          {children}
        </main>

        {/* Smart Traffic Chatbot */}
        <Chatbot />
      </div>
    </div>
  );
}
