// context/AuthContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = unknown, false = not logged in
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(false); // Not authenticated
        }
      } catch (err) {
        setUser(false);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Login function
  const login = async (username, password, location) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, location }),
      headers: { 'Content-Type': 'application/json' },
    });
  
    const data = await res.json();
  
    if (res.ok) {
      setUser(data.user || { username });
    } else {
      throw new Error(data.message || 'Invalid credentials');
    }
  
    return { ok: res.ok, data };
  };

  // Logout function
  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
