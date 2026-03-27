import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, ExternalLink, MoreHorizontal, BookOpen } from 'lucide-react';
import { getBook, getBookEnrich } from '../../lib/api';
import { useReflections } from '../../hooks/useReflections';
import { LoadingSpinner, ErrorMessage, BookCoverImage, AvatarImage } from '../ui';
import { formatDate } from '../../lib/format';
import type { Book } from '../../types';

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  default:    { bg: '#f0ede6', text: '#5a5040', border: '#d8d0c0' },
  fiction:    { bg: '#e8f0e4', text: '#3a5c30', border: '#b8d4b0' },
  poetry:     { bg: '#e8f0e4', text: '#3a5c30', border: '#b8d4b0' },
  philosophy: { bg: '#f0ede6', text: '#5a5040', border: '#d8d0c0' },
  'sci-fi':   { bg: '#e4eaf5', text: '#2a3f6a', border: '#b0c0e0' },
  historical: { bg: '#f5ede4', text: '#6a3a20', border: '#e0c0a0' },
  melancholy: { bg: '#3d3020', text: '#d4c090', border: '#5a4a28' },
  wonder:     { bg: '#f0ede6', text: '#5a5040', border: '#d8d0c0' },
  longing:    { bg: '#e8f0e4', text: '#3a5c30', border: '#b8d4b0' },
  trauma:     { bg: '#f5ede4', text: '#6a3a20', border: '#e0c0a0' },
};

function tagStyle(tag: string) {
  const key = tag.toLowerCase().replace(/\s+/g, '');
  return TAG_COLORS[key] ?? TAG_COLORS.default;
}

export const ShareCard = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { reflections } = useReflections({ bookId });
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // 1단계 + 2단계를 병렬로 — 기본 정보 먼저, GPT는 백그라운드
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState('');
  const [showQuote, setShowQuote] = useState(false);

  // 책 언어 감지 — 한글 포함 여부로 판단
  const isKo = (b: Book | null): boolean => {
    if (!b) return false;
    const sample = (b.title || '') + (b.author || '') + (b.description || '');
    return /[\uAC00-\uD7A3]/.test(sample);
  };

  const ko = isKo(book);

  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    setError('');
    setBook(null);

    getBook(bookId)
      .then((base: Book) => {
        setBook(base);
        setLoading(false);

        // GPT 병렬 요청 — 완료되면 덮어씀
        if (!base.title || !base.author) return;
        setEnriching(true);
        getBookEnrich(bookId, base.title, base.author)
          .then((extra: Partial<Book>) => {
            setBook((prev) => prev ? { ...prev, ...extra } : prev);
          })
          .catch(() => {})
          .finally(() => setEnriching(false));
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [bookId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  if (error || !book) {
    return (
      <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
        <ErrorMessage message={error || 'Book not found'} />
      </div>
    );
  }

  const featuredReflection = reflections[0] ?? null;

  return (
    <div
      className="min-h-screen bg-[#f5f3ee]"
      style={{ fontFamily: "'Manrope', sans-serif" }}
      onClick={() => menuOpen && setMenuOpen(false)}
    >
      {/* ── 헤더 ── */}
      <header className="flex items-start justify-between px-5 sm:px-8 pt-6 pb-3">
        <div>
          <div
            className="font-serif font-bold text-xl text-[#2a2218] tracking-tight cursor-pointer"
            style={{ fontFamily: "'Newsreader', serif" }}
            onClick={() => navigate('/')}
          >
            Butter
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#9a8e78] font-bold mt-0.5">
            {ko ? '버터에서 공유됨' : 'Shared from Butter'}
          </p>
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e8e4da] transition-colors text-[#9a8e78]"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-[#e0dbd0] rounded-xl shadow-lg py-1 w-44 z-50">
              <button
                onClick={() => { navigate(`/explore/${bookId}`); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
              >
                {ko ? 'Butter에서 열기' : 'Open in Butter'}
              </button>
              <button
                onClick={() => { handleCopy(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
              >
                {ko ? '링크 복사' : 'Copy Link'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── 메인 카드 ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl px-4 sm:px-6 pb-6"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4da] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:min-h-[400px]">

            {/* 왼쪽 — 책 커버 */}
            <div className="sm:w-[38%] sm:shrink-0 bg-[#e8e4da] flex items-center justify-center relative py-10 px-8">
              <div
                className="absolute inset-0 opacity-30"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #d4cfc4 0%, transparent 60%)' }}
              />
              <div
                className="relative shadow-[0_16px_48px_rgba(0,0,0,0.22)] rounded-lg overflow-hidden w-[55%] sm:w-[65%]"
                style={{ aspectRatio: '2/3' }}
              >
                <BookCoverImage src={book.cover} alt={book.title} className="w-full h-full object-cover" />
              </div>
            </div>

            {/* 오른쪽 — 인용 중심 레이아웃 */}
            <div className="flex-1 px-6 sm:px-9 py-7 sm:py-8 flex flex-col justify-between min-w-0 gap-4">
              <div className="flex flex-col gap-4">

                {/* 1. 상단 메타 — 레이블 + 날짜 */}
                <div>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-bold mb-2" style={{ color: '#755b00' }}>
                    {ko ? '책 세부내용 공유' : 'Book Detail Share'}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#9a8e78] font-medium">
                      {new Date().toLocaleDateString(ko ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    {(book.tags || []).length > 0 && (
                      <>
                        <span className="w-px h-3 bg-[#d0c8b8]" />
                        <span className="text-[9px] uppercase tracking-[0.15em] text-[#9a8e78] font-medium">
                          {book.tags[0]}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. 말풍선 — 페이지의 주인공 */}
                {(() => {
                  const desc = book.description
                    ? book.description.slice(0, 180).trimEnd() + (book.description.length > 180 ? '…' : '')
                    : null;
                  const quote = (ko && book.quoteKo ? book.quoteKo : book.quote) ?? null;
                  const displayText = showQuote && quote ? quote : desc;
                  if (!displayText) return null;
                  return (
                    <div>
                      <div className="border border-[#e0dbd0] rounded-lg px-5 py-5 relative overflow-hidden" style={{ minHeight: '90px' }}>
                        <span
                          className="absolute top-2 left-3 text-3xl text-[#d0c8b8] leading-none select-none"
                          style={{ fontFamily: "'Newsreader', serif" }}
                        >
                          "
                        </span>
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={showQuote ? 'quote' : 'desc'}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.28, ease: 'easeInOut' }}
                            className="text-[0.92rem] sm:text-[0.98rem] italic pt-2"
                            style={{ fontFamily: "'Newsreader', serif", color: '#2a2218', lineHeight: 1.75 }}
                          >
                            {displayText}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                      {/* 전환 버튼 */}
                      {quote && !enriching && (
                        <div className="flex justify-end mt-1.5">
                          <button
                            onClick={() => setShowQuote(v => !v)}
                            className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.18em] font-bold transition-colors"
                            style={{ color: showQuote ? '#755b00' : '#9a8e78' }}
                          >
                            <span
                              className="inline-block w-3 h-3 rounded-full border flex-shrink-0 transition-colors"
                              style={{
                                borderColor: showQuote ? '#755b00' : '#c8c0b0',
                                background: showQuote ? '#755b00' : 'transparent',
                              }}
                            />
                            {showQuote
                              ? (ko ? '책 설명 보기' : 'Show description')
                              : (ko ? '저자 인용구 보기' : 'Show quote')}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. 출처 — 저자 · 책제목 (가볍게) */}
                <p
                  className="font-light"
                  style={{ fontSize: '14px', color: '#6a5e4a', fontFamily: "'Newsreader', serif", fontStyle: 'italic' }}
                >
                  {book.author}
                  {book.title && (
                    <span style={{ color: '#9a8e78' }}> · 『{book.title}』</span>
                  )}
                </p>

              </div>
            </div>
          </div>
        </div>

        {/* ── COPY LINK + OPEN BUTTER ── */}
        <div className="flex justify-center mt-6 mb-7">
          <div className="inline-flex border border-[#e0dbd0] rounded-full bg-white shadow-sm overflow-hidden">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 sm:px-7 py-3 text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
            >
              {copied
                ? <><Check size={13} className="text-green-500" /> {ko ? '복사됨' : 'Copied'}</>
                : <><Copy size={13} /> {ko ? '링크 복사' : 'Copy Link'}</>}
            </button>
            <div className="w-px bg-[#e0dbd0]" />
            <button
              onClick={() => navigate(`/explore/${bookId}`)}
              className="flex items-center gap-2 px-5 sm:px-7 py-3 text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
            >
              <ExternalLink size={13} /> {ko ? 'Butter 열기' : 'Open Butter'}
            </button>
          </div>
        </div>

        {/* ── 하단 — Historical Context: 준비되면 fade-in, 그 전엔 아무것도 없음 ── */}
        <AnimatePresence>
          {!enriching && book.historicalContext && (
            <motion.div
              key="historical"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-center px-4 sm:px-8 pb-12"
            >
              <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#9a8e78] mb-6">
                {ko ? '기억에 남은 구절' : 'A Moment That Lingered'}
              </p>
              <p
                className="text-lg sm:text-xl text-[#3a3020] italic leading-relaxed max-w-lg mx-auto"
                style={{ fontFamily: "'Newsreader', serif" }}
              >
                {ko && book.historicalContextKo ? book.historicalContextKo : book.historicalContext}
              </p>
              <div className="flex items-center justify-center gap-2 mt-8 text-[#c8c0b0]">
                <span className="text-xs">✦</span>
                <span className="text-[9px] tracking-widest">·</span>
                <span className="text-xs">✦</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
