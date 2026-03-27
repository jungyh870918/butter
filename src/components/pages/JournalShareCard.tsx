import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink, MoreHorizontal, BookOpen } from 'lucide-react';
import { getJournalEntry } from '../../lib/api';
import { BookCoverImage, LoadingSpinner, ErrorMessage } from '../ui';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
  emotions?: string[];
  intensity?: number;
  highlight?: string;
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
}

const EMOTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  default:    { bg: '#f0ede6', text: '#5a5040', border: '#d8d0c0' },
  설렘:       { bg: '#e8f0e4', text: '#3a5c30', border: '#b8d4b0' },
  차분한:     { bg: '#e4eaf5', text: '#2a3f6a', border: '#b0c0e0' },
  자극받은:   { bg: '#f5ede4', text: '#6a3a20', border: '#e0c0a0' },
  슬픈:       { bg: '#e8e8f0', text: '#3a3a6a', border: '#b0b0e0' },
  hopeful:    { bg: '#e8f0e4', text: '#3a5c30', border: '#b8d4b0' },
  melancholy: { bg: '#3d3020', text: '#d4c090', border: '#5a4a28' },
  wonder:     { bg: '#f0ede6', text: '#5a5040', border: '#d8d0c0' },
};

function emotionStyle(tag: string) {
  const key = tag.toLowerCase();
  return EMOTION_COLORS[key] ?? EMOTION_COLORS.default;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

// 저널 content에서 첫 번째 의미 있는 단락 추출
function extractExcerpt(content: string, maxLen = 280): string {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  // [레이블] 형태 제거 후 본문만
  const bodyLines = lines.filter(l => !l.startsWith('['));
  const body = bodyLines.join(' ').trim();
  if (body.length <= maxLen) return body;
  return body.slice(0, maxLen).trimEnd() + '…';
}

export const JournalShareCard = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!entryId) return;
    getJournalEntry(entryId)
      .then(setEntry)
      .catch(() => setError('Journal entry not found'))
      .finally(() => setLoading(false));
  }, [entryId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
  if (error || !entry) return (
    <div className="min-h-screen bg-[#f5f3ee] flex items-center justify-center">
      <ErrorMessage message={error || 'Not found'} />
    </div>
  );

  const excerpt = extractExcerpt(entry.content);
  const hasBook = !!(entry.bookTitle && entry.bookAuthor);

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
            독서 노트에서 공유됨
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
                onClick={() => { navigate('/journal'); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
              >
                Butter에서 열기
              </button>
              <button
                onClick={() => { handleCopy(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-xs text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
              >
                링크 복사
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

            {/* 왼쪽 — 책 커버 패널 (책이 있을 때만) */}
            {hasBook && (
              <div className="sm:w-[35%] sm:shrink-0 bg-[#e8e4da] flex items-center justify-center relative py-10 px-8">
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #d4cfc4 0%, transparent 60%)' }}
                />
                <div
                  className="relative shadow-[0_16px_48px_rgba(0,0,0,0.22)] rounded-lg overflow-hidden w-[55%] sm:w-[70%]"
                  style={{ aspectRatio: '2/3' }}
                >
                  {entry.bookCover ? (
                    <BookCoverImage
                      src={entry.bookCover}
                      alt={entry.bookTitle!}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // 커버 없을 때 책 제목 플레이스홀더
                    <div className="w-full h-full bg-[#c8c0b0] flex items-end p-3">
                      <p className="text-[#f5f3ee] text-xs font-serif italic leading-snug line-clamp-4">
                        {entry.bookTitle}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 오른쪽 — 저널 콘텐츠 */}
            <div className={`flex-1 px-6 sm:px-9 py-7 sm:py-8 flex flex-col justify-between min-w-0 gap-5 ${!hasBook ? 'sm:px-10' : ''}`}>
              <div className="flex flex-col gap-0">

                {/* 날짜 + 책 정보 */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[9px] uppercase tracking-[0.18em] text-[#9a8e78] font-medium">
                    {formatDate(entry.date)}
                  </span>
                  {hasBook && (
                    <>
                      <span className="w-px h-3 bg-[#d0c8b8]" />
                      <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#755b00] flex items-center gap-1">
                        <BookOpen size={9} />
                        {entry.bookTitle}
                      </span>
                    </>
                  )}
                </div>

                {/* 저자 */}
                {hasBook && (
                  <p
                    className="text-sm text-[#9a8e78] italic mb-4"
                    style={{ fontFamily: "'Newsreader', serif" }}
                  >
                    작가명  {entry.bookAuthor}
                  </p>
                )}

                {/* 하이라이트 (memorable passage) */}
                {entry.highlight && (
                  <div className="border border-[#e0dbd0] rounded-lg px-5 py-4 mb-5 relative">
                    <span
                      className="absolute top-2 left-3 text-3xl text-[#d0c8b8] leading-none select-none"
                      style={{ fontFamily: "'Newsreader', serif" }}
                    >
                      "
                    </span>
                    <p
                      className="text-[0.92rem] sm:text-[1rem] text-[#2a2218] italic leading-snug pt-2"
                      style={{ fontFamily: "'Newsreader', serif" }}
                    >
                      {entry.highlight}
                    </p>
                  </div>
                )}

                {/* 본문 발췌 */}
                <p className="text-sm text-[#6a5e4a] leading-relaxed font-light">
                  {excerpt}
                </p>
              </div>

              {/* 감정 태그 */}
              {(entry.emotions ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {(entry.emotions ?? []).map((em) => {
                    const s = emotionStyle(em);
                    return (
                      <span
                        key={em}
                        className="text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 rounded-full border"
                        style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                      >
                        {em}
                      </span>
                    );
                  })}
                </div>
              )}
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
                ? <><Check size={13} className="text-green-500" /> 복사됨</>
                : <><Copy size={13} /> 링크 복사</>}
            </button>
            <div className="w-px bg-[#e0dbd0]" />
            <button
              onClick={() => navigate('/journal')}
              className="flex items-center gap-2 px-5 sm:px-7 py-3 text-[10px] uppercase tracking-[0.18em] font-bold text-[#5a5040] hover:bg-[#f5f3ee] transition-colors"
            >
              <ExternalLink size={13} /> Open Butter
            </button>
          </div>
        </div>

        {/* ── 하단 인용 ── */}
        {entry.highlight && (
          <div className="text-center px-4 sm:px-8 pb-12">
            <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-[#9a8e78] mb-6">
              기억에 남은 문장
            </p>
            <p
              className="text-lg sm:text-xl text-[#3a3020] italic leading-relaxed max-w-lg mx-auto"
              style={{ fontFamily: "'Newsreader', serif" }}
            >
              {entry.highlight}
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
