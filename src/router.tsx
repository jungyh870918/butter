import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout';
import { Home } from './components/pages/Home';
import { Explore } from './components/pages/Explore';
import { BookDetail } from './components/pages/BookDetail';
import { ShareCard } from './components/pages/ShareCard';
import { Journal } from './components/pages/Journal';
import { Cartography } from './components/pages/Cartography';
import { NotFound } from './components/pages/NotFound';

export const router = createBrowserRouter([
  {
    // 공유 카드 — Navbar/Footer 없는 독립 레이아웃
    path: '/share/:bookId',
    element: <ShareCard />,
  },
  {
    path: '/',
    element: <RootLayout />,
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
