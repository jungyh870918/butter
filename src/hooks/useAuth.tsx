import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
// 토큰은 더 이상 localStorage에 저장하지 않음 — httpOnly 쿠키로 관리
const USER_KEY = 'butter-user';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 — 쿠키 토큰으로 /me 검증
  // localStorage의 user 캐시는 빠른 렌더용으로만 사용, 실제 인증은 서버에서 확인
  useEffect(() => {
    const cachedUser = localStorage.getItem(USER_KEY);
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch { /* ignore */ }
    }

    // 쿠키 토큰 서버 검증
    fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include', // 쿠키 전송
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
        // 쿠키가 없거나 만료됨
        setUser(null);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 응답 쿠키 저장
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message ?? 'Login failed');
    }

    const data = await res.json();
    // 토큰은 쿠키에 저장됨 — user 정보만 캐시
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    // 서버에 로그아웃 요청 → 쿠키 삭제
    fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => { /* 조용히 실패 */ });

    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

