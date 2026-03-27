import { useLocale } from '../../hooks/useLocale';
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, Check, X, ArrowRight, ArrowLeft, BookOpen, Search, Loader2, Share2, Link as LinkIcon, Copy, Library, X as XIcon } from 'lucide-react';
import { JournalEntry, Book } from '../../types';
import { useJournal } from '../../hooks/useJournal';
import { createReflection, getBooks, getBookShelf, removeFromBookShelf } from '../../lib/api';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage } from '../ui';
import { getReflectionQuestions } from '../../lib/api';

const DEMO_USER_ID = 'demo-user-id'; // legacy — 더 이상 사용 안 함

// ── Prompt steps — backend content fields ─────────────────────────────────
interface Prompt {
  id: string;
  label: string;
  question: string;
  placeholder: string;
  hint: string;
  isHighlight?: boolean;
  isAtmosphere?: boolean;
}

function getPrompts(t: (k: any) => string): Prompt[] {
  return [
    { id: 'opening', label: t('prompt.opening.label'), question: t('prompt.opening.q'), placeholder: t('prompt.opening.p'), hint: t('prompt.opening.h') },
    { id: 'highlight', label: t('prompt.passage.label'), question: t('prompt.passage.q'), placeholder: t('prompt.passage.p'), hint: t('prompt.passage.h'), isHighlight: true },
    { id: 'emotion', label: t('prompt.emotion.label'), question: t('prompt.emotion.q'), placeholder: t('prompt.emotion.p'), hint: t('prompt.emotion.h') },
    { id: 'mirror', label: t('prompt.reflection.label'), question: t('prompt.reflection.q'), placeholder: t('prompt.reflection.p'), hint: t('prompt.reflection.h') },
    { id: 'linger', label: t('prompt.lingering.label'), question: t('prompt.lingering.q'), placeholder: t('prompt.lingering.p'), hint: t('prompt.lingering.h') },
    { id: 'atmosphere', label: t('prompt.atmosphere.label'), question: t('prompt.atmosphere.q'), placeholder: '', hint: t('prompt.atmosphere.h'), isAtmosphere: true },
  ];
}

function getAtmospheres(t: (k: any) => string): string[] {
  return [
    t('atm.contemplative'), t('atm.moved'), t('atm.melancholy'), t('atm.nostalgic'),
    t('atm.inspired'), t('atm.unsettled'), t('atm.joyful'), t('atm.awe'),
    t('atm.anxious'), t('atm.pensive'), t('atm.calm'),
  ];
}

type PromptId = 'opening' | 'highlight' | 'emotion' | 'mirror' | 'linger' | 'atmosphere';
type JournalView = 'write' | 'archive';

// ── Book context type ──────────────────────────────────────────────────────
interface BookContext {
  bookId: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  bookCover: string | null;
}

const EMPTY_BOOK: BookContext = {
  bookId: null,
  bookTitle: null,
  bookAuthor: null,
  bookCover: null,
};

// ── Journal page ──────────────────────────────────────────────────────────
export const Journal = () => {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const bookContext: BookContext = location.state ?? EMPTY_BOOK;

  const [view, setView] = useState<JournalView>('write');
  const [shelfOpen, setShelfOpen] = useState(false);
  const [shelfItems, setShelfItems] = useState<any[]>([]);
  const [shelfLoading, setShelfLoading] = useState(false);

  const openShelf = () => {
    setShelfOpen(true);
    setShelfLoading(true);
    getBookShelf()
      .then(setShelfItems)
      .catch(() => {})
      .finally(() => setShelfLoading(false));
  };
  const { entries, loading, error, create, update, remove } = useJournal(view === 'archive');

  return (
    <div className="min-h-screen bg-butter-bg">

      {/* ── Page header ── */}
      <div className="pt-16 md:pt-24 pb-6 md:pb-8 px-5 md:px-14 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-butter-muted/70 font-medium mb-4">
          {t('journal.label')}
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem] md:text-[2.6rem] font-serif font-black leading-[1.1] tracking-tight mb-3 md:mb-4">
              {t('journal.title')}{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--color-butter-primary)', fontWeight: 700 }}>
                {t('journal.title.em')}
              </em>
            </h1>
            <p className="text-butter-muted leading-[1.75] max-w-sm font-light text-[15px]">
              {t('journal.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-5 pb-1 shrink-0">
            {(['write', 'archive'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`pb-1.5 text-[11px] uppercase tracking-[0.18em] font-medium transition-all duration-200 ${
                  view === v ? 'text-butter-text' : 'text-butter-muted hover:text-butter-text'
                }`}
                style={view === v ? { borderBottom: '1px solid var(--color-butter-text)' } : {}}
              >
                {v === 'write' ? t('journal.tab.write') : t('journal.tab.archive')}
              </button>
            ))}
            <button
              onClick={openShelf}
              className="pb-1.5 text-[11px] uppercase tracking-[0.18em] font-medium text-butter-muted hover:text-butter-text transition-all duration-200"
            >
              {locale === 'ko' ? '서재' : 'Library'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }} />

      <div className="px-5 md:px-14 max-w-7xl mx-auto py-8 md:py-14">
        <AnimatePresence mode="wait">
          {view === 'write' ? (
            <WriteView key="write" onCreate={create} onSaved={() => setView('archive')} bookContext={bookContext} />
          ) : (
            <ArchiveView
              key="archive"
              entries={entries}
              loading={loading}
              error={error}
              onUpdate={update}
              onDelete={remove}
              onSwitchToWrite={() => setView('write')}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── 서재 모달 ── */}
      <AnimatePresence>
        {shelfOpen && (
          <>
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              onClick={() => setShelfOpen(false)}
            />
            {/* 모달 패널 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed inset-x-4 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] top-1/2 -translate-y-1/2 z-50 rounded-xl overflow-hidden"
              style={{ background: 'var(--color-butter-bg)', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
                <div className="flex items-center gap-2">
                  <Library size={15} strokeWidth={1.5} style={{ color: 'var(--color-butter-primary)' }} />
                  <h2 className="text-[13px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--color-butter-text)' }}>
                    {locale === 'ko' ? '내 서재' : 'My Library'}
                  </h2>
                </div>
                <button
                  onClick={() => setShelfOpen(false)}
                  className="transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-butter-muted)' }}
                >
                  <XIcon size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* 모달 바디 */}
              <div className="overflow-y-auto flex-1 px-6 py-4">
                {shelfLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-butter-accent)', borderTopColor: 'var(--color-butter-primary)' }} />
                  </div>
                ) : shelfItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Library size={28} strokeWidth={1} className="mx-auto mb-3" style={{ color: 'var(--color-butter-muted)', opacity: 0.4 }} />
                    <p className="font-serif italic text-[14px]" style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}>
                      {locale === 'ko' ? '서재가 비어 있습니다.' : 'Your library is empty.'}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-0">
                    {shelfItems.map((item, i) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-4 py-4 group"
                        style={{ borderBottom: i < shelfItems.length - 1 ? '1px solid var(--color-butter-rule)' : 'none' }}
                      >
                        {/* 커버 썸네일 — 클릭 시 상세 페이지 */}
                        <div
                          className="w-9 h-12 rounded-sm overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ background: 'var(--color-butter-accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                          onClick={() => { setShelfOpen(false); navigate(`/explore/${item.bookId}`); }}
                        >
                          {item.bookCover ? (
                            <img src={item.bookCover} alt={item.bookTitle} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : null}
                        </div>

                        {/* 텍스트 — 제목 클릭 시 상세 페이지 */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-serif font-light leading-snug truncate cursor-pointer hover:text-butter-primary transition-colors"
                            style={{ fontSize: '14px', color: 'var(--color-butter-text)' }}
                            onClick={() => { setShelfOpen(false); navigate(`/explore/${item.bookId}`); }}
                          >
                            {item.bookTitle}
                          </p>
                          <p className="font-light italic truncate mt-0.5" style={{ fontSize: '12px', color: 'var(--color-butter-muted)' }}>
                            {item.bookAuthor}
                          </p>
                          <p className="mt-1" style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.55, letterSpacing: '0.05em' }}>
                            {new Date(item.addedAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={async () => {
                            await removeFromBookShelf(item.bookId).catch(() => {});
                            setShelfItems(prev => prev.filter(s => s.id !== item.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          style={{ color: 'var(--color-butter-muted)' }}
                          title={locale === 'ko' ? '서재에서 제거' : 'Remove'}
                        >
                          <XIcon size={13} strokeWidth={1.5} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 모달 푸터 */}
              {shelfItems.length > 0 && (
                <div className="px-6 py-3" style={{ borderTop: '1px solid var(--color-butter-rule)' }}>
                  <p className="text-center" style={{ fontSize: '11px', color: 'var(--color-butter-muted)', opacity: 0.55 }}>
                    {locale === 'ko'
                      ? `${shelfItems.length}권이 서재에 보관되어 있습니다.`
                      : `${shelfItems.length} book${shelfItems.length > 1 ? 's' : ''} in your library.`}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── WriteView ──────────────────────────────────────────────────────────────

interface WriteViewProps {
  onCreate: (payload: {
    content: string;
    prompt: string;
    mood: string;
    emotions: string[];
    intensity: number;
    highlight?: string | null;
    bookId?: string | null;
    bookTitle?: string | null;
    bookAuthor?: string | null;
    bookCover?: string | null;
  }) => Promise<{ id: string }>;
  onSaved: () => void;
  bookContext: BookContext;
}

type WritePhase = 'prompts' | 'summary';

const WriteView = ({ onCreate, onSaved, bookContext }: WriteViewProps) => {
  const { t } = useLocale();
  const PROMPTS = getPrompts(t);
  const ATMOSPHERES = getAtmospheres(t);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<PromptId, string>>({
    opening: '', highlight: '', emotion: '', mirror: '', linger: '', atmosphere: '',
  });
  const [selectedAtmospheres, setSelectedAtmospheres] = useState<string[]>([]);
  const [phase, setPhase] = useState<WritePhase>('prompts');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // activeBook: navigation에서 전달된 bookContext로 초기화, 검색으로 교체 가능
  const [activeBook, setActiveBook] = useState<BookContext>(bookContext);

  // ── GPT 질문 state (EN + KO 분리 보관) ──
  const [gptQuestions, setGptQuestions]     = useState<string[]>([]);
  const [gptQuestionsKo, setGptQuestionsKo] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // 책이 변경될 때마다 GPT 질문 fetch
  const handleBookChange = (book: BookContext) => {
    setActiveBook(book);
    if (book.bookTitle && book.bookAuthor) {
      setGptQuestions([]);
      setGptQuestionsKo([]);
      setQuestionsLoading(true);
      getReflectionQuestions({
        bookTitle: book.bookTitle,
        bookAuthor: book.bookAuthor,
      })
        .then((res) => {
          setGptQuestions(res.questions);
          setGptQuestionsKo(res.questionsKo ?? []);
        })
        .catch(() => { setGptQuestions([]); setGptQuestionsKo([]); })
        .finally(() => setQuestionsLoading(false));
    } else {
      setGptQuestions([]);
      setGptQuestionsKo([]);
    }
  };

  // BookDetail에서 책과 함께 진입한 경우 초기 질문 자동 fetch
  useEffect(() => {
    if (bookContext.bookTitle && bookContext.bookAuthor) {
      setQuestionsLoading(true);
      getReflectionQuestions({
        bookTitle: bookContext.bookTitle,
        bookAuthor: bookContext.bookAuthor,
      })
        .then((res) => {
          setGptQuestions(res.questions);
          setGptQuestionsKo(res.questionsKo ?? []);
        })
        .catch(() => { setGptQuestions([]); setGptQuestionsKo([]); })
        .finally(() => setQuestionsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 1회만

  const current = PROMPTS[step];
  const isFirst = step === 0;
  const isLast = step === PROMPTS.length - 1;
  const progress = phase === 'summary' ? 100 : ((step + 1) / PROMPTS.length) * 100;

  const canProceed = current.isAtmosphere
    ? selectedAtmospheres.length > 0
    : answers[current.id as PromptId].trim().length > 0;

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goPrev = () => { setDirection(-1); setStep((s) => s - 1); };
  const skipStep = () => { setDirection(1); setStep((s) => s + 1); };

  const handleFinish = () => {
    setDirection(1);
    setPhase('summary');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const journalContent = PROMPTS
        .filter((p) => !p.isAtmosphere && answers[p.id as PromptId].trim())
        .map((p) => `[${p.label}]\n${answers[p.id as PromptId].trim()}`)
        .join('\n\n');

      const primaryMood = selectedAtmospheres[0] ?? '';
      const intensity = Math.min(10, Math.max(1, selectedAtmospheres.length * 2 + 3));

      const entry = await onCreate({
        content: journalContent || answers.opening.trim() || 'A quiet reflection.',
        prompt: PROMPTS[step]?.question ?? '',
        mood: primaryMood,
        emotions: selectedAtmospheres,
        intensity,
        highlight: answers.highlight.trim() || null,
        bookId: activeBook.bookId ?? null,
        bookTitle: activeBook.bookTitle ?? null,
        bookAuthor: activeBook.bookAuthor ?? null,
        bookCover: activeBook.bookCover ?? null,
      });

      // reflection content: 빈 경우 journalContent → 최종 fallback 'A quiet reflection.'
      const reflectionContent =
        [answers.opening, answers.mirror, answers.linger].filter(Boolean).join(' ').trim()
        || journalContent
        || 'A quiet reflection.';

      await createReflection({
        title: `A reflection on: ${answers.opening.trim().split(' ').slice(0, 6).join(' ') || 'my reading'}…`,
        content: reflectionContent,
        author: 'Reader',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=butter',
        tags: selectedAtmospheres,
        journalEntryId: entry.id,
        bookId: activeBook.bookId ?? null,
        bookTitle: activeBook.bookTitle ?? null,
        bookAuthor: activeBook.bookAuthor ?? null,
      });

      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); onSaved(); }, 1200);
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row gap-8 md:gap-16 xl:gap-24 pb-0">

        {/* ── Left col: book + progress context ── */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
          <div className="lg:sticky lg:top-28 space-y-5 md:space-y-8">

            {/* Book context — search 기능 포함 */}
            <BookContextPanel
              bookContext={activeBook}
              onBookChange={handleBookChange}
            />

            {/* GPT 질문 — 책이 선택됐을 때 좌측 패널에 표시 */}
            {phase === 'prompts' && (activeBook.bookTitle) && (
              <GptQuestionsPanel
                questions={gptQuestions}
                questionsKo={gptQuestionsKo}
                loading={questionsLoading}
              />
            )}

            {/* {t('journal.progress')} indicator — 현재 스텝과 전체 흐름 */}
            {phase === 'prompts' && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}>
                <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-butter-muted/60 mb-4">
                  Progress
                </p>
                <div className="space-y-2.5">
                  {PROMPTS.map((p, i) => {
                    const done = i < step;
                    const active = i === step;
                    const hasAnswer = p.isAtmosphere
                      ? selectedAtmospheres.length > 0
                      : answers[p.id as PromptId].trim().length > 0;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div
                          className="w-1 h-1 rounded-full shrink-0 transition-all duration-300"
                          style={{
                            background: active
                              ? 'var(--color-butter-primary)'
                              : done && hasAnswer
                              ? 'var(--color-butter-primary)'
                              : 'rgba(0,0,0,0.15)',
                            width: active ? '6px' : '4px',
                            height: active ? '6px' : '4px',
                          }}
                        />
                        <span
                          className="text-[11px] transition-colors duration-200"
                          style={{
                            color: active
                              ? 'var(--color-butter-text)'
                              : done && hasAnswer
                              ? 'var(--color-butter-primary)'
                              : 'var(--color-butter-muted)',
                            fontWeight: active ? 500 : 400,
                          }}
                        >
                          {p.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hint for current step */}
            {phase === 'prompts' && current.hint && (
              <p className="text-[12px] text-butter-muted/65 font-light italic leading-[1.7]">
                {current.hint}
              </p>
            )}
          </div>
        </aside>

        {/* ── Right col: writing area ── */}
        <main className="flex-1 min-w-0 max-w-2xl">

          <AnimatePresence mode="wait">
            {phase === 'prompts' && (
              <motion.div
                key={`step-${step}`}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 32 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: d * -32 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.26, ease: 'easeInOut' }}
              >
                {/* Progress bar */}
                <div
                  className="mb-5 md:mb-10"
                  style={{ background: 'rgba(0,0,0,0.06)', height: '1px' }}
                >
                  <motion.div
                    style={{ background: 'var(--color-butter-primary)', height: '1px' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>

                {/* Step label + counter */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-butter-primary">
                    {current.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-butter-muted/65">
                    {step + 1} / {PROMPTS.length}
                  </span>
                </div>

                {/* Question */}
                <h2 className="text-2xl md:text-[1.75rem] font-serif font-light leading-[1.35] mb-5 md:mb-8 text-butter-text">
                  {current.question}
                </h2>

                {/* Input area */}
                {current.isAtmosphere ? (
                  <div className="mb-10">
                    <div className="flex flex-wrap gap-2.5">
                      {ATMOSPHERES.map((a) => {
                        const active = selectedAtmospheres.includes(a);
                        return (
                          <button
                            key={a}
                            onClick={() =>
                              setSelectedAtmospheres((prev) =>
                                prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                              )
                            }
                            className="px-4 py-1.5 text-[12px] font-medium transition-all duration-150"
                            style={{
                              borderRadius: '2px',
                              border: active
                                ? '1px solid var(--color-butter-primary)'
                                : '1px solid rgba(0,0,0,0.12)',
                              background: active ? 'var(--color-butter-primary)' : 'transparent',
                              color: active ? '#ffffff' : 'var(--color-butter-muted)',
                            }}
                          >
                            {a}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : current.isHighlight ? (
                  // Highlight input — borderLeft quote style
                  <div
                    className="mb-10 relative"
                    style={{ borderLeft: '2px solid rgba(107,82,0,0.18)' }}
                  >
                    <span
                      className="absolute -top-3 left-4 font-serif text-3xl leading-none select-none"
                      style={{ color: 'rgba(107,82,0,0.15)' }}
                    >
                      "
                    </span>
                    <textarea
                      autoFocus
                      value={answers[current.id as PromptId]}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
                      }
                      placeholder={current.placeholder}
                      rows={4}
                      className="w-full bg-transparent pl-6 pr-4 pt-4 pb-4 text-[16px] font-serif italic leading-[1.85] resize-none focus:outline-none text-butter-text/80 placeholder:text-butter-muted/55"
                    />
                  </div>
                ) : (
                  // Regular textarea
                  <textarea
                    autoFocus
                    value={answers[current.id as PromptId]}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
                    }
                    placeholder={current.placeholder}
                    rows={5}
                    className="w-full bg-transparent text-[17px] font-serif leading-[1.9] resize-none focus:outline-none text-butter-text/85 placeholder:text-butter-muted/55 mb-6 md:mb-10"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '1.5rem' }}
                  />
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={goPrev}
                    disabled={isFirst}
                    className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-butter-muted hover:text-butter-text transition-colors disabled:opacity-0 disabled:pointer-events-none px-4 py-2"
                    style={{ border: '1px solid rgba(0,0,0,0.10)', borderRadius: '2px' }}
                  >
                    <ArrowLeft size={12} /> {t('journal.back')}
                  </button>

                  <button
                    onClick={skipStep}
                    className={`text-[11px] font-medium uppercase tracking-[0.14em] text-butter-muted/65 hover:text-butter-muted transition-colors px-3 py-2 ${
                      isLast ? 'invisible' : ''
                    }`}
                  >
                    {t('journal.skip')}
                  </button>

                  {isLast ? (
                    <button
                      onClick={handleFinish}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-7 py-2.5 bg-butter-primary text-white font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all text-[11px] disabled:opacity-40"
                      style={{ borderRadius: '2px' }}
                    >
                      {t('journal.review')} <ArrowRight size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={goNext}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-7 py-2.5 bg-butter-primary text-white font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all text-[11px] disabled:opacity-40"
                      style={{ borderRadius: '2px' }}
                    >
                      {t('journal.next')} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {phase === 'summary' && (
              <motion.div
                key="summary"
                custom={1}
                variants={{
                  enter: () => ({ opacity: 0, x: 32 }),
                  center: { opacity: 1, x: 0 },
                  exit: () => ({ opacity: 0, x: -32 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Summary header */}
                <div className="mb-10" style={{ background: 'var(--color-butter-primary)', height: '1px' }} />
                <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-butter-primary mb-4 block">
                  {t('journal.review.label')}
                </span>
                <h2 className="text-2xl md:text-[1.75rem] font-serif font-light leading-[1.35] mb-2 text-butter-text">
                  {t('journal.review.title')}
                </h2>
                <p className="text-[13px] text-butter-muted font-light leading-[1.7] mb-10">
                  {t('journal.review.subtitle')}
                </p>

                {/* Answers review */}
                <div className="space-y-8 mb-10">
                  {PROMPTS.filter((p) => !p.isAtmosphere).map((p) => {
                    const val = answers[p.id as PromptId].trim();
                    if (!val) return null;
                    return (
                      <div
                        key={p.id}
                        style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}
                      >
                        <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-butter-primary/70 mb-2">
                          {p.label}
                        </p>
                        {p.isHighlight ? (
                          <p className="text-[15px] font-serif italic text-butter-text/70 leading-[1.85]">
                            "{val}"
                          </p>
                        ) : (
                          <p className="text-[15px] text-butter-text/80 font-light leading-[1.85]">{val}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Atmosphere summary */}
                {selectedAtmospheres.length > 0 && (
                  <div
                    className="mb-10"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}
                  >
                    <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-butter-primary/70 mb-3">
                      Atmosphere
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAtmospheres.map((a) => (
                        <span
                          key={a}
                          className="text-[11px] font-medium px-3 py-1 uppercase tracking-[0.1em]"
                          style={{
                            border: '1px solid rgba(107,82,0,0.30)',
                            borderRadius: '2px',
                            color: 'var(--color-butter-primary)',
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save CTA */}
                <div
                  className="flex items-center justify-between pt-6"
                  style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
                >
                  <button
                    onClick={() => { setDirection(-1); setPhase('prompts'); setStep(PROMPTS.length - 1); }}
                    className="flex items-center gap-2 px-5 py-2.5 text-butter-muted hover:text-butter-text text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                    style={{ border: '1px solid rgba(0,0,0,0.10)', borderRadius: '2px' }}
                  >
                    <ArrowLeft size={12} /> {t('journal.edit')}
                  </button>

                  <div className="text-right">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`flex items-center gap-2.5 px-8 py-3 font-medium uppercase tracking-[0.14em] text-[11px] transition-all disabled:opacity-50 ${
                        saveSuccess ? 'bg-green-600 text-white' : 'bg-butter-primary text-white hover:brightness-110'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      {saveSuccess ? (
                        <><Check size={12} /> {t('journal.saved')}</>
                      ) : saving ? t('journal.saving') : (
                        <><span style={{ fontSize: '14px' }}>📖</span> {t('journal.save')}</>
                      )}
                    </button>
                    <p className="text-[10px] text-butter-muted/55 mt-2 font-light italic">
                      {t('journal.archive.note')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
  );
};

// ── GptQuestionsPanel ──────────────────────────────────────────────────────
// 책이 선택됐을 때 좌측 패널에 표시되는 GPT 생성 질문 힌트

const GptQuestionsPanel = ({
  questions,
  questionsKo,
  loading,
}: {
  questions: string[];
  questionsKo: string[];
  loading: boolean;
}) => {
  const { locale, t } = useLocale();

  // locale에 맞는 질문 선택 — KO 번역이 없으면 EN fallback
  const displayQuestions = locale === 'ko' && questionsKo.length > 0 ? questionsKo : questions;

  if (!loading && displayQuestions.length === 0) return null;

  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}>
      <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-butter-muted/65 mb-4">
        {t('journal.questions.label')}
      </p>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 rounded-sm animate-pulse"
              style={{ background: 'rgba(0,0,0,0.06)', width: `${70 + i * 8}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {displayQuestions.map((q, i) => (
            <p
              key={i}
              className="text-[12px] text-butter-muted font-light leading-[1.7] italic"
              style={{ color: 'var(--color-butter-muted)' }}
            >
              — {q}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// ── BookContextPanel — with inline book search ─────────────────────────────

const BookContextPanel = ({
  bookContext,
  onBookChange,
}: {
  bookContext: BookContext;
  onBookChange: (book: BookContext) => void;
}) => {
  const { locale, t } = useLocale();
  const hasBook = !!(bookContext.bookTitle && bookContext.bookAuthor);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSearch = () => {
    setSearching(true);
    setQuery('');
    setResults([]);
    setSearchError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
    setResults([]);
    setSearchError('');
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');
      try {
        const books = await getBooks({ search: value.trim(), lang: locale });
        setResults(books.slice(0, 6));
      } catch {
        setSearchError(t('journal.book.searchfail'));
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSelect = (book: Book) => {
    onBookChange({
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCover: book.cover,
    });
    closeSearch();
  };

  const handleClear = () => {
    onBookChange({ bookId: null, bookTitle: null, bookAuthor: null, bookCover: null });
  };

  // ── 검색 모드 ──
  if (searching) {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-butter-muted/60 mb-4">
          {t('journal.book.label')}
        </p>

        {/* 비활성 상태와 동일한 surface 컨테이너 */}
        <div
          className="p-4"
          style={{ background: 'var(--color-butter-surface)', borderRadius: '3px' }}
        >
          {/* 검색 input — 컨테이너 안에 자연스럽게 */}
          <div
            className="flex items-center gap-2 px-3 py-2 mb-3"
            style={{
              background: 'var(--color-butter-bg)',
              borderRadius: '2px',
              border: '1px solid var(--color-butter-rule)',
            }}
          >
            <Search size={12} className="text-butter-muted/65 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              {...{placeholder: t('journal.book.search')}}
              className="flex-1 text-[13px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/35 font-light"
            />
            {searchLoading && <Loader2 size={12} className="text-butter-muted/65 animate-spin shrink-0" />}
            <button onClick={closeSearch} className="text-butter-muted/55 hover:text-butter-muted transition-colors shrink-0">
              <X size={13} />
            </button>
          </div>

          {/* 안내 문구 */}
          {!query.trim() && (
            <p className="text-[11px] text-butter-muted/65 font-light italic leading-[1.6]">
              {t('journal.book.typing')}
            </p>
          )}
          {query.trim().length > 0 && query.trim().length < 3 && (
            <p className="text-[11px] text-butter-muted/65 font-light italic leading-[1.6]">
              {t('journal.book.keeptyping')}
            </p>
          )}
          {searchError && (
            <p className="text-[11px] text-red-400 font-light">{searchError}</p>
          )}

          {/* 검색 결과 */}
          {!searchLoading && results.length > 0 && (
            <div className="space-y-0.5">
              {results.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleSelect(book)}
                  className="w-full flex items-center gap-3 px-2 py-2 text-left transition-colors group"
                  style={{ borderRadius: '2px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-butter-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="shrink-0 overflow-hidden"
                    style={{ width: '28px', aspectRatio: '2/3', borderRadius: '1px', background: 'var(--color-butter-accent)' }}
                  >
                    <BookCoverImage
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-butter-text leading-snug line-clamp-1 group-hover:text-butter-primary transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-butter-muted font-light italic line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searchLoading && query.trim().length >= 3 && results.length === 0 && !searchError && (
            <p className="text-[12px] text-butter-muted/65 font-light italic">
              {t('journal.book.noresult')} \"{query}\"
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── 책이 선택된 상태 ──
  if (hasBook) {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-butter-muted/60 mb-4">
          Currently Reflecting On
        </p>
        <div className="flex gap-4 items-start mb-4">
          <div
            className="shrink-0 overflow-hidden"
            style={{
              width: '88px',
              aspectRatio: '2/3',
              boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
              borderRadius: '2px',
            }}
          >
            <BookCoverImage
              src={bookContext.bookCover ?? ''}
              alt={bookContext.bookTitle ?? ''}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="pt-0.5 min-w-0">
            <h2
              className="font-serif italic font-light leading-[1.2] mb-2 text-butter-text"
              style={{ fontSize: '1.35rem' }}
            >
              {bookContext.bookTitle}
            </h2>
            <p className="text-[13px] text-butter-muted font-light tracking-wide">
              {bookContext.bookAuthor}
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={openSearch}
            className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/60 hover:text-butter-primary transition-colors"
          >
            {t('journal.book.change')}
          </button>
          <span className="text-butter-muted/25 text-[10px]">·</span>
          <button
            onClick={handleClear}
            className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/55 hover:text-red-400 transition-colors"
          >
            {t('journal.book.remove')}
          </button>
          {bookContext.bookId && (
            <>
              <span className="text-butter-muted/25 text-[10px]">·</span>
              <Link
                to={`/explore/${bookContext.bookId}`}
                className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/60 hover:text-butter-primary transition-colors"
              >
                {t('journal.book.viewdetails')}
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── 책이 없는 상태 — 검색 유도 ──
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-butter-muted/60 mb-4">
        Currently Reflecting On
      </p>
      <button
        onClick={openSearch}
        className="w-full flex items-center gap-3 p-4 text-left transition-all group"
        style={{ background: 'var(--color-butter-surface)', borderRadius: '3px' }}
      >
        <BookOpen size={13} className="text-butter-primary/50 shrink-0" />
        <div>
          <p className="text-[12px] font-medium text-butter-muted group-hover:text-butter-primary transition-colors">
            {t('journal.book.link')}
          </p>
          <p className="text-[11px] text-butter-muted/60 font-light mt-0.5">
            {t('journal.book.link.desc')}
          </p>
        </div>
        <Search size={12} className="text-butter-muted/45 shrink-0 ml-auto group-hover:text-butter-primary/50 transition-colors" />
      </button>
    </div>
  );
};


// ── Archive 헬퍼 함수들 ────────────────────────────────────────────────────

function groupEntriesByMonth(entries: JournalEntry[]): Map<string, JournalEntry[]> {
  const map = new Map<string, JournalEntry[]>();
  entries.forEach((e) => {
    const key = e.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });
  return map;
}

function formatMonthYear(yyyyMm: string, locale: string): string {
  const [y, m] = yyyyMm.split('-');
  const loc = locale === 'ko' ? 'ko-KR' : 'en-US';
  return new Date(Number(y), Number(m) - 1).toLocaleString(loc, { month: 'long', year: 'numeric' });
}

// 날짜 → 계절 레이블 (디자인의 "AUTUMN EQUINOX · 2024" 스타일)
function getSeasonLabel(dateStr: string, t: (k: any) => string): string {
  const date = new Date(dateStr);
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 2 && month <= 4) return `${t('season.spring')} · ${year}`;
  if (month >= 5 && month <= 7) return `${t('season.summer')} · ${year}`;
  if (month >= 8 && month <= 10) return `${t('season.autumn')} · ${year}`;
  return `${t('season.winter')} · ${year}`;
}

// 엔트리의 첫 번째 의미있는 텍스트 줄 (서브타이틀용)
function getEntrySubtitle(entry: JournalEntry): string {
  const sections = entry.content.split(/\n\n(?=\[)/);
  const first = sections[0];
  const match = first.match(/^\[.+?\]\n([\s\S]+)/);
  const raw = match ? match[1] : first;
  const firstLine = raw.trim().split('\n')[0].trim();
  return firstLine.length > 60 ? firstLine.slice(0, 57) + '…' : firstLine;
}

// 해당 월의 날짜에 엔트리가 있는지 확인
function getEntryDatesInMonth(entries: JournalEntry[], year: number, month: number): Set<number> {
  const set = new Set<number>();
  entries.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      set.add(d.getDate());
    }
  });
  return set;
}

// ── ArchiveView ────────────────────────────────────────────────────────────

interface ArchiveViewProps {
  entries: JournalEntry[];
  loading: boolean;
  error: string;
  onUpdate: (id: string, payload: { content: string; mood: string; intensity: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSwitchToWrite: () => void;
}

const ArchiveView = ({ entries, loading, error, onUpdate, onDelete, onSwitchToWrite }: ArchiveViewProps) => {
  const { locale, t } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 캘린더 상태 — 현재 표시 월 (YYYY, MM 0-indexed)
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // 첫 로드 시 최신 엔트리 자동 선택
  useEffect(() => {
    if (entries.length > 0 && !selectedId) {
      setSelectedId(entries[0].id);
    }
  }, [entries]);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  // 캘린더용 데이터
  const entryDates = getEntryDatesInMonth(entries, calYear, calMonth);
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // 캘린더에서 날짜 클릭 → 해당 날짜의 첫 엔트리 선택
  const handleCalDateClick = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const found = entries.find((e) => e.date === dateStr);
    if (found) setSelectedId(found.id);
  };

  // Recent entries — 최근 10개
  const recentEntries = entries.slice(0, 10);

  // 첫 엔트리 날짜 (아카이브 시작일)
  const firstEntryDate = entries.length > 0
    ? new Date(entries[entries.length - 1].date).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' })
    : null;

  if (loading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-32">
      <LoadingSpinner />
    </motion.div>
  );
  if (error) return <ErrorMessage message={error} />;
  if (entries.length === 0) return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      <p className="font-serif text-2xl font-light mb-3 italic" style={{ color: 'var(--color-butter-muted)' }}>
        {t('archive.nothing')}
      </p>
      <p className="text-[13px] font-light mb-6" style={{ color: 'var(--color-butter-muted)' }}>
        {t('archive.nothing.sub')}
      </p>
      <button
        onClick={onSwitchToWrite}
        className="flex items-center gap-2 px-6 py-2.5 bg-butter-primary text-white text-[11px] font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all"
        style={{ borderRadius: '2px' }}
      >
        {t('archive.new')}
      </button>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col lg:flex-row gap-0 lg:gap-16 xl:gap-20"
    >
      {/* ══════════════════════════════════════════════
          LEFT — 엔트리 상세 뷰
          ══════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0">
        {selectedEntry ? (
          <AnimatePresence mode="wait">
            <ArchiveDetailView
              key={selectedEntry.id}
              entry={selectedEntry}
              allEntries={entries}
              onUpdate={onUpdate}
              onDelete={async (id) => {
                await onDelete(id).catch(() => {});
                setSelectedId(entries.find((e) => e.id !== id)?.id ?? null);
              }}
              onSwitchToWrite={onSwitchToWrite}
            />
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-[13px] italic font-light" style={{ color: 'var(--color-butter-muted)' }}>
              {t('archive.select')}
            </p>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════
          RIGHT — 캘린더 + 엔트리 목록
          ══════════════════════════════════════════════ */}
      <aside
        className="lg:w-72 xl:w-80 shrink-0 mt-10 lg:mt-0"
        style={{ borderLeft: '1px solid var(--color-butter-rule)', paddingLeft: '2rem' }}
      >
        {/* 모바일 전용 상단 구분선 */}
        <div className="block lg:hidden mb-8" style={{ height: '1px', background: 'var(--color-butter-rule)' }} />

        {/* ── 캘린더 ── */}
        <div className="mb-8">
          {/* 캘린더 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-[1.1rem] font-light" style={{ color: 'var(--color-butter-text)' }}>
              {new Date(calYear, calMonth).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
                  else setCalMonth(m => m - 1);
                }}
                className="w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-butter-muted)', borderRadius: '2px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-butter-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-butter-muted)')}
              >
                <ArrowLeft size={13} />
              </button>
              <button
                onClick={() => {
                  if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
                  else setCalMonth(m => m + 1);
                }}
                className="w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-butter-muted)', borderRadius: '2px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-butter-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-butter-muted)')}
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-2">
            {[t('archive.cal.su'), t('archive.cal.mo'), t('archive.cal.tu'), t('archive.cal.we'), t('archive.cal.th'), t('archive.cal.fr'), t('archive.cal.sa')].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium uppercase tracking-[0.08em] py-1"
                style={{ color: 'var(--color-butter-muted)', opacity: 0.65 }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* 첫 주 빈 칸 */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* 날짜 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasEntry = entryDates.has(day);
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedEntry?.date === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={day}
                  onClick={() => hasEntry && handleCalDateClick(day)}
                  disabled={!hasEntry}
                  className="relative flex flex-col items-center justify-center py-1 transition-all"
                  style={{ cursor: hasEntry ? 'pointer' : 'default' }}
                >
                  <span
                    className="w-7 h-7 flex items-center justify-center text-[12px] font-medium transition-all"
                    style={{
                      borderRadius: '50%',
                      background: isSelected
                        ? 'var(--color-butter-primary)'
                        : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : hasEntry
                        ? 'var(--color-butter-text)'
                        : 'var(--color-butter-muted)',
                      opacity: hasEntry ? 1 : 0.3,
                      fontWeight: isToday && !isSelected ? 600 : undefined,
                    }}
                  >
                    {day}
                  </span>
                  {/* 엔트리 있는 날 도트 */}
                  {hasEntry && !isSelected && (
                    <span
                      className="absolute bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: 'var(--color-butter-primary)', opacity: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── [1] Accumulation text ── */}
        {entries.length >= 3 && (
          <p
            className="font-serif italic font-light mb-6"
            style={{
              fontSize: '11px',
              lineHeight: 1.7,
              color: 'var(--color-butter-muted)',
              opacity: 0.6,
            }}
          >
            {locale === 'ko'
              ? `${entries.length}개의 기록이 조용히 쌓이고 있습니다.`
              : `You've been quietly building a record of your reading.`}
          </p>
        )}

        {/* ── {t('archive.recent')} ── */}
        <div className="mb-6">
          <p
            className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-4"
            style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
          >
            Recent Entries
          </p>
          <div className="space-y-1">
            {recentEntries.map((entry) => {
              const isSelected = entry.id === selectedId;
              const displayEmotions = (entry.emotions ?? []).length > 0
                ? entry.emotions.slice(0, 2)
                : entry.mood ? [entry.mood] : [];
              // 날짜 포맷 — "Sep 09" 스타일
              const d = new Date(entry.date);
              const dateLabel = d.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit' });

              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className="w-full text-left py-3 px-3 transition-all group"
                  style={{
                    borderRadius: '2px',
                    background: isSelected
                      ? 'var(--color-butter-surface)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '2px solid var(--color-butter-primary)'
                      : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--color-butter-faint)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* 제목 */}
                      <p
                        className="text-[13px] font-serif font-light leading-snug line-clamp-1 transition-colors mb-1"
                        style={{
                          color: isSelected ? 'var(--color-butter-text)' : 'var(--color-butter-text)',
                          opacity: isSelected ? 1 : 0.85,
                        }}
                      >
                        {entry.bookTitle ?? getEntrySubtitle(entry) ?? t('archive.free')}
                      </p>
                      {/* 감정 태그들 */}
                      {displayEmotions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {displayEmotions.map((em) => (
                            <span
                              key={em}
                              className="text-[9px] uppercase tracking-[0.1em] font-semibold"
                              style={{ color: 'var(--color-butter-muted)', opacity: 0.7 }}
                            >
                              {em}
                            </span>
                          ))}
                          {isSelected && (
                            <span
                              className="text-[9px] uppercase tracking-[0.1em] font-semibold"
                              style={{ color: 'var(--color-butter-primary)' }}
                            >
                              · {t('archive.today')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* 날짜 */}
                    <span
                      className="text-[10px] font-medium shrink-0 mt-0.5"
                      style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                    >
                      {dateLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── New Journal Entry CTA ── */}
        <div>
          <button
            onClick={onSwitchToWrite}
            className="w-full flex items-center justify-center gap-2 py-3 font-medium uppercase tracking-[0.14em] text-[11px] hover:brightness-110 transition-all text-white bg-butter-primary"
            style={{ borderRadius: '2px' }}
          >
            + New Journal Entry
          </button>
          {firstEntryDate && (
            <p
              className="text-center text-[11px] font-light italic mt-3"
              style={{ color: 'var(--color-butter-muted)', opacity: 0.65 }}
            >
              {entries.length} {t('archive.entries')} {t('archive.since')} {firstEntryDate}
            </p>
          )}

          {/* ── [3] Soft CTA ── */}
          <p
            className="text-center font-serif italic font-light mt-4"
            style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
          >
            {locale === 'ko' ? '짧은 메모도 괜찮습니다.' : 'Even a small note counts.'}
          </p>
        </div>
      </aside>
    </motion.div>
  );
};

// ── ArchiveDetailView ──────────────────────────────────────────────────────

interface ArchiveDetailViewProps {
  entry: JournalEntry;
  allEntries: JournalEntry[];
  onUpdate: (id: string, payload: { content: string; mood: string; intensity: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSwitchToWrite: () => void;
}

const ArchiveDetailView = ({ entry, allEntries, onUpdate, onDelete, onSwitchToWrite }: ArchiveDetailViewProps) => {
  const { locale, t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [editMood, setEditMood] = useState(entry.mood || '');
  const [editIntensity, setEditIntensity] = useState(entry.intensity);

  // [4] 이 책에 연결된 엔트리 수
  const bookEntryCount = entry.bookId
    ? allEntries.filter((e) => e.bookId === entry.bookId && e.id !== entry.id).length
    : 0;

  // [2] 약 한 달 전 비슷한 감정의 엔트리 찾기
  const entryDate = new Date(entry.date);
  const oneMonthAgo = new Date(entryDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(entryDate);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const currentEmotions = new Set(entry.emotions ?? []);
  const similarEntry = allEntries.find((e) => {
    if (e.id === entry.id) return false;
    const d = new Date(e.date);
    if (d > twoMonthsAgo && d < oneMonthAgo) {
      // 감정이 겹치거나, 같은 책이거나
      const sharedEmotion = (e.emotions ?? []).some((em) => currentEmotions.has(em));
      const sameBook = e.bookId && e.bookId === entry.bookId;
      return sharedEmotion || sameBook;
    }
    return false;
  }) ?? null;

  useEffect(() => {
    setEditContent(entry.content);
    setEditMood(entry.mood || '');
    setEditIntensity(entry.intensity);
    setEditing(false);
  }, [entry.id]);

  const sections = entry.content
    .split(/\n\n(?=\[)/)
    .map((block) => {
      const match = block.match(/^\[(.+?)\]\n([\s\S]+)$/);
      return match ? { label: match[1], text: match[2] } : null;
    })
    .filter(Boolean) as { label: string; text: string }[];

  const displayEmotions = (entry.emotions ?? []).length > 0
    ? entry.emotions
    : entry.mood ? [entry.mood] : [];

  const subtitle = getEntrySubtitle(entry);

  const handleUpdate = async () => {
    try {
      await onUpdate(entry.id, { content: editContent, mood: editMood, intensity: editIntensity });
      setEditing(false);
    } catch (e: any) {
      alert(t('archive.update.fail') + e.message);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ── 헤더 영역 ── */}
      <header className="mb-12">

        {/* 계절 레이블 */}
        <p
          className="text-[10px] uppercase tracking-[0.3em] font-medium mb-5"
          style={{ color: 'var(--color-butter-muted)', opacity: 0.55 }}
        >
          {getSeasonLabel(entry.date, t)}
        </p>

        {/* 책 커버 + 제목 — 책이 있을 때 */}
        {entry.bookTitle ? (
          <div className="flex items-start gap-6 mb-6">
            {entry.bookCover && (
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: '80px',
                  aspectRatio: '2/3',
                  borderRadius: '2px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                }}
              >
                <BookCoverImage
                  src={entry.bookCover}
                  alt={entry.bookTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* 제목 + 저자 — 단일 블록으로 */}
            <div className="flex flex-col justify-center" style={{ paddingTop: '0.25rem' }}>
              <h1
                className="font-serif leading-[1.12] tracking-tight mb-1.5"
                style={{
                  fontSize: 'clamp(1.85rem, 3.2vw, 2.6rem)',
                  fontWeight: 300,
                  color: 'var(--color-butter-text)',
                }}
              >
                {entry.bookTitle}
              </h1>
              {entry.bookAuthor && (
                <p
                  className="font-serif italic font-light"
                  style={{ fontSize: '1rem', color: 'var(--color-butter-muted)', opacity: 0.75 }}
                >
                  {t('common.by')} {entry.bookAuthor}
                </p>
              )}
              {/* [4] Book-level accumulation */}
              {bookEntryCount > 0 && (
                <p
                  className="font-light mt-2"
                  style={{ fontSize: '11px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
                >
                  {locale === 'ko'
                    ? `이 책에 대한 메모 ${bookEntryCount}개 더`
                    : `${bookEntryCount} more ${bookEntryCount === 1 ? 'note' : 'notes'} for this book`}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* 책이 없을 때 — 첫 줄을 제목처럼 */
          <h1
            className="font-serif font-light leading-[1.15] tracking-tight mb-4"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-butter-text)' }}
          >
            {subtitle || t('archive.free')}
          </h1>
        )}

        {/* 서브타이틀 — 책 있을 때만 */}
        {entry.bookTitle && subtitle && (
          <p
            className="font-serif italic font-light mb-6"
            style={{ fontSize: '1rem', color: 'var(--color-butter-muted)', opacity: 0.7 }}
          >
            {subtitle}
          </p>
        )}

        {/* 감정 pill들 */}
        {displayEmotions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {displayEmotions.map((em) => (
              <span
                key={em}
                className="text-[10px] uppercase tracking-[0.14em] font-semibold px-3 py-1"
                style={{
                  background: 'var(--color-butter-accent)',
                  color: 'var(--color-butter-primary)',
                  borderRadius: '2px',
                }}
              >
                {em}
              </span>
            ))}
          </div>
        )}
      </header>

      {editing ? (
        <div className="flex flex-col gap-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-[15px] font-serif leading-relaxed resize-none focus:outline-none min-h-[240px] p-4"
            style={{
              background: 'var(--color-butter-surface)',
              border: '1px solid var(--color-butter-rule)',
              borderRadius: '2px',
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-all"
              style={{
                color: 'var(--color-butter-muted)',
                border: '1px solid var(--color-butter-rule)',
                borderRadius: '2px',
              }}
            >
              <X size={12} /> {t('archive.cancel')}
            </button>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1 px-4 py-2 bg-butter-primary text-white text-[11px] font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all"
              style={{ borderRadius: '2px' }}
            >
              <Check size={12} /> {t('archive.save')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── 하이라이트 인용 — 페이지의 감정적 앵커 ── */}
          {entry.highlight && (
            <blockquote
              style={{
                borderLeft: '2px solid var(--color-butter-primary)',
                paddingLeft: '1.75rem',
                marginBottom: '3rem',
                marginTop: '0.5rem',
                opacity: 0.88,
              }}
            >
              <p
                className="font-serif italic"
                style={{
                  fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)',
                  lineHeight: 1.95,
                  color: 'var(--color-butter-text)',
                }}
              >
                "{entry.highlight}"
              </p>
            </blockquote>
          )}

          {/* ── 본문 ── */}
          <div className="mb-14">
            {sections.length > 0 ? (
              <div className="space-y-7">
                {sections.map((s) => (
                  <p
                    key={s.label}
                    className="font-serif font-light"
                    style={{
                      fontSize: '1.0125rem',
                      lineHeight: 2.0,
                      color: 'var(--color-butter-text)',
                      opacity: 0.84,
                    }}
                  >
                    {s.text}
                  </p>
                ))}
              </div>
            ) : (
              <p
                className="font-serif font-light"
                style={{
                  fontSize: '1.0125rem',
                  lineHeight: 2.0,
                  color: 'var(--color-butter-text)',
                  opacity: 0.84,
                }}
              >
                {entry.content}
              </p>
            )}
          </div>

          {/* ── [2] Reflection revisit link ── */}
          {similarEntry && (
            <p
              className="font-serif italic font-light mb-10 -mt-6"
              style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.45 }}
            >
              {locale === 'ko' ? '한 달 전에도 비슷한 내용을 썼습니다 —' : 'From a month ago, you wrote something similar —'}{' '}
              <button
                onClick={() => {/* 외부에서 selectedId를 바꿀 수 없으므로 향후 확장용 no-op */}}
                className="font-serif italic underline underline-offset-2 transition-opacity"
                style={{
                  fontSize: '12px',
                  color: 'var(--color-butter-primary)',
                  opacity: 0.6,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'default',
                  textDecorationColor: 'var(--color-butter-primary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                {similarEntry.bookTitle ?? getEntrySubtitle(similarEntry) ?? (locale === 'ko' ? '그 메모' : 'that note')}
              </button>
            </p>
          )}

          {/* ── 하단 메타 + 액션 ── */}
          <footer
            className="flex items-center justify-between pt-8"
            style={{ borderTop: '1px solid var(--color-butter-rule)' }}
          >
            {/* 좌: Edit / Delete / Share */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-muted)'; }}
              >
                <Pencil size={12} /> {t('archive.edit')}
              </button>
              <button
                onClick={() => onDelete(entry.id).catch((e) => alert(e.message))}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-muted)'; }}
              >
                <Trash2 size={12} /> {t('archive.delete')}
              </button>
              <button
                onClick={() => setLinkOpen(p => !p)}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                style={{ color: linkOpen ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)', opacity: linkOpen ? 1 : 0.6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-primary)'; }}
                onMouseLeave={(e) => { if (!linkOpen) { (e.currentTarget as HTMLElement).style.opacity = '0.6'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-muted)'; }}}
              >
                <Share2 size={12} /> {locale === 'ko' ? '공유하기' : 'Share'}
              </button>
            </div>

            {/* 우: 날짜 — quiet context note */}
            <p
              className="font-light italic"
              style={{
                fontSize: '11px',
                letterSpacing: '0.02em',
                color: 'var(--color-butter-muted)',
                opacity: 0.55,
              }}
            >
              {new Date(entry.date).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </footer>

          {/* 링크 패널 — BookDetail과 동일한 패턴 */}
          <AnimatePresence>
            {linkOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-1">
                  <p
                    className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1"
                    style={{ color: 'var(--color-butter-muted)' }}
                  >
                    <LinkIcon size={9} /> {locale === 'ko' ? '공유 링크' : 'Share Link'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}/share/journal/${entry.id}`}
                      className="flex-1 rounded px-2.5 py-1.5 text-[11px] font-mono truncate focus:outline-none"
                      style={{ background: 'var(--color-butter-surface)', color: 'var(--color-butter-muted)', border: 'none' }}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/share/journal/${entry.id}`)
                          .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
                      }}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-medium transition-all text-white"
                      style={{ background: copied ? '#22c55e' : 'var(--color-butter-primary)' }}
                    >
                      {copied
                        ? <><Check size={10} /> {locale === 'ko' ? '완료' : 'Done'}</>
                        : <><Copy size={10} /> {locale === 'ko' ? '복사' : 'Copy'}</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.article>
  );
};
