import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, setUnauthorizedHandler } from '../lib/api';
import { setCookie, getCookie, deleteCookie } from '../lib/cookies';
import { toaster } from '../components/Toaster';

export type User = { id: string; email: string; username: string } | null;

type LoginPayload = { username: string; password: string };
type LoginResponse = { token: string; username: string; id: string; email: string };
type UserInfoResponse = { username: string; id: string; email: string };

type AuthContextValue = {
  user: User;
  loading: boolean;
  hasToken: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User>(null);
  const [loading, setLoading] = React.useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const refreshUser = React.useCallback(async () => {
    const token = getCookie('token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await apiFetch<UserInfoResponse>('/api/users/user-info');
      setUser({ id: me!.id, email: me!.email, username: me!.username });
    } catch {
      deleteCookie('token');
      setUser(null);
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  // Global 401 handler: toast + logout + redirect to /auth (remember previous page)
  React.useEffect(() => {
    let handled = false;
    const handler = () => {
      if (handled) return;
      handled = true;

      deleteCookie('token');
      setUser(null);

      toaster.create({
        title: 'Session expired',
        description: 'Please sign in again.',
        type: 'info'
      });

      // brief delay so toast paints before navigation
      setTimeout(() => {
        navigate('/auth', { replace: true, state: { from: location } });
      }, 50);
    };

    setUnauthorizedHandler(handler);
    return () => setUnauthorizedHandler(() => {});
  }, [navigate, location]);

  const login = React.useCallback(async ({ username, password }: LoginPayload) => {
    const data = await apiFetch<LoginResponse>('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    setCookie('token', data!.token, {
      maxAge: 60 * 60 * 24,
      sameSite: 'Lax',
      // Use the browser's location, not react-router's Location
      secure: globalThis.location.protocol === 'https:',
      path: '/'
    });

    setUser({ id: data!.id, email: data!.email, username: data!.username });
  }, []);

  const logout = React.useCallback(() => {
    deleteCookie('token');
    setUser(null);
    navigate('/auth', { replace: true });
  }, [navigate]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      hasToken: !!getCookie('token'),
      login,
      logout,
      refreshUser
    }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
