import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Login } from './components/pages/Login';
import { Home } from './components/pages/Home';
import { Explore } from './components/pages/Explore';
import { BookDetail } from './components/pages/BookDetail';
import { ShareCard } from './components/pages/ShareCard';
import { JournalShareCard } from './components/pages/JournalShareCard';
import { Journal } from './components/pages/Journal';
import { Cartography } from './components/pages/Cartography';
import { NotFound } from './components/pages/NotFound';

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/share/journal/:entryId', element: <JournalShareCard /> },  // 구체적인 경로 먼저
  { path: '/share/:bookId', element: <ShareCard /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'explore', element: <Explore /> },
      { path: 'explore/:bookId', element: <BookDetail /> },
      { path: 'journal', element: <Journal /> },
      { path: 'cartography', element: <Cartography /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
