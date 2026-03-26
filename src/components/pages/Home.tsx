import { useLocale } from '../../hooks/useLocale';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageSquare, BookOpen, ArrowLeft } from 'lucide-react';
import { Reflection, Book } from '../../types';
import { useReflections } from '../../hooks/useReflections';
import { EmptyState, AvatarImage, BookCoverImage } from '../ui';
import { formatDate } from '../../lib/format';
import { useEffect, useState, useCallback } from 'react';
import { getBooks, getBook } from '../../lib/api';

// ── 좌측 사이드바 ──────────────────────────────────────────────────────────
interface BookSidebarProps {
  book: Book | null;
  loading: boolean;
}

const BookSidebar = ({ book, loading }: BookSidebarProps) => {
  const navigate = useNavigate();
  const { locale } = useLocale();

  if (loading) return (
    <div className="space-y-4">
      <div className="aspect-[2/3] w-full rounded-sm animate-pulse"
        style={{ background: 'var(--color-butter-accent)' }} />
      <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
      <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
    </div>
  );

  if (!book) return null;

  const desc = book.description
    ? book.description.slice(0, 200).trimEnd() + (book.description.length > 200 ? '…' : '')
    : '';

  return (
    <motion.div
      key={book.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* 책 커버 */}
      <div
        className="overflow-hidden rounded-sm mb-6 cursor-pointer"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.13)' }}
        onClick={() => navigate(`/explore/${book.id}`)}
      >
        <BookCoverImage src={book.cover} alt={book.title} className="w-full object-cover" />
      </div>

      {/* 제목 + 저자 */}
      <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
        <h3
          className="font-serif italic font-light leading-[1.25] mb-1.5 cursor-pointer hover:text-butter-primary transition-colors duration-200"
          style={{ fontSize: '1.05rem', color: 'var(--color-butter-text)' }}
          onClick={() => navigate(`/explore/${book.id}`)}
        >
          {book.title}
        </h3>
        <p className="font-serif italic font-light" style={{ fontSize: '13px', color: 'var(--color-butter-muted)' }}>
          by {book.author}
        </p>
      </div>

      {/* 책 설명 */}
      {desc && (
        <div className="mb-5 pb-5" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
          <p
            className="font-serif italic font-light leading-[1.75]"
            style={{ fontSize: '12.5px', color: 'var(--color-butter-muted)', opacity: 0.8 }}
          >
            {desc}
          </p>
        </div>
      )}

      {/* 저자 소개 */}
      {book.authorNote && (
        <div className="mb-6 pb-5" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
          <p className="text-[9px] uppercase tracking-[0.22em] font-medium mb-3"
            style={{ color: 'var(--color-butter-muted)', opacity: 0.55 }}>
            {locale === 'ko' ? '저자 소개' : 'About the Author'}
          </p>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-sm shrink-0 overflow-hidden"
              style={{ background: 'var(--color-butter-accent)' }}>
              <img
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(book.author)}`}
                alt={book.author}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-serif italic font-light leading-[1.65]"
              style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.75 }}>
              {book.authorNote}
            </p>
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="space-y-2">
        <button
          onClick={() => navigate(`/explore/${book.id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 font-medium uppercase tracking-[0.12em] transition-all hover:brightness-110"
          style={{ fontSize: '10px', background: 'var(--color-butter-primary)', color: 'white', borderRadius: '2px' }}
        >
          <BookOpen size={11} strokeWidth={2} />
          {locale === 'ko' ? '계속 읽기' : 'Continue Reading'}
        </button>
        <div className="flex gap-2">
          <button className="flex-1 py-2 font-medium uppercase tracking-[0.1em]"
            style={{ fontSize: '10px', border: '1px solid var(--color-butter-rule)', borderRadius: '2px', color: 'var(--color-butter-muted)', background: 'transparent' }}>
            {locale === 'ko' ? '저장' : 'Save'}
          </button>
          <button className="flex-1 py-2 font-medium uppercase tracking-[0.1em]"
            style={{ fontSize: '10px', border: '1px solid var(--color-butter-rule)', borderRadius: '2px', color: 'var(--color-butter-muted)', background: 'transparent' }}>
            {locale === 'ko' ? '공유' : 'Share'}
          </button>
        </div>
        <button
          onClick={() => navigate('/journal', { state: { bookId: book.id, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover } })}
          className="w-full py-2 font-medium uppercase tracking-[0.1em]"
          style={{ fontSize: '10px', border: '1px solid var(--color-butter-rule)', borderRadius: '2px', color: 'var(--color-butter-muted)', background: 'transparent' }}>
          {locale === 'ko' ? '리플렉션 쓰기' : 'Write Reflection'}
        </button>
      </div>
    </motion.div>
  );
};

// ── 피드 아이템 ────────────────────────────────────────────────────────────
interface ReflectionCardProps {
  reflection: Reflection;
  index: number;
  onBookClick: (bookId: string) => void;
}

const ReflectionCard = ({ reflection, index, onBookClick }: ReflectionCardProps) => {
  const { locale } = useLocale();

  // reflection에 저장된 bookTitle 사용, 없으면 title 파싱으로 fallback
  const bookTitleMatch = reflection.title.match(/^A reflection on:\s*(.+?)…?$/i);
  const displayBookTitle = reflection.bookTitle || (bookTitleMatch ? bookTitleMatch[1].trim() : null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group py-10"
      style={{ borderTop: '1px solid var(--color-butter-rule)' }}
    >
      {/* 감정 태그 */}
      {(reflection.tags || []).length > 0 && (
        <p className="uppercase tracking-[0.2em] font-medium mb-3"
          style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.6 }}>
          {reflection.tags[0]}
        </p>
      )}

      {/* 제목 */}
      <h2
        className="font-serif font-light leading-[1.2] mb-3 group-hover:text-butter-primary transition-colors duration-300"
        style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.65rem)', color: 'var(--color-butter-text)' }}
      >
        {reflection.title}
      </h2>

      {/* 책 제목 링크 — bookId가 있을 때 */}
      {reflection.bookId && displayBookTitle && (
        <button
          onClick={() => onBookClick(reflection.bookId!)}
          className="flex items-center gap-1.5 mb-3 group/book"
        >
          <span
            className="font-serif italic font-light group-hover/book:text-butter-primary transition-colors duration-200"
            style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.7 }}
          >
            {locale === 'ko' ? '— ' : '— from '}
          </span>
          <span
            className="font-serif italic font-light group-hover/book:text-butter-primary transition-colors duration-200 underline underline-offset-2"
            style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.7, textDecorationColor: 'var(--color-butter-rule)' }}
          >
            {displayBookTitle}
          </span>
        </button>
      )}

      {/* 본문 */}
      <p className="font-light leading-[1.85] mb-6 line-clamp-3"
        style={{ fontSize: '14px', color: 'var(--color-butter-muted)' }}>
        {reflection.content}
      </p>

      {/* 메타 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AvatarImage src={reflection.authorAvatar} alt={reflection.author} className="w-7 h-7 rounded-full opacity-90" />
          <div>
            <p className="font-medium" style={{ fontSize: '13px', color: 'var(--color-butter-text)' }}>
              {reflection.author}
            </p>
            <p className="tracking-wide" style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.65 }}>
              {formatDate(reflection.date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5" style={{ color: 'var(--color-butter-muted)' }}>
          <button className="flex items-center gap-1.5 hover:text-butter-primary transition-colors">
            <Heart size={13} strokeWidth={1.5} />
            <span style={{ fontSize: '11px' }}>24</span>
          </button>
          <button className="flex items-center gap-1.5 hover:text-butter-primary transition-colors">
            <MessageSquare size={13} strokeWidth={1.5} />
            <span style={{ fontSize: '11px' }}>8</span>
          </button>
        </div>
      </div>
    </motion.article>
  );
};

// ── 홈 페이지 ──────────────────────────────────────────────────────────────
export const Home = () => {
  const { locale, t } = useLocale();

  // 사이드바 책 상태 — 초기 랜덤 + 클릭 시 변경
  const [sidebarBook, setSidebarBook] = useState<Book | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // 선택된 책 필터 (null = 전체)
  const [filteredBookId, setFilteredBookId] = useState<string | null>(null);
  const [filteredBookTitle, setFilteredBookTitle] = useState<string>('');

  // 초기 랜덤 책 로드
  useEffect(() => {
    setSidebarLoading(true);
    getBooks({ lang: locale })
      .then((books: Book[]) => {
        if (books.length === 0) return;
        setSidebarBook(books[Math.floor(Math.random() * books.length)]);
      })
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  }, [locale]);

  // 피드에서 책 제목 클릭 → 사이드바 + 피드 모두 변경
  const handleBookClick = useCallback(async (bookId: string) => {
    setFilteredBookId(bookId);
    setSidebarLoading(true);
    try {
      const book = await getBook(bookId);
      setSidebarBook(book);
      setFilteredBookTitle(book.title || bookId);
    } catch {
      setFilteredBookTitle(bookId);
    } finally {
      setSidebarLoading(false);
    }
  }, []);

  // 전체 보기로 복귀
  const handleClearFilter = useCallback(() => {
    setFilteredBookId(null);
    setFilteredBookTitle('');
    // 사이드바도 다시 랜덤 책으로
    setSidebarLoading(true);
    getBooks({ lang: locale })
      .then((books: Book[]) => {
        if (books.length === 0) return;
        setSidebarBook(books[Math.floor(Math.random() * books.length)]);
      })
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  }, [locale]);

  // bookId 필터 적용된 reflections
  const { reflections, loading: refLoading, error: refError } = useReflections({
    bookId: filteredBookId ?? undefined,
    limit: filteredBookId ? undefined : 10,
  });

  return (
    <div className="pt-20 pb-24 px-6 md:px-12 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-14 xl:gap-20">

        {/* ── 좌측 사이드바 (sticky) ── */}
        <aside className="lg:w-56 xl:w-64 shrink-0 order-1 lg:order-1">
          <div className="lg:sticky lg:top-28">
            <BookSidebar book={sidebarBook} loading={sidebarLoading} />
          </div>
        </aside>

        {/* ── 우측 메인 피드 ── */}
        <div className="flex-1 min-w-0 order-2 lg:order-2">

          {/* 헤더 */}
          <header className="mb-0 pb-8" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
            <p className="text-[10px] uppercase tracking-[0.3em] text-butter-muted/70 font-medium mb-4">
              {t('home.label')}
            </p>
            <h1 className="text-5xl md:text-[3.75rem] font-serif font-black leading-[1.06] tracking-tight mb-4">
              {t('home.title')}{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--color-butter-primary)', fontWeight: 700 }}>
                {t('home.title.em')}
              </em>
            </h1>
            <p className="text-butter-muted leading-[1.75] max-w-md font-light text-[15px]">
              {t('home.subtitle')}
            </p>
          </header>

          {/* 책 필터 배너 */}
          <AnimatePresence>
            {filteredBookId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between py-3 px-4 rounded-sm"
                  style={{ background: 'var(--color-butter-surface)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="font-serif italic font-light"
                      style={{ fontSize: '13px', color: 'var(--color-butter-muted)', opacity: 0.7 }}
                    >
                      {locale === 'ko' ? `『${filteredBookTitle}』의 코멘트` : `Reflections on "${filteredBookTitle}"`}
                    </span>
                  </div>
                  <button
                    onClick={handleClearFilter}
                    className="flex items-center gap-1.5 transition-colors hover:text-butter-primary"
                    style={{ fontSize: '11px', color: 'var(--color-butter-muted)', opacity: 0.7 }}
                  >
                    <ArrowLeft size={11} strokeWidth={1.5} />
                    <span className="uppercase tracking-[0.12em] font-medium" style={{ fontSize: '10px' }}>
                      {locale === 'ko' ? '전체 보기' : 'All reflections'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 피드 */}
          {refLoading && (
            <div className="mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="py-10" style={{ borderTop: '1px solid var(--color-butter-rule)' }}>
                  <div className="h-2.5 w-16 rounded animate-pulse mb-3" style={{ background: 'var(--color-butter-accent)' }} />
                  <div className="h-6 w-4/5 rounded animate-pulse mb-3" style={{ background: 'var(--color-butter-accent)' }} />
                  <div className="space-y-2 mb-6">
                    <div className="h-3 w-full rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
                    <div className="h-3 w-11/12 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
                    <div className="h-3 w-3/4 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!refLoading && refError && (
            <p className="mt-12 font-serif italic" style={{ fontSize: '15px', color: 'var(--color-butter-muted)' }}>
              {refError}
            </p>
          )}

          {!refLoading && !refError && reflections.length === 0 && (
            <div className="mt-4">
              <EmptyState message={
                filteredBookId
                  ? (locale === 'ko' ? '이 책에 대한 코멘트가 없습니다.' : 'No reflections for this book yet.')
                  : t('home.empty')
              } />
              {filteredBookId && (
                <button
                  onClick={handleClearFilter}
                  className="mt-4 flex items-center gap-1.5 hover:text-butter-primary transition-colors"
                  style={{ fontSize: '12px', color: 'var(--color-butter-muted)' }}
                >
                  <ArrowLeft size={12} strokeWidth={1.5} />
                  {locale === 'ko' ? '전체 코멘트 보기' : 'View all reflections'}
                </button>
              )}
            </div>
          )}

          {!refLoading && !refError && reflections.length > 0 && (
            <div>
              {reflections.map((r, i) => (
                <ReflectionCard key={r.id} reflection={r} index={i} onBookClick={handleBookClick} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
