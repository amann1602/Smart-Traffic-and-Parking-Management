import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

// Simulated user database
const USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Aman Inamdar',
    email: 'aman.inamdar@punesmartcity.gov.in',
    designation: 'Traffic Management Director',
    avatar: null,
    department: 'Smart Traffic Wing',
    lastLogin: new Date().toLocaleString(),
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    role: 'user',
    name: 'Saniya Tamboli',
    email: 'saniya.tamboli@citizen.pune.gov.in',
    designation: 'Pune Citizen',
    avatar: null,
    department: 'Public',
    lastLogin: new Date().toLocaleString(),
  },
  {
    id: 3,
    username: 'operator',
    password: 'op123',
    role: 'admin',
    name: 'Aman Inamdar',
    email: 'aman.inamdar@punesmartcity.gov.in',
    designation: 'Field Operations Officer',
    avatar: null,
    department: 'Operations',
    lastLogin: new Date().toLocaleString(),
  },
];

const SESSION_KEY = 'pune_smart_city_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Restore session on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setLoginError('');

    // Simulate network latency
    await new Promise(r => setTimeout(r, 800));

    const found = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (found) {
      const session = { ...found, sessionStart: new Date().toISOString() };
      delete session.password;
      setUser(session);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setLoading(false);
      return true;
    } else {
      setLoginError('Invalid username or password. Please try again.');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginError, setLoginError, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
