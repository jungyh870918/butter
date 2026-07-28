import { createBrowserRouter, createHashRouter, Navigate } from 'react-router-dom';
import { isNative } from './lib/native';
import { RootLayout } from './components/layout/RootLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './components/pages/Login';
import { Home } from './components/pages/Home';
import { Explore } from './components/pages/Explore';
import { BookDetail } from './components/pages/BookDetail';
import { Journal } from './components/pages/Journal';
import { Cartography } from './components/pages/Cartography';
import { Settings } from './components/pages/Settings';
import { AccountDeletion } from './components/pages/AccountDeletion';
import { Privacy } from './components/pages/Privacy';
import { NotFound } from './components/pages/NotFound';

// 네이티브(WebView)에서는 hash 라우터를 쓴다.
// capacitor:// 로컬 서버는 /journal 같은 경로를 새로고침·복원할 때
// index.html 폴백을 보장하지 않아 흰 화면이 될 수 있음. 웹은 기존대로 history 라우터.
const createRouter = isNative ? createHashRouter : createBrowserRouter;

export const router = createRouter([
  { path: '/login', element: <Login /> },
  // 법적 고지 — 스토어 심사자가 로그인 없이 열어봐야 하므로 공개 라우트
  { path: '/privacy', element: <Privacy /> },
  { path: '/account-deletion', element: <AccountDeletion /> },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'explore', element: <Explore /> },
      { path: 'explore/:bookId', element: <BookDetail /> },
      {
        path: 'journal',
        element: (
          <ProtectedRoute>
            <Journal />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cartography',
        element: (
          <ProtectedRoute>
            <Cartography />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
