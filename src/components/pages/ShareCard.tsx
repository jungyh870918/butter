import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { getBook, getBookEnrich } from '../../lib/api';
import { LoadingSpinner, ErrorMessage, BookCoverImage } from '../ui';
import type { Book } from '../../types';

const T = {
  bg: '#faf8f4', surface: '#f5f2eb', text: '#1c1a17',
  muted: '#5e574f', primary: '#6b5200', rule: 'rgba(0,0,0,0.07)', accent: '#e8e3d6',
};

export const ShareCard = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate   = useNavigate();
  const [book, setBook]           = useState<Book | null>(null);
  const [loading, setLoading]     = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isKo = (b: Book | null) =>
    b ? /[\uAC00-\uD7A3]/.test((b.title || '') + (b.author || '')) : false;
  const ko = isKo(book);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true); setError(''); setBook(null);
    getBook(bookId)
      .then((base: Book) => {
        setBook(base); setLoading(false);
        if (!base.title || !base.author) return;
        setEnriching(true);
        getBookEnrich(bookId, base.title, base.author)
          .then((extra: Partial<Book>) => setBook(prev => prev ? { ...prev, ...extra } : prev))
          .catch(() => {})
          .finally(() => setEnriching(false));
      })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [bookId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner />
    </div>
  );
  if (error || !book) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ErrorMessage message={error || 'Book not found'} />
    </div>
  );

  const desc  = book.description ? book.description.slice(0, 220).trimEnd() + (book.description.length > 220 ? '…' : '') : null;
  const quote = (ko && book.quoteKo ? book.quoteKo : book.quote) ?? null;
  const displayText = showQuote && quote ? quote : desc;
  const historicalCtx = (ko && book.historicalContextKo) ? book.historicalContextKo : book.historicalContext;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── 헤더 ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '1.2rem 1rem 0.75rem' : '1.5rem 1.5rem 0.75rem',
        maxWidth: '780px', margin: '0 auto' }}>
        <div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em',
            color: T.text, cursor: 'pointer', fontStyle: 'italic' }} onClick={() => navigate('/')}>
            Butter
          </p>
          <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: T.muted, opacity: 0.5, marginTop: '0.2rem' }}>
            {ko ? '버터에서 공유됨' : 'Shared from Butter'}
          </p>
        </div>
        <button onClick={() => navigate(`/explore/${bookId}`)}
          style={{ fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: T.primary, opacity: 0.7,
            background: 'none', border: `1px solid ${T.primary}`,
            padding: '0.3rem 0.75rem', cursor: 'pointer', fontFamily: 'inherit' }}>
          {ko ? 'BUTTER 열기' : 'OPEN BUTTER'}
        </button>
      </header>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: '780px', margin: '0 auto',
          padding: isMobile ? '1rem 1rem 0' : '1.5rem 1.5rem 0' }}>

        {/* ── 카드 ── */}
        <div style={{ background: '#fff', border: `1px solid ${T.rule}`, overflow: 'hidden' }}>

          {isMobile ? (
            /* ── 모바일: 세로 단일 컬럼 ── */
            <div>
              {/* 커버 상단 — 가운데 정렬, 컴팩트 */}
              <div style={{ background: T.surface, display: 'flex', justifyContent: 'center',
                alignItems: 'center', padding: '2rem 2rem 1.5rem' }}>
                <div style={{ width: '42%', aspectRatio: '2/3', overflow: 'hidden',
                  boxShadow: '4px 8px 28px rgba(0,0,0,0.18)' }}>
                  <BookCoverImage src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                </div>
              </div>
              {/* 내용 */}
              <div style={{ padding: '1.4rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.24em',
                    textTransform: 'uppercase', color: T.primary, opacity: 0.65, marginBottom: '0.4rem' }}>
                    {ko ? '책 세부내용 공유' : 'Book Detail Share'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: T.muted, opacity: 0.55 }}>
                      {new Date().toLocaleDateString(ko ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {(book.tags || []).length > 0 && (
                      <><span style={{ width: 1, height: '0.6rem', background: T.rule, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: T.muted, opacity: 0.45 }}>{book.tags![0]}</span></>
                    )}
                  </div>
                </div>
                {displayText && (
                  <div>
                    <div style={{ border: `1px solid ${T.rule}`, padding: '1rem 1.1rem',
                      position: 'relative', minHeight: '70px' }}>
                      <span style={{ position: 'absolute', top: '0.4rem', left: '0.7rem',
                        fontSize: '1.6rem', lineHeight: 1, color: T.accent,
                        fontFamily: 'Georgia, serif', userSelect: 'none', opacity: 0.8 }}>"</span>
                      <p style={{ fontSize: '0.82rem', fontWeight: 300, lineHeight: 1.82,
                        color: T.text, opacity: 0.82, paddingTop: '0.75rem', fontStyle: 'italic' }}>
                        {displayText}
                      </p>
                    </div>
                    {quote && !enriching && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                        <button onClick={() => setShowQuote(v => !v)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.14em',
                            textTransform: 'uppercase', color: showQuote ? T.primary : T.muted,
                            opacity: showQuote ? 0.8 : 0.5, background: 'none', border: 'none',
                            cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%',
                            border: `1px solid ${showQuote ? T.primary : T.muted}`,
                            background: showQuote ? T.primary : 'transparent', display: 'inline-block', flexShrink: 0 }} />
                          {showQuote ? (ko ? '책 설명 보기' : 'Show description') : (ko ? '저자 인용구 보기' : 'Show quote')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', fontWeight: 300, fontStyle: 'italic',
                  color: T.muted, opacity: 0.7 }}>
                  {book.author}{book.title && <span style={{ opacity: 0.55 }}> · 『{book.title}』</span>}
                </p>
              </div>
            </div>
          ) : (
            /* ── 데스크탑: 좌우 2단 ── */
            <div style={{ display: 'flex', flexDirection: 'row', minHeight: '380px' }}>
              {/* 좌 — 커버 */}
              <div style={{ width: '36%', flexShrink: 0, background: T.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '2.5rem 2rem', position: 'relative' }}>
                <div style={{ width: '72%', aspectRatio: '2/3', overflow: 'hidden',
                  boxShadow: '4px 8px 32px rgba(0,0,0,0.2)' }}>
                  <BookCoverImage src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                </div>
              </div>
              {/* 우 — 내용 */}
              <div style={{ flex: 1, padding: '2rem 2rem 2rem 2.2rem',
                display: 'flex', flexDirection: 'column', gap: '1.2rem', minWidth: 0 }}>
                <div>
                  <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.24em',
                    textTransform: 'uppercase', color: T.primary, opacity: 0.65, marginBottom: '0.5rem' }}>
                    {ko ? '책 세부내용 공유' : 'Book Detail Share'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: T.muted, opacity: 0.6 }}>
                      {new Date().toLocaleDateString(ko ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    {(book.tags || []).length > 0 && (
                      <><span style={{ width: 1, height: '0.65rem', background: T.rule, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.14em',
                        textTransform: 'uppercase', color: T.muted, opacity: 0.5 }}>{book.tags![0]}</span></>
                    )}
                  </div>
                </div>
                {displayText && (
                  <div>
                    <div style={{ border: `1px solid ${T.rule}`, padding: '1.1rem 1.2rem 1rem',
                      position: 'relative', minHeight: '80px' }}>
                      <span style={{ position: 'absolute', top: '0.5rem', left: '0.8rem',
                        fontSize: '1.8rem', lineHeight: 1, color: T.accent,
                        fontFamily: 'Georgia, serif', userSelect: 'none', opacity: 0.8 }}>"</span>
                      <AnimatePresence mode="wait">
                        <motion.p key={showQuote ? 'q' : 'd'}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22 }}
                          style={{ fontSize: '0.85rem', fontWeight: 300, lineHeight: 1.85,
                            color: T.text, opacity: 0.82, paddingTop: '0.8rem', fontStyle: 'italic' }}>
                          {displayText}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    {quote && !enriching && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button onClick={() => setShowQuote(v => !v)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.16em',
                            textTransform: 'uppercase', color: showQuote ? T.primary : T.muted,
                            opacity: showQuote ? 0.8 : 0.5, background: 'none', border: 'none',
                            cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            border: `1px solid ${showQuote ? T.primary : T.muted}`,
                            background: showQuote ? T.primary : 'transparent', display: 'inline-block' }} />
                          {showQuote ? (ko ? '책 설명 보기' : 'Show description') : (ko ? '저자 인용구 보기' : 'Show quote')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <p style={{ fontSize: '0.78rem', fontWeight: 300, fontStyle: 'italic',
                  color: T.muted, opacity: 0.75, marginTop: 'auto' }}>
                  {book.author}{book.title && <span style={{ opacity: 0.55 }}> · 『{book.title}』</span>}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── 액션 버튼 ── */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem auto 0',
          border: `1px solid ${T.rule}`, background: '#fff', width: 'fit-content' }}>
          <button onClick={handleCopy}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.75rem 1.4rem', fontSize: '0.55rem', fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted,
              background: 'none', border: 'none', borderRight: `1px solid ${T.rule}`,
              cursor: 'pointer', fontFamily: 'inherit' }}>
            {copied ? <><Check size={11} style={{ color: '#4a9a4a' }} /> {ko ? '복사됨' : 'Copied'}</>
                    : <><Copy size={11} /> {ko ? '링크 복사' : 'Copy Link'}</>}
          </button>
          <button onClick={() => navigate(`/explore/${bookId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.75rem 1.4rem', fontSize: '0.55rem', fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <ExternalLink size={11} /> {ko ? 'BUTTER 열기' : 'OPEN BUTTER'}
          </button>
        </div>

        {/* ── 하단 Historical Context ── */}
        <AnimatePresence>
          {!enriching && historicalCtx && (
            <motion.div key="ctx"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
              style={{ textAlign: 'center', padding: isMobile ? '2.5rem 1rem 3.5rem' : '3rem 2rem 4rem' }}>
              <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.28em',
                textTransform: 'uppercase', color: T.muted, opacity: 0.4, marginBottom: '1.5rem' }}>
                {ko ? '기억에 남은 구절' : 'A Moment That Lingered'}
              </p>
              <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem', fontWeight: 300, fontStyle: 'italic',
                lineHeight: 1.85, color: T.text, opacity: 0.75,
                maxWidth: '32rem', margin: '0 auto' }}>
                {historicalCtx}
              </p>
              <p style={{ marginTop: '2rem', fontSize: '0.5rem', letterSpacing: '0.3em', color: T.muted, opacity: 0.2 }}>✦ · ✦</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
