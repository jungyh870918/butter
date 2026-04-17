import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const TOKEN_KEY = 'butter-token';
const USER_KEY  = 'butter-user';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── 토큰 헬퍼 (localStorage 기반) ─────────────────────────────────────────
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 — localStorage 토큰으로 /me 검증
  useEffect(() => {
    const cachedUser = localStorage.getItem(USER_KEY);
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch { /* ignore */ }
    }

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('not authenticated');
        return res.json();
      })
      .then(({ user: serverUser }) => {
        setUser(serverUser);
        localStorage.setItem(USER_KEY, JSON.stringify(serverUser));
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? 'Login failed');
    }

    const data = await res.json();
    // 서버가 token을 응답에 포함해서 돌려주면 저장
    if (data.token) {
      setToken(data.token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
