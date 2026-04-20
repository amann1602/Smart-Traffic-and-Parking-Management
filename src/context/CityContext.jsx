import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

// ─── Constants ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  { id: 'fc-road', name: 'FC Road', area: 'Central Pune', lat: 18.5236, lng: 73.8478 },
  { id: 'mg-road', name: 'MG Road', area: 'Camp', lat: 18.5204, lng: 73.8567 },
  { id: 'hinjewadi', name: 'Hinjewadi IT Park', area: 'Hinjewadi', lat: 18.5912, lng: 73.7389 },
  { id: 'shivajinagar', name: 'Shivajinagar', area: 'Shivajinagar', lat: 18.5314, lng: 73.8446 },
  { id: 'kothrud', name: 'Kothrud', area: 'Kothrud', lat: 18.5074, lng: 73.8077 },
  { id: 'baner', name: 'Baner Road', area: 'Baner', lat: 18.5590, lng: 73.7868 },
  { id: 'viman-nagar', name: 'Viman Nagar', area: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
  { id: 'hadapsar', name: 'Hadapsar', area: 'Hadapsar', lat: 18.5018, lng: 73.9253 },
  { id: 'wanowrie', name: 'Wanowrie', area: 'Wanowrie', lat: 18.4855, lng: 73.8963 },
  { id: 'karve-road', name: 'Karve Road', area: 'Deccan', lat: 18.5050, lng: 73.8340 },
];

const SIGNAL_LOCATIONS = LOCATIONS.slice(0, 8).map((loc, i) => ({
  ...loc,
  signalId: `SIG-${String(i + 1).padStart(3, '0')}`,
}));

const PARKING_LOCATIONS = [
  { id: 'park-1', name: 'PMC Parking – FC Road', area: 'Central Pune', total: 80, lat: 18.5240, lng: 73.8480 },
  { id: 'park-2', name: 'JM Road Multi-Level', area: 'Deccan', total: 150, lat: 18.5160, lng: 73.8414 },
  { id: 'park-3', name: 'Camp Commercial', area: 'Camp', total: 100, lat: 18.5207, lng: 73.8570 },
  { id: 'park-4', name: 'Baner IT Hub Parking', area: 'Baner', total: 200, lat: 18.5595, lng: 73.7872 },
  { id: 'park-5', name: 'Hinjewadi Phase 1', area: 'Hinjewadi', total: 300, lat: 18.5920, lng: 73.7395 },
  { id: 'park-6', name: 'Viman Nagar Airport Rd', area: 'Viman Nagar', total: 120, lat: 18.5685, lng: 73.9148 },
];

const getRandom = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(1);

const getDensityLabel = (density) => {
  if (density < 35) return 'Low';
  if (density < 70) return 'Medium';
  return 'High';
};

const getSignalDuration = (density) => {
  if (density >= 70) return { green: 60, yellow: 5, red: 30 };
  if (density >= 35) return { green: 45, yellow: 5, red: 45 };
  return { green: 30, yellow: 5, red: 60 };
};

// ─── Context ──────────────────────────────────────────────────────────────────
const CityContext = createContext(null);

export const useCityData = () => {
  const ctx = useContext(CityContext);
  if (!ctx) throw new Error('useCityData must be used inside CityProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const CityProvider = ({ children }) => {
  // Traffic
  const [trafficData, setTrafficData] = useState(() =>
    LOCATIONS.map(loc => ({
      ...loc,
      density: getRandom(20, 90),
      vehicles: getRandom(50, 300),
      speed: getRandom(15, 80),
      trend: 'stable',
    }))
  );

  // Signals
  const [signals, setSignals] = useState(() =>
    SIGNAL_LOCATIONS.map(loc => ({
      ...loc,
      phase: ['red', 'green', 'yellow'][getRandom(0, 2)],
      timer: getRandom(10, 60),
      autoMode: true,
      density: getRandom(20, 90),
    }))
  );

  // Parking
  const [parkingData, setParkingData] = useState(() =>
    PARKING_LOCATIONS.map(loc => ({
      ...loc,
      available: getRandom(5, loc.total),
      reserved: getRandom(0, 20),
    }))
  );

  // Trend history for charts
  const [trendHistory, setTrendHistory] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 12 }, (_, i) => ({
      time: new Date(now - (11 - i) * 5000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      density: getRandom(30, 85),
      vehicles: getRandom(80, 280),
      parking: getRandom(40, 90),
    }));
  });

  // Violations
  const [violations, setViolations] = useState([]);
  const [nextViolationId, setNextViolationId] = useState(1);

  // Emergency
  const [emergencyMode, setEmergencyMode] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', message: 'System initialized. Monitoring active.', time: new Date(), read: false },
  ]);

  // Logs
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, action: 'System Boot', module: 'Core', time: new Date(), level: 'info' },
  ]);

  const violationIdRef = useRef(nextViolationId);
  const logIdRef = useRef(2);
  const notifIdRef = useRef(2);

  // ─── Firebase Sync ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!db) return;

    try {
      // Sync Violations
      const vQuery = query(collection(db, 'violations'), orderBy('time', 'desc'), limit(50));
      const unsubscribeV = onSnapshot(vQuery, (snapshot) => {
        const vData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), time: doc.data().time?.toDate() || new Date() }));
        setViolations(vData);
      });

      // Sync Logs
      const lQuery = query(collection(db, 'systemLogs'), orderBy('time', 'desc'), limit(100));
      const unsubscribeL = onSnapshot(lQuery, (snapshot) => {
        const lData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), time: doc.data().time?.toDate() || new Date() }));
        setSystemLogs(lData);
      });

      return () => {
        unsubscribeV();
        unsubscribeL();
      };
    } catch (e) {
      console.error("Firestore sync error:", e);
    }
  }, []);

  const addNotification = useCallback((type, message) => {
    const id = notifIdRef.current++;
    setNotifications(prev => [{ id, type, message, time: new Date(), read: false }, ...prev].slice(0, 30));
  }, []);

  const addLog = useCallback(async (action, module, level = 'info') => {
    if (db) {
      try {
        await addDoc(collection(db, 'systemLogs'), {
          action,
          module,
          level,
          time: serverTimestamp(),
        });
        return;
      } catch (e) {
        console.error("Error adding log to Firebase:", e);
      }
    }
    
    // Fallback
    const id = logIdRef.current++;
    setSystemLogs(prev => [{ id, action, module, time: new Date(), level }, ...prev].slice(0, 100));
  }, []);

  const addViolation = useCallback(async (location) => {
    const types = ['Illegal Parking', 'Double Parking', 'No Parking Zone', 'Blocking Lane', 'Expired Permit'];
    const type = types[getRandom(0, types.length - 1)];
    const vehicle = `MH-12-${String.fromCharCode(65 + getRandom(0, 25))}${String.fromCharCode(65 + getRandom(0, 25))}-${getRandom(1000, 9999)}`;
    
    const violationData = {
      type,
      location: location?.name || LOCATIONS[getRandom(0, LOCATIONS.length - 1)].name,
      vehicle,
      status: 'Active',
      fineAmount: getRandom(500, 2000),
    };

    if (db) {
      try {
        await addDoc(collection(db, 'violations'), { ...violationData, time: serverTimestamp() });
        addNotification('warning', `Violation: ${type} detected at ${violationData.location} – ${vehicle}`);
        return;
      } catch (e) {
        console.error("Error saving violation to Firebase:", e);
      }
    }

    // Fallback
    const id = violationIdRef.current++;
    const violation = { ...violationData, id, time: new Date() };
    setViolations(prev => [violation, ...prev].slice(0, 50));
    addNotification('warning', `Violation: ${type} detected at ${violation.location} – ${vehicle}`);
    addLog(`Violation detected: ${type}`, 'Parking', 'warning');
  }, [addNotification, addLog]);

  // ─── Emergency Mode ──────────────────────────────────────────────────────────
  const activateEmergency = useCallback(() => {
    setEmergencyMode(true);
    setSignals(prev => prev.map(s => ({ ...s, phase: 'green', timer: 999, autoMode: false })));
    addNotification('danger', '🚨 EMERGENCY MODE ACTIVATED – All signals set to GREEN');
    addLog('Emergency Mode Activated', 'Emergency', 'critical');
  }, [addNotification, addLog]);

  const deactivateEmergency = useCallback(() => {
    setEmergencyMode(false);
    setSignals(prev => prev.map(s => ({ ...s, autoMode: true, timer: getRandom(10, 60) })));
    addNotification('info', '✅ Emergency Mode Deactivated – Normal operations resumed');
    addLog('Emergency Mode Deactivated', 'Emergency', 'info');
  }, [addNotification, addLog]);

  // ─── Manual Signal Control ───────────────────────────────────────────────────
  const setSignalPhase = useCallback((signalId, phase) => {
    setSignals(prev => prev.map(s =>
      s.id === signalId ? { ...s, phase, autoMode: false, timer: 30 } : s
    ));
    addLog(`Manual override: Signal ${signalId} → ${phase.toUpperCase()}`, 'Traffic', 'warning');
    addNotification('info', `Signal at ${SIGNAL_LOCATIONS.find(s => s.id === signalId)?.name} manually set to ${phase.toUpperCase()}`);
  }, [addLog, addNotification]);

  const toggleSignalAuto = useCallback((signalId) => {
    setSignals(prev => prev.map(s =>
      s.id === signalId ? { ...s, autoMode: !s.autoMode } : s
    ));
  }, []);

  // ─── Parking Management (Admin) ──────────────────────────────────────────────
  const updateParkingSlots = useCallback((locationId, delta) => {
    setParkingData(prev => prev.map(p =>
      p.id === locationId
        ? { ...p, total: Math.max(0, p.total + delta), available: Math.max(0, Math.min(p.available + delta, p.total + delta)) }
        : p
    ));
  }, []);

  const reserveSlot = useCallback((locationId) => {
    setParkingData(prev => prev.map(p =>
      p.id === locationId && p.available > 0
        ? { ...p, available: p.available - 1, reserved: p.reserved + 1 }
        : p
    ));
  }, []);

  // ─── Clear Violations ────────────────────────────────────────────────────────
  const clearViolation = useCallback((id) => {
    setViolations(prev => prev.map(v =>
      v.id === id ? { ...v, status: 'Resolved' } : v
    ));
    addLog(`Violation #${id} cleared`, 'Parking', 'info');
  }, [addLog]);

  const clearAllViolations = useCallback(() => {
    setViolations(prev => prev.map(v => ({ ...v, status: 'Resolved' })));
    addLog('All violations cleared', 'Parking', 'info');
  }, [addLog]);

  // ─── Mark notifications read ─────────────────────────────────────────────────
  const markNotificationRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // ─── Real-time Simulation Engine (every 4s) ──────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      // Update traffic data
      setTrafficData(prev => prev.map(loc => {
        const delta = getRandom(-12, 12);
        const newDensity = Math.max(5, Math.min(100, loc.density + delta));
        const trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';
        return {
          ...loc,
          density: newDensity,
          vehicles: getRandom(50, 350),
          speed: Math.max(5, Math.min(100, 90 - newDensity * 0.7 + getRandom(-5, 5))),
          trend,
        };
      }));

      // Update signals (auto mode only, not emergency)
      if (!emergencyMode) {
        setSignals(prev => prev.map(s => {
          if (!s.autoMode) {
            // Count down non-auto timers
            if (s.timer > 0) return { ...s, timer: s.timer - 4 };
            return { ...s, autoMode: true }; // re-enable auto
          }
          const newDensity = Math.max(5, Math.min(100, s.density + getRandom(-10, 10)));
          const durations = getSignalDuration(newDensity);
          let newPhase = s.phase;
          let newTimer = s.timer - 4;
          if (newTimer <= 0) {
            if (s.phase === 'green') { newPhase = 'yellow'; newTimer = durations.yellow; }
            else if (s.phase === 'yellow') { newPhase = 'red'; newTimer = durations.red; }
            else { newPhase = 'green'; newTimer = durations.green; }
          }
          return { ...s, phase: newPhase, timer: newTimer, density: newDensity };
        }));
      }

      // Update parking
      setParkingData(prev => prev.map(p => {
        const delta = getRandom(-8, 8);
        return {
          ...p,
          available: Math.max(0, Math.min(p.total, p.available + delta)),
        };
      }));

      // Update trend history
      setTrendHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          density: getRandom(30, 90),
          vehicles: getRandom(80, 300),
          parking: getRandom(40, 90),
        };
        return [...prev.slice(-23), newEntry];
      });

      // Random violations (15% chance)
      if (Math.random() < 0.15) {
        const loc = LOCATIONS[getRandom(0, LOCATIONS.length - 1)];
        addViolation(loc);
      }

      // High traffic alerts (if any location > 80%)
      const avgDensity = Math.random() * 100;
      if (avgDensity > 80) {
        addNotification('warning', `High traffic detected! Average density: ${avgDensity.toFixed(0)}%`);
      }

    }, 4000);

    return () => clearInterval(interval);
  }, [emergencyMode, addViolation, addNotification]);

  // ─── Derived Values ──────────────────────────────────────────────────────────
  const avgDensity = Math.round(trafficData.reduce((s, t) => s + t.density, 0) / trafficData.length);
  const totalVehicles = trafficData.reduce((s, t) => s + t.vehicles, 0);
  const totalParking = parkingData.reduce((s, p) => s + p.total, 0);
  const availableParking = parkingData.reduce((s, p) => s + p.available, 0);
  const activeViolations = violations.filter(v => v.status === 'Active').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const value = {
    // Data
    trafficData,
    signals,
    parkingData,
    trendHistory,
    violations,
    notifications,
    systemLogs,
    emergencyMode,
    // Derived
    avgDensity,
    totalVehicles,
    totalParking,
    availableParking,
    activeViolations,
    unreadNotifications,
    // Actions
    activateEmergency,
    deactivateEmergency,
    setSignalPhase,
    toggleSignalAuto,
    updateParkingSlots,
    reserveSlot,
    addViolation,
    clearViolation,
    clearAllViolations,
    markNotificationRead,
    markAllRead,
    // Helpers
    getDensityLabel,
    locations: LOCATIONS,
    signalLocations: SIGNAL_LOCATIONS,
    parkingLocations: PARKING_LOCATIONS,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
};
