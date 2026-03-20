import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink, MoreHorizontal } from 'lucide-react';
import { useBook } from '../../hooks/useBook';
import { useReflections } from '../../hooks/useReflections';
import { LoadingSpinner, ErrorMessage, BookCoverImage, AvatarImage } from '../ui';
import { formatDate } from '../../lib/format';

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
  const { book, loading, error } = useBook(bookId);
  const { reflections } = useReflections({ bookId });
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      {/* ── 헤더 ──────────────────────────────────────────────── */}
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
            Shared from Butter
          </p>
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e8e4da] transition-colors text-[#9a8e78]"
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-[#e0dbd0] rounded-xl shadow-lg py-1 w-40 z-50">
              <button
                onClick={() => { navigate(`/explore/${bookId}`); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
              >
                Open in Butter
              </button>
              <button
                onClick={() => { handleCopy(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
              >
                Copy link
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── 메인 카드 ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl px-4 sm:px-6 pb-6"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4da] overflow-hidden">
          {/* 모바일: 세로 스택 / 태블릿+: 가로 분할 */}
          <div className="flex flex-col sm:flex-row sm:min-h-[420px]">

            {/* 왼쪽(sm+) / 상단(모바일) — 커버 패널 */}
            <div className="sm:w-[38%] sm:shrink-0 bg-[#e8e4da] flex items-center justify-center relative
                            py-10 px-8 sm:py-10 sm:px-10">
              <div
                className="absolute inset-0 opacity-30"
                style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #d4cfc4 0%, transparent 60%)' }}
              />
              {/* 모바일: 가로형 / sm+: 세로형 */}
              <div
                className="relative shadow-[0_16px_48px_rgba(0,0,0,0.22)] rounded-lg overflow-hidden
                           w-[45%] sm:w-[65%]"
                style={{ aspectRatio: '2/3' }}
              >
                <BookCoverImage
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 오른쪽(sm+) / 하단(모바일) — 콘텐츠 */}
            <div className="flex-1 px-6 sm:px-9 py-7 sm:py-8 flex flex-col justify-between min-w-0 gap-5">
              <div className="flex flex-col gap-0">
                {/* 태그 + 날짜 */}
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                  {(book.tags || []).slice(0, 1).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#755b00]"
                    >
                      {tag}
                    </span>
                  ))}
                  {(book.tags || []).length > 0 && featuredReflection && (
                    <span className="w-px h-3 bg-[#d0c8b8]" />
                  )}
                  {featuredReflection && (
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[#9a8e78] font-medium">
                      {formatDate(featuredReflection.date)}
                    </span>
                  )}
                </div>

                {/* 제목 */}
                <h1
                  className="text-[1.85rem] sm:text-[2.4rem] leading-[1.1] text-[#1a1610] mb-2 font-normal"
                  style={{ fontFamily: "'Newsreader', serif" }}
                >
                  {book.title}
                </h1>
                <p
                  className="text-sm sm:text-base text-[#9a8e78] italic mb-5 sm:mb-6"
                  style={{ fontFamily: "'Newsreader', serif" }}
                >
                  by {book.author}
                </p>

                {/* 섹션 제목 + 리플렉션 본문 */}
                {featuredReflection && (
                  <>
                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#1a1610] mb-2">
                      {featuredReflection.title}
                    </p>
                    <p className="text-sm text-[#6a5e4a] leading-relaxed mb-5 font-light line-clamp-4">
                      {featuredReflection.content}
                    </p>
                  </>
                )}

                {/* 인용구 박스 */}
                {book.quote && (
                  <div className="border border-[#e0dbd0] rounded-lg px-5 py-4 mb-5 relative">
                    <span
                      className="absolute top-2 left-3 text-3xl text-[#d0c8b8] leading-none select-none"
                      style={{ fontFamily: "'Newsreader', serif" }}
                    >
                      "
                    </span>
                    <p
                      className="text-[0.95rem] sm:text-[1.05rem] text-[#2a2218] italic leading-snug pt-2"
                      style={{ fontFamily: "'Newsreader', serif" }}
                    >
                      {book.quote}
                    </p>
                  </div>
                )}
              </div>

              {/* 감정 태그 */}
              <div className="flex flex-wrap gap-2">
                {(book.tags || []).map((tag) => {
                  const s = tagStyle(tag);
                  return (
                    <span
                      key={tag}
                      className="text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 rounded-full border"
                      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── COPY LINK + OPEN BUTTER ───────────────────────── */}
        <div className="flex justify-center mt-6 mb-7">
          <div className="inline-flex border border-[#e0dbd0] rounded-full bg-white shadow-sm overflow-hidden">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 sm:px-7 py-3 text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
            >
              {copied
                ? <><Check size={13} className="text-green-500" /> Copied</>
                : <><Copy size={13} /> Copy Link</>}
            </button>
            <div className="w-px bg-[#e0dbd0]" />
            <button
              onClick={() => navigate(`/explore/${bookId}`)}
              className="flex items-center gap-2 px-5 sm:px-7 py-3 text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
            >
              <ExternalLink size={13} /> Open Butter
            </button>
          </div>
        </div>

        {/* ── A MOMENT THAT LINGERED ────────────────────────── */}
        {book.historicalContext && (
          <div className="text-center px-4 sm:px-8 pb-12">
            <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#9a8e78] mb-6">
              A Moment That Lingered
            </p>
            <p
              className="text-lg sm:text-xl text-[#3a3020] italic leading-relaxed max-w-lg mx-auto"
              style={{ fontFamily: "'Newsreader', serif" }}
            >
              {book.historicalContext}
            </p>
            <div className="flex items-center justify-center gap-2 mt-8 text-[#c8c0b0]">
              <span className="text-xs">✦</span>
              <span className="text-[9px] tracking-widest uppercase font-bold">·</span>
              <span className="text-xs">✦</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
