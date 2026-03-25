import { useLocale } from '../../hooks/useLocale';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Book } from '../../types';
import { useBooks } from '../../hooks/useBooks';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage } from '../ui';

const CATEGORIES = ['All', 'Fiction', 'Poetry', 'Philosophy', 'Sci-Fi', 'Historical'] as const;
// CATEGORY_LABELS는 컴포넌트 내부에서 t()로 처리

export const Explore = () => {
  const [filter, setFilter] = useState('All');
  const { t } = useLocale();
  const CATEGORY_LABELS: Record<string, string> = {
    'All': t('explore.cat.all'),
    'Fiction': t('explore.cat.fiction'),
    'Poetry': t('explore.cat.poetry'),
    'Philosophy': t('explore.cat.philosophy'),
    'Sci-Fi': t('explore.cat.scifi'),
    'Historical': t('explore.cat.historical'),
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { books, loading, error } = useBooks(filter);
  const navigate = useNavigate();

  const handleSelectBook = (book: Book) => navigate(`/explore/${book.id}`);
  const trendingBooks = books.slice(0, 3);

  return (
    <div className="min-h-screen bg-butter-bg">

      {/* ── Hero 헤더 ── */}
      <div className="pt-24 pb-6 px-8 md:px-14 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-butter-muted/70 font-medium mb-4">
          {t('explore.label')}
        </p>
        <h1 className="text-5xl md:text-[3.75rem] font-serif font-black leading-[1.06] tracking-tight mb-5">
          {t('explore.title')}{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-butter-primary)', fontWeight: 700 }}>
            {t('explore.title.em')}
          </em>
        </h1>
        <p className="text-butter-muted leading-[1.75] max-w-md font-light text-[15px]">
          {t('explore.subtitle')}
        </p>
      </div>

      <div className="px-8 md:px-14 max-w-7xl mx-auto">

        {/* ── 카테고리 필터 ── */}
        <div className="flex items-center gap-1 mb-10 overflow-x-auto pb-1 scrollbar-hide pt-6"
          style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200 ${
                filter === cat
                  ? 'bg-butter-primary text-white'
                  : 'text-butter-muted hover:text-butter-text'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* ── 메인 + 사이드바 ── */}
        <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 pb-24">

          {/* 책 그리드 */}
          <main className="flex-1 min-w-0">
            {loading && <LoadingSpinner />}
            {!loading && error && <ErrorMessage message={error} />}
            {!loading && !error && books.length === 0 && <EmptyState {...{message: t('explore.empty')}} />}
            {!loading && !error && books.length > 0 && (
              <div className="grid grid-cols-2 gap-x-7 gap-y-12">
                {books.map((book, i) => (
                  <BookCard key={book.id} book={book} onClick={() => handleSelectBook(book)} index={i} />
                ))}
              </div>
            )}
          </main>

          {/* ── 사이드바 ── */}
          <aside className="lg:w-60 xl:w-64 shrink-0 space-y-0">

            {/* A. {t('explore.trending')} */}
            {!loading && trendingBooks.length > 0 && (
              <div
                className="p-6 mb-8"
                style={{
                  background: 'var(--color-butter-surface)',
                  borderRadius: '3px',
                }}
              >
                <p className="text-[9px] uppercase tracking-[0.28em] font-bold text-butter-muted/80 mb-5">
                  {t('explore.trending')}
                </p>
                <div className="space-y-5">
                  {trendingBooks.map((book, i) => (
                    <div
                      key={book.id}
                      className="flex gap-3.5 items-start cursor-pointer group"
                      onClick={() => handleSelectBook(book)}
                    >
                      <span
                        className="font-serif font-light leading-none mt-0.5 shrink-0 select-none w-5 text-right"
                        style={{ fontSize: '1.05rem', color: '#c5b89a' }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium leading-snug group-hover:text-butter-primary transition-colors line-clamp-2">
                          {book.title}
                        </p>
                        <p className="text-[11px] text-butter-muted italic mt-0.5 font-light">{book.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* B. Journaling Circle */}
            <div
              className="pl-5 py-1 mb-8"
              style={{ borderLeft: '2px solid rgba(107,82,0,0.20)' }}
            >
              <h3 className="font-serif text-[1rem] font-light leading-snug mb-2 text-butter-text">
                {t('explore.journal.title')}
              </h3>
              <p className="text-[12px] text-butter-muted leading-[1.7] mb-5 font-light">
                {t('explore.journal.desc')}
              </p>
              <input
                type="email"
                {...{placeholder: t('explore.journal.email')}}
                className="w-full px-0 py-2 text-[13px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/40 transition-colors"
                style={{ borderBottom: '1px solid rgba(0,0,0,0.10)' }}
              />
              <button
                className="mt-4 w-full py-2.5 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:brightness-110 transition-all"
                style={{
                  background: 'var(--color-butter-text)',
                  borderRadius: '2px',
                }}
              >
                {t('explore.journal.subscribe')}
              </button>
            </div>

            {/* C. Did you know */}
            <div
              className="p-5"
              style={{
                background: 'var(--color-butter-bg)',
                borderRadius: '3px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: '14px', lineHeight: 1 }}>📖</span>
                <p className="text-[9px] uppercase tracking-[0.24em] font-bold text-butter-muted/60">
                  {t('explore.didyouknow')}
                </p>
              </div>
              <p className="text-[13px] text-butter-muted leading-[1.75] italic font-light">
                "Reading is that fruitful miracle of a communication in the midst of solitude."
              </p>
              <p className="text-[11px] text-butter-muted/60 mt-2.5 not-italic font-medium">
                — Marcel Proust
              </p>
            </div>

          </aside>
        </div>
      </div>

      {/* 모바일 드로어 */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-butter-bg rounded-t-2xl p-6 pb-10"
              style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.08)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-xl font-light">Categories</h3>
                <button onClick={() => setDrawerOpen(false)}>
                  <X size={18} className="text-butter-muted" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setFilter(cat); setDrawerOpen(false); }}
                    className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      filter === cat ? 'bg-butter-primary text-white' : 'text-butter-muted'
                    }`}
                    style={filter !== cat ? { background: 'rgba(0,0,0,0.04)' } : {}}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const BookCard = ({ book, onClick, index }: { book: Book; onClick: () => void; index: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04, duration: 0.35 }}
    className="group cursor-pointer"
    onClick={onClick}
  >
    <div
      className="relative aspect-[2/3] mb-4 overflow-hidden rounded-sm transition-all duration-500 group-hover:-translate-y-1"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}
    >
      <BookCoverImage
        src={book.cover}
        alt={book.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
      />
    </div>
    <h3 className="font-serif text-[0.95rem] leading-snug mb-1 group-hover:text-butter-primary transition-colors duration-300 line-clamp-2">
      {book.title}
    </h3>
    <p className="text-[12px] text-butter-muted italic font-light line-clamp-1">{book.author}</p>
  </motion.article>
);
