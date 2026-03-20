import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Pencil, Trash2, Check, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { JournalEntry } from '../../types';
import { useJournal } from '../../hooks/useJournal';
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
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
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
    <div className="bg-butter-accent p-1 rounded-full flex">
      {(['write', 'archive'] as const).map((v) => (
        <button
          key={v}
          onClick={() => onToggle(v)}
          className={`px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
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

interface WriteViewProps {
  onCreate: (payload: { content: string; prompt: string; mood: string; intensity: number }) => Promise<void>;
  onSaved: () => void;
}

const WriteView = ({ onCreate, onSaved }: WriteViewProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<PromptId, string>>({
    opening: '', emotion: '', mirror: '', linger: '', feeling: '',
  });
  const [mood, setMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1); // 슬라이드 방향

  const current = PROMPTS[step];
  const isFirst = step === 0;
  const isLast = step === PROMPTS.length - 1;
  const progress = ((step + 1) / PROMPTS.length) * 100;

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goPrev = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // 모든 질문과 답변을 하나의 content로 합침
      const content = PROMPTS
        .filter((p) => answers[p.id as PromptId].trim())
        .map((p) => `[${p.label}]\n${answers[p.id as PromptId].trim()}`)
        .join('\n\n');

      if (!content) return;

      await onCreate({
        content,
        prompt: current.question,
        mood,
        intensity,
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

      {/* 스텝 인디케이터 */}
      <div className="flex items-center justify-between px-12 pt-8 pb-0">
        <div className="flex gap-2">
          {PROMPTS.map((p, i) => (
            <div
              key={p.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step
                  ? 'bg-butter-primary w-6'
                  : i === step
                  ? 'bg-butter-primary w-10'
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
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="flex flex-col flex-1"
          >
            {/* 질문 */}
            <div className="mb-10">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-butter-primary mb-2 block">
                {current.label}
              </span>
              <h2 className="text-3xl font-serif leading-snug">{current.question}</h2>
            </div>

            {/* 답변 textarea */}
            {!current.isFinal && (
              <textarea
                autoFocus
                value={answers[current.id as PromptId]}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
                }
                placeholder={current.placeholder}
                className="flex-1 w-full bg-transparent border-none focus:ring-0 text-xl font-serif leading-relaxed resize-none placeholder:text-butter-accent min-h-[160px]"
              />
            )}

            {/* 마지막 스텝: mood + intensity */}
            {current.isFinal && (
              <div className="flex flex-col gap-8 flex-1">
                <textarea
                  autoFocus
                  value={answers[current.id as PromptId]}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
                  }
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
        {/* Back button */}
        <button
          onClick={goPrev}
          disabled={isFirst}
          className="flex items-center gap-2 px-8 py-3 rounded-full border border-butter-accent text-butter-muted hover:bg-butter-accent transition-all text-xs font-bold uppercase tracking-widest disabled:opacity-0 disabled:pointer-events-none"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Skip button */}
        <button
          onClick={goNext}
          className={`flex items-center gap-2 px-5 py-2 rounded-full border border-butter-accent text-butter-muted hover:bg-butter-accent hover:text-butter-text transition-all text-xs font-bold uppercase tracking-widest ${
            isLast ? 'invisible' : ''
          }`}
        >
          Skip
        </button>

        {/* Next / Finish button */}
        {isLast ? (
          <button
            onClick={handleFinish}
            disabled={saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold uppercase tracking-widest shadow-lg transition-all text-xs ${
              saveSuccess
                ? 'bg-green-500 text-white'
                : 'bg-butter-primary text-white hover:brightness-110'
            } disabled:opacity-50`}
          >
            {saveSuccess ? <><Check size={14} /> Saved</> : saving ? 'Saving...' : <><Check size={14} /> Finish</>}
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
    <div className="bg-white p-8 rounded-3xl border border-butter-accent shadow-sm hover:shadow-md transition-all">
      {editing ? (
        <div className="flex flex-col gap-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-butter-accent/20 border border-butter-accent rounded-2xl px-4 py-3 text-base font-serif leading-relaxed resize-none focus:ring-0 focus:border-butter-primary min-h-[120px]"
          />
          <div className="grid grid-cols-2 gap-4">
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
          <div className="flex justify-between items-start mb-5">
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
