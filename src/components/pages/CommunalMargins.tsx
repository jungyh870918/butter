import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Share2, Bookmark, MoreHorizontal, BookOpen } from 'lucide-react';
import { getRandomBookWithReflections } from '../../lib/api';
import { BookCoverImage } from '../ui';
import { useLocale } from '../../hooks/useLocale';
import { formatDate } from '../../lib/format';
import type { Book, Reflection } from '../../types';

// ── 별점 렌더 ──────────────────────────────────────────────────────────────
const Stars = ({ count = 4 }: { count?: number }) => (
  <div className="flex items-center gap-0.5 mt-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        style={{
          fontSize: '11px',
          color: i < count ? 'var(--color-butter-primary)' : 'var(--color-butter-accent)',
        }}
      >
        ★
      </span>
    ))}
  </div>
);

// ── 개별 Reflection 행 ─────────────────────────────────────────────────────
const ReflectionRow = ({ reflection, index }: { reflection: Reflection; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 + index * 0.07, duration: 0.35 }}
    className="flex gap-5 py-7"
    style={{ borderBottom: '1px solid var(--color-butter-rule)' }}
  >
    {/* 아바타 */}
    <div className="shrink-0 mt-0.5">
      <div
        className="w-10 h-10 rounded-full overflow-hidden"
        style={{ background: 'var(--color-butter-accent)' }}
      >
        {reflection.authorAvatar ? (
          <img
            src={reflection.authorAvatar}
            alt={reflection.author}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-serif italic"
            style={{ fontSize: '14px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
          >
            {reflection.author.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </div>

    {/* 내용 */}
    <div className="flex-1 min-w-0">
      {/* 저자 + 날짜 */}
      <div className="flex items-baseline gap-3 mb-2.5">
        <span
          className="font-medium"
          style={{ fontSize: '13px', color: 'var(--color-butter-text)' }}
        >
          {reflection.author}
        </span>
        <span
          className="uppercase tracking-[0.15em] font-medium"
          style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
        >
          {formatDate(reflection.date)}
        </span>
      </div>

      {/* 본문 */}
      <p
        className="font-serif italic leading-[1.75] font-light"
        style={{
          fontSize: '15px',
          color: 'var(--color-butter-text)',
          opacity: 0.85,
        }}
      >
        {reflection.content}
      </p>

      {/* 별점 — tags 배열 길이를 별점으로 활용 (0~5) */}
      <Stars count={Math.min(5, Math.max(0, (reflection.tags || []).length + 3))} />
    </div>
  </motion.div>
);

// ── 메인 페이지 ────────────────────────────────────────────────────────────
export const CommunalMargins = () => {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setLoading(true);
    getRandomBookWithReflections()
      .then(({ book: b, reflections: r }) => {
        setBook(b);
        setReflections(r);
      })
      .catch(() => setError('No reflections available yet.'))
      .finally(() => setLoading(false));
  }, []);

  const visibleReflections = showAll ? reflections : reflections.slice(0, 4);

  // ── 로딩 skeleton ──
  if (loading) {
    return (
      <div className="pt-20 pb-24 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 lg:gap-24">
          {/* 좌 skeleton */}
          <div className="md:w-56 lg:w-64 shrink-0 space-y-4">
            <div className="aspect-[2/3] rounded-sm animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
            <div className="h-5 w-3/4 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
            <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
          </div>
          {/* 우 skeleton */}
          <div className="flex-1 space-y-8 pt-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-5 py-7" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
                <div className="w-10 h-10 rounded-full shrink-0 animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3 w-1/4 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
                  <div className="h-3.5 w-full rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
                  <div className="h-3.5 w-4/5 rounded animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 에러 / 빈 상태 ──
  if (error || !book) {
    return (
      <div className="pt-32 text-center">
        <p className="font-serif italic" style={{ fontSize: '15px', color: 'var(--color-butter-muted)' }}>
          {error || 'No reflections available yet.'}
        </p>
      </div>
    );
  }

  const description = book.description || '';
  const truncatedDesc = description.length > 200
    ? description.slice(0, 200).trimEnd() + '…'
    : description;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen"
      style={{ background: 'var(--color-butter-bg)' }}
    >
      <div className="pt-20 pb-24 px-6 md:px-12 max-w-6xl mx-auto">

        {/* ── 상단 우측 아이콘들 ── */}
        <div className="flex justify-end gap-2 mb-10">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ color: 'var(--color-butter-muted)' }}
            title="Share"
          >
            <Share2 size={15} strokeWidth={1.5} />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ color: 'var(--color-butter-muted)' }}
            title="Save"
          >
            <Bookmark size={15} strokeWidth={1.5} />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:opacity-80"
            style={{ color: 'var(--color-butter-muted)' }}
            title="More"
          >
            <MoreHorizontal size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-14 lg:gap-24">

          {/* ── 좌측 사이드바 ── */}
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="md:w-56 lg:w-64 shrink-0"
          >
            {/* 책 커버 */}
            <div
              className="aspect-[2/3] rounded-sm overflow-hidden mb-6"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
            >
              <BookCoverImage
                src={book.cover}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* 제목 */}
            <h2
              className="font-serif italic font-light leading-[1.2] mb-2"
              style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: 'var(--color-butter-text)' }}
            >
              {book.title}
            </h2>

            {/* 저자 */}
            <p
              className="font-serif italic font-light mb-4"
              style={{ fontSize: '14px', color: 'var(--color-butter-muted)' }}
            >
              by {book.author}
            </p>

            {/* 설명 */}
            <p
              className="font-serif italic font-light leading-[1.7] mb-6"
              style={{ fontSize: '13px', color: 'var(--color-butter-muted)', opacity: 0.75 }}
            >
              {truncatedDesc}
            </p>

            {/* 저자 노트 (있는 경우) */}
            {book.authorNote && (
              <div
                className="mb-6 p-3"
                style={{ borderLeft: '2px solid var(--color-butter-rule)' }}
              >
                <p
                  className="text-[9px] uppercase tracking-[0.2em] font-medium mb-2"
                  style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                >
                  About the Author
                </p>
                <p
                  className="font-serif italic font-light leading-[1.65]"
                  style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.75 }}
                >
                  {book.authorNote}
                </p>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <button
                onClick={() => navigate(`/explore/${book.id}`)}
                className="w-full flex items-center justify-center gap-2 py-2.5 font-medium uppercase tracking-[0.12em] transition-all hover:brightness-110"
                style={{
                  fontSize: '11px',
                  background: 'var(--color-butter-primary)',
                  color: 'white',
                  borderRadius: '2px',
                }}
              >
                <BookOpen size={12} strokeWidth={2} />
                Continue Reading
              </button>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 font-medium uppercase tracking-[0.12em] transition-colors hover:opacity-80"
                  style={{
                    fontSize: '10px',
                    border: '1px solid var(--color-butter-rule)',
                    borderRadius: '2px',
                    color: 'var(--color-butter-muted)',
                    background: 'transparent',
                  }}
                >
                  Save
                </button>
                <button
                  className="flex-1 py-2.5 font-medium uppercase tracking-[0.12em] transition-colors hover:opacity-80"
                  style={{
                    fontSize: '10px',
                    border: '1px solid var(--color-butter-rule)',
                    borderRadius: '2px',
                    color: 'var(--color-butter-muted)',
                    background: 'transparent',
                  }}
                >
                  Share
                </button>
              </div>

              <button
                onClick={() => navigate('/journal', {
                  state: {
                    bookId: book.id,
                    bookTitle: book.title,
                    bookAuthor: book.author,
                    bookCover: book.cover,
                  }
                })}
                className="w-full py-2.5 font-medium uppercase tracking-[0.12em] transition-colors hover:opacity-80"
                style={{
                  fontSize: '10px',
                  border: '1px solid var(--color-butter-rule)',
                  borderRadius: '2px',
                  color: 'var(--color-butter-muted)',
                  background: 'transparent',
                }}
              >
                Write Reflection
              </button>
            </div>
          </motion.aside>

          {/* ── 우측 메인 — Reader Reflections ── */}
          <main className="flex-1 min-w-0">
            {/* 섹션 헤더 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-8"
            >
              <p
                className="uppercase tracking-[0.22em] font-medium mb-3"
                style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.65 }}
              >
                Reader Reflections
              </p>
              <h1
                className="font-serif italic font-light leading-[1.15]"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.4rem)', color: 'var(--color-butter-text)' }}
              >
                Communal Margins
              </h1>
            </motion.div>

            {/* 구분선 */}
            <div style={{ height: '1px', background: 'var(--color-butter-rule)', marginBottom: '0' }} />

            {/* Reflection 목록 */}
            {reflections.length === 0 ? (
              <p
                className="font-serif italic pt-12"
                style={{ fontSize: '15px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
              >
                No reflections available yet.
              </p>
            ) : (
              <>
                {visibleReflections.map((r, i) => (
                  <ReflectionRow key={r.id} reflection={r} index={i} />
                ))}

                {/* Load more */}
                {reflections.length > 4 && (
                  <button
                    onClick={() => setShowAll(p => !p)}
                    className="flex items-center gap-2 pt-6 uppercase tracking-[0.18em] font-medium transition-opacity hover:opacity-80"
                    style={{ fontSize: '10px', color: 'var(--color-butter-muted)' }}
                  >
                    {showAll
                      ? (locale === 'ko' ? '접기' : 'Show Less')
                      : (locale === 'ko' ? `리플렉션 더 보기 (${reflections.length - 4})` : `Load More Reflections (${reflections.length - 4})`)}
                    <span style={{ fontSize: '12px' }}>{showAll ? '∧' : '∨'}</span>
                  </button>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </motion.div>
  );
};
