import { useLocale, localizeEmotion } from '../../hooks/useLocale';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, ChevronDown, Bookmark, PenLine, Share2, Copy, Check } from 'lucide-react';
import { Book, JournalEntry } from '../../types';
import { useJournal } from '../../hooks/useJournal';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState, BookCoverImage } from '../ui';
import { formatDate } from '../../lib/format';
import { useEffect, useState, useRef } from 'react';
import { getFeaturedBooks, addToBookShelf } from '../../lib/api';
import { openExternal, publicBaseUrl } from '../../lib/native';

// ── 좌측 사이드바 ──────────────────────────────────────────────────────────
interface BookSidebarProps {
  book: Book | null;
  loading: boolean;
}

const BookSidebar = ({ book, loading }: BookSidebarProps) => {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [shelved, setShelved] = useState(false);
  const [shelving, setShelving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddToShelf = async () => {
    if (!book || shelved || shelving) return;
    setShelving(true);
    try {
      await addToBookShelf({ bookId: book.id, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover });
      setShelved(true);
    } catch { setShelved(true); }
    finally { setShelving(false); }
  };

  // 책 정보 공유 링크. ⚠️ 네이티브에서 window.location.origin 은 WebView 내부 주소라
  //    publicBaseUrl() 로 공개 웹 주소를 쓴다.
  const handleCopy = () => {
    const url = `${publicBaseUrl()}/share/${book?.id}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

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
          onClick={() => {
            const query = encodeURIComponent(`${book.title} ${book.author}`);
            const isKo = /[\uAC00-\uD7A3]/.test((book.title || '') + (book.author || ''));
            const url = isKo
              ? `https://search.kyobobook.co.kr/search?keyword=${query}`
              : `https://www.amazon.com/s?k=${query}`;
            void openExternal(url);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 font-medium uppercase tracking-[0.12em] transition-all hover:brightness-110"
          style={{ fontSize: '10px', background: 'var(--color-butter-primary)', color: 'white', borderRadius: '2px' }}
        >
          <BookOpen size={11} strokeWidth={2} />
          {locale === 'ko' ? '이어 읽기' : 'Continue Reading'}
        </button>
        <div className="flex gap-2">
          {/* 서재에 추가 */}
          <button
            onClick={handleAddToShelf}
            disabled={shelving || !book}
            className="flex-1 flex items-center justify-center gap-1 py-2 font-medium uppercase tracking-[0.1em] transition-all cursor-pointer"
            style={{
              fontSize: '10px', border: '1px solid var(--color-butter-rule)', borderRadius: '2px',
              color: shelved ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)',
              background: shelved ? 'rgba(107,82,0,0.06)' : 'transparent',
            }}
          >
            {shelving
              ? <div className="w-3 h-3 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-butter-accent)', borderTopColor: 'var(--color-butter-primary)' }} />
              : <Bookmark size={10} strokeWidth={shelved ? 2 : 1.5} fill={shelved ? 'var(--color-butter-primary)' : 'none'} />
            }
            {shelved ? '✓' : (locale === 'ko' ? '서재에 추가' : 'Save')}
          </button>

          {/* 공유하기 — 책 정보만 담긴 링크 */}
          <button
            onClick={() => setShareOpen(p => !p)}
            className="flex-1 flex items-center justify-center gap-1 py-2 font-medium uppercase tracking-[0.1em] transition-all"
            style={{
              fontSize: '10px', border: '1px solid var(--color-butter-rule)', borderRadius: '2px',
              color: shareOpen ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)',
              background: shareOpen ? 'rgba(107,82,0,0.04)' : 'transparent',
            }}
          >
            <Share2 size={10} strokeWidth={1.5} />
            {locale === 'ko' ? '공유하기' : 'Share'}
          </button>
        </div>

        {/* 공유 링크 패널 */}
        {shareOpen && (
          <div className="space-y-1.5">
            <input
              readOnly
              value={`${publicBaseUrl()}/share/${book?.id}`}
              className="w-full rounded px-2.5 py-1.5 text-[11px] font-mono truncate focus:outline-none"
              style={{ background: 'var(--color-butter-surface)', color: 'var(--color-butter-muted)', border: 'none' }}
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 font-medium uppercase tracking-[0.1em] transition-all"
              style={{
                fontSize: '10px', borderRadius: '2px',
                background: copied ? '#22c55e' : 'var(--color-butter-primary)',
                color: 'white',
              }}
            >
              {copied ? <><Check size={10} /> {locale === 'ko' ? '복사됨' : 'Copied'}</> : <><Copy size={10} /> {locale === 'ko' ? '링크 복사' : 'Copy Link'}</>}
            </button>
          </div>
        )}
        <button
          onClick={() => navigate('/journal', { state: { bookId: book.id, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover } })}
          className="w-full py-2 font-medium uppercase tracking-[0.1em]"
          style={{ fontSize: '10px', border: '1px solid var(--color-butter-rule)', borderRadius: '2px', color: 'var(--color-butter-muted)', background: 'transparent' }}>
          {locale === 'ko' ? '기록 남기기' : 'Write Entry'}
        </button>
      </div>
    </motion.div>
  );
};

// ── 내 기록 카드 ───────────────────────────────────────────────────────────
// 커뮤니티 피드를 대체 — 남의 글이 아니라 내가 쓴 저널만 보여준다.
interface MyEntryCardProps {
  entry: JournalEntry;
  index: number;
}

const MyEntryCard = ({ entry, index }: MyEntryCardProps) => {
  const { locale } = useLocale();
  const navigate = useNavigate();

  const preview =
    entry.content.length > 220 ? entry.content.slice(0, 220).trimEnd() + '…' : entry.content;

  const emotions = (entry.emotions ?? []).filter(Boolean);
  const mood = emotions[0] ?? entry.mood;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.35 }}
      onClick={() => navigate('/journal')}
      className="py-10 cursor-pointer group"
      style={{ borderTop: '1px solid var(--color-butter-rule)' }}
    >
      {mood && (
        <p
          className="uppercase tracking-[0.18em] mb-3"
          style={{ fontSize: '10px', color: 'var(--color-butter-primary)', opacity: 0.8 }}
        >
          {localizeEmotion(mood, locale)}
        </p>
      )}

      {entry.bookTitle && (
        <p
          className="font-serif italic mb-2"
          style={{ fontSize: '13px', color: 'var(--color-butter-muted)' }}
        >
          {locale === 'ko' ? `『${entry.bookTitle}』` : `on "${entry.bookTitle}"`}
        </p>
      )}

      {entry.highlight && (
        <blockquote
          className="font-serif italic mb-4 pl-4"
          style={{
            fontSize: '15px',
            lineHeight: 1.8,
            color: 'var(--color-butter-text)',
            borderLeft: '2px solid var(--color-butter-accent)',
          }}
        >
          "{entry.highlight}"
        </blockquote>
      )}

      <p
        className="mb-5 group-hover:text-butter-text transition-colors"
        style={{ fontSize: '14.5px', lineHeight: 1.85, color: 'var(--color-butter-muted)' }}
      >
        {preview}
      </p>

      <div className="flex items-center justify-between">
        <span
          className="uppercase tracking-[0.14em]"
          style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.55 }}
        >
          {formatDate(entry.date)}
        </span>
        <span
          className="uppercase tracking-[0.14em]"
          style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.4 }}
        >
          {locale === 'ko' ? '강도' : 'Intensity'} {entry.intensity}/10
        </span>
      </div>
    </motion.article>
  );
};

// ── 홈 페이지 ──────────────────────────────────────────────────────────────
export const Home = () => {
  const { locale, t } = useLocale();
  const navigate = useNavigate();

  // 사이드바 책 상태 — 초기 랜덤 + 클릭 시 변경
  const [sidebarBook, setSidebarBook] = useState<Book | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // 초기 featured 책 로드 — 베스트셀러 pool에서 랜덤 1권
  useEffect(() => {
    setSidebarLoading(true);
    getFeaturedBooks(locale, 1)
      .then((books: Book[]) => {
        if (books.length === 0) return;
        setSidebarBook(books[0]);
      })
      .catch(() => {})
      .finally(() => setSidebarLoading(false));
  }, [locale]);

  // 모바일 사이드바 접기/펼치기
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 내 저널 기록 — 비로그인 시엔 호출하지 않는다
  const { user } = useAuth();
  const { entries, loading: entriesLoading, error: entriesError } = useJournal();
  const recentEntries = entries.slice(0, 10);

  return (
    <div className="pt-20 pb-24 px-6 md:px-12 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-14 xl:gap-20">

        {/* ── 좌측 사이드바 (sticky) ── */}
        <aside ref={sidebarRef} className="lg:w-56 xl:w-64 shrink-0 order-1 lg:order-1">
          <div className="lg:sticky lg:top-28">

            {/* 모바일: 토글 버튼 — 펼쳤을 때 상단 fixed */}
            <div className="lg:hidden">
              {/* 접혀있을 때 — 인라인 버튼 */}
              {!sidebarExpanded && (
                <button
                  onClick={() => setSidebarExpanded(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full font-medium text-[11px] uppercase tracking-[0.15em] mb-4 transition-all"
                  style={{
                    background: 'var(--color-butter-primary)',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(107,82,0,0.25)',
                  }}
                >
                  <BookOpen size={12} strokeWidth={2} />
                  {locale === 'ko' ? '추천 책 보기' : 'Featured Book'}
                </button>
              )}

              {/* 펼쳐졌을 때 — 상단 fixed 닫기 버튼 */}
              {sidebarExpanded && (
                <div
                  className="fixed top-16 left-0 right-0 z-40 flex justify-center pointer-events-none"
                >
                  <button
                    onClick={() => setSidebarExpanded(false)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full font-medium text-[11px] uppercase tracking-[0.15em] transition-all shadow-md"
                    style={{
                      background: 'var(--color-butter-primary)',
                      color: 'white',
                      boxShadow: '0 4px 16px rgba(107,82,0,0.35)',
                    }}
                  >
                    <ChevronDown
                      size={12}
                      strokeWidth={2.5}
                      style={{ transform: 'rotate(180deg)' }}
                    />
                    {locale === 'ko' ? '책 정보 닫기' : 'Close'}
                  </button>
                </div>
              )}
            </div>

            {/* PC: 항상 표시 / 모바일: 펼쳤을 때만 */}
            <AnimatePresence initial={false}>
              {(sidebarExpanded) && (
                <motion.div
                  key="sidebar-mobile"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden lg:hidden"
                >
                  <BookSidebar book={sidebarBook} loading={sidebarLoading} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* PC 전용 (항상 표시) */}
            <div className="hidden lg:block">
              <BookSidebar book={sidebarBook} loading={sidebarLoading} />
            </div>

          </div>
        </aside>

        {/* ── 우측 메인 피드 ── */}
        <div className="flex-1 min-w-0 order-2 lg:order-2">

          {/* 헤더 */}
          <header className="mb-0 pb-0" style={{ paddingBottom: '2rem' }}>
            <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.5, marginBottom: '1.4rem' }}>
              {t('home.label')}
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <h1 style={{ fontWeight: 700, fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 0.95, letterSpacing: '-0.03em', color: 'var(--color-butter-text)', margin: 0 }}>
                {t('home.title')} {t('home.title.em')}
              </h1>
              <div style={{ textAlign: 'right', flexShrink: 0, paddingBottom: '0.15rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.65, marginBottom: '0.25rem' }}>
                  {t('home.ref')}
                </p>
                <p style={{ fontSize: '0.5rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.32 }}>
                  {locale === 'ko'
                    ? new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                </p>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-butter-rule)', paddingTop: '1.75rem', display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 300, lineHeight: 1.9, color: 'var(--color-butter-muted)', maxWidth: '26rem', margin: 0 }}>
                {t('home.subtitle')}
              </p>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.5 }}>
                  {t('home.tagline')}
                </p>
              </div>
            </div>
          </header>

          {/* 내 기록 */}
          {!user && (
            <div className="mt-4">
              <EmptyState message={t('home.signin')} />
              <button
                onClick={() => navigate('/login')}
                className="mt-4 flex items-center gap-1.5 hover:text-butter-primary transition-colors"
                style={{ fontSize: '12px', color: 'var(--color-butter-muted)' }}
              >
                <PenLine size={12} strokeWidth={1.5} />
                {t('home.signin.cta')}
              </button>
            </div>
          )}

          {user && entriesLoading && (
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

          {user && !entriesLoading && entriesError && (
            <p className="mt-12 font-serif italic" style={{ fontSize: '15px', color: 'var(--color-butter-muted)' }}>
              {entriesError}
            </p>
          )}

          {user && !entriesLoading && !entriesError && recentEntries.length === 0 && (
            <div className="mt-4">
              <EmptyState message={t('home.empty')} />
              <button
                onClick={() => navigate('/journal')}
                className="mt-4 flex items-center gap-1.5 hover:text-butter-primary transition-colors"
                style={{ fontSize: '12px', color: 'var(--color-butter-muted)' }}
              >
                <PenLine size={12} strokeWidth={1.5} />
                {t('home.write')}
              </button>
            </div>
          )}

          {user && !entriesLoading && !entriesError && recentEntries.length > 0 && (
            <div>
              {recentEntries.map((e, i) => (
                <MyEntryCard key={e.id} entry={e} index={i} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
