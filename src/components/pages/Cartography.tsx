import { useLocale , localizeEmotion } from '../../hooks/useLocale';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useEmotions } from '../../hooks/useEmotions';
import { useJournal } from '../../hooks/useJournal';
import { getUserProfile } from '../../lib/api';
import { UserProfile } from '../../types';
import { LoadingSpinner, EmptyState } from '../ui';
import * as d3 from 'd3';
// @ts-ignore
import cloud from 'd3-cloud';

// ── CSS 변수 헬퍼 ─────────────────────────────────────────────────────────
const C = {
  primary: () => getComputedStyle(document.documentElement).getPropertyValue('--color-butter-primary').trim() || '#6b5200',
  muted:   () => getComputedStyle(document.documentElement).getPropertyValue('--color-butter-muted').trim()   || '#5e574f',
  surface: () => getComputedStyle(document.documentElement).getPropertyValue('--color-butter-surface').trim() || '#f5f2eb',
  text:    () => getComputedStyle(document.documentElement).getPropertyValue('--color-butter-text').trim()    || '#1c1a17',
  bg:      () => getComputedStyle(document.documentElement).getPropertyValue('--color-butter-bg').trim()      || '#faf8f4',
  rule:    () => getComputedStyle(document.documentElement).getPropertyValue('--color-butter-rule').trim()    || 'rgba(0,0,0,0.06)',
};

const TABS = ['shelf', 'magazine', 'wordcloud', 'score', 'arc'] as const;
type Tab = typeof TABS[number];
type ShelfSort = 'date' | 'emotion' | 'author' | 'genre';
type WCFilter  = 'all' | 'emotion' | 'author' | 'theme';

// ══════════════════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════════════════
export const Cartography = () => {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<Tab>('shelf');
  const { loading: emotionsLoading } = useEmotions();
  const { entries, loading: journalLoading } = useJournal();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    getUserProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false));
  }, []);

  const loading = emotionsLoading || journalLoading || profileLoading;

  const TAB_LABELS: Record<Tab, { en: string; ko: string }> = {
    shelf:     { en: 'Shelf',      ko: '서재' },
    magazine:  { en: 'Magazine',   ko: '잡지' },
    wordcloud: { en: 'Word Cloud', ko: '워드클라우드' },
    score:     { en: 'Score',      ko: '악보' },
    arc:       { en: 'Arc',        ko: '아크' },
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-butter-bg)' }}>
      {/* 헤더 */}
      <div className="pt-14 md:pt-32 pb-8 px-5 md:px-14 max-w-7xl mx-auto">
        <p style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.5, marginBottom: '1.4rem' }}>
          {locale === 'ko' ? '감정 지도' : 'Emotional Cartography'}
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <h1 style={{ fontWeight: 700, fontSize: 'clamp(2.6rem, 6vw, 4.5rem)', lineHeight: 0.95, letterSpacing: '-0.03em', color: 'var(--color-butter-text)', margin: 0 }}>
            {locale === 'ko' ? '나의 독서 여정' : 'Your Reading Arc'}
          </h1>
          <div style={{ textAlign: 'right', flexShrink: 0, paddingBottom: '0.2rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.65, marginBottom: '0.3rem' }}>
              {locale === 'ko' ? '기록 기반 시각화' : 'Visualization based on journal'}
            </p>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.6 }}>
              {locale === 'ko' ? `마지막 업데이트 — ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}` : `LAST UPDATED — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}`}
            </p>
          </div>
        </div>
        <div style={{ paddingTop: '1.75rem', borderTop: '1px solid var(--color-butter-rule)', display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 300, lineHeight: 1.9, color: 'var(--color-butter-muted)', maxWidth: '28rem', margin: 0 }}>
            {locale === 'ko'
              ? '독서 생활의 패턴과 흐름을 시각화한 기록입니다. 감정의 흐름, 자주 등장한 단어, 책과 감정의 연결망, 그리고 시간의 궤적을 한눈에 살펴보세요.'
              : 'A visual record of the patterns in your reading life. Explore the arc of your emotions, recurring words, networks between books and feelings, and the trajectory of time.'}
          </p>
          <div style={{ marginLeft: 'auto', textAlign: 'right', paddingTop: '0.1rem' }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-butter-muted)', opacity: 0.5 }}>
              {locale === 'ko' ? '5개 섹션 — 서재 / 잡지 / 워드클라우드 / 악보 / 아크' : '5 sections — Shelf / Magazine / Word Cloud / Score / Arc'}
            </p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="px-5 md:px-14 max-w-7xl mx-auto">
        <div className="flex items-center gap-8 pb-0">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="pb-3 text-[11px] uppercase tracking-[0.18em] font-medium transition-all duration-200"
              style={{
                color: activeTab === tab ? 'var(--color-butter-text)' : 'var(--color-butter-muted)',
                borderBottom: activeTab === tab ? '1px solid var(--color-butter-text)' : '1px solid transparent',
                opacity: activeTab === tab ? 1 : 0.55,
              }}>
              {TAB_LABELS[tab][locale as 'en' | 'ko']}
            </button>
          ))}
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="px-5 md:px-14 max-w-7xl mx-auto py-14 md:py-20">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {activeTab === 'shelf'     && <ShelfTab     entries={entries} locale={locale} />}
            {activeTab === 'magazine'  && <MagazineTab  entries={entries} locale={locale} />}
            {activeTab === 'wordcloud' && <WordCloudTab entries={entries} profile={profile} locale={locale} />}
            {activeTab === 'score'     && <ScoreTab     entries={entries} locale={locale} />}
            {activeTab === 'arc'       && <ArcTab       entries={entries} locale={locale} />}
          </>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SHELF TAB
// ══════════════════════════════════════════════════════════════════════════
const ShelfTab = ({ entries, locale }: { entries: any[]; locale: string }) => {
  const [sort, setSort] = useState<ShelfSort>('date');

  const books = useMemo(() => {
    const map = new Map<string, {
      title: string; author: string; cover?: string;
      emotions: string[]; date: string; count: number;
    }>();
    entries.forEach((e) => {
      if (!e.bookTitle) return;
      const key = e.bookTitle;
      if (!map.has(key)) {
        map.set(key, { title: e.bookTitle, author: e.bookAuthor ?? '—', cover: e.bookCover, emotions: [], date: e.date, count: 0 });
      }
      const b = map.get(key)!;
      b.count++;
      (e.emotions ?? []).forEach((em: string) => { if (!b.emotions.includes(em)) b.emotions.push(em); });
      if (new Date(e.date) > new Date(b.date)) b.date = e.date;
    });
    return [...map.values()];
  }, [entries]);

  const sorted = useMemo(() => {
    const arr = [...books];
    if (sort === 'emotion') arr.sort((a, b) => (a.emotions[0] ?? '').localeCompare(b.emotions[0] ?? ''));
    if (sort === 'author')  arr.sort((a, b) => a.author.localeCompare(b.author));
    if (sort === 'genre')   arr.sort((a, b) => (a.emotions[1] ?? a.emotions[0] ?? '').localeCompare(b.emotions[1] ?? b.emotions[0] ?? ''));
    if (sort === 'date')    arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return arr;
  }, [books, sort]);

  const primary = C.primary();
  const muted   = C.muted();
  const surface = C.surface();

  const SORT_LABELS: Record<ShelfSort, { en: string; ko: string }> = {
    date:    { en: 'Recent',     ko: '최근순' },
    emotion: { en: 'By Emotion', ko: '감정순' },
    author:  { en: 'By Author',  ko: '작가순' },
    genre:   { en: 'By Mood',    ko: '분위기순' },
  };

  if (sorted.length === 0) {
    return <EmptyState message={locale === 'ko'
      ? '책과 함께 저널을 작성하면 서재가 채워집니다.'
      : 'Write journal entries with books to fill your shelf.'} />;
  }

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return locale === 'ko'
      ? `${dt.getFullYear()}. ${dt.getMonth()+1}. ${dt.getDate()}.`
      : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif font-light" style={{ fontSize: '1.2rem', color: 'var(--color-butter-text)' }}>
            {locale === 'ko' ? `${sorted.length}권의 기록` : `${sorted.length} books read`}
          </h2>
          <p className="text-[12px] font-light mt-1" style={{ color: muted, opacity: 0.6 }}>
            {locale === 'ko' ? '저널에 기록된 책들입니다.' : 'Books from your journal entries.'}
          </p>
        </div>
        {/* 정렬 버튼 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['date','emotion','author','genre'] as ShelfSort[]).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] font-medium transition-all"
              style={{
                borderRadius: '2px',
                border: `1px solid ${sort === s ? primary : C.rule()}`,
                background: sort === s ? primary : 'transparent',
                color: sort === s ? C.bg() : muted,
              }}>
              {SORT_LABELS[s][locale as 'en'|'ko']}
            </button>
          ))}
        </div>
      </div>

      {/* 표 */}
      <div style={{ border: `1px solid ${C.rule()}`, borderRadius: '3px', overflow: 'hidden' }}>
        {/* 컬럼 헤더 */}
        <div className="grid px-5 py-3 gap-4"
          style={{
            gridTemplateColumns: '2.4fr 1.2fr 1.4fr 1fr',
            background: 'var(--color-butter-surface)',
            borderBottom: `1px solid ${C.rule()}`,
          }}>
          {[
            locale === 'ko' ? '제목' : 'Title',
            locale === 'ko' ? '저자' : 'Author',
            locale === 'ko' ? '감정' : 'Emotion',
            locale === 'ko' ? '기록일' : 'Last read',
          ].map((label, i) => (
            <p key={i} className="text-[9px] uppercase tracking-[0.22em] font-semibold"
              style={{ color: muted, opacity: 0.5 }}>
              {label}
            </p>
          ))}
        </div>

        {/* 행 */}
        {sorted.map((book, i) => (
          <div key={book.title}
            className="grid px-5 py-3.5 gap-4 items-center"
            style={{
              gridTemplateColumns: '2.4fr 1.2fr 1.4fr 1fr',
              borderBottom: i < sorted.length - 1 ? `1px solid ${C.rule()}` : 'none',
              background: i % 2 === 1 ? 'var(--color-butter-surface)' : 'transparent',
            }}>
            {/* 제목 */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 overflow-hidden"
                style={{ width: 22, height: 32, borderRadius: '1px', boxShadow: '0 1px 4px rgba(0,0,0,0.14)', background: primary, opacity: book.cover ? 1 : 0.15 }}>
                {book.cover && (
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
              <p className="font-serif font-light truncate"
                style={{ fontSize: '13px', color: 'var(--color-butter-text)' }}>
                {book.title}
              </p>
            </div>
            {/* 저자 */}
            <p className="text-[12px] font-light italic truncate"
              style={{ color: muted, opacity: 0.75 }}>
              {book.author}
            </p>
            {/* 감정 */}
            <div className="flex flex-wrap gap-1.5">
              {book.emotions.slice(0, 2).map((em) => (
                <span key={em}
                  className="text-[9px] uppercase tracking-[0.08em] px-1.5 py-0.5"
                  style={{ color: primary, border: `1px solid ${primary}`, borderRadius: '2px', opacity: 0.65 }}>
                  {localizeEmotion(em, locale as 'en' | 'ko')}
                </span>
              ))}
            </div>
            {/* 날짜 */}
            <p className="text-[11px] tabular-nums" style={{ color: muted, opacity: 0.45 }}>
              {formatDate(book.date)}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[10px] mt-4 font-light" style={{ color: muted, opacity: 0.35 }}>
        {locale === 'ko'
          ? '같은 책에 여러 번 기록하면 하나로 합산됩니다.'
          : 'Multiple entries for the same book are combined.'}
      </p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// MAGAZINE TAB — 패션 잡지 스타일 감상 아카이브
// ══════════════════════════════════════════════════════════════════════════

interface MagEntry {
  id: string;
  entryNo: string;
  catalogCode: string;
  date: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover?: string;
  emotions: string[];
  content: string;
  highlight?: string;
}

// 각 카드의 고유 스펙 — 카드 자체 너비 + 표지 배치
type CoverPos  = 'left' | 'right' | 'top' | 'none';

interface MagCardSpec {
  cardWidth:   string;   // 카드 자체 너비 (px or %)
  coverWidth:  number;   // 표지 px 너비 (0 = 없음)
  coverHeight: number;   // 표지 px 높이
  coverPos:    CoverPos;
  textWidth:   string;   // 텍스트 영역 너비 (cover 옆에 붙을 때)
  titleSize:   string;   // 제목 font-size
  accentNo:    boolean;  // 큰 인덱스 번호 강조 여부
}

// 카드 스펙 시퀀스 (반복 사용) — 각각 다른 너비와 배치
const CARD_SPECS: MagCardSpec[] = [
  // 0: 넓은 카드, 큰 커버 우측
  { cardWidth: '680px', coverWidth: 200, coverHeight: 280, coverPos: 'right',
    textWidth: '340px', titleSize: '1.7rem', accentNo: false },
  // 1: 중간 카드, 커버 좌측
  { cardWidth: '440px', coverWidth: 130, coverHeight: 182, coverPos: 'left',
    textWidth: '260px', titleSize: '1.1rem', accentNo: false },
  // 2: 좁은 카드, 커버 상단
  { cardWidth: '300px', coverWidth: 140, coverHeight: 196, coverPos: 'top',
    textWidth: '300px', titleSize: '1rem',   accentNo: false },
  // 3: 중간 카드, 텍스트만 + 큰 번호
  { cardWidth: '380px', coverWidth: 0,   coverHeight: 0,   coverPos: 'none',
    textWidth: '380px', titleSize: '1.2rem', accentNo: true },
  // 4: 넓은 카드, 커버 좌측 큰
  { cardWidth: '600px', coverWidth: 175, coverHeight: 245, coverPos: 'left',
    textWidth: '370px', titleSize: '1.5rem', accentNo: false },
  // 5: 좁은 카드, 텍스트만
  { cardWidth: '320px', coverWidth: 0,   coverHeight: 0,   coverPos: 'none',
    textWidth: '320px', titleSize: '1.05rem', accentNo: false },
  // 6: 중간-넓은 카드, 커버 우측 중간
  { cardWidth: '520px', coverWidth: 150, coverHeight: 210, coverPos: 'right',
    textWidth: '320px', titleSize: '1.25rem', accentNo: false },
  // 7: 좁은 카드, 커버 상단 작은
  { cardWidth: '280px', coverWidth: 110, coverHeight: 154, coverPos: 'top',
    textWidth: '280px', titleSize: '0.95rem', accentNo: false },
  // 8: 넓은 카드, 텍스트만 + 큰 번호
  { cardWidth: '560px', coverWidth: 0,   coverHeight: 0,   coverPos: 'none',
    textWidth: '560px', titleSize: '1.6rem', accentNo: true },
  // 9: 중간 카드, 커버 우측 작은
  { cardWidth: '400px', coverWidth: 100, coverHeight: 140, coverPos: 'right',
    textWidth: '260px', titleSize: '1.1rem', accentNo: false },
];

const MagazineTab = ({ entries, locale }: { entries: any[]; locale: string }) => {
  const muted = C.muted();

  const magEntries: MagEntry[] = useMemo(() => {
    const filtered = entries
      .filter((e) => e.bookTitle && e.content)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered.map((e, i) => {
      const dt = new Date(e.date);
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const day   = String(dt.getDate()).padStart(2, '0');
      const year  = String(dt.getFullYear()).slice(2);
      return {
        id:          e.id,
        entryNo:     `ENTRY NO. ${String(filtered.length - i).padStart(3, '0')}`,
        catalogCode: `CATALOG. ${month}.${day}.${year}`,
        date:        e.date,
        bookTitle:   e.bookTitle,
        bookAuthor:  e.bookAuthor ?? '—',
        bookCover:   e.bookCover,
        emotions:    e.emotions ?? [],
        content:     e.content,
        highlight:   e.highlight,
      };
    });
  }, [entries]);

  if (magEntries.length === 0) {
    return (
      <EmptyState message={locale === 'ko'
        ? '책과 함께 저널을 작성하면 잡지가 채워집니다.'
        : 'Write journal entries with books to fill the magazine.'} />
    );
  }

  const formatDate = (d: string) => {
    const dt = new Date(d);
    return locale === 'ko'
      ? `${dt.getFullYear()}. ${dt.getMonth() + 1}. ${dt.getDate()}.`
      : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
      {/* 잡지 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
        borderBottom: `2px solid var(--color-butter-text)`,
        paddingBottom: '1.25rem', marginBottom: '0',
      }}>
        <div>
          <p style={{ fontSize: '0.5rem', letterSpacing: '0.32em', textTransform: 'uppercase',
            color: muted, opacity: 0.45, marginBottom: '0.5rem', fontWeight: 600 }}>
            {locale === 'ko' ? '독서 아카이브 매거진' : 'Reading Archive Magazine'}
          </p>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.1rem)', fontWeight: 700,
            letterSpacing: '-0.01em', color: 'var(--color-butter-text)', lineHeight: 1.05 }}>
            THE READER'S ARCHIVE
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.5rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: muted, opacity: 0.4, marginBottom: '0.25rem' }}>
            {locale === 'ko' ? `총 ${magEntries.length}편의 기록` : `${magEntries.length} entries`}
          </p>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: muted, opacity: 0.3, fontWeight: 300 }}>
            ISSUE {String(magEntries.length).padStart(3, '0')}
          </p>
        </div>
      </div>

      {/* 카드 컨테이너 — flex-wrap으로 자연스럽게 흘러가기 */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '0',
        // 모바일에서는 overflow hidden으로 카드 넘침 방지
        overflow: 'hidden',
      }}>
        {magEntries.map((entry, i) => {
          const spec = CARD_SPECS[i % CARD_SPECS.length];
          return (
            <MagCard
              key={entry.id}
              entry={entry}
              spec={spec}
              entryIndex={i}
              locale={locale}
              formatDate={formatDate}
            />
          );
        })}
      </div>
    </div>
  );
};

// ── 모달 컴포넌트 ─────────────────────────────────────────────────────────
const MagModal = ({ entry, locale, formatDate, onClose }: {
  entry: MagEntry; locale: string; formatDate: (d: string) => string; onClose: () => void;
}) => {
  const primary = C.primary();
  const muted   = C.muted();
  const rule    = C.rule();

  // 바깥 클릭 시 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-butter-bg)',
          width: '100%', maxWidth: '680px',
          maxHeight: '88vh', overflowY: 'auto',
          borderRadius: '16px 16px 0 0',
          padding: '2rem 1.5rem 3rem',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
        }}
      >
        {/* 드래그 핸들 */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: rule,
          margin: '0 auto 1.5rem', opacity: 0.5 }} />

        {/* 메타 */}
        <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: muted, opacity: 0.55, marginBottom: '1rem', lineHeight: 1.6 }}>
          {entry.entryNo}
          <span style={{ margin: '0 0.4rem', opacity: 0.4 }}>/</span>
          {entry.catalogCode}
          <span style={{ margin: '0 0.4rem', opacity: 0.4 }}>/</span>
          {formatDate(entry.date)}
        </p>

        {/* 표지 + 제목 */}
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          {entry.bookCover && (
            <div style={{ width: 72, height: 100, flexShrink: 0,
              background: 'var(--color-butter-surface)', boxShadow: '2px 3px 12px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <img src={entry.bookCover} alt={entry.bookTitle}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                referrerPolicy="no-referrer" />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em',
              color: 'var(--color-butter-text)', lineHeight: 1.1, marginBottom: '0.35rem' }}>
              {entry.bookTitle}
            </p>
            <p style={{ fontSize: '0.75rem', fontWeight: 300, fontStyle: 'italic',
              color: muted, opacity: 0.6, marginBottom: '0.75rem' }}>
              {entry.bookAuthor}
            </p>
            {entry.emotions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {entry.emotions.slice(0, 3).map((em) => (
                  <span key={em} style={{
                    fontSize: '0.5rem', letterSpacing: '0.16em', textTransform: 'uppercase',
                    border: `1px solid ${primary}`, color: primary, opacity: 0.5,
                    padding: '0.15rem 0.45rem',
                  }}>{em}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 인용구 */}
        {entry.highlight && (
          <p style={{
            fontSize: '0.85rem', fontWeight: 300, lineHeight: 1.85,
            color: 'var(--color-butter-text)', opacity: 0.5,
            borderLeft: `1.5px solid ${primary}`, paddingLeft: '0.85rem',
            fontStyle: 'italic', marginBottom: '1.2rem',
          }}>
            "{entry.highlight}"
          </p>
        )}

        {/* 구분선 */}
        <div style={{ height: 1, background: rule, marginBottom: '1.2rem' }} />

        {/* 본문 전체 */}
        <p style={{ fontSize: '0.88rem', fontWeight: 300, lineHeight: 1.92,
          color: 'var(--color-butter-text)', opacity: 0.72 }}>
          {entry.content}
        </p>
      </div>
    </div>
  );
};

// ── 개별 카드 컴포넌트 ────────────────────────────────────────────────────
const MagCard = ({
  entry, spec, entryIndex, locale, formatDate,
}: {
  entry: MagEntry;
  spec: MagCardSpec;
  entryIndex: number;
  locale: string;
  formatDate: (d: string) => string;
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const primary = C.primary();
  const muted   = C.muted();
  const rule    = C.rule();

  // 모바일 감지 (SSR safe)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 미리보기 길이 — 모바일은 60자, 데스크탑은 140자
  const PREVIEW_LEN = isMobile ? 60 : 140;
  const preview  = entry.content.length > PREVIEW_LEN ? entry.content.slice(0, PREVIEW_LEN) + '…' : entry.content;
  const canExpand = entry.content.length > PREVIEW_LEN;
  const hasCover = spec.coverWidth > 0;

  // ── 커버 이미지 ──────────────────────────────────────────────────
  const CoverImg = ({ w, h }: { w: number; h: number }) => (
    <div style={{
      width: w, height: h, flexShrink: 0,
      background: 'var(--color-butter-surface)',
      boxShadow: '2px 4px 16px rgba(0,0,0,0.13)',
      overflow: 'hidden',
    }}>
      {entry.bookCover ? (
        <img src={entry.bookCover} alt={entry.bookTitle}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '0.6rem' }}>
          <p style={{ fontSize: '0.45rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: primary, opacity: 0.25, textAlign: 'center', lineHeight: 1.7 }}>
            {entry.bookTitle.slice(0, 16)}
          </p>
        </div>
      )}
    </div>
  );

  // ── 메타 라인 ─────────────────────────────────────────────────────
  const MetaLine = () => (
    <p style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: muted, opacity: 0.55, marginBottom: '0.65rem', lineHeight: 1.6 }}>
      {entry.entryNo}
      <span style={{ margin: '0 0.4rem', opacity: 0.4 }}>/</span>
      {entry.catalogCode}
      <span style={{ margin: '0 0.4rem', opacity: 0.4 }}>/</span>
      {formatDate(entry.date)}
    </p>
  );

  // ── 텍스트 블록 ───────────────────────────────────────────────────
  const TextBlock = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{ width: mobile ? '100%' : spec.textWidth, minWidth: 0 }}>
      <p style={{ fontSize: mobile ? '1.1rem' : spec.titleSize, fontWeight: 700, letterSpacing: '-0.02em',
        color: 'var(--color-butter-text)', lineHeight: 1.1, marginBottom: '0.35rem' }}>
        {entry.bookTitle}
      </p>
      <p style={{ fontSize: '0.7rem', fontWeight: 300, fontStyle: 'italic',
        color: muted, opacity: 0.55, letterSpacing: '0.02em', marginBottom: '0.75rem' }}>
        {entry.bookAuthor}
      </p>
      {entry.emotions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.75rem' }}>
          {entry.emotions.slice(0, 3).map((em) => (
            <span key={em} style={{
              fontSize: '0.48rem', letterSpacing: '0.14em', textTransform: 'uppercase',
              border: `1px solid ${primary}`, color: primary, opacity: 0.48,
              padding: '0.15rem 0.4rem',
            }}>{em}</span>
          ))}
        </div>
      )}
      {entry.highlight && (
        <p style={{
          fontSize: '0.75rem', fontWeight: 300, lineHeight: 1.8,
          color: 'var(--color-butter-text)', opacity: 0.48,
          borderLeft: `1.5px solid ${primary}`, paddingLeft: '0.75rem',
          fontStyle: 'italic', marginBottom: '0.8rem',
        }}>
          "{entry.highlight}"
        </p>
      )}
      <p style={{ fontSize: '0.75rem', fontWeight: 300, lineHeight: 1.88,
        color: 'var(--color-butter-text)', opacity: 0.65, marginBottom: '0.6rem',
        wordBreak: 'keep-all', overflowWrap: 'break-word' }}>
        {preview}
      </p>
      {canExpand && (
        <button
          onClick={() => setModalOpen(true)}
          style={{
            fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: primary, opacity: 0.65, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0,
            textDecoration: 'underline', textUnderlineOffset: '3px',
            fontFamily: 'inherit',
          }}>
          {locale === 'ko' ? '전문 보기' : 'VIEW ARCHIVE'}
        </button>
      )}
    </div>
  );

  // ── IMG 번호 ─────────────────────────────────────────────────────
  const ImgNo = () => (
    <p style={{ fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
      color: muted, opacity: 0.3, marginTop: '0.4rem', textAlign: 'center' }}>
      IMG. {String(entryIndex + 1).padStart(3, '0')}
    </p>
  );

  // ════════════════════════════════════════════════════
  // 모바일 렌더 — 단일 컬럼, 표지 좌측 고정 작은 사이즈
  // ════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        <div style={{
          width: '100%', padding: '2rem 0 2rem',
          borderBottom: `1px solid ${rule}`,
          boxSizing: 'border-box',
        }}>
          <MetaLine />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            {hasCover && (
              <div style={{ flexShrink: 0 }}>
                <CoverImg w={72} h={100} />
                <ImgNo />
              </div>
            )}
            <TextBlock mobile />
          </div>
        </div>
        {modalOpen && (
          <MagModal entry={entry} locale={locale} formatDate={formatDate} onClose={() => setModalOpen(false)} />
        )}
      </>
    );
  }

  // ════════════════════════════════════════════════════
  // 데스크탑 렌더 — 기존 spec 기반
  // ════════════════════════════════════════════════════
  const cardStyle: React.CSSProperties = {
    width: spec.cardWidth,
    maxWidth: '100%',
    padding: '2.8rem 2.4rem 2.8rem 0',
    borderBottom: `1px solid ${rule}`,
    boxSizing: 'border-box',
    flexShrink: 0,
  };

  const coverW = spec.coverWidth;
  const coverH = spec.coverHeight;

  if (!hasCover) {
    return (
      <>
        <div style={cardStyle}>
          <MetaLine />
          {spec.accentNo && (
            <p style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 700,
              letterSpacing: '-0.05em', lineHeight: 1,
              color: 'var(--color-butter-text)', opacity: 0.05, marginBottom: '-0.6rem' }}>
              {String(entryIndex + 1).padStart(2, '0')}
            </p>
          )}
          <TextBlock />
        </div>
        {modalOpen && (
          <MagModal entry={entry} locale={locale} formatDate={formatDate} onClose={() => setModalOpen(false)} />
        )}
      </>
    );
  }

  if (spec.coverPos === 'top') {
    return (
      <>
        <div style={cardStyle}>
          <MetaLine />
          <CoverImg w={coverW} h={coverH} />
          <ImgNo />
          <div style={{ marginTop: '1rem' }}><TextBlock /></div>
        </div>
        {modalOpen && (
          <MagModal entry={entry} locale={locale} formatDate={formatDate} onClose={() => setModalOpen(false)} />
        )}
      </>
    );
  }

  if (spec.coverPos === 'right') {
    return (
      <>
        <div style={cardStyle}>
          <MetaLine />
          <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'flex-start' }}>
            <TextBlock />
            <div><CoverImg w={coverW} h={coverH} /><ImgNo /></div>
          </div>
        </div>
        {modalOpen && (
          <MagModal entry={entry} locale={locale} formatDate={formatDate} onClose={() => setModalOpen(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div style={cardStyle}>
        <MetaLine />
        <div style={{ display: 'flex', gap: '1.4rem', alignItems: 'flex-start' }}>
          <div><CoverImg w={coverW} h={coverH} /><ImgNo /></div>
          <TextBlock />
        </div>
      </div>
      {modalOpen && (
        <MagModal entry={entry} locale={locale} formatDate={formatDate} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// WORD CLOUD TAB  (d3-cloud)
// ══════════════════════════════════════════════════════════════════════════
interface CloudWord {
  text: string;
  size: number;
  type: WCFilter;
  x?: number; y?: number; rotate?: number;
}

const WordCloudTab = ({ entries, profile, locale }: {
  entries: any[]; profile: UserProfile | null; locale: string;
}) => {
  const [filter, setFilter] = useState<WCFilter>('all');
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef       = useRef<SVGSVGElement>(null);
  const [dims, setDims]         = useState({ w: 700, h: 440 });
  const [cloudWords, setCloudWords] = useState<CloudWord[]>([]);
  const [rendering, setRendering]   = useState(false);

  // 컨테이너 크기 감지
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.floor(e.contentRect.width);
      const n = rawWords.length;
      const ratio = n <= 5 ? 0.32 : n <= 10 ? 0.42 : n <= 20 ? 0.50 : 0.58;
      setDims({ w, h: Math.max(220, Math.floor(w * ratio)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 단어 빈도 집계
  const rawWords = useMemo((): CloudWord[] => {
    const freq = new Map<string, { count: number; type: WCFilter }>();
    const add = (word: string, type: WCFilter) => {
      if (!word?.trim() || word.trim().length < 1) return;
      const w = word.trim();
      const cur = freq.get(w);
      if (cur) cur.count++;
      else freq.set(w, { count: 1, type });
    };

    if (filter === 'all' || filter === 'emotion') {
      entries.forEach((e) => (e.emotions ?? []).forEach((em: string) => add(em, 'emotion')));
      profile?.recentEmotions?.forEach((em) => add(em, 'emotion'));
    }
    if (filter === 'all' || filter === 'author') {
      entries.forEach((e) => e.bookAuthor && add(e.bookAuthor, 'author'));
    }
    if (filter === 'all' || filter === 'theme') {
      profile?.dominantThemes?.forEach((t) => add(t, 'theme'));
      profile?.recentBookCategories?.forEach((c) => add(c, 'theme'));
    }

    const maxCount = Math.max(...[...freq.values()].map((v) => v.count), 1);
    const wordList = [...freq.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 50);

    // 단어 수가 적을수록 폰트 크기를 줄여서 좁은 영역에 자연스럽게 배치
    const n = wordList.length;
    const maxSize = n <= 5 ? 28 : n <= 10 ? 36 : n <= 20 ? 44 : 52;
    const minSize = n <= 5 ? 11 : n <= 10 ? 11 : 12;

    return wordList.map(([text, { count, type }]) => ({
      text,
      size: Math.round(minSize + (count / maxCount) * (maxSize - minSize)),
      type,
    }));
  }, [entries, profile, filter]);

  // d3-cloud 레이아웃 계산
  useEffect(() => {
    if (!rawWords.length || !dims.w) return;
    setRendering(true);

    const layout = cloud<CloudWord>()
      .size([dims.w, dims.h])
      .words(rawWords.map((w) => ({ ...w })))
      .padding(6)
      .rotate(() => (Math.random() > 0.75 ? (Math.random() > 0.5 ? 90 : -90) : 0))
      .font('Georgia, serif')
      .fontSize((d) => d.size!)
      .on('end', (words) => {
        setCloudWords(words as CloudWord[]);
        setRendering(false);
      });

    layout.start();
    return () => { layout.stop(); };
  }, [rawWords, dims]);

  const primary = C.primary();
  const muted   = C.muted();
  const surface = C.surface();

  // 타입별 불투명도
  const typeOpacity: Record<WCFilter, number> = {
    all: 1, emotion: 0.9, author: 0.6, theme: 0.45,
  };
  const getOpacity = (w: CloudWord) => {
    const base = filter === 'all' ? typeOpacity[w.type] : 0.85;
    return base;
  };
  const getFontStyle = (w: CloudWord) =>
    w.type === 'author' ? 'normal' : 'italic';
  const getFontWeight = (w: CloudWord) =>
    w.type === 'author' ? '400' : '300';

  const FILTER_LABELS: Record<WCFilter, { en: string; ko: string }> = {
    all:     { en: 'All',      ko: '전체' },
    emotion: { en: 'Emotions', ko: '감정' },
    author:  { en: 'Authors',  ko: '작가' },
    theme:   { en: 'Themes',   ko: '테마' },
  };

  if (!rawWords.length) {
    return <EmptyState message={locale === 'ko'
      ? '저널을 작성하면 워드클라우드가 만들어집니다.'
      : 'Write journal entries to build your word cloud.'} />;
  }

  return (
    <div>
      {/* 헤더 + 필터 */}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <h2 className="font-serif font-light" style={{ fontSize: '1.2rem', color: 'var(--color-butter-text)' }}>
            {locale === 'ko' ? '나의 독서 언어' : 'My Reading Language'}
          </h2>
          <p className="text-[12px] font-light mt-1" style={{ color: muted, opacity: 0.6 }}>
            {locale === 'ko'
              ? '자주 등장한 단어일수록 크게 표시됩니다.'
              : 'More frequent words appear larger.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(['all','emotion','author','theme'] as WCFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] font-medium transition-all"
              style={{
                borderRadius: '2px',
                border: `1px solid ${filter === f ? primary : C.rule()}`,
                background: filter === f ? primary : 'transparent',
                color: filter === f ? C.bg() : muted,
              }}>
              {FILTER_LABELS[f][locale as 'en'|'ko']}
            </button>
          ))}
        </div>
      </div>

      {/* 캔버스 */}
      <div ref={containerRef}
        style={{ background: 'var(--color-butter-surface)', borderRadius: '3px', overflow: 'hidden', minHeight: dims.h, position: 'relative' }}>
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 animate-spin"
              style={{ borderColor: `${primary}30`, borderTopColor: primary }} />
          </div>
        )}
        <svg ref={svgRef}
          width={dims.w} height={dims.h}
          style={{ display: 'block', opacity: rendering ? 0.3 : 1, transition: 'opacity 0.3s' }}>
          <g transform={`translate(${dims.w / 2},${dims.h / 2})`}>
            {cloudWords.map((w, i) => (
              <text
                key={`${w.text}-${i}`}
                transform={`translate(${w.x ?? 0},${w.y ?? 0}) rotate(${w.rotate ?? 0})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={w.size}
                fontFamily="Georgia, 'Gowun Batang', serif"
                fontStyle={getFontStyle(w)}
                fontWeight={getFontWeight(w)}
                fill={primary}
                fillOpacity={getOpacity(w)}
                style={{ cursor: 'default', userSelect: 'none' }}
              >
                {w.text}
              </text>
            ))}
          </g>
        </svg>
      </div>

      {/* 범례 (전체 보기일 때만) */}
      {filter === 'all' && (
        <div className="flex items-center gap-6 mt-5 flex-wrap">
          {([
            { type: 'emotion', label: locale === 'ko' ? '감정 (이탤릭, 진함)' : 'Emotion (italic, bold)' },
            { type: 'author',  label: locale === 'ko' ? '작가 (정체, 중간)' : 'Author (roman, mid)' },
            { type: 'theme',   label: locale === 'ko' ? '테마 (이탤릭, 흐림)' : 'Theme (italic, faded)' },
          ] as { type: WCFilter; label: string }[]).map(({ type, label }) => (
            <div key={type} className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: primary, opacity: typeOpacity[type] * 0.7 }} />
              <span className="text-[11px] font-light" style={{ color: muted, opacity: 0.7 }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ══════════════════════════════════════════════════════════════════════════
// HEXBIN TAB — 장르별 벌집 구획 + 감정 점
// 각 장르가 하나의 육각형 클러스터를 가짐
// 클러스터 안에 해당 장르 기록의 감정 점들이 찍힘
// ══════════════════════════════════════════════════════════════════════════

// 육각형 꼭짓점 계산 (flat-top)
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

// 육각형 중심 좌표 그리드 (offset grid)
function hexGrid(cols: number, rows: number, R: number): { col: number; row: number; x: number; y: number }[] {
  const dx = R * Math.sqrt(3);
  const dy = R * 1.5;
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * dx + (row % 2 === 1 ? dx / 2 : 0);
      const y = row * dy;
      cells.push({ col, row, x, y });
    }
  }
  return cells;
}

const HexbinTab = ({ entries, locale }: { entries: any[]; locale: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 760, h: 480 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.floor(e.contentRect.width);
      setDims({ w, h: Math.max(320, Math.floor(w * 0.62)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 장르(분위기 첫 태그) 집계
  const { genreData, emotionPalette } = useMemo(() => {
    const genreMap = new Map<string, { emotions: string[]; count: number }>();
    const emotionFreq = new Map<string, number>();

    entries.forEach((e) => {
      if (!e.bookTitle) return;
      const genre = e.emotions?.[0];
      if (!genre) return;
      if (!genreMap.has(genre)) genreMap.set(genre, { emotions: [], count: 0 });
      const g = genreMap.get(genre)!;
      g.count++;
      (e.emotions ?? []).forEach((em: string) => {
        g.emotions.push(em);
        emotionFreq.set(em, (emotionFreq.get(em) ?? 0) + 1);
      });
    });

    // 상위 장르 최대 12개
    const genreList = [...genreMap.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 12);

    // 전체 감정 목록 → 색상 팔레트
    const allEmotions = [...emotionFreq.keys()].sort((a, b) => (emotionFreq.get(b)! - emotionFreq.get(a)!));
    const PALETTE = [
      '#b5833a','#8b6f47','#c4956a','#6b5200','#d4a96a',
      '#a07850','#7a5c30','#c8aa7a','#956840','#b09060',
    ];
    const emotionPalette = new Map<string, string>(
      allEmotions.map((em, i) => [em, PALETTE[i % PALETTE.length]])
    );

    return { genreData: genreList, emotionPalette };
  }, [entries]);

  if (genreData.length === 0) {
    return <EmptyState message={locale === 'ko'
      ? '분위기와 함께 저널을 작성하면 지도가 채워집니다.'
      : 'Log entries with moods to populate the map.'} />;
  }

  const primary = '#6b5200';
  const n = genreData.length;

  // 클러스터 배치 — 전체를 큰 육각형 그리드로
  // 각 클러스터 육각형의 외접원 반지름 (클러스터 크기)
  const clusterR = Math.min(
    (dims.w * 0.88) / (Math.ceil(n / 3) * Math.sqrt(3) + 0.5),
    (dims.h * 0.78) / (Math.ceil(n / Math.ceil(n / 3)) * 1.5 + 0.5),
    120
  );

  const cols = Math.ceil(Math.sqrt(n * 1.3));
  const rows = Math.ceil(n / cols);
  const gridCells = hexGrid(cols, rows, clusterR + 4).slice(0, n);

  // 전체 그리드 중심 정렬
  const allX = gridCells.map((c) => c.x);
  const allY = gridCells.map((c) => c.y);
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const offsetX = (dims.w - (maxX - minX)) / 2 - minX;
  const offsetY = (dims.h - (maxY - minY)) / 2 - minY;

  // 클러스터 내부 점 배치
  // 점 반지름 고정 4px, 내부 beeswarm
  const DOT_R = 4;
  const innerR = clusterR * 0.78; // 클러스터 내부 사용 가능 반지름

  const clusterDots = genreData.map(([genre, { emotions }]) => {
      const placed: { x: number; y: number; color: string; emotion: string }[] = [];
      // 각 감정을 점으로 — 중복 포함, 최대 클러스터당 40개
      const dotEmotions = emotions.slice(0, 40);
      dotEmotions.forEach((em) => {
        const color = emotionPalette.get(em) ?? primary;
        let px = 0, py = 0, ok = false;
        for (let attempt = 0; attempt < 150; attempt++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * (innerR - DOT_R);
          const tx = Math.cos(angle) * r;
          const ty = Math.sin(angle) * r;
          const overlaps = placed.some((p) => Math.hypot(p.x - tx, p.y - ty) < DOT_R * 2.4);
          if (!overlaps) { px = tx; py = ty; ok = true; break; }
        }
        if (!ok) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * (innerR - DOT_R);
          px = Math.cos(angle) * r;
          py = Math.sin(angle) * r;
        }
        placed.push({ x: px, y: py, color, emotion: em });
      });
      return { genre, dots: placed };
    });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: '1.2rem', color: 'var(--color-butter-text)' }}>
          {locale === 'ko' ? '장르별 감정 지도' : 'Genre Emotion Map'}
        </h2>
        <p className="text-[12px] font-light mt-1" style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}>
          {locale === 'ko'
            ? '각 벌집 구획은 하나의 분위기 장르. 안의 점들은 기록된 감정입니다.'
            : 'Each hexagon is a mood genre. Dots inside represent logged emotions.'}
        </p>
      </div>

      <div ref={containerRef}
        style={{ background: '#ffffff', borderRadius: '3px', border: '1px solid rgba(107,82,0,0.08)', overflow: 'hidden' }}>
        <svg width={dims.w} height={dims.h} style={{ display: 'block' }}>
          {gridCells.map((cell, i) => {
            const [genre, { count }] = genreData[i];
            const cx = cell.x + offsetX;
            const cy = cell.y + offsetY;
            const { dots } = clusterDots[i];

            return (
              <g key={genre}>
                {/* 벌집 배경 */}
                <polygon
                  points={hexPoints(cx, cy, clusterR)}
                  fill={`rgba(107,82,0,${0.024 + (i % 2) * 0.018})`}
                  stroke="rgba(107,82,0,0.13)"
                  strokeWidth={1}
                />
                {/* 감정 점들 */}
                {dots.map((dot, di) => (
                  <circle
                    key={di}
                    cx={cx + dot.x}
                    cy={cy + dot.y}
                    r={DOT_R}
                    fill={dot.color}
                    fillOpacity={0.32}
                    stroke={dot.color}
                    strokeOpacity={0.6}
                    strokeWidth={0.8}
                  />
                ))}
                {/* 장르 레이블 */}
                <text
                  x={cx}
                  y={cy + clusterR - 10}
                  textAnchor="middle"
                  fontSize={Math.max(9, Math.min(11, clusterR * 0.18))}
                  fontFamily="var(--font-sans)"
                  fill="rgba(107,82,0,0.55)"
                  letterSpacing="0.06em"
                >
                  {genre.length > 7 ? genre.slice(0, 6) + '…' : genre}
                </text>
                {/* 기록 수 */}
                <text
                  x={cx}
                  y={cy + clusterR - 0}
                  textAnchor="middle"
                  fontSize={8}
                  fontFamily="var(--font-sans)"
                  fill="rgba(107,82,0,0.35)"
                >
                  {count}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 감정 색상 범례 */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
        {[...emotionPalette.entries()].slice(0, 10).map(([em, color]) => (
          <div key={em} className="flex items-center gap-1.5">
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, opacity: 0.65 }} />
            <span className="text-[11px] font-light" style={{ color: 'var(--color-butter-muted)', opacity: 0.7 }}>
              {em}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCORE TAB — 오선지 악보 형태 감정/장르 시각화

type ScoreMode = 'emotion' | 'genre';

// ══════════════════════════════════════════════════════════════════════════
// SCORE TAB — 단일 오선지, 각 줄=감정, 화음 묶음
// ══════════════════════════════════════════════════════════════════════════

// 음표 머리 (타원 기울임)
const NoteHead = ({ x, y, r = 5.2, fill = '#1c1a17', opacity = 0.8 }: {
  x: number; y: number; r?: number; fill?: string; opacity?: number;
}) => (
  <ellipse
    cx={x} cy={y} rx={r} ry={r * 0.72}
    transform={`rotate(-20,${x},${y})`}
    fill={fill} fillOpacity={opacity}
  />
);

// 오선지 — 5줄, 화면 전체 너비
const StaffLines = ({ x, y, width, step, color }: {
  x: number; y: number; width: number; step: number; color: string;
}) => (
  <>
    {[0,1,2,3,4].map((i) => (
      <line key={i}
        x1={x} y1={y + i * step}
        x2={x + width} y2={y + i * step}
        stroke={color} strokeWidth={0.85} />
    ))}
  </>
);

const ScoreTab = ({ entries, locale }: { entries: any[]; locale: string }) => {
  const [mode, setMode] = useState<ScoreMode>('emotion');
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgWidth, setSvgWidth] = useState(800);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; author: string } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSvgWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── 데이터 구조 ──────────────────────────────────────────────────────
  // dateGroups: 날짜 → 책들 배열
  // 책마다 { bookTitle, chordAxes[] } — 해당 책의 감정들이 하나의 화음
  const { axes, dateGroups } = useMemo(() => {
    // axis 빈도 집계
    const freqMap = new Map<string, number>();

    // 날짜 → 책별 entry 목록
    const dayBookMap = new Map<string, Map<string, string[]>>();
    // key: date, value: Map<bookTitle, emotions[]>
    const authorMap = new Map<string, string>(); // bookTitle → author

    entries.forEach((e) => {
      if (!e.bookTitle) return;
      const day = e.date.slice(0, 10);
      const book = e.bookTitle;
      if (e.bookAuthor) authorMap.set(book, e.bookAuthor);
      if (!dayBookMap.has(day)) dayBookMap.set(day, new Map());
      const bookMap = dayBookMap.get(day)!;
      if (!bookMap.has(book)) bookMap.set(book, []);

      // 감정 모드: 모든 emotions / 장르 모드: emotions[0] 하나만 (장르 역할)
      const values = mode === 'emotion'
        ? (e.emotions ?? [])
        : (e.emotions?.[0] ? [e.emotions[0]] : []);

      values.forEach((v: string) => {
        if (!bookMap.get(book)!.includes(v)) bookMap.get(book)!.push(v);
        freqMap.set(v, (freqMap.get(v) ?? 0) + 1);
      });
    });

    // axis: 빈도 내림차순
    const axes = [...freqMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([v]) => v);

    // dateGroups: 날짜순 정렬, 각 날짜에 책별 화음 배열
    const dateGroups = [...dayBookMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, bookMap]) => ({
        day,
        chords: [...bookMap.entries()].map(([bookTitle, axisValues]) => ({
          bookTitle,
          bookAuthor: authorMap.get(bookTitle) ?? '',
          axisValues,
        })),
      }));

    return { axes, dateGroups };
  }, [entries, mode]);

  if (axes.length === 0 || dateGroups.length === 0) {
    return <EmptyState message={locale === 'ko'
      ? '분위기와 함께 저널을 작성하면 악보가 채워집니다.'
      : 'Log entries with moods to compose your score.'} />;
  }

  // ── 레이아웃 ─────────────────────────────────────────────────────────
  // LABEL_W  : 감정 레이블 텍스트 전용 영역 (오선 왼쪽 바깥)
  // CLEF_W   : 높은음자리표가 그려지는 오선 위 빈 구간 (음표 없는 구역)
  // 오선은 LABEL_W 에서 시작, 음표는 LABEL_W + CLEF_W 부터 시작
  const LABEL_W   = 108;   // 레이블 텍스트 영역
  const CLEF_W    = 42;    // 클레프 전용 오선 구간 (빈 오선)
  const STAFF_X   = LABEL_W;          // 오선 시작 X
  const NOTE_X0   = LABEL_W + CLEF_W; // 음표 시작 X
  const PAD_R     = 20;
  const STEP      = 13;
  const PAD_V     = STEP * 3;
  const svgH      = PAD_V * 2 + axes.length * STEP;

  // 날짜 컬럼 너비
  const maxChordsPerDay = Math.max(...dateGroups.map((d) => d.chords.length), 1);
  const CHORD_SPACING = 22;
  const DAY_PAD       = 18;
  const dayColW = Math.max(DAY_PAD + maxChordsPerDay * CHORD_SPACING, 44);

  // 전체 악보 너비 — NOTE_X0 기준으로 날짜 컬럼 배치
  const scoreW  = dateGroups.length * dayColW;
  const totalW  = Math.max(svgWidth, NOTE_X0 + scoreW + PAD_R);

  // 축 Y
  const axisY = (i: number) => PAD_V + i * STEP;

  // 날짜 컬럼 X 시작 — NOTE_X0 부터
  const dayStartX = (di: number) => NOTE_X0 + di * dayColW;

  // 화음 X
  const chordX = (di: number, ci: number) =>
    dayStartX(di) + DAY_PAD + ci * CHORD_SPACING;

  const NOTE_R   = 4.8;
  const noteCol  = 'rgba(28,26,23,0.8)';
  const lineCol  = 'rgba(107,82,0,0.2)';
  const extCol   = 'rgba(107,82,0,0.08)';
  const mutedCol = 'rgba(94,87,79,0.5)';
  const primary  = '#6b5200';

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-end justify-between mb-7 flex-wrap gap-4">
        <div>
          <h2 className="font-serif font-light" style={{ fontSize: '1.2rem', color: 'var(--color-butter-text)' }}>
            {locale === 'ko' ? '독서 악보' : 'Reading Score'}
          </h2>
          <p className="text-[12px] font-light mt-1" style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}>
            {mode === 'emotion'
              ? (locale === 'ko'
                  ? '각 줄 = 감정. 같은 책의 감정들 = 화음. 다른 책 = 다른 음표.'
                  : "Each line = emotion. Same book's moods = chord. Different books = separate notes.")
              : (locale === 'ko'
                  ? '각 줄 = 장르. 날짜별 책마다 단음 하나.'
                  : 'Each line = genre. One note per book per day.')}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {([
            { v: 'emotion' as ScoreMode, en: 'Emotion', ko: '감정' },
            { v: 'genre'   as ScoreMode, en: 'Genre',   ko: '장르' },
          ]).map(({ v, en, ko }) => (
            <button key={v} onClick={() => setMode(v)}
              className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] font-medium transition-all"
              style={{
                borderRadius: '2px',
                border: `1px solid ${mode === v ? primary : 'rgba(107,82,0,0.15)'}`,
                background: mode === v ? primary : 'transparent',
                color: mode === v ? '#faf8f4' : mutedCol,
              }}>
              {locale === 'ko' ? ko : en}
            </button>
          ))}
        </div>
      </div>

      {/* 악보 — 가로 스크롤 */}
      <div ref={containerRef}
        style={{ background: '#ffffff', borderRadius: '3px', border: '1px solid rgba(107,82,0,0.08)', overflowX: 'auto' }}>
        <svg width={totalW} height={svgH} style={{ display: 'block' }}>

          {/* ── 오선 5줄 + 밖 줄들 ── */}
          {axes.map((_, i) => {
            const y = axisY(i);
            const isStaff = i < 5;
            return (
              <line key={`line-${i}`}
                x1={STAFF_X} y1={y}
                x2={totalW - PAD_R} y2={y}
                stroke={isStaff ? lineCol : extCol}
                strokeWidth={isStaff ? 0.85 : 0.5}
                strokeDasharray={isStaff ? undefined : '4,7'} />
            );
          })}

          {/* ── 날짜 컬럼 구분선 ── */}
          {dateGroups.map((_, di) => (
            <line key={`col-${di}`}
              x1={dayStartX(di)} y1={PAD_V - STEP}
              x2={dayStartX(di)} y2={svgH - PAD_V + STEP}
              stroke="rgba(107,82,0,0.05)"
              strokeWidth={1} />
          ))}

          {/* ── 오선 좌측 마감선 ── */}
          <line
            x1={STAFF_X} y1={axisY(0)}
            x2={STAFF_X} y2={axisY(4)}
            stroke={lineCol} strokeWidth={1.2} />

          {/* ── 클레프/음표 경계 세로선 (클레프 구간 끝) ── */}
          <line
            x1={NOTE_X0 - 4} y1={axisY(0)}
            x2={NOTE_X0 - 4} y2={axisY(4)}
            stroke={lineCol} strokeWidth={0.8} />

          {/* ── 높은음자리표 — 클레프 전용 구간(빈 오선) 위에 렌더 ── */}
          {(() => {
            const staffTop    = axisY(0);
            const staffBottom = axisY(4);
            const staffH      = staffBottom - staffTop;
            const clefFontSize = staffH * 2.1;
            // STAFF_X 바로 오른쪽에 배치 — 클레프 전용 구간 안에 위치
            const clefX = STAFF_X + 2;
            const clefY = staffBottom - staffH * 0.08;
            return (
              <text
                x={clefX} y={clefY}
                fontSize={clefFontSize}
                fontFamily="'Bravura', 'Noto Music', 'FreeSerif', Georgia, serif"
                fill="rgba(107,82,0,0.35)"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >𝄞</text>
            );
          })()}

          {/* ── 좌측 감정 레이블 ── */}
          {axes.map((axis, i) => {
            const y = axisY(i);
            const isStaff = i < 5;
            return (
              <text key={`lbl-${i}`}
                x={STAFF_X - 6} y={y + 1}
                textAnchor="end" dominantBaseline="middle"
                fontSize={8.5} fontStyle="italic"
                fill={isStaff ? 'rgba(94,87,79,0.6)' : 'rgba(94,87,79,0.3)'}>
                {axis.length > 12 ? axis.slice(0, 11) + '…' : axis}
              </text>
            );
          })}

          {/* ── 날짜 레이블 ── */}
          {dateGroups.map(({ day }, di) => (
            <text key={`dl-${day}`}
              x={dayStartX(di) + dayColW / 2} y={svgH - 9}
              textAnchor="middle" fontSize={7.5} fill="rgba(94,87,79,0.4)">
              {day.slice(5)}
            </text>
          ))}

          {/* ── 음표 ── */}
          {dateGroups.map(({ day, chords }, di) =>
            chords.map(({ bookTitle, bookAuthor, axisValues }, ci) => {
              const nx = chordX(di, ci);

              const noteIdxs = axisValues
                .map((v) => axes.indexOf(v))
                .filter((i) => i >= 0)
                .sort((a, b) => a - b);

              if (noteIdxs.length === 0) return null;

              const topIdx   = noteIdxs[0];
              const botIdx   = noteIdxs[noteIdxs.length - 1];
              const topY     = axisY(topIdx);
              const botY     = axisY(botIdx);
              const stemTopY = topY - STEP * 2.2;

              return (
                <g key={`${day}-${bookTitle}-${ci}`}
                  style={{ cursor: 'default' }}
                  onMouseEnter={() => setTooltip({ x: nx + NOTE_R + 6, y: topY - STEP, title: bookTitle, author: bookAuthor })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <line x1={nx + NOTE_R * 0.9} y1={topY} x2={nx + NOTE_R * 0.9} y2={stemTopY} stroke={noteCol} strokeWidth={1.15} />
                  {noteIdxs.length > 1 && (
                    <line x1={nx + NOTE_R * 0.9} y1={topY} x2={nx + NOTE_R * 0.9} y2={botY} stroke={noteCol} strokeWidth={1.15} />
                  )}
                  {noteIdxs.map((ni) => {
                    const ny = axisY(ni);
                    const needsLedger = ni >= 5;
                    return (
                      <g key={`nh-${ni}`}>
                        {needsLedger && (
                          <line x1={nx - 7} y1={ny} x2={nx + NOTE_R * 2 + 5} y2={ny} stroke="rgba(107,82,0,0.4)" strokeWidth={0.85} />
                        )}
                        <NoteHead x={nx} y={ny} r={NOTE_R} fill={noteCol} opacity={0.78} />
                      </g>
                    );
                  })}
                </g>
              );
            })
          )}

          {/* ── 툴팁 ── */}
          {tooltip && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={tooltip.x} y={tooltip.y - 20}
                width={Math.max(tooltip.title.length, tooltip.author.length) * 6.2 + 16}
                height={tooltip.author ? 36 : 22}
                rx={2}
                fill="var(--color-butter-surface)"
                stroke="rgba(107,82,0,0.15)"
                strokeWidth={0.8}
              />
              <text x={tooltip.x + 8} y={tooltip.y - 7}
                fontSize={9} fontFamily="var(--font-serif)" fontStyle="italic"
                fill="rgba(28,26,23,0.85)">
                {tooltip.title.length > 24 ? tooltip.title.slice(0, 23) + '…' : tooltip.title}
              </text>
              {tooltip.author && (
                <text x={tooltip.x + 8} y={tooltip.y + 7}
                  fontSize={8} fontFamily="var(--font-sans)"
                  fill="rgba(94,87,79,0.6)">
                  {tooltip.author.length > 24 ? tooltip.author.slice(0, 23) + '…' : tooltip.author}
                </text>
              )}
            </g>
          )}

        </svg>
      </div>

      <p className="text-[10px] mt-3 font-light" style={{ color: 'var(--color-butter-muted)', opacity: 0.35 }}>
        {locale === 'ko'
          ? `${dateGroups.length}일간의 기록 · ${axes.length}개의 ${mode === 'emotion' ? '감정' : '장르'}`
          : `${dateGroups.length} days · ${axes.length} ${mode === 'emotion' ? 'emotions' : 'genres'}`}
      </p>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// INTENSITY TAB — Narrative Arc + 감정별 강도 바
// ══════════════════════════════════════════════════════════════════════════

const IntensityTab = ({ emotions, summary, locale }: {
  emotions: EmotionData[]; summary: EmotionSummary | null; locale: string;
}) => {
  const arcRef      = useRef<SVGSVGElement>(null);
  const barRef      = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Narrative Arc ──────────────────────────────────────────────────
  useEffect(() => {
    const svgEl = arcRef.current;
    if (!svgEl || !emotions || !emotions.length) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const W = width, H = 200;
    const m = { top: 20, right: 20, bottom: 36, left: 40 };
    const iW = Math.max(1, W - m.left - m.right);
    const iH = H - m.top - m.bottom;
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const sorted = [...emotions].sort((a, b) => a.date.localeCompare(b.date));
    if (!sorted.length) return;

    const xScale = d3.scalePoint<string>()
      .domain(sorted.map(d => d.date))
      .range([0, iW]).padding(0.3);
    const yScale = d3.scaleLinear().domain([0, 10]).range([iH, 0]);

    // 격자
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-iW).tickFormat(() => ''))
      .call(ax => { ax.select('.domain').remove(); ax.selectAll('line').attr('stroke','rgba(107,82,0,0.07)').attr('stroke-dasharray','3,5'); });

    // X축
    const step = Math.max(1, Math.ceil(sorted.length / 10));
    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(xScale)
        .tickValues(sorted.filter((_, i) => i % step === 0).map(d => d.date))
        .tickSize(0))
      .call(ax => { ax.select('.domain').attr('stroke','rgba(107,82,0,0.12)'); ax.selectAll('text').attr('font-size',8.5).attr('fill','rgba(94,87,79,0.55)').attr('dy','1.2em').text(d => (d as string).slice(5)); });

    // Y축
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickSize(3))
      .call(ax => { ax.select('.domain').remove(); ax.selectAll('text').attr('font-size',8.5).attr('fill','rgba(94,87,79,0.5)'); });

    // 그라디언트
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient').attr('id','int-grad').attr('x1',0).attr('y1',0).attr('x2',0).attr('y2',1);
    grad.append('stop').attr('offset','0%').attr('stop-color','#6b5200').attr('stop-opacity',0.18);
    grad.append('stop').attr('offset','100%').attr('stop-color','#6b5200').attr('stop-opacity',0);

    const area = d3.area<EmotionData>()
      .x(d => xScale(d.date) ?? 0).y0(iH).y1(d => yScale(d.intensity))
      .curve(d3.curveCatmullRom.alpha(0.5));
    const line = d3.line<EmotionData>()
      .x(d => xScale(d.date) ?? 0).y(d => yScale(d.intensity))
      .curve(d3.curveCatmullRom.alpha(0.5));

    g.append('path').datum(sorted).attr('fill','url(#int-grad)').attr('d', area);
    g.append('path').datum(sorted).attr('fill','none').attr('stroke','#6b5200').attr('stroke-opacity',0.55).attr('stroke-width',1.5).attr('d', line);
    g.selectAll('circle').data(sorted).join('circle')
      .attr('cx', d => xScale(d.date) ?? 0).attr('cy', d => yScale(d.intensity))
      .attr('r', 3).attr('fill','#6b5200').attr('fill-opacity',0.65);

  }, [emotions, width]);

  // ── 감정별 평균 강도 바 ────────────────────────────────────────────
  useEffect(() => {
    const svgEl = barRef.current;
    const data = summary?.topEmotions;
    if (!svgEl || !data || !data.length) return;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const BAR_H = 22, GAP = 8;
    const W = width, m = { top: 8, right: 60, bottom: 24, left: 90 };
    const iW = Math.max(1, W - m.left - m.right);
    const H = m.top + data.length * (BAR_H + GAP) + m.bottom;
    svg.attr('height', H);

    const xScale = d3.scaleLinear().domain([0, 10]).range([0, iW]);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    data.forEach((d, i) => {
      const y = i * (BAR_H + GAP);
      g.append('text').attr('x',-6).attr('y', y + BAR_H/2 + 1)
        .attr('text-anchor','end').attr('dominant-baseline','middle')
        .attr('font-size',10).attr('font-style','italic').attr('fill','rgba(94,87,79,0.7)')
        .text(d.emotion.length > 10 ? d.emotion.slice(0,9)+'…' : d.emotion);
      g.append('rect').attr('x',0).attr('y',y).attr('width',iW).attr('height',BAR_H)
        .attr('fill','rgba(107,82,0,0.04)').attr('rx',2);
      g.append('rect').attr('x',0).attr('y',y)
        .attr('width', xScale(d.avgIntensity ?? 0)).attr('height',BAR_H)
        .attr('fill','#6b5200').attr('fill-opacity', 0.15 + ((d.avgIntensity ?? 0)/10)*0.45).attr('rx',2);
      g.append('text').attr('x', iW+8).attr('y', y+BAR_H/2+1)
        .attr('dominant-baseline','middle').attr('font-size',9.5).attr('font-family','var(--font-sans)')
        .attr('fill','rgba(107,82,0,0.6)').text((d.avgIntensity ?? 0).toFixed(1));
    });

    g.append('g').attr('transform', `translate(0,${data.length*(BAR_H+GAP)-GAP})`)
      .call(d3.axisBottom(xScale).ticks(5).tickSize(3))
      .call(ax => { ax.select('.domain').attr('stroke','rgba(107,82,0,0.1)'); ax.selectAll('text').attr('font-size',8).attr('fill','rgba(94,87,79,0.45)'); });

  }, [summary, width]);

  if (!emotions || !emotions.length) {
    return <EmptyState message={locale === 'ko' ? '감정 기록이 쌓이면 강도 차트가 만들어집니다.' : 'Log emotions to build the intensity chart.'} />;
  }

  const avgI = summary?.avgIntensity ?? 0;
  const mostIntense = summary?.topEmotions
    ?.slice()
    .sort((a, b) => (b.avgIntensity ?? 0) - (a.avgIntensity ?? 0))[0]?.emotion;

  return (
    <div ref={containerRef}>
      {/* 수치 카드 */}
      <div className="flex items-start gap-6 mb-10 flex-wrap">
        {[
          { label: locale === 'ko' ? '평균 감정 강도' : 'Avg Intensity', value: avgI.toFixed(1), sub: '/ 10' },
          { label: locale === 'ko' ? '총 감정 기록' : 'Total Logs', value: String(summary?.totalEntries ?? emotions.length), sub: '' },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ borderLeft: '2px solid #6b5200', paddingLeft: '1rem' }}>
            <p className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-1" style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}>{label}</p>
            <p className="font-serif font-light" style={{ fontSize: '2.2rem', color: 'var(--color-butter-primary)', lineHeight: 1 }}>{value}</p>
            {sub && <p className="text-[10px] mt-1" style={{ color: 'var(--color-butter-muted)', opacity: 0.5 }}>{sub}</p>}
          </div>
        ))}
        {mostIntense && (
          <div style={{ borderLeft: '2px solid #6b5200', paddingLeft: '1rem' }}>
            <p className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-1" style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}>
              {locale === 'ko' ? '가장 강렬한 감정' : 'Most Intense'}
            </p>
            <p className="font-serif font-light italic" style={{ fontSize: '1.5rem', color: 'var(--color-butter-primary)', lineHeight: 1.2 }}>{mostIntense}</p>
          </div>
        )}
      </div>

      <p className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-4" style={{ color: 'var(--color-butter-muted)', opacity: 0.55 }}>
        {locale === 'ko' ? '시간별 감정 강도' : 'Intensity over time'}
      </p>
      <div style={{ background: '#ffffff', borderRadius: '3px', border: '1px solid rgba(107,82,0,0.08)', marginBottom: '2rem' }}>
        <svg ref={arcRef} width={width} height={200} style={{ display: 'block' }} />
      </div>

      {summary?.topEmotions?.length ? (
        <>
          <p className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-4" style={{ color: 'var(--color-butter-muted)', opacity: 0.55 }}>
            {locale === 'ko' ? '감정별 평균 강도' : 'Avg intensity by emotion'}
          </p>
          <div style={{ background: '#ffffff', borderRadius: '3px', border: '1px solid rgba(107,82,0,0.08)' }}>
            <svg ref={barRef} width={width} height={300} style={{ display: 'block' }} />
          </div>
        </>
      ) : null}
    </div>
  );
};

// 세로 노드 목록, 반원 호로 연결
// ══════════════════════════════════════════════════════════════════════════

const ArcTab = ({ entries, locale }: { entries: any[]; locale: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 760, h: 500 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.floor(e.contentRect.width);
      setDims({ w, h: isMobile ? w * 1.1 : Math.max(420, w * 0.55) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  const { nodes, links } = useMemo(() => {
    const bookFreq  = new Map<string, number>();
    const emotionFreq = new Map<string, number>();
    const linkSet = new Map<string, number>();

    entries.forEach((e) => {
      if (!e.bookTitle) return;
      bookFreq.set(e.bookTitle, (bookFreq.get(e.bookTitle) ?? 0) + 1);
      (e.emotions ?? []).forEach((em: string) => {
        emotionFreq.set(em, (emotionFreq.get(em) ?? 0) + 1);
        const key = `${e.bookTitle}||${em}`;
        linkSet.set(key, (linkSet.get(key) ?? 0) + 1);
      });
    });

    const books = [...bookFreq.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => ({ id, type: 'book' as const }));
    const emotions = [...emotionFreq.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => ({ id, type: 'emotion' as const }));

    const nodeIds = new Set([...books.map(b => b.id), ...emotions.map(e => e.id)]);
    const nodes = [...books, ...emotions];

    const links: { source: string; target: string; value: number }[] = [];
    linkSet.forEach((value, key) => {
      const [src, tgt] = key.split('||');
      if (nodeIds.has(src) && nodeIds.has(tgt)) links.push({ source: src, target: tgt, value });
    });

    return { nodes, links };
  }, [entries]);

  // 감정별 고유 색상 팔레트
  const EMOTION_COLORS = [
    '#e05c5c', '#e08a3c', '#d4b432', '#5aaa6a', '#3a8fbf',
    '#7060c8', '#c050a0', '#3fbfb0', '#9a6040', '#708090',
  ];

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svg || !nodes.length) return;
    svg.selectAll('*').remove();

    const emotionNodes = nodes.filter(n => n.type === 'emotion');
    const emotionColorMap = new Map<string, string>(
      emotionNodes.map((n, i) => [n.id, EMOTION_COLORS[i % EMOTION_COLORS.length]])
    );

    const maxVal = Math.max(...links.map(l => l.value), 1);

    if (isMobile) {
      // ── 모바일: 세로 아크 (기존 방식) ──────────────────────────
      const NODE_H = 28;
      const LABEL_W = 160;
      const ARC_W = dims.w - LABEL_W - 16;
      const H = nodes.length * NODE_H + 48;
      svg.attr('height', H);

      const yPos = new Map<string, number>(
        nodes.map((n, i) => [n.id, 28 + i * NODE_H])
      );

      const arcG = svg.append('g').attr('transform', `translate(${LABEL_W},0)`);
      links.forEach(({ source, target, value }) => {
        const y1 = yPos.get(source); const y2 = yPos.get(target);
        if (y1 === undefined || y2 === undefined) return;
        const span = Math.abs(y2 - y1);
        const rx = Math.min(span * 0.55, ARC_W * 0.85);
        const ry = span / 2;
        const strokeW = 0.8 + (value / maxVal) * 2.2;
        const color = emotionColorMap.get(target) ?? emotionColorMap.get(source) ?? '#6b5200';
        arcG.append('path')
          .attr('d', `M 0 ${y1} A ${rx} ${ry} 0 0 1 0 ${y2}`)
          .attr('fill', 'none').attr('stroke', color)
          .attr('stroke-opacity', 0.35 + (value / maxVal) * 0.45)
          .attr('stroke-width', strokeW)
          .attr('data-source', source).attr('data-target', target)
          .attr('data-color', color)
          .attr('data-base-opacity', String(0.35 + (value / maxVal) * 0.45));
      });

      const labelG = svg.append('g');
      const allArcs = () => arcG.selectAll<SVGPathElement, unknown>('path');
      const onEnter = (id: string) => allArcs().each(function() {
        const el = d3.select(this);
        const connected = el.attr('data-source') === id || el.attr('data-target') === id;
        const base = parseFloat(el.attr('data-base-opacity') ?? '0.3');
        el.attr('stroke-opacity', connected ? Math.min(base * 2.2, 0.95) : base * 0.12);
      });
      const onLeave = () => allArcs().each(function() {
        const el = d3.select(this);
        el.attr('stroke-opacity', el.attr('data-base-opacity'));
      });

      nodes.forEach((n) => {
        const y = yPos.get(n.id)!;
        const isBook = n.type === 'book';
        const color = isBook ? 'var(--color-butter-primary)' : (emotionColorMap.get(n.id) ?? '#6b5200');
        labelG.append('rect').attr('x', 0).attr('y', y - 11)
          .attr('width', LABEL_W - 2).attr('height', 22)
          .attr('fill', 'transparent').style('cursor', 'default')
          .on('mouseenter', () => onEnter(n.id)).on('mouseleave', onLeave);
        labelG.append('circle').attr('cx', LABEL_W - 7).attr('cy', y)
          .attr('r', isBook ? 3.8 : 3).attr('fill', color).attr('fill-opacity', 0.8)
          .style('pointer-events', 'none');
        labelG.append('text').attr('x', LABEL_W - 14).attr('y', y + 1)
          .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
          .attr('font-size', isBook ? 10 : 9.5).attr('font-style', isBook ? 'normal' : 'italic')
          .attr('fill', isBook ? 'rgba(28,26,23,0.78)' : color).attr('fill-opacity', 0.75)
          .text(n.id.length > 16 ? n.id.slice(0, 15) + '…' : n.id);
      });

      const bookCount = nodes.filter(n => n.type === 'book').length;
      svg.append('line').attr('x1', 0).attr('y1', 28 + bookCount * NODE_H - NODE_H / 2)
        .attr('x2', LABEL_W - 2).attr('y2', 28 + bookCount * NODE_H - NODE_H / 2)
        .attr('stroke', 'rgba(107,82,0,0.12)').attr('stroke-dasharray', '3,4');

    } else {
      // ── 데스크탑: 가로 아크 ──────────────────────────────────────
      // 노드를 가로(X축)로 배치, 아크는 위로 솟는 반원
      const NODE_W = Math.max(60, Math.min(90, (dims.w - 40) / nodes.length));
      const LABEL_H = 72; // 레이블 영역 (하단)
      const ARC_AREA_H = dims.h - LABEL_H - 20;
      const W = nodes.length * NODE_W + 40;
      const totalW = Math.max(dims.w, W);
      svg.attr('height', dims.h);

      const xPos = new Map<string, number>(
        nodes.map((n, i) => [n.id, 24 + i * NODE_W + NODE_W / 2])
      );

      // 노드 배치 Y (레이블 위쪽)
      const nodeY = dims.h - LABEL_H;

      const arcG = svg.append('g');
      links.forEach(({ source, target, value }) => {
        const x1 = xPos.get(source); const x2 = xPos.get(target);
        if (x1 === undefined || x2 === undefined) return;
        const span = Math.abs(x2 - x1);
        // rx = 가로 반지름, ry = 세로 반지름 (아크 높이)
        const ry = Math.min(span * 0.6, ARC_AREA_H * 0.88);
        const rx = span / 2;
        const strokeW = 0.8 + (value / maxVal) * 2.5;
        const color = emotionColorMap.get(target) ?? emotionColorMap.get(source) ?? '#6b5200';
        const baseOp = 0.3 + (value / maxVal) * 0.5;
        arcG.append('path')
          // 위쪽으로 솟는 반타원 아크
          .attr('d', `M ${x1} ${nodeY} A ${rx} ${ry} 0 0 1 ${x2} ${nodeY}`)
          .attr('fill', 'none').attr('stroke', color)
          .attr('stroke-opacity', baseOp).attr('stroke-width', strokeW)
          .attr('data-source', source).attr('data-target', target)
          .attr('data-color', color).attr('data-base-opacity', String(baseOp));
      });

      // 노드 점 + 레이블
      const labelG = svg.append('g');
      const allArcs = () => arcG.selectAll<SVGPathElement, unknown>('path');
      const onEnter = (id: string) => allArcs().each(function() {
        const el = d3.select(this);
        const connected = el.attr('data-source') === id || el.attr('data-target') === id;
        const base = parseFloat(el.attr('data-base-opacity') ?? '0.3');
        el.attr('stroke-opacity', connected ? Math.min(base * 2.2, 0.95) : base * 0.1);
      });
      const onLeave = () => allArcs().each(function() {
        d3.select(this).attr('stroke-opacity', d3.select(this).attr('data-base-opacity'));
      });

      // 책/감정 구분선
      const bookCount = nodes.filter(n => n.type === 'book').length;
      const divX = 24 + bookCount * NODE_W;
      svg.append('line')
        .attr('x1', divX).attr('y1', nodeY - 18)
        .attr('x2', divX).attr('y2', dims.h - 8)
        .attr('stroke', 'rgba(107,82,0,0.12)').attr('stroke-dasharray', '3,4');

      nodes.forEach((n) => {
        const x = xPos.get(n.id)!;
        const isBook = n.type === 'book';
        const color = isBook
          ? C.primary()
          : (emotionColorMap.get(n.id) ?? '#6b5200');

        // 히트 영역
        labelG.append('rect').attr('x', x - NODE_W / 2).attr('y', nodeY - 12)
          .attr('width', NODE_W).attr('height', LABEL_H + 12)
          .attr('fill', 'transparent').style('cursor', 'default')
          .on('mouseenter', () => onEnter(n.id)).on('mouseleave', onLeave);

        // 점
        labelG.append('circle').attr('cx', x).attr('cy', nodeY)
          .attr('r', isBook ? 4.5 : 3.5).attr('fill', color).attr('fill-opacity', 0.85)
          .style('pointer-events', 'none');

        // 레이블 — 세로로 꺾어서 표시 (rotate)
        const label = n.id.length > 12 ? n.id.slice(0, 11) + '…' : n.id;
        labelG.append('text')
          .attr('x', x).attr('y', nodeY + 10)
          .attr('text-anchor', 'start')
          .attr('transform', `rotate(38, ${x}, ${nodeY + 10})`)
          .attr('font-size', isBook ? 9.5 : 9)
          .attr('font-style', isBook ? 'normal' : 'italic')
          .attr('fill', isBook ? 'rgba(28,26,23,0.72)' : color)
          .attr('fill-opacity', 0.8)
          .style('pointer-events', 'none')
          .text(label);
      });

      svg.attr('width', totalW);
    }

  }, [nodes, links, dims, isMobile]);

  if (!nodes.length) {
    return <EmptyState message={locale === 'ko'
      ? '책과 감정을 기록하면 아크 다이어그램이 만들어집니다.'
      : 'Log books and emotions to build the arc diagram.'} />;
  }

  const bookCount   = nodes.filter(n => n.type === 'book').length;
  const emotionCount = nodes.filter(n => n.type === 'emotion').length;
  const emotionNodes = nodes.filter(n => n.type === 'emotion');
  const emotionColorMap = new Map<string, string>(
    emotionNodes.map((n, i) => [n.id, EMOTION_COLORS[i % EMOTION_COLORS.length]])
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: '1.2rem', color: 'var(--color-butter-text)' }}>
          {locale === 'ko' ? '책 — 감정 연결망' : 'Books — Emotions Network'}
        </h2>
        <p className="text-[12px] font-light mt-1" style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}>
          {locale === 'ko'
            ? '호의 굵기는 연결 빈도. 색상은 감정을 나타냅니다.'
            : 'Arc thickness shows frequency. Colors represent distinct emotions.'}
        </p>
      </div>

      <div ref={containerRef}
        style={{ background: 'var(--color-butter-surface)', borderRadius: '3px',
          border: '1px solid var(--color-butter-rule)', overflowX: 'auto' }}>
        <svg ref={svgRef} width={dims.w} height={dims.h} style={{ display: 'block' }} />
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
        <div className="flex items-center gap-2">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary(), opacity: 0.8 }} />
          <span className="text-[11px] font-light" style={{ color: 'var(--color-butter-muted)', opacity: 0.7 }}>
            {locale === 'ko' ? `책 (${bookCount})` : `Books (${bookCount})`}
          </span>
        </div>
        {emotionNodes.slice(0, 6).map((n, i) => (
          <div key={n.id} className="flex items-center gap-1.5">
            <div style={{ width: 6, height: 6, borderRadius: '50%',
              background: EMOTION_COLORS[i % EMOTION_COLORS.length], opacity: 0.8 }} />
            <span className="text-[10px] font-light" style={{ color: 'var(--color-butter-muted)', opacity: 0.65 }}>
              {n.id}
            </span>
          </div>
        ))}
        {emotionCount > 6 && (
          <span className="text-[10px]" style={{ color: 'var(--color-butter-muted)', opacity: 0.45 }}>
            +{emotionCount - 6} more
          </span>
        )}
      </div>
    </div>
  );
};
