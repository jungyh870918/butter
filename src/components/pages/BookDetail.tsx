import { useLocale } from '../../hooks/useLocale';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Heart, BookOpen, Bookmark, MessageSquare, PenLine,
  Share2, Link, Check, Copy
} from 'lucide-react';
import { Book } from '../../types';
import { useBook } from '../../hooks/useBook';
import { useBooks } from '../../hooks/useBooks';
import { ErrorMessage, BookCoverImage, AvatarImage } from '../ui';
import { addToBookShelf } from '../../lib/api';
import { openExternal, publicBaseUrl } from '../../lib/native';
import { formatDate } from '../../lib/format';


// ══════════════════════════════════════════════════════════════════════════
// BOOK DETAIL SIDEBAR — 같은 작가 + 노트 유도 + 인용구
// ══════════════════════════════════════════════════════════════════════════
const BookDetailSidebar = ({ book, loading, locale }: { book: Book | null; loading: boolean; locale: string }) => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const author = book?.author ?? '';
  const { books: authorBooks, loading: authorLoading } = useBooks('All', author || undefined, locale === 'ko' ? 'ko' : undefined);
  const otherBooks = authorBooks.filter((b) => b.id !== book?.id).slice(0, 5);
  const quote = book ? ((locale === 'ko' && book.quoteKo) ? book.quoteKo : book.quote) : undefined;

  if (loading) return <div className="hidden lg:block lg:w-60 xl:w-64 shrink-0" />;

  // 같은 작가 책 목록만 표시 (A섹션) — 나머지는 여백의 미
  return (
    <aside className="flex flex-col gap-0 w-full">
      {!authorLoading && otherBooks.length > 0 && (
        <div>
          <p className="text-[9px] uppercase tracking-[0.2em] font-medium mb-4"
            style={{ fontFamily: "'Inter', sans-serif", color: 'var(--color-butter-muted)', opacity: 0.6 }}>
            {locale === 'ko' ? '같은 작가의 다른 책' : 'More by This Author'}
          </p>
          <div className="space-y-3">
            {otherBooks.map((b, i) => (
              <div key={b.id} className="flex gap-2.5 items-start cursor-pointer group"
                onClick={() => navigate(`/explore/${b.id}`)}>
                <span className="font-light leading-none mt-0.5 shrink-0 select-none w-4 text-right text-[0.7rem]"
                  style={{ fontFamily: "'Inter', sans-serif", color: 'var(--color-butter-muted)', opacity: 0.45 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium leading-snug group-hover:text-butter-primary transition-colors line-clamp-2"
                    style={{ fontFamily: "'Inter', sans-serif" }}>{b.title}</p>
                  <p className="text-[10px] font-light mt-0.5" style={{ fontFamily: "'Inter', sans-serif", color: 'var(--color-butter-muted)' }}>{b.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

// ── Skeleton 헬퍼 ──────────────────────────────────────────────────────────
const Sk = ({ w = '100%', h = 14, className = '' }: { w?: string | number; h?: number; className?: string }) => (
  <div className={`rounded animate-pulse ${className}`}
    style={{ width: w, height: h, background: 'var(--color-butter-accent)' }} />
);

// ── TagPill ────────────────────────────────────────────────────────────────
const TagPill = ({ label }: { label: string }) => (
  <span
    className="inline-block px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] font-medium"
    style={{ border: '0.5px solid var(--color-butter-primary)', color: 'var(--color-butter-primary)', background: 'transparent' }}
  >
    {label}
  </span>
);

// ══════════════════════════════════════════════════════════════════════════
export const BookDetail = () => {
  const { t, locale } = useLocale();
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { book, loading: bookLoading, enriching, error: bookError } = useBook(bookId);

  if (bookError) return (
    <div className="pt-24 flex items-center justify-center min-h-[60vh]">
      <ErrorMessage message={bookError || 'Book not found'} />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="min-h-screen bg-butter-bg">

      {/* Back */}
      <div className="px-4 md:px-8 lg:px-14 max-w-7xl mx-auto pt-16 md:pt-24 pb-4">
        <button onClick={() => navigate('/explore')} className="inline-flex items-center gap-2 text-butter-muted hover:text-butter-text transition-colors">
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span className="text-[11px] uppercase tracking-widest font-medium">{t('book.back')}</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          모바일 레이아웃 (md 미만)
          ══════════════════════════════════════════════ */}
      <div className="block md:hidden px-4 max-w-7xl mx-auto pb-0">
        {/* 커버 — 화면 너비의 50% */}
        <div className="w-1/2 mx-auto mb-5">
          <div className="aspect-[2/3] overflow-hidden rounded-sm" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.14)' }}>
            {bookLoading
              ? <div className="w-full h-full animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
              : <BookCoverImage src={book!.cover} alt={book!.title} className="w-full h-full object-cover" />
            }
          </div>
        </div>

        {/* 제목 + 저자 */}
        {!bookLoading && book && (
          <div className="mb-5 text-center">
            <h1 className="text-[1.6rem] font-sans font-bold leading-[1.1] tracking-[-0.02em] mb-2 break-keep" style={{ color: 'var(--color-butter-text)' }}>
              {book.title}
            </h1>
            {(book.tags || []).length > 0 && (
              <p className="text-[11px] text-butter-muted font-light mb-2">{book.tags!.join(' · ')}</p>
            )}
            {book.publishedDate && (
              <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted opacity-60">
                ED. {new Date(book.publishedDate).getFullYear()}
              </p>
            )}
          </div>
        )}

        {/* 보관 + 공유 버튼 */}
        {!bookLoading && book && (
          <MobileActions book={book} bookId={bookId!} locale={locale} t={t} />
        )}

        {/* 같은 작가 사이드바 */}
        {!bookLoading && book && (
          <div className="mt-6 pb-6" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
            <BookDetailSidebar book={book} loading={bookLoading} locale={locale} />
          </div>
        )}

        {/* 본문 내용 (이 책에 대해, 배경 정보, 메타, CTA, 카드) */}
        <div className="mt-6">
          <RightColumn book={book} loading={bookLoading} enriching={enriching} />
        </div>

        {/* 같은 장르 */}
        {!bookLoading && book && (
          <SameCollectionSection currentBookId={bookId!} tags={book.tags || []} locale={locale} />
        )}
      </div>

      {/* ══════════════════════════════════════════════
          데스크탑 레이아웃 (md 이상) — 기존 2단 유지
          ══════════════════════════════════════════════ */}
      <div className="hidden md:block px-8 lg:px-14 max-w-7xl mx-auto pb-0">
        <div className="grid grid-cols-12 gap-x-10 lg:gap-x-14 items-start">
          <div className="col-span-5 lg:col-span-4">
            <LeftColumn book={book} bookId={bookId!} loading={bookLoading} />
            <div className="mt-10">
              <BookDetailSidebar book={book} loading={bookLoading} locale={locale} />
            </div>
          </div>
          <div className="col-span-7 lg:col-span-8">
            <RightColumn book={book} loading={bookLoading} enriching={enriching} />
          </div>
        </div>
      </div>

      {/* 하단: 같은 장르의 다른 책 (데스크탑 전용) */}
      {!bookLoading && book && (
        <div className="hidden md:block px-8 lg:px-14 max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-x-10 lg:gap-x-14">
            <div className="col-span-5 lg:col-span-4" />
            <div className="col-span-7 lg:col-span-8">
              <SameCollectionSection currentBookId={bookId!} tags={book.tags || []} locale={locale} />
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// MOBILE ACTIONS — 모바일 전용 보관/공유 버튼
// ══════════════════════════════════════════════════════════════════════════
const MobileActions = ({ book, bookId, locale, t }: {
  book: Book; bookId: string; locale: string; t: (k: string) => string;
}) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [shelved, setShelved] = useState(false);
  const [shelving, setShelving] = useState(false);
  const [copied, setCopied] = useState(false);
  // 책 정보 공유용 링크 — 개인 기록이 아니라 책 소개 페이지를 가리킨다.
  const pageUrl = `${publicBaseUrl()}/share/${bookId}`;

  const handleShelf = async () => {
    if (shelved || shelving) return;
    setShelving(true);
    try {
      await addToBookShelf({ bookId, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover });
      setShelved(true);
    } catch { setShelved(true); } finally { setShelving(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2.5">
      {/* 읽기 시작 */}
      <button
        onClick={() => {
          const query = encodeURIComponent(`${book.title} ${book.author}`);
          const isKo = /[가-힣]/.test(book.title + book.author);
          void openExternal(isKo ? `https://search.kyobobook.co.kr/search?keyword=${query}` : `https://www.amazon.com/s?k=${query}`);
        }}
        className="w-full py-3.5 font-semibold text-[12px] uppercase tracking-[0.14em] text-white text-center"
        style={{ background: 'var(--color-butter-primary)' }}
      >
        {t('book.start')}
      </button>
      {/* 보관 + 공유 + 기록 */}
      <div className="flex gap-2">
        <button onClick={handleShelf} disabled={shelving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-all"
          style={{ border: '1px solid var(--color-butter-rule)', color: shelved ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)', background: 'transparent' }}>
          <Heart size={13} strokeWidth={1.5} fill={shelved ? 'currentColor' : 'none'} />
          {shelving ? '…' : shelved ? t('book.add') + ' ✓' : t('book.add')}
        </button>
        <button onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-all"
          style={{ border: '1px solid var(--color-butter-rule)', color: 'var(--color-butter-muted)', background: 'transparent' }}>
          {copied ? <><Check size={12} /> {t('book.copied')}</> : <><Share2 size={12} strokeWidth={1.5} /> {t('book.share')}</>}
        </button>
        <button
          onClick={() => navigate('/journal', { state: { bookId, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover } })}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium transition-all"
          style={{ border: '1px solid var(--color-butter-rule)', color: 'var(--color-butter-muted)', background: 'transparent' }}>
          {t('book.write')}
        </button>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// LEFT COLUMN — 커버 + 액션(보관 / 책 정보 공유)
// ══════════════════════════════════════════════════════════════════════════
const LeftColumn = ({ book, bookId, loading }: { book: Book | null; bookId: string; loading: boolean }) => {
  const { t } = useLocale();
  const [liked, setLiked] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  // 책 소개 페이지 링크. 개인 감상은 포함되지 않는다.
  const pageUrl = `${publicBaseUrl()}/share/${bookId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* 커버 */}
      <div className="aspect-[2/3] overflow-hidden mb-3 rounded-sm"
        style={{ boxShadow: '0 4px 32px rgba(0,0,0,0.12)' }}>
        {loading
          ? <div className="w-full h-full animate-pulse" style={{ background: 'var(--color-butter-accent)' }} />
          : <BookCoverImage src={book!.cover} alt={book!.title} className="w-full h-full object-cover" />
        }
      </div>

      {/* 태그 — 커버 바로 아래 일반 텍스트 */}
      {!loading && (book?.tags || []).length > 0 && (
        <p className="text-[11px] text-butter-muted font-light mb-2">
          {book!.tags!.join(' · ')}
        </p>
      )}

      {/* EDITION */}
      <div className="space-y-1 mb-5">
        {loading ? (
          <><Sk w="70%" h={9} /><Sk w="55%" h={9} /></>
        ) : (
          <>
            <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted">
              {book!.publishedDate
                ? `ED. ${new Date(book!.publishedDate).getFullYear()}`
                : 'EDITION: STANDARD'}
            </p>
          </>
        )}
      </div>

      {/* 보관 + 책 정보 공유 */}
      <div className="flex gap-2">
        <button
          onClick={() => setLiked(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all ${
            liked ? 'text-red-500 bg-red-50' : 'text-butter-muted hover:text-butter-text'
          }`}
          style={!liked ? { background: 'rgba(0,0,0,0.04)' } : {}}
        >
          <Heart size={13} strokeWidth={1.5} fill={liked ? 'currentColor' : 'none'} />
          {t('book.save')}
        </button>
        <button
          onClick={() => setLinkOpen(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-all ${
            linkOpen ? 'text-butter-primary' : 'text-butter-muted hover:text-butter-text'
          }`}
          style={{ background: linkOpen ? 'rgba(107,82,0,0.06)' : 'rgba(0,0,0,0.04)' }}
        >
          <Share2 size={13} strokeWidth={1.5} />
          {t('book.share')}
        </button>
      </div>

      {/* 링크 패널 */}
      <AnimatePresence>
        {linkOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <div className="pt-2 pb-1 mt-2">
              <p className="text-[10px] uppercase tracking-widest text-butter-muted mb-2 flex items-center gap-1">
                <Link size={9} /> {t('book.share.link')}
              </p>
              <div className="flex gap-2">
                <input readOnly value={pageUrl} className="flex-1 bg-butter-surface rounded px-2.5 py-1.5 text-[11px] font-mono truncate focus:outline-none text-butter-muted" onFocus={(e) => e.target.select()} />
                <button onClick={handleCopy} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-medium transition-all ${copied ? 'bg-green-500 text-white' : 'bg-butter-primary text-white'}`}>
                  {copied ? <><Check size={10} /> {t('book.copied')}</> : <><Copy size={10} /> {t('book.copy')}</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// RIGHT COLUMN — 제목/설명/메타그리드/CTA/감상
// ══════════════════════════════════════════════════════════════════════════
const DESCRIPTION_LIMIT = 500;
const DESCRIPTION_LIMIT_KO = 150;

const RightColumn = ({ book, loading, enriching = false }: {
  book: Book | null; loading: boolean; enriching?: boolean;
}) => {
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const [descExpanded, setDescExpanded] = useState(false);
  const [shelved, setShelved] = useState(false);
  const [shelving, setShelving] = useState(false);
  const { bookId } = useParams<{ bookId: string }>();

  useEffect(() => { setDescExpanded(false); }, [book?.id]);

  const handleAddToShelf = async () => {
    if (!book || shelved || shelving) return;
    setShelving(true);
    try {
      await addToBookShelf({ bookId: bookId!, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover });
      setShelved(true);
    } catch { setShelved(true); } finally { setShelving(false); }
  };

  const description = book?.description || '';
  const limit = locale === 'ko' ? DESCRIPTION_LIMIT_KO : DESCRIPTION_LIMIT;
  const isTruncated = description.length > limit;
  const displayedDescription = isTruncated && !descExpanded
    ? description.slice(0, limit).trimEnd() + '…' : description;

  const quote             = book ? ((locale === 'ko' && book.quoteKo)             ? book.quoteKo             : book.quote)             : undefined;
  const authorNote        = book ? ((locale === 'ko' && book.authorNoteKo)        ? book.authorNoteKo        : book.authorNote)        : undefined;
  const historicalContext = book ? ((locale === 'ko' && book.historicalContextKo) ? book.historicalContextKo : book.historicalContext) : undefined;

  return (
    <div className="flex-1 min-w-0">

      {/* 제목 — 패딩 없이 왼쪽 끝 */}
      {loading
        ? <div className="mb-3 space-y-3"><Sk w="85%" h={44} /><Sk w="55%" h={44} /></div>
        : <h1 className="text-[1.6rem] md:text-[2.6rem] lg:text-[3.8rem] font-sans font-bold leading-[1.05] tracking-[-0.02em] mb-4 md:mb-8 break-keep">
            {book!.title}
          </h1>
      }

      {/* 제목 아래 요소 전체 — 좌측 패딩으로 오른쪽 밀기 */}
      <div className="pl-0 md:pl-8">

      {/* ABOUT THIS ENTRY */}
      {!loading && (
        <p className="text-[13px] font-medium text-butter-text mb-2">
          {locale === 'ko' ? '이 책에 대해' : 'About this entry'}
        </p>

      )}

      {/* 설명 */}
      <div className="mb-12">
        {loading ? (
          <div className="space-y-2.5">
            {[100, 95, 100, 88, 60].map((w, i) => <Sk key={i} w={`${w}%`} h={14} />)}
          </div>
        ) : (
          <>
            <p className="text-[11px] leading-[1.85] text-butter-muted font-normal">
              {displayedDescription}
            </p>
            {isTruncated && (
              <button onClick={() => setDescExpanded(p => !p)} className="mt-4 text-[11px] font-medium uppercase tracking-widest text-butter-primary hover:opacity-70 transition-opacity">
                {descExpanded ? t('book.readless') : t('book.readmore')}
              </button>
            )}
          </>
        )}
      </div>

      {/* 배경 정보 — 이 책에 대해 바로 아래 */}
      {!loading && !enriching && historicalContext && (
        <div className="mb-10">
          <p className="text-[13px] font-medium text-butter-text mb-2">
            {locale === 'ko' ? '배경 정보' : 'Historical Context'}
          </p>
          <p className="text-[11px] leading-[1.85] text-butter-muted font-normal">
            {historicalContext}
          </p>
        </div>
      )}
      {(loading || enriching) && (
        <div className="mb-10 space-y-2">
          <Sk w={100} h={13} /><Sk w="95%" h={11} /><Sk w="80%" h={11} />
        </div>
      )}

      {/* 메타 그리드 — AUTHOR / PUBLISHED / GENRE / DURATION */}
      {!loading ? (
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-12 py-9"
          style={{ borderTop: '0.5px solid rgba(0,0,0,0.07)', borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted mb-1">{locale === 'ko' ? '저자' : 'AUTHOR'}</p>
            <p className="text-[13px] font-medium text-butter-text">{book!.author}</p>
          </div>
          {book!.publishedDate && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted mb-1">{locale === 'ko' ? '출판' : 'PUBLISHED'}</p>
              <p className="text-[13px] font-medium text-butter-text">{book!.publishedDate}</p>
            </div>
          )}
          {(book!.tags || []).length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted mb-1">{locale === 'ko' ? '장르' : 'GENRE'}</p>
              <p className="text-[13px] font-medium text-butter-text uppercase">{book!.tags![0]}</p>
            </div>
          )}
          {book!.pageCount && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted mb-1">{locale === 'ko' ? '분량' : 'DURATION'}</p>
              <p className="text-[13px] font-medium text-butter-text">{book!.pageCount} {t('book.pages')}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-8 h-24 animate-pulse rounded" style={{ background: 'var(--color-butter-accent)' }} />
      )}







      {/* CTA 버튼 — 데스크탑 전용 (모바일은 MobileActions 사용) */}
      {!loading && (
        <div className="hidden md:flex flex-row gap-3 mt-2">
          <button
            onClick={() => {
              if (!book) return;
              const query = encodeURIComponent(`${book.title} ${book.author}`);
              const isKo = /[가-힣]/.test((book.title || '') + (book.author || ''));
              const url = isKo
                ? `https://search.kyobobook.co.kr/search?keyword=${query}`
                : `https://www.amazon.com/s?k=${query}`;
              void openExternal(url);
            }}
            className="flex-1 py-3.5 font-semibold text-[12px] uppercase tracking-[0.14em] text-white hover:brightness-105 transition-all text-center"
            style={{ background: 'var(--color-butter-primary)' }}
          >
            {t('book.start')}
          </button>
          <button
            onClick={handleAddToShelf}
            disabled={shelving || !book}
            className="flex-1 py-3.5 font-semibold text-[12px] uppercase tracking-[0.14em] transition-all cursor-pointer disabled:cursor-default text-center"
            style={{ border: '1px solid rgba(0,0,0,0.2)', color: shelved ? 'var(--color-butter-primary)' : 'var(--color-butter-text)', background: 'transparent' }}
          >
            {shelving
              ? <span className="inline-block w-3 h-3 rounded-full border-2 animate-spin align-middle" style={{ borderColor: 'var(--color-butter-accent)', borderTopColor: 'var(--color-butter-primary)' }} />
              : shelved ? (t('book.add') + ' ✓') : t('book.add')
            }
          </button>
          <button
            onClick={() => book && navigate('/journal', { state: { bookId: book.id, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover } })}
            className="flex-1 py-3.5 font-semibold text-[12px] uppercase tracking-[0.14em] transition-colors text-center"
            style={{ border: '1px solid rgba(0,0,0,0.2)', color: 'var(--color-butter-muted)', background: 'transparent' }}
          >
            {t('book.write')}
          </button>
        </div>
      )}

      {/* ChapterCards — pl wrapper 밖, 제목과 동일한 좌측 정렬 */}
      </div>{/* /pl wrapper */}

      {!loading && book && (
        <div className="mt-10 md:mt-14">
          <ChapterCards book={book} />
        </div>
      )}

    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// CHAPTER CARDS — 하단 회색 3개 섹션
// ══════════════════════════════════════════════════════════════════════════
const ChapterCards = ({ book }: { book: Book }) => {
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const { bookId } = useParams<{ bookId: string }>();

  const historicalContext = (locale === 'ko' && book.historicalContextKo)
    ? book.historicalContextKo : book.historicalContext;

  return (
    <div className="pb-6 md:pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

        {/* I — 독서 여정 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.4 }}
          onClick={() => navigate('/journal', { state: { bookId: book.id, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover } })}
          className="cursor-pointer group"
          style={{ background: 'var(--color-butter-surface)', padding: '1.2rem', minHeight: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* 상단: 아이콘 + 라벨 */}
          <div className="flex items-center gap-2">
            <PenLine size={16} strokeWidth={1.5} className="text-butter-muted shrink-0" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted">
              {locale === 'ko' ? 'I — 독서 여정' : 'I — Reading Journey'}
            </p>
          </div>
          {/* 하단: 제목 + 내용 */}
          <div>
            <h3 className="font-sans text-[1rem] font-medium leading-snug mb-3 text-butter-text group-hover:text-butter-primary transition-colors">
              {locale === 'ko' ? '감상을 기록하다' : 'Record Your Reading'}
            </h3>
            <p className="text-[12px] text-butter-muted leading-[1.75] font-light">
              {locale === 'ko'
                ? '이 책이 당신에게 남긴 온도와 문장 사이의 침묵을 기록해두세요.'
                : 'Capture the temperature this book left — the silence between its lines.'}
            </p>
          </div>
        </motion.div>

        {/* II — 아카이브 노트 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.4 }}
          style={{ background: 'var(--color-butter-faint)', padding: '1.2rem', minHeight: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* 상단: 아이콘 + 라벨 */}
          <div className="flex items-center gap-2">
            <MessageSquare size={16} strokeWidth={1.5} className="text-butter-muted shrink-0" />
            <p className="text-[9px] uppercase tracking-[0.2em] text-butter-muted">
              {locale === 'ko' ? 'II — 아카이브 노트' : 'II — Archive Note'}
            </p>
          </div>
          {/* 하단: 내용 */}
          <div>

            {/* 저자 한마디 — 배경정보와 동일 스타일: 제목 굵고 크게, 내용 얇고 작게 */}
            {(book.quote || book.quoteKo) && (
              <div className="mb-5">
                <h3 className="font-sans text-[1rem] font-semibold leading-snug mb-2 text-butter-text">
                  {t('book.author_note')}
                </h3>
                <blockquote className="text-[12px] font-light leading-[1.85] text-butter-muted italic mb-1">
                  "{(locale === 'ko' && book.quoteKo) ? book.quoteKo : book.quote}"
                </blockquote>
                <p className="text-[11px] text-butter-muted font-medium">— {book.author}</p>
              </div>
            )}

            {/* 내용 없을 때 fallback */}
            {!book.quote && !book.quoteKo && (
              <p className="text-[12px] font-light leading-[1.85] text-butter-muted">
                {locale === 'ko' ? '이 책에 대한 기록을 남겨보세요.' : 'Write your own note on this book.'}
              </p>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════

// SAME COLLECTION
// ══════════════════════════════════════════════════════════════════════════
const SameCollectionSection = ({ currentBookId, tags, locale }: { currentBookId: string; tags: string[]; locale: string }) => {
  const navigate = useNavigate();
  const lang = locale === 'ko' ? 'ko' : undefined;
  const { books, loading } = useBooks(tags[0] || 'All', undefined, lang);
  const related = books.filter((b) => b.id !== currentBookId).slice(0, 3);
  if (loading || related.length === 0) return null;

  return (
    <section className="pb-16 md:pb-24 pt-8 md:pt-12" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 'clamp(1rem, 2vw, 1.4rem)', letterSpacing: '-0.01em', color: 'var(--color-butter-text)', marginBottom: '1.25rem' }}>
        {locale === 'ko' ? '같은 장르의 다른 책' : 'From the Same Genre'}
      </h2>
      <div className="grid grid-cols-3 gap-x-3 md:gap-x-8 gap-y-6 md:gap-y-10">
        {related.map((book, i) => (
          <motion.article key={book.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="group cursor-pointer min-w-0"
            onClick={() => navigate(`/explore/${book.id}`)}>
            <div className="aspect-[2/3] mb-2 overflow-hidden rounded-sm transition-all duration-500 group-hover:-translate-y-1"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09)' }}>
              <BookCoverImage src={book.cover} alt={book.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
            </div>
            <h3 className="font-sans text-[0.7rem] md:text-[0.95rem] leading-snug mb-0.5 group-hover:text-butter-primary transition-colors duration-300 line-clamp-2">
              {book.title}
            </h3>
            <p className="text-[0.6rem] md:text-[12px] text-butter-muted italic font-light line-clamp-1">{book.author}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
