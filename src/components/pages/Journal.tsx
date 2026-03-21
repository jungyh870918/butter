import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Pencil, Trash2, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { JournalEntry } from '../../types';
import { useJournal } from '../../hooks/useJournal';
import { createReflection } from '../../lib/api';

const DEMO_USER_ID = 'demo-user-id';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../ui';

const MOODS = ['Nostalgic', 'Inspired', 'Calm', 'Melancholy', 'Joyful', 'Pensive', 'Anxious', 'Awe'] as const;

// 여러 단계의 질문 정의
const PROMPTS = [
  {
    id: 'opening',
    label: 'Opening',
    question: 'What were you reading today, and what first impression did it leave on you?',
    placeholder: 'Describe the book, a scene, a passage — anything that caught your attention first...',
  },
  {
    id: 'emotion',
    label: 'Emotion',
    question: 'What emotion surfaced most strongly while you read?',
    placeholder: 'Was it curiosity, unease, longing, joy? Try to name it precisely...',
  },
  {
    id: 'mirror',
    label: 'Reflection',
    question: 'Did anything in the text mirror something in your own life right now?',
    placeholder: 'A character\'s situation, a theme, a single line — what felt personally true?',
  },
  {
    id: 'linger',
    label: 'Lingering',
    question: 'What single image, sentence, or idea will stay with you after you close the book?',
    placeholder: 'Something you\'ll still be thinking about tomorrow...',
  },
  {
    id: 'feeling',
    label: 'Feeling',
    question: 'How are you feeling right now, at the end of this reading session?',
    placeholder: 'Capture your mood and the intensity of today\'s experience...',
    isFinal: true, // 이 스텝에서 mood/intensity 입력
  },
] as const;

type PromptId = typeof PROMPTS[number]['id'];
type JournalView = 'write' | 'archive';

export const Journal = () => {
  const [view, setView] = useState<JournalView>('write');
  const { entries, loading, error, create, update, remove } = useJournal(view === 'archive');

  return (
    <div className="pt-20 md:pt-24 pb-12 px-4 md:px-6 max-w-5xl mx-auto">
      <ViewToggle view={view} onToggle={setView} />

      <AnimatePresence mode="wait">
        {view === 'write' ? (
          <WriteView key="write" onCreate={create} onSaved={() => setView('archive')} />
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
  );
};

// ── ViewToggle ─────────────────────────────────────────────────────────────

const ViewToggle = ({ view, onToggle }: { view: JournalView; onToggle: (v: JournalView) => void }) => (
  <div className="flex justify-center mb-12">
    <div className="flex gap-1 p-1 rounded-full" style={{background: "rgba(0,0,0,0.05)"}}>
      {(['write', 'archive'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onToggle(v)}
          className={`px-5 md:px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
            view === v ? 'bg-white shadow-md' : 'text-butter-muted'
          }`}
        >
          {v === 'write' ? 'Daily Reflection' : 'Your Archive'}
        </button>
      ))}
    </div>
  </div>
);

// ── WriteView (multi-step) ─────────────────────────────────────────────────

// 답변들을 기반으로 요약문을 생성하는 함수 (현재는 하드코딩)
function generateSummary(answers: Record<PromptId, string>, mood: string): string {
  const filledAnswers = PROMPTS.filter((p) => answers[p.id as PromptId].trim());
  if (filledAnswers.length === 0) return '';

  // 실제 구현 시 AI API 호출로 교체 예정
  // 현재는 답변 내용을 조합한 템플릿 문장으로 대체
  const moodPhrase = mood ? `Feeling ${mood.toLowerCase()}, ` : '';
  const opening = answers.opening.trim();
  const emotion = answers.emotion.trim();
  const mirror = answers.mirror.trim();
  const linger = answers.linger.trim();

  const parts: string[] = [];

  if (opening) parts.push(opening.split('.')[0] + '.');
  if (emotion) parts.push(`The reading stirred a deep sense of ${emotion.toLowerCase().split(' ').slice(0, 8).join(' ')}.`);
  if (mirror) parts.push(mirror.split('.')[0] + '.');
  if (linger) parts.push(`What lingers most: ${linger.split('.')[0].toLowerCase()}.`);

  return moodPhrase + parts.join(' ');
}

interface WriteViewProps {
  onCreate: (payload: { content: string; prompt: string; mood: string; intensity: number }) => Promise<void>;
  onSaved: () => void;
}

type WritePhase = 'writing' | 'summary';

const WriteView = ({ onCreate, onSaved }: WriteViewProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<PromptId, string>>({
    opening: '', emotion: '', mirror: '', linger: '', feeling: '',
  });
  const [mood, setMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [phase, setPhase] = useState<WritePhase>('writing');
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const current = PROMPTS[step];
  const isFirst = step === 0;
  const isLast = step === PROMPTS.length - 1;
  const progress = phase === 'summary' ? 100 : ((step + 1) / PROMPTS.length) * 100;

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  // Finish 클릭 → 요약 생성 후 요약 화면으로 전환
  const handleFinish = () => {
    const generated = generateSummary(answers, mood);
    setSummary(generated);
    setDirection(1);
    setPhase('summary');
  };

  // 요약 화면에서 Save 클릭 → journal 저장 → reflection 저장 → 완료
  const handleSave = async () => {
    setSaving(true);
    try {
      const journalContent = PROMPTS
        .filter((p) => answers[p.id as PromptId].trim())
        .map((p) => `[${p.label}]\n${answers[p.id as PromptId].trim()}`)
        .join('\n\n');

      // 1) Journal entry 저장 → 생성된 id 획득
      const journalEntry = await onCreate({
        content: journalContent,
        prompt: PROMPTS[PROMPTS.length - 1].question,
        mood,
        intensity,
      });

      // 2) 요약을 Reflection으로 저장 (userId, journalEntryId 연결)
      await createReflection({
        title: `A reflection on: ${answers.opening.trim().split(' ').slice(0, 6).join(' ') || 'my reading'}...`,
        content: summary,
        author: 'Butter Demo User',
        authorAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=butter',
        tags: mood ? [mood] : [],
        bookId: null,
        userId: DEMO_USER_ID,
        journalEntryId: journalEntry.id,
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onSaved();
      }, 1200);
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = current.isFinal ? true : answers[current.id as PromptId].trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-[40px] shadow-2xl border border-butter-accent overflow-hidden"
    >
      {/* 진행 바 */}
      <div className="h-1 bg-butter-accent">
        <motion.div
          className="h-full bg-butter-primary"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        {/* ── Writing phase ── */}
        {phase === 'writing' && (
          <motion.div
            key="writing"
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {/* 스텝 인디케이터 */}
            <div className="flex items-center justify-between px-12 pt-8 pb-0">
              <div className="flex gap-2">
                {PROMPTS.map((p, i) => (
                  <div
                    key={p.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < step ? 'bg-butter-primary w-6'
                      : i === step ? 'bg-butter-primary w-10'
                      : 'bg-butter-accent w-6'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-butter-muted">
                {step + 1} / {PROMPTS.length}
              </span>
            </div>

            {/* 질문 + 답변 영역 */}
            <div className="px-12 py-10 min-h-[420px] flex flex-col">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: d * 30 }),
                    center: { opacity: 1, x: 0 },
                    exit: (d: number) => ({ opacity: 0, x: d * -30 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="flex flex-col flex-1"
                >
                  <div className="mb-10">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-butter-primary mb-2 block">
                      {current.label}
                    </span>
                    <h2 className="text-3xl font-serif leading-snug">{current.question}</h2>
                  </div>

                  {!current.isFinal && (
                    <textarea
                      autoFocus
                      value={answers[current.id as PromptId]}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
                      placeholder={current.placeholder}
                      className="flex-1 w-full bg-transparent border-none focus:ring-0 text-xl font-serif leading-relaxed resize-none placeholder:text-butter-accent min-h-[160px]"
                    />
                  )}

                  {current.isFinal && (
                    <div className="flex flex-col gap-8 flex-1">
                      <textarea
                        autoFocus
                        value={answers[current.id as PromptId]}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
                        placeholder={current.placeholder}
                        className="w-full bg-transparent border-none focus:ring-0 text-xl font-serif leading-relaxed resize-none placeholder:text-butter-accent min-h-[100px]"
                      />
                      <div className="grid grid-cols-2 gap-4 mt-auto">
                        <MoodSelect value={mood} onChange={setMood} />
                        <IntensitySlider value={intensity} onChange={setIntensity} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom navigation */}
            <div className="px-12 pb-10 pt-4 border-t border-butter-accent flex justify-between items-center">
              <button
                onClick={goPrev}
                disabled={isFirst}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-butter-accent text-butter-muted hover:bg-butter-accent transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-0 disabled:pointer-events-none"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                onClick={goNext}
                className={`flex items-center gap-2 px-5 py-2 rounded-full border border-butter-accent text-butter-muted hover:bg-butter-accent hover:text-butter-text transition-all text-xs font-bold uppercase tracking-widest ${
                  isLast ? 'invisible' : ''
                }`}
              >
                Skip
              </button>

              {isLast ? (
                <button
                  onClick={handleFinish}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-butter-primary text-white font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all text-xs"
                >
                  Finish <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canProceed}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-butter-primary text-white font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all text-xs disabled:opacity-40"
                >
                  Next <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Summary phase ── */}
        {phase === 'summary' && (
          <motion.div
            key="summary"
            custom={1}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: 'easeInOut' }}
          >
            {/* 헤더 */}
            <div className="px-12 pt-10 pb-0">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-butter-primary mb-2 block">
                Your Reflection
              </span>
              <h2 className="text-3xl font-serif leading-snug mb-1">Here's what emerged from today's reading.</h2>
              <p className="text-sm text-butter-muted font-light">
                We've distilled your responses into a single reflection. Review it before saving.
              </p>
            </div>

            {/* 요약 카드 */}
            <div className="px-12 py-8 min-h-[280px]">
              <div className="bg-butter-accent/30 border border-butter-accent rounded-3xl px-8 py-7 relative">
                {/* 인용 장식 */}
                <span className="absolute top-4 left-6 text-4xl text-butter-primary/20 font-serif leading-none select-none">"</span>
                <p className="text-xl font-serif italic leading-relaxed text-butter-text pt-4 pl-3">
                  {summary || 'No content to summarize — try filling in a few prompts.'}
                </p>
                <span className="absolute bottom-4 right-6 text-4xl text-butter-primary/20 font-serif leading-none select-none rotate-180">"</span>
              </div>

              {/* 메타 정보 */}
              {mood && (
                <div className="flex items-center gap-3 mt-5 px-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-butter-muted">Mood</span>
                  <span className="text-xs bg-butter-primary/10 text-butter-primary px-3 py-1 rounded-full font-bold">{mood}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-butter-muted ml-2">Intensity</span>
                  <span className="text-xs bg-butter-primary/10 text-butter-primary px-3 py-1 rounded-full font-bold">{intensity} / 10</span>
                </div>
              )}

              <p className="text-xs text-butter-muted mt-5 px-1 font-light">
                This summary will also be saved as a community reflection, visible on the Home feed.
              </p>
            </div>

            {/* 하단 버튼 */}
            <div className="px-12 pb-10 pt-4 border-t border-butter-accent flex justify-between items-center">
              <button
                onClick={() => { setDirection(-1); setPhase('writing'); }}
                className="flex items-center gap-2 px-8 py-3 rounded-full border border-butter-accent text-butter-muted hover:bg-butter-accent transition-all text-xs font-bold uppercase tracking-widest"
              >
                <ArrowLeft size={14} /> Edit
              </button>

              <div /> {/* spacer */}

              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold uppercase tracking-widest shadow-lg transition-all text-xs ${
                  saveSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-butter-primary text-white hover:brightness-110'
                } disabled:opacity-50`}
              >
                {saveSuccess ? <><Check size={14} /> Saved!</> : saving ? 'Saving...' : <><Check size={14} /> Save</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="grid gap-6"
  >
    {loading && <LoadingSpinner />}
    {!loading && error && <ErrorMessage message={error} />}
    {!loading && !error && entries.length === 0 && (
      <EmptyState message="No journal entries yet — write your first reflection!" />
    )}
    {!loading && !error && entries.map((entry) => (
      <JournalEntryCard key={entry.id} entry={entry} onUpdate={onUpdate} onDelete={onDelete} />
    ))}
  </motion.div>
);

// ── JournalEntryCard ───────────────────────────────────────────────────────

interface JournalEntryCardProps {
  entry: JournalEntry;
  onUpdate: (id: string, payload: { content: string; mood: string; intensity: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const JournalEntryCard = ({ entry, onUpdate, onDelete }: JournalEntryCardProps) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [editMood, setEditMood] = useState(entry.mood || '');
  const [editIntensity, setEditIntensity] = useState(entry.intensity);

  // content에서 섹션 파싱 ([Label]\n내용 형태)
  const sections = entry.content
    .split(/\n\n(?=\[)/)
    .map((block) => {
      const match = block.match(/^\[(.+?)\]\n([\s\S]+)$/);
      return match ? { label: match[1], text: match[2] } : null;
    })
    .filter(Boolean) as { label: string; text: string }[];

  const handleUpdate = async () => {
    try {
      await onUpdate(entry.id, { content: editContent, mood: editMood, intensity: editIntensity });
      setEditing(false);
    } catch (e: any) {
      alert('Update failed: ' + e.message);
    }
  };

  return (
    <div className="py-6">
      {editing ? (
        <div className="flex flex-col gap-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-butter-accent/20 border border-butter-accent rounded-2xl px-4 py-3 text-base font-serif leading-relaxed resize-none focus:ring-0 focus:border-butter-primary min-h-[120px]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <MoodSelect value={editMood} onChange={setEditMood} />
            <IntensitySlider value={editIntensity} onChange={setEditIntensity} />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-4 py-2 rounded-full border border-butter-accent text-butter-muted hover:bg-butter-accent text-xs font-bold uppercase tracking-widest transition-all"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1 px-4 py-2 rounded-full bg-butter-primary text-white text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
            >
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 justify-between items-start mb-4 md:mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-1">
                {entry.date}
              </p>
              <h3 className="text-xl font-serif">{entry.mood || 'Reflection'}</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-butter-primary">
                <TrendingUp size={14} />
                <span className="text-xs font-bold">Intensity: {entry.intensity}</span>
              </div>
              <button onClick={() => setEditing(true)} className="text-butter-muted hover:text-butter-primary transition-colors p-1">
                <Pencil size={15} />
              </button>
              <button onClick={() => onDelete(entry.id).catch((e) => alert(e.message))} className="text-butter-muted hover:text-red-400 transition-colors p-1">
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* 섹션 구조가 있으면 섹션별로, 없으면 그냥 텍스트로 */}
          {sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map((s) => (
                <div key={s.label}>
                  <p className="text-[9px] uppercase tracking-widest font-bold text-butter-primary mb-1">{s.label}</p>
                  <p className="text-butter-muted font-light leading-relaxed text-sm">{s.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-butter-muted font-light leading-relaxed">{entry.content}</p>
          )}
        </>
      )}
    </div>
  );
};

// ── Shared form controls ───────────────────────────────────────────────────

const MoodSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-2 block">Mood</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-butter-accent/30 border border-butter-accent rounded-xl px-3 py-2 text-sm font-serif focus:ring-0 focus:border-butter-primary"
    >
      <option value="">— Select a mood —</option>
      {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
  </div>
);

const IntensitySlider = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div>
    <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-2 block">
      Intensity: {value}
    </label>
    <input
      type="range" min={1} max={10} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-butter-primary mt-3"
    />
  </div>
);
