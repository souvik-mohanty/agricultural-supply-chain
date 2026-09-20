import { createContext } from 'react';

// Shape: { user, role, status: 'loading' | 'authenticated' | 'anonymous', isAuthenticated, sessionExpired,
//          login(token), logout(), refreshUser(), hasRole(...roles) }
export const AuthContext = createContext(null);
