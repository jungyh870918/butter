import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, Check, X, ArrowRight, ArrowLeft, BookOpen, Search, Loader2 } from 'lucide-react';
import { JournalEntry, Book } from '../../types';
import { useJournal } from '../../hooks/useJournal';
import { createReflection, getBooks } from '../../lib/api';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage } from '../ui';
import { getReflectionQuestions } from '../../lib/api';

const DEMO_USER_ID = 'demo-user-id';

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

const PROMPTS: Prompt[] = [
  {
    id: 'opening',
    label: 'Opening',
    question: 'What were you reading today, and what first impression did it leave on you?',
    placeholder: 'Describe the book, a scene, a passage — anything that caught your attention first…',
    hint: 'Let the first thing that comes to mind lead you.',
  },
  {
    id: 'highlight',
    label: 'A Passage',
    question: 'Is there a sentence or image from the reading that you want to keep?',
    placeholder: '"The world is not what it is, but what we remember of it."',
    hint: 'A line, a phrase, a detail. Even a single word.',
    isHighlight: true,
  },
  {
    id: 'emotion',
    label: 'Emotion',
    question: 'What emotion surfaced most strongly while you read?',
    placeholder: 'Was it curiosity, unease, longing, joy? Try to name it precisely…',
    hint: 'Precision here matters more than being right.',
  },
  {
    id: 'mirror',
    label: 'Reflection',
    question: 'Did anything in the text mirror something in your own life right now?',
    placeholder: 'A character\'s situation, a theme, a single line — what felt personally true?',
    hint: 'The most honest answer is usually the first one.',
  },
  {
    id: 'linger',
    label: 'Lingering',
    question: 'What single image, sentence, or idea will stay with you after you close the book?',
    placeholder: 'Something you\'ll still be thinking about tomorrow…',
    hint: 'What refuses to leave?',
  },
  {
    id: 'atmosphere',
    label: 'Atmosphere',
    question: 'How would you describe the atmosphere of today\'s reading?',
    placeholder: '',
    hint: 'Select everything that resonates.',
    isAtmosphere: true,
  },
];

const ATMOSPHERES = [
  'Contemplative', 'Moved', 'Melancholy', 'Nostalgic',
  'Inspired', 'Unsettled', 'Joyful', 'Awe',
  'Anxious', 'Pensive', 'Calm',
] as const;

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
  const location = useLocation();
  const bookContext: BookContext = location.state ?? EMPTY_BOOK;

  const [view, setView] = useState<JournalView>('write');
  const { entries, loading, error, create, update, remove } = useJournal(view === 'archive');

  return (
    <div className="min-h-screen bg-butter-bg">

      {/* ── Page header ── */}
      <div className="pt-24 pb-8 px-8 md:px-14 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-butter-muted/70 font-medium mb-4">
          Daily Practice
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-5xl md:text-[3.75rem] font-serif font-black leading-[1.06] tracking-tight mb-4">
              Your{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--color-butter-primary)', fontWeight: 700 }}>
                journal
              </em>
            </h1>
            <p className="text-butter-muted leading-[1.75] max-w-sm font-light text-[15px]">
              A private space for slow reading, quiet reflection, and the thoughts books leave behind.
            </p>
          </div>
          <div className="flex gap-7 pb-1 shrink-0">
            {(['write', 'archive'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`pb-1.5 text-[11px] uppercase tracking-[0.18em] font-medium transition-all duration-200 ${
                  view === v ? 'text-butter-text' : 'text-butter-muted hover:text-butter-text'
                }`}
                style={view === v ? { borderBottom: '1px solid var(--color-butter-text)' } : {}}
              >
                {v === 'write' ? 'Write' : 'Archive'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }} />

      <div className="px-8 md:px-14 max-w-7xl mx-auto py-14">
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
            />
          )}
        </AnimatePresence>
      </div>
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

  // ── GPT 질문 state ──
  const [gptQuestions, setGptQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // 책이 변경될 때마다 GPT 질문 fetch
  const handleBookChange = (book: BookContext) => {
    setActiveBook(book);
    // 책이 선택된 경우에만 질문 요청
    if (book.bookTitle && book.bookAuthor) {
      setGptQuestions([]);
      setQuestionsLoading(true);
      getReflectionQuestions({
        bookTitle: book.bookTitle,
        bookAuthor: book.bookAuthor,
      })
        .then((res) => setGptQuestions(res.questions))
        .catch(() => setGptQuestions([]))  // 실패해도 조용히 — 기능 저하 없음
        .finally(() => setQuestionsLoading(false));
    } else {
      setGptQuestions([]);
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
        .then((res) => setGptQuestions(res.questions))
        .catch(() => setGptQuestions([]))
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
      // content: PROMPTS의 텍스트 답변들을 섹션 형태로 조합
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

      await createReflection({
        title: `A reflection on: ${answers.opening.trim().split(' ').slice(0, 6).join(' ') || 'my reading'}…`,
        content: [answers.opening, answers.mirror, answers.linger]
          .filter(Boolean).join(' ').trim() || answers.opening.trim(),
        author: 'Butter Demo User',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=butter',
        tags: selectedAtmospheres,
        bookId: activeBook.bookId ?? null,
        userId: DEMO_USER_ID,
        journalEntryId: entry.id,
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
      <div className="flex flex-col lg:flex-row gap-16 xl:gap-24">

        {/* ── Left col: book + progress context ── */}
        <aside className="lg:w-64 xl:w-72 shrink-0">
          <div className="lg:sticky lg:top-28 space-y-8">

            {/* Book context — search 기능 포함 */}
            <BookContextPanel
              bookContext={activeBook}
              onBookChange={handleBookChange}
            />

            {/* GPT 질문 — 책이 선택됐을 때 좌측 패널에 표시 */}
            {phase === 'prompts' && (activeBook.bookTitle) && (
              <GptQuestionsPanel
                questions={gptQuestions}
                loading={questionsLoading}
              />
            )}

            {/* Progress indicator — 현재 스텝과 전체 흐름 */}
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
              <p className="text-[12px] text-butter-muted/50 font-light italic leading-[1.7]">
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
                  className="mb-10"
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
                  <span className="text-[10px] uppercase tracking-widest font-medium text-butter-muted/50">
                    {step + 1} / {PROMPTS.length}
                  </span>
                </div>

                {/* Question */}
                <h2 className="text-2xl md:text-[1.75rem] font-serif font-light leading-[1.35] mb-8 text-butter-text">
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
                      className="w-full bg-transparent pl-6 pr-4 pt-4 pb-4 text-[16px] font-serif italic leading-[1.85] resize-none focus:outline-none text-butter-text/80 placeholder:text-butter-muted/25"
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
                    rows={7}
                    className="w-full bg-transparent text-[17px] font-serif leading-[1.9] resize-none focus:outline-none text-butter-text/85 placeholder:text-butter-muted/25 mb-10"
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
                    <ArrowLeft size={12} /> Back
                  </button>

                  <button
                    onClick={skipStep}
                    className={`text-[11px] font-medium uppercase tracking-[0.14em] text-butter-muted/50 hover:text-butter-muted transition-colors px-3 py-2 ${
                      isLast ? 'invisible' : ''
                    }`}
                  >
                    Skip
                  </button>

                  {isLast ? (
                    <button
                      onClick={handleFinish}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-7 py-2.5 bg-butter-primary text-white font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all text-[11px] disabled:opacity-40"
                      style={{ borderRadius: '2px' }}
                    >
                      Review <ArrowRight size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={goNext}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-7 py-2.5 bg-butter-primary text-white font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all text-[11px] disabled:opacity-40"
                      style={{ borderRadius: '2px' }}
                    >
                      Next <ArrowRight size={12} />
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
                  Your Reflection
                </span>
                <h2 className="text-2xl md:text-[1.75rem] font-serif font-light leading-[1.35] mb-2 text-butter-text">
                  Here's what emerged from today's reading.
                </h2>
                <p className="text-[13px] text-butter-muted font-light leading-[1.7] mb-10">
                  Review your responses before saving to your private archive.
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
                    <ArrowLeft size={12} /> Edit
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
                        <><Check size={12} /> Saved</>
                      ) : saving ? 'Saving…' : (
                        <><span style={{ fontSize: '14px' }}>📖</span> Save Reflection</>
                      )}
                    </button>
                    <p className="text-[10px] text-butter-muted/40 mt-2 font-light italic">
                      Added to your private journal archive.
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
  loading,
}: {
  questions: string[];
  loading: boolean;
}) => {
  if (!loading && questions.length === 0) return null;

  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}>
      <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-butter-muted/50 mb-4">
        Questions to Consider
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
          {questions.map((q, i) => (
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
        const books = await getBooks({ search: value.trim() });
        setResults(books.slice(0, 6));
      } catch {
        setSearchError('Search failed. Please try again.');
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
          Currently Reflecting On
        </p>
        <div
          className="flex items-center gap-2 px-3 py-2.5 mb-3"
          style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: '2px' }}
        >
          <Search size={12} className="text-butter-muted/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search by title or author…"
            className="flex-1 text-[13px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/35 font-light"
          />
          {searchLoading && <Loader2 size={12} className="text-butter-muted/50 animate-spin shrink-0" />}
          <button onClick={closeSearch} className="text-butter-muted/40 hover:text-butter-muted transition-colors shrink-0">
            <X size={13} />
          </button>
        </div>

        {searchError && (
          <p className="text-[11px] text-red-400 font-light mb-2">{searchError}</p>
        )}

        {!searchLoading && results.length > 0 && (
          <div className="space-y-0.5">
            {results.map((book) => (
              <button
                key={book.id}
                onClick={() => handleSelect(book)}
                className="w-full flex items-center gap-3 px-2 py-2 text-left transition-colors hover:bg-butter-surface group"
                style={{ borderRadius: '2px' }}
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

        {!searchLoading && query.trim() && results.length === 0 && !searchError && (
          <p className="text-[12px] text-butter-muted/50 font-light italic mt-2">
            No books found for "{query}"
          </p>
        )}

        {!query.trim() && (
          <p className="text-[11px] text-butter-muted/40 font-light italic leading-[1.6] mt-2">
            Type a title or author name to search.
          </p>
        )}

        {query.trim().length > 0 && query.trim().length < 3 && (
          <p className="text-[11px] text-butter-muted/40 font-light italic leading-[1.6] mt-2">
            Keep typing…
          </p>
        )}
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
            Change
          </button>
          <span className="text-butter-muted/25 text-[10px]">·</span>
          <button
            onClick={handleClear}
            className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/40 hover:text-red-400 transition-colors"
          >
            Remove
          </button>
          {bookContext.bookId && (
            <>
              <span className="text-butter-muted/25 text-[10px]">·</span>
              <a
                href={`/explore/${bookContext.bookId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/60 hover:text-butter-primary transition-colors"
              >
                View Details
              </a>
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
        style={{ background: '#f2ede3', borderRadius: '3px' }}
      >
        <BookOpen size={13} className="text-butter-primary/50 shrink-0" />
        <div>
          <p className="text-[12px] font-medium text-butter-muted group-hover:text-butter-primary transition-colors">
            Link a book
          </p>
          <p className="text-[11px] text-butter-muted/60 font-light mt-0.5">
            Search to connect this entry to a book
          </p>
        </div>
        <Search size={12} className="text-butter-muted/30 shrink-0 ml-auto group-hover:text-butter-primary/50 transition-colors" />
      </button>
    </div>
  );
};

// ── ArchiveView ────────────────────────────────────────────────────────────

interface ArchiveViewProps {
  entries: JournalEntry[];
  loading: boolean;
  error: string;
  onUpdate: (id: string, payload: { content: string; mood: string; intensity: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ArchiveView = ({ entries, loading, error, onUpdate, onDelete }: ArchiveViewProps) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    className="max-w-2xl"
  >
    {loading && <LoadingSpinner />}
    {!loading && error && <ErrorMessage message={error} />}
    {!loading && !error && entries.length === 0 && (
      <EmptyState message="No journal entries yet — write your first reflection." />
    )}
    {!loading && !error && entries.map((entry, i) => (
      <JournalEntryCard
        key={entry.id}
        entry={entry}
        onUpdate={onUpdate}
        onDelete={onDelete}
        first={i === 0}
      />
    ))}
  </motion.div>
);

// ── JournalEntryCard ───────────────────────────────────────────────────────

interface JournalEntryCardProps {
  entry: JournalEntry;
  first: boolean;
  onUpdate: (id: string, payload: { content: string; mood: string; intensity: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const JournalEntryCard = ({ entry, first, onUpdate, onDelete }: JournalEntryCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [editMood, setEditMood] = useState(entry.mood || '');
  const [editIntensity, setEditIntensity] = useState(entry.intensity);

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

  const handleUpdate = async () => {
    try {
      await onUpdate(entry.id, { content: editContent, mood: editMood, intensity: editIntensity });
      setEditing(false);
    } catch (e: any) {
      alert('Update failed: ' + e.message);
    }
  };

  return (
    <article
      className="py-10"
      style={{ borderTop: first ? 'none' : '1px solid rgba(0,0,0,0.06)' }}
    >
      {editing ? (
        <div className="flex flex-col gap-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-butter-surface px-4 py-3 text-[15px] font-serif leading-relaxed resize-none focus:outline-none min-h-[120px]"
            style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '2px' }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-4 py-2 text-butter-muted hover:text-butter-text text-[11px] font-medium uppercase tracking-[0.14em] transition-all"
              style={{ border: '1px solid rgba(0,0,0,0.10)', borderRadius: '2px' }}
            >
              <X size={12} /> Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1 px-4 py-2 bg-butter-primary text-white text-[11px] font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all"
              style={{ borderRadius: '2px' }}
            >
              <Check size={12} /> Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-medium text-butter-muted/50 mb-1.5">
                {entry.date}
              </p>
              {entry.bookTitle && (
                <p className="text-[12px] text-butter-primary/80 italic font-light mb-2">
                  {entry.bookTitle}{entry.bookAuthor ? ` — ${entry.bookAuthor}` : ''}
                </p>
              )}
              {displayEmotions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {displayEmotions.map((e) => (
                    <span
                      key={e}
                      className="text-[10px] uppercase tracking-[0.1em] font-medium px-2.5 py-0.5"
                      style={{
                        border: '1px solid rgba(107,82,0,0.22)',
                        borderRadius: '2px',
                        color: 'var(--color-butter-primary)',
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <button
                onClick={() => setEditing(true)}
                className="text-butter-muted/40 hover:text-butter-primary transition-colors p-1"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onDelete(entry.id).catch((e) => alert(e.message))}
                className="text-butter-muted/40 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {entry.highlight && (
            <div
              className="mb-5 pl-4 py-3 pr-4"
              style={{ borderLeft: '2px solid rgba(107,82,0,0.18)' }}
            >
              <p className="text-[14px] font-serif italic text-butter-text/60 leading-[1.8]">
                "{entry.highlight}"
              </p>
            </div>
          )}

          {sections.length > 0 ? (
            <div className="space-y-5">
              {sections.map((s) => (
                <div key={s.label}>
                  <p className="text-[9px] uppercase tracking-widest font-medium text-butter-primary/60 mb-1.5">
                    {s.label}
                  </p>
                  <p className="text-[14px] text-butter-muted font-light leading-[1.85]">{s.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-butter-muted font-light leading-[1.85]">{entry.content}</p>
          )}
        </>
      )}
    </article>
  );
};
