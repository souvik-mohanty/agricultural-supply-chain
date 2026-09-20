import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getUserDetails } from '../service/userApi';
import { UNAUTHORIZED_EVENT } from '../service/apiClient';
import { isUnauthorized } from '../lib/errors';
import { AuthContext } from './authContext';

// Holds the logged-in user. The backend is the source of truth for who the user is and what role they have:
// the profile (including the role) is loaded from /users/me, never decoded from the token in the browser.
const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (localStorage.getItem('token') ? 'loading' : 'anonymous'));
  const [sessionExpired, setSessionExpired] = useState(false);

  const clearSession = useCallback(
    (expired = false) => {
      localStorage.removeItem('token');
      setUser(null);
      setStatus('anonymous');
      setSessionExpired(expired);
      queryClient.clear(); // never show the previous user's cached data to the next one
    },
    [queryClient],
  );

  // Restore the session on page load.
  useEffect(() => {
    if (status !== 'loading') {
      return;
    }
    let cancelled = false;
    getUserDetails()
      .then((response) => {
        if (!cancelled) {
          setUser(response.data);
          setStatus('authenticated');
        }
      })
      .catch((error) => {
        if (cancelled) return;
        if (isUnauthorized(error)) {
          clearSession(true);
        } else {
          setStatus('anonymous'); // backend unreachable: keep the token, ask the user to log in again
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, clearSession]);

  // Any request answered with 401 (expired or revoked token, suspended user) ends the session.
  useEffect(() => {
    const onUnauthorized = () => clearSession(true);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  const login = useCallback(async (token) => {
    localStorage.setItem('token', token);
    try {
      const response = await getUserDetails();
      setUser(response.data);
      setStatus('authenticated');
      setSessionExpired(false);
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  }, []);

  const logout = useCallback(() => clearSession(false), [clearSession]);

  const refreshUser = useCallback(async () => {
    const response = await getUserDetails();
    setUser(response.data);
    return response.data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      status,
      isAuthenticated: status === 'authenticated',
      sessionExpired,
      login,
      logout,
      refreshUser,
      hasRole: (...roles) => roles.includes(user?.role),
    }),
    [user, status, sessionExpired, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
