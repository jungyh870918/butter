import { useLocale } from '../../hooks/useLocale';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Book } from '../../types';
import { useBooks } from '../../hooks/useBooks';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage } from '../ui';

const CATEGORIES = ['All', 'Fiction', 'Poetry', 'Philosophy', 'Sci-Fi', 'Historical', 'Essay', 'Psychology', 'Mystery', 'History', 'Comics'] as const;
// CATEGORY_LABELS는 컴포넌트 내부에서 t()로 처리

export const Explore = () => {
  const [filter, setFilter] = useState('All');
  const { locale, t } = useLocale();
  const CATEGORY_LABELS: Record<string, string> = {
    'All': t('explore.cat.all'),
    'Fiction': t('explore.cat.fiction'),
    'Poetry': t('explore.cat.poetry'),
    'Philosophy': t('explore.cat.philosophy'),
    'Sci-Fi': t('explore.cat.scifi'),
    'Historical': t('explore.cat.historical'),
    'Essay': t('explore.cat.essay'),
    'Psychology': t('explore.cat.psychology'),
    'Mystery': t('explore.cat.mystery'),
    'History': t('explore.cat.history'),
    'Comics': t('explore.cat.comics'),
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') ?? '';

  // 검색 쿼리가 바뀌면 카테고리 필터 초기화
  useEffect(() => {
    if (searchQuery) { setFilter('All'); setCurrentPage(1); }
  }, [searchQuery]);

  // 검색 지우기
  const clearSearch = () => setSearchParams({});

  // 페이지네이션 — 페이지당 20권, offset = (page-1)*20
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // 필터 변경 시 페이지 1로 리셋
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const currentOffset = searchQuery ? 0 : (currentPage - 1) * PAGE_SIZE;

  const { books, loading, error } = useBooks(
    searchQuery ? undefined : filter,
    searchQuery || undefined,
    locale,
    currentOffset > 0 ? currentOffset : undefined
  );
  const navigate = useNavigate();

  const handleSelectBook = (book: Book) => navigate(`/explore/${book.id}`);
  const trendingBooks = books.slice(0, 3);
  const shuffledBooks = books; // 인기순 유지 (정렬 안 섞음)

  // 이전/다음 페이지 — 결과가 PAGE_SIZE 미만이면 마지막 페이지
  const hasNextPage = !loading && !searchQuery && books.length >= PAGE_SIZE;
  const hasPrevPage = currentPage > 1;

  const goNextPage = () => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goPrevPage = () => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-butter-bg">

      {/* ── Hero 헤더 ── */}
      <div className="pt-24 pb-6 px-8 md:px-14 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-butter-muted/70 font-medium mb-4">
          {t('explore.label')}
        </p>
        <h1 className="text-[1.6rem] md:text-[2.6rem] font-serif font-black leading-[1.1] tracking-tight mb-5">
          {t('explore.title')}{' '}
          <em style={{ fontStyle: 'italic', color: 'var(--color-butter-primary)', fontWeight: 700 }}>
            {t('explore.title.em')}
          </em>
        </h1>
        <p className="text-butter-muted leading-[1.75] max-w-md font-light text-[15px]">
          {t('explore.subtitle')}
        </p>
      </div>

      {/* ── 검색 결과 배너 ── */}
      {searchQuery && (
        <div className="px-8 md:px-14 max-w-7xl mx-auto pb-2">
          <div className="flex items-center gap-3 py-3" style={{ borderTop: '1px solid var(--color-butter-rule)' }}>
            <p className="text-[13px] font-light" style={{ color: 'var(--color-butter-text)' }}>
              {loading
                ? (t('nav.search.placeholder'))
                : `${books.length} ${books.length === 1 ? 'result' : 'results'} for`}{' '}
              {!loading && (
                <em className="font-serif italic" style={{ color: 'var(--color-butter-primary)' }}>
                  "{searchQuery}"
                </em>
              )}
            </p>
            <button
              onClick={clearSearch}
              className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-[0.1em] transition-colors hover:text-butter-text"
              style={{ color: 'var(--color-butter-muted)', opacity: 0.7 }}
            >
              <X size={11} />
              {t('explore.cat.all')}
            </button>
          </div>
        </div>
      )}

      <div className="px-8 md:px-14 max-w-7xl mx-auto">

        {/* ── 카테고리 필터 ── */}
        <div
          className="flex items-center gap-1 mb-10 overflow-x-auto pb-1 scrollbar-hide pt-6 transition-opacity duration-200"
          style={{
            borderTop: '1px solid rgba(0,0,0,0.07)',
            opacity: searchQuery ? 0.35 : 1,
            pointerEvents: searchQuery ? 'none' : 'auto',
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
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
            {!loading && !error && shuffledBooks.length === 0 && <EmptyState {...{message: t('explore.empty')}} />}
            {!loading && !error && shuffledBooks.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
                {shuffledBooks.map((book, i) => (
                  <BookCard key={book.id} book={book} onClick={() => handleSelectBook(book)} index={i} />
                ))}
              </div>
            )}

            {/* 페이지네이션 */}
            {!loading && !searchQuery && (hasPrevPage || hasNextPage) && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={goPrevPage}
                  disabled={!hasPrevPage}
                  className="flex items-center gap-1.5 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-all disabled:opacity-30"
                  style={{
                    border: '1px solid var(--color-butter-rule)',
                    borderRadius: '2px',
                    color: 'var(--color-butter-muted)',
                    background: 'transparent',
                  }}
                >
                  ← {locale === 'ko' ? '이전' : 'Prev'}
                </button>

                <span
                  className="text-[11px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                >
                  {currentPage}
                </span>

                <button
                  onClick={goNextPage}
                  disabled={!hasNextPage}
                  className="flex items-center gap-1.5 px-5 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-all disabled:opacity-30"
                  style={{
                    border: '1px solid var(--color-butter-rule)',
                    borderRadius: '2px',
                    color: 'var(--color-butter-muted)',
                    background: 'transparent',
                  }}
                >
                  {locale === 'ko' ? '다음' : 'Next'} →
                </button>
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
                className="w-full px-0 py-2 text-[16px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/55 transition-colors"
                style={{ borderBottom: '1px solid var(--color-butter-rule)' }}
              />
              <button
                className="mt-4 w-full py-2.5 text-[10px] uppercase tracking-[0.18em] font-semibold hover:brightness-110 transition-all"
                style={{
                  background: 'var(--color-butter-primary)',
                  color: 'var(--color-butter-bg)',
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
                    onClick={() => { handleFilterChange(cat); setDrawerOpen(false); }}
                    className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                      filter === cat ? 'bg-butter-primary text-white' : 'text-butter-muted'
                    }`}
                    style={filter !== cat ? { background: 'rgba(0,0,0,0.04)' } : {}}
                  >
                    {CATEGORY_LABELS[cat] || cat}
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
    <h3 className="font-serif text-[0.85rem] leading-snug mb-0.5 group-hover:text-butter-primary transition-colors duration-300 line-clamp-2">
      {book.title}
    </h3>
    <p className="text-[11px] text-butter-muted italic font-light line-clamp-1">{book.author}</p>
  </motion.article>
);
