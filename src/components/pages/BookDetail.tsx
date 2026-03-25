import { useLocale } from '../../hooks/useLocale';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Heart, BookOpen, Bookmark,
  Share2, Link, Check, Copy, MessageSquare, PenLine
} from 'lucide-react';
import { Book, Reflection } from '../../types';
import { useBook } from '../../hooks/useBook';
import { useBooks } from '../../hooks/useBooks';
import { useReflections } from '../../hooks/useReflections';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage, AvatarImage } from '../ui';
import { formatDate } from '../../lib/format';

const TagPill = ({ label }: { label: string }) => (
  <span
    className="inline-block px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] font-bold rounded-sm"
    style={{ background: 'var(--color-butter-primary)', color: '#ffffff' }}
  >
    {label}
  </span>
);

export const BookDetail = () => {
  const { t } = useLocale();
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { book, loading: bookLoading, error: bookError } = useBook(bookId);
  const { reflections, loading: refLoading, error: refError } = useReflections({ bookId });

  if (bookLoading) return <div className="pt-24 flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;
  if (bookError || !book) return <div className="pt-24 flex items-center justify-center min-h-[60vh]"><ErrorMessage message={bookError || 'Book not found'} /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="min-h-screen bg-butter-bg">
      <div className="px-6 md:px-12 max-w-6xl mx-auto pt-20 md:pt-24 pb-5">
        <button onClick={() => navigate('/explore')} className="inline-flex items-center gap-2 text-butter-muted hover:text-butter-text transition-colors">
          <ArrowLeft size={14} strokeWidth={1.5} />
          <span className="text-[11px] uppercase tracking-widest font-medium">{t('book.back')}</span>
        </button>
      </div>

      <div className="px-6 md:px-12 max-w-6xl mx-auto pb-16">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16 lg:gap-20">
          <LeftColumn book={book} bookId={bookId!} />
          <RightColumn book={book} reflections={reflections} refLoading={refLoading} refError={refError} />
        </div>
      </div>

      {/* {t('book.collection')} */}
      <SameCollectionSection currentBookId={bookId!} tags={book.tags || []} />
    </motion.div>
  );
};

const LeftColumn = ({ book, bookId }: { book: Book; bookId: string }) => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [linkOpen, setLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const pageUrl = `${window.location.origin}/share/${bookId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="md:w-56 lg:w-64 shrink-0">
      <div className="md:sticky md:top-24 space-y-5">
        {/* 커버 */}
        <div className="aspect-[2/3] rounded-sm overflow-hidden bg-butter-surface"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}>
          <BookCoverImage src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        </div>

        {/* CTA */}
        <div className="space-y-2">
          <button className="w-full flex items-center justify-center gap-2 bg-butter-primary text-white py-3 rounded font-medium text-[13px] tracking-wide hover:brightness-105 transition-all">
            <BookOpen size={14} strokeWidth={2} />
            {t('book.start')}
          </button>
          <button className="w-full flex items-center justify-center gap-2 text-butter-muted py-3 rounded text-[13px] font-medium hover:text-butter-text transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)' }}>
            <Bookmark size={14} strokeWidth={1.5} />
            {t('book.add')}
          </button>
          <button
            onClick={() => navigate('/journal', {
              state: {
                bookId: book.id,
                bookTitle: book.title,
                bookAuthor: book.author,
                bookCover: book.cover,
              }
            })}
            className="w-full flex items-center justify-center gap-2 text-butter-muted py-3 rounded text-[13px] font-medium hover:text-butter-text transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)' }}
          >
            <PenLine size={14} strokeWidth={1.5} />
            {t('book.write')}
          </button>
        </div>

        {/* 액션 */}
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
              <div className="pt-1 pb-2">
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

        {/* 메타 */}
        <div className="pt-3 space-y-3.5" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {book.publishedDate && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest text-butter-muted">{t('book.published')}</span>
              <span className="text-[12px] font-serif italic text-butter-text/80">
                {book.publishedDate}
              </span>
            </div>
          )}
          {book.pageCount && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest text-butter-muted">{t('book.length')}</span>
              <span className="text-[12px] font-serif italic text-butter-text/80">
                {book.pageCount} {t('book.pages')}
              </span>
            </div>
          )}
          {(book.tags || []).length > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest text-butter-muted">{t('book.genre')}</span>
              <span className="text-[12px] font-light text-butter-text text-right max-w-[60%] line-clamp-1">
                {(book.tags || []).slice(0, 1)[0]}
              </span>
            </div>
          )}
          {book.rating > 0 && (
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] uppercase tracking-widest text-butter-muted">{t('book.rating')}</span>
              <span className="text-sm font-serif italic">{book.rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DESCRIPTION_LIMIT = 500;

const RightColumn = ({ book, reflections, refLoading, refError }: {
  book: Book; reflections: Reflection[]; refLoading: boolean; refError: string;
}) => {
  const { locale, t } = useLocale();
  const [descExpanded, setDescExpanded] = useState(false);
  const description = book.description || '';
  const isTruncated = description.length > DESCRIPTION_LIMIT;
  const displayedDescription = isTruncated && !descExpanded
    ? description.slice(0, DESCRIPTION_LIMIT).trimEnd() + '…'
    : description;

  // locale에 따라 EN/KO 필드 자동 선택
  // KO 필드가 없으면 EN fallback
  const quote             = (locale === 'ko' && book.quoteKo)             ? book.quoteKo             : book.quote;
  const authorNote        = (locale === 'ko' && book.authorNoteKo)        ? book.authorNoteKo        : book.authorNote;
  const historicalContext = (locale === 'ko' && book.historicalContextKo) ? book.historicalContextKo : book.historicalContext;

  return (
    <div className="flex-1 min-w-0">
      {/* 태그 */}
      {(book.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {(book.tags || []).map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      )}

      {/* 제목 */}
      <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif font-light leading-[1.1] tracking-tight mb-3">
        {book.title}
      </h1>

      {/* 저자 */}
      <p className="text-lg font-serif italic text-butter-muted mb-8 font-light">
        by {book.author}
      </p>

      {/* 구분 */}
      <div className="mb-8" style={{ height: '1px', background: 'rgba(0,0,0,0.07)' }} />

      {/* Description */}
      <div className="mb-12">
        <p className="text-[15px] leading-[1.9] text-butter-text/75 font-light drop-cap">
          {displayedDescription}
        </p>
        {isTruncated && (
          <button onClick={() => setDescExpanded(p => !p)} className="mt-4 text-[11px] font-medium uppercase tracking-widest text-butter-primary hover:opacity-70 transition-opacity">
            {descExpanded ? t('book.readless') : t('book.readmore')}
          </button>
        )}
      </div>

      {/* {t('book.author_note')} (quote) */}
      {quote && (
        <div className="mb-12 relative pl-6" style={{ borderLeft: '2px solid rgba(107,82,0,0.3)' }}>
          <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-butter-primary/80 mb-4">
            {t('book.author_note')}
          </p>
          <blockquote className="text-xl md:text-2xl font-serif italic leading-relaxed text-butter-text/80 font-light mb-6">
            "{quote}"
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0"
              style={{ background: 'var(--color-butter-surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}>
              <AvatarImage
                src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(book.author)}`}
                alt={book.author}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[13px] font-medium">{book.author}</p>
              {authorNote && (
                <p className="text-[11px] text-butter-muted italic font-light line-clamp-1">{authorNote}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* {t('book.about')} (quote 없을 때) */}
      {authorNote && !quote && (
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-butter-primary/80 mb-3">{t('book.about')}</p>
          <p className="text-[15px] leading-[1.85] text-butter-muted font-light">{authorNote}</p>
        </div>
      )}

      {/* {t('book.historical')} */}
      {historicalContext && (
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-butter-primary/80 mb-3">{t('book.historical')}</p>
          <p className="text-[15px] leading-[1.85] text-butter-muted font-light">{historicalContext}</p>
        </div>
      )}

      {/* 구분 */}
      <div className="mb-10" style={{ height: '1px', background: 'rgba(0,0,0,0.07)' }} />

      {/* {t('book.reflections')} */}
      <div>
        <div className="flex items-center gap-2 mb-8">
          <MessageSquare size={13} strokeWidth={1.5} className="text-butter-muted" />
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-butter-muted">
            Community Reflections
          </p>
        </div>

        {refLoading && <LoadingSpinner />}
        {!refLoading && refError && <ErrorMessage message={refError} />}
        {!refLoading && !refError && reflections.length === 0 && (
          <p className="text-[12px] uppercase tracking-widest text-butter-muted/60 text-center py-8">
            {t('book.no_reflections')}
          </p>
        )}
        {!refLoading && !refError && reflections.length > 0 && (
          <div className="space-y-8">
            {reflections.map((reflection, i) => (
              <div key={reflection.id} style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : 'none', paddingTop: i > 0 ? '2rem' : 0 }}>
                <div className="flex items-center gap-3 mb-3">
                  <AvatarImage src={reflection.authorAvatar} alt={reflection.author} className="w-8 h-8 rounded-full opacity-90" />
                  <div>
                    <p className="text-[13px] font-medium">{reflection.author}</p>
                    <p className="text-[10px] text-butter-muted tracking-wide">{formatDate(reflection.date)}</p>
                  </div>
                </div>
                <h4 className="font-serif text-lg font-light mb-2">{reflection.title}</h4>
                <p className="text-[13px] text-butter-muted line-clamp-3 font-light leading-[1.8]">{reflection.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── From the Same Collection ───────────────────────────────────────────────

const SameCollectionSection = ({
  currentBookId,
  tags,
}: {
  currentBookId: string;
  tags: string[];
}) => {
  const navigate = useNavigate();
  const tag = tags[0] ?? '';
  const { books, loading } = useBooks(tag || 'All');

  const related = books
    .filter((b) => b.id !== currentBookId)
    .slice(0, 3);

  if (loading || related.length === 0) return null;

  return (
    <section
      className="px-6 md:px-12 max-w-6xl mx-auto pb-24"
      style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '3.5rem' }}
    >
      <h2 className="font-serif text-2xl md:text-3xl italic font-light mb-10 text-butter-text">
        From the Same Collection
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-10">
        {related.map((book, i) => (
          <motion.article
            key={book.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="group cursor-pointer"
            onClick={() => navigate(`/explore/${book.id}`)}
          >
            <div
              className="aspect-[2/3] mb-4 overflow-hidden rounded-sm transition-all duration-500 group-hover:-translate-y-1"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.09)' }}
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
            <p className="text-[12px] text-butter-muted italic font-light line-clamp-1">
              {book.author}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
