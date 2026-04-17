import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { getJournalEntry } from '../../lib/api';
import { BookCoverImage, LoadingSpinner, ErrorMessage } from '../ui';

interface JournalEntry {
  id: string; date: string; content: string;
  mood?: string; emotions?: string[]; intensity?: number;
  highlight?: string; bookId?: string; bookTitle?: string;
  bookAuthor?: string; bookCover?: string;
}

const T = {
  bg: '#faf8f4', surface: '#f5f2eb', text: '#1c1a17',
  muted: '#5e574f', primary: '#6b5200', rule: 'rgba(0,0,0,0.07)', accent: '#e8e3d6',
};

function parseSections(content: string): { label: string; text: string }[] {
  return content.split(/\n\n(?=\[)/)
    .map(block => { const m = block.match(/^\[(.+?)\]\n([\s\S]+)$/); return m ? { label: m[1], text: m[2] } : null; })
    .filter(Boolean) as { label: string; text: string }[];
}

function extractExcerpt(content: string, maxLen = 200): string {
  const sections = parseSections(content);
  if (sections.length > 0) {
    const first = sections[0].text.trim();
    return first.length > maxLen ? first.slice(0, maxLen).trimEnd() + '…' : first;
  }
  const clean = content.split('\n').filter(l => !l.startsWith('[')).join(' ').trim();
  return clean.length > maxLen ? clean.slice(0, maxLen).trimEnd() + '…' : clean;
}

function formatDate(dateStr: string, ko = true) {
  return new Date(dateStr).toLocaleDateString(ko ? 'ko-KR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' });
}

const STEP_LABELS: Record<string, { ko: string; en: string }> = {
  '시작': { ko: '시작', en: 'Opening' }, 'Opening': { ko: '시작', en: 'Opening' },
  '구절': { ko: '구절', en: 'A Passage' }, 'A Passage': { ko: '구절', en: 'A Passage' },
  '느낌': { ko: '느낌', en: 'Feeling' }, 'Feeling': { ko: '느낌', en: 'Feeling' },
  '연결': { ko: '연결', en: 'Connection' }, 'Connection': { ko: '연결', en: 'Connection' },
  '남은 것': { ko: '남은 것', en: 'What Stayed' }, 'What Stayed': { ko: '남은 것', en: 'What Stayed' },
};

export const JournalShareCard = () => {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate    = useNavigate();
  const [entry, setEntry]     = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const ko = entry ? /[\uAC00-\uD7A3]/.test((entry.bookTitle ?? '') + (entry.content ?? '')) : true;

  useEffect(() => {
    if (!entryId) return;
    getJournalEntry(entryId)
      .then(setEntry).catch(() => setError('Journal entry not found'))
      .finally(() => setLoading(false));
  }, [entryId]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingSpinner />
    </div>
  );
  if (error || !entry) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ErrorMessage message={error || 'Not found'} />
    </div>
  );

  const sections = parseSections(entry.content);
  const excerpt  = extractExcerpt(entry.content);
  const hasBook  = !!(entry.bookTitle);
  const emotions = entry.emotions ?? [];

  // 커버 + 책 정보 블록
  const CoverBlock = ({ compact }: { compact?: boolean }) => (
    <div style={{
      background: T.surface,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center',
      padding: compact ? '1.5rem 1.2rem' : '2rem 1.5rem',
      gap: '0.9rem',
      width: compact ? '100%' : '32%',
      flexShrink: 0,
    }}>
      <div style={{
        width: compact ? '38%' : '75%',
        aspectRatio: '2/3', overflow: 'hidden',
        boxShadow: '4px 8px 28px rgba(0,0,0,0.18)',
      }}>
        {entry.bookCover ? (
          <BookCoverImage src={entry.bookCover} alt={entry.bookTitle!} className="w-full h-full object-cover" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: T.accent,
            display: 'flex', alignItems: 'flex-end', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.6rem', fontStyle: 'italic', color: T.muted, lineHeight: 1.4, opacity: 0.7 }}>
              {entry.bookTitle}
            </p>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '-0.01em',
          color: T.text, lineHeight: 1.3, marginBottom: '0.2rem' }}>
          {entry.bookTitle}
        </p>
        {entry.bookAuthor && (
          <p style={{ fontSize: '0.62rem', fontWeight: 300, fontStyle: 'italic',
            color: T.muted, opacity: 0.6 }}>
            {entry.bookAuthor}
          </p>
        )}
      </div>
    </div>
  );

  // 감상 내용 블록
  const ContentBlock = () => (
    <div style={{ flex: 1, padding: isMobile ? '1.4rem 1.2rem' : '1.8rem 2rem',
      display: 'flex', flexDirection: 'column', gap: '1.1rem', minWidth: 0 }}>
      {/* 메타 */}
      <div>
        <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: T.primary, opacity: 0.65, marginBottom: '0.35rem' }}>
          {ko ? '책 세부내용 공유' : 'Personal Reflection'}
        </p>
        <p style={{ fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: T.muted, opacity: 0.5 }}>
          {formatDate(entry.date, ko)}
        </p>
      </div>
      {/* 하이라이트 */}
      {entry.highlight && (
        <div style={{ borderLeft: `2px solid ${T.primary}`, paddingLeft: '1rem', opacity: 0.82 }}>
          <p style={{ fontSize: isMobile ? '0.85rem' : '0.88rem', fontWeight: 300,
            fontStyle: 'italic', lineHeight: 1.8, color: T.text }}>
            "{entry.highlight}"
          </p>
        </div>
      )}
      {/* 섹션 or 발췌 */}
      {sections.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {sections.slice(0, isMobile ? 2 : 3).map((s, i) => {
            const stepLabel = STEP_LABELS[s.label];
            const maxLen = isMobile ? 80 : 120;
            return (
              <div key={s.label}>
                <p style={{ fontSize: '0.48rem', fontWeight: 600, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: T.primary, opacity: 0.45, marginBottom: '0.25rem' }}>
                  {String(i + 1).padStart(2, '0')}
                  {stepLabel && <span style={{ marginLeft: '0.4rem', opacity: 0.7 }}>{ko ? stepLabel.ko : stepLabel.en}</span>}
                </p>
                <p style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 300,
                  lineHeight: 1.82, color: T.text, opacity: 0.76 }}>
                  {s.text.length > maxLen ? s.text.slice(0, maxLen).trimEnd() + '…' : s.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 300,
          lineHeight: 1.88, color: T.text, opacity: 0.75 }}>
          {excerpt}
        </p>
      )}
      {/* 감정 태그 */}
      {emotions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: 'auto' }}>
          {emotions.slice(0, 4).map(em => (
            <span key={em} style={{
              fontSize: '0.48rem', fontWeight: 600, letterSpacing: '0.14em',
              textTransform: 'uppercase', padding: '0.18rem 0.5rem',
              border: `1px solid ${T.primary}`, color: T.primary, opacity: 0.5,
            }}>{em}</span>
          ))}
        </div>
      )}
    </div>
  );

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
            {ko ? '독서 기록에서 공유됨' : 'Shared from Reading Journal'}
          </p>
        </div>
        <button onClick={() => navigate('/journal')}
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
            /* 모바일: 커버 가로 띠 + 내용 세로 */
            hasBook ? (
              <div>
                {/* 책 커버 가로 배치 */}
                <div style={{ background: T.surface, display: 'flex', flexDirection: 'row',
                  alignItems: 'center', gap: '1rem', padding: '1.2rem 1.2rem' }}>
                  <div style={{ width: '22%', aspectRatio: '2/3', overflow: 'hidden', flexShrink: 0,
                    boxShadow: '3px 6px 20px rgba(0,0,0,0.16)' }}>
                    {entry.bookCover ? (
                      <BookCoverImage src={entry.bookCover} alt={entry.bookTitle!} className="w-full h-full object-cover" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: T.accent }} />
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '-0.01em',
                      color: T.text, lineHeight: 1.25, marginBottom: '0.25rem' }}>
                      {entry.bookTitle}
                    </p>
                    {entry.bookAuthor && (
                      <p style={{ fontSize: '0.65rem', fontWeight: 300, fontStyle: 'italic',
                        color: T.muted, opacity: 0.6 }}>{entry.bookAuthor}</p>
                    )}
                  </div>
                </div>
                <ContentBlock />
              </div>
            ) : (
              <ContentBlock />
            )
          ) : (
            /* 데스크탑: 좌우 2단 */
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              {hasBook && <CoverBlock />}
              <ContentBlock />
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
          <button onClick={() => navigate('/journal')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.75rem 1.4rem', fontSize: '0.55rem', fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <ExternalLink size={11} /> {ko ? 'BUTTER 열기' : 'OPEN BUTTER'}
          </button>
        </div>

        {/* ── 하단 하이라이트 ── */}
        {entry.highlight && (
          <div style={{ textAlign: 'center', padding: isMobile ? '2.5rem 1rem 3.5rem' : '3rem 2rem 4rem' }}>
            <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: T.muted, opacity: 0.35, marginBottom: '1.5rem' }}>
              {ko ? '기억에 남은 문장' : 'A Sentence That Stayed'}
            </p>
            <p style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 300,
              fontStyle: 'italic', lineHeight: 1.9, color: T.text, opacity: 0.72,
              maxWidth: '30rem', margin: '0 auto' }}>
              "{entry.highlight}"
            </p>
            {entry.bookTitle && (
              <p style={{ marginTop: '0.9rem', fontSize: '0.65rem', fontWeight: 300,
                fontStyle: 'italic', color: T.muted, opacity: 0.4 }}>
                — 『{entry.bookTitle}』
              </p>
            )}
            <p style={{ marginTop: '2rem', fontSize: '0.5rem', letterSpacing: '0.3em', color: T.muted, opacity: 0.2 }}>✦ · ✦</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
