import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const API_BASE  = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
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
  deleteAccount: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null, loading: true,
  login: async () => {}, logout: () => {},
  deleteAccount: async () => {},
});

export function useAuth() { return useContext(AuthContext); }

export function getToken(): string | null {
  // 1순위: localStorage (로그인 후 저장된 Bearer 토큰)
  const lsToken = localStorage.getItem(TOKEN_KEY);
  if (lsToken) return lsToken;

  // 2순위: 쿠키 fallback (httpOnly: false 설정된 경우 동작)
  try {
    const match = document.cookie.match(/(?:^|;\s*)butter-token=([^;]+)/);
    if (match) {
      const cookieToken = decodeURIComponent(match[1]);
      localStorage.setItem(TOKEN_KEY, cookieToken); // 다음부터 빠르게
      return cookieToken;
    }
  } catch { /* ignore */ }

  return null;
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ── 인증 헤더 헬퍼 ────────────────────────────────────────────────────────
function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 캐시된 유저 정보로 빠른 렌더
    const cachedUser = localStorage.getItem(USER_KEY);
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch { /* ignore */ }
    }

    const token = getToken();

    // 토큰 없으면 비로그인 처리
    if (!token) {
      setUser(null);
      localStorage.removeItem(USER_KEY);
      setLoading(false);
      return;
    }

    // 토큰 유효성 서버에서 검증
    fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => { if (!res.ok) throw new Error('invalid'); return res.json(); })
      .then(({ user: serverUser }) => {
        setUser(serverUser);
        localStorage.setItem(USER_KEY, JSON.stringify(serverUser));
      })
      .catch(() => {
        clearAuth();
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

    // 서버가 token을 body에 포함하면 저장 (Bearer 방식)
    if (data.token) {
      setToken(data.token);
    }

    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    // 서버에 로그아웃 (쿠키 삭제 — 하위 호환)
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    }).catch(() => {});
    clearAuth();
    setUser(null);
  };

  /**
   * 계정 영구 삭제. ⚠️ 되돌릴 수 없음.
   * 서버가 비밀번호를 재확인하고, 성공하면 로컬 세션도 정리한다.
   */
  const deleteAccount = async (password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? 'Failed to delete account');
    }

    // 계정이 사라졌으므로 로컬에 남은 토큰·캐시도 전부 제거
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}
