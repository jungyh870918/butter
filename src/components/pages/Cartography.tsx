import { useLocale } from '../../hooks/useLocale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEmotions } from '../../hooks/useEmotions';
import { LoadingSpinner, ErrorMessage, EmptyState } from '../ui';
import { EmotionData, EmotionSummary } from '../../types';

const MATRIX_CELLS = 28;

export const Cartography = () => {
  const { t } = useLocale();
  const { emotions, summary, loading, error } = useEmotions();

  return (
    <div className="pt-20 md:pt-24 pb-12 px-4 md:px-6 max-w-6xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-serif font-light mb-3 md:mb-4">Personal Cartography</h1>
        <p className="text-butter-muted">Mapping the emotional terrain of your literary journey.</p>
      </header>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 mb-5 md:mb-8">
            <NarrativeArc emotions={emotions} />
            <IntensityMatrix emotions={emotions} />
          </div>
          <LexiconCloud emotions={emotions} summary={summary} />
        </>
      )}
    </div>
  );
};

// ── NarrativeArc ───────────────────────────────────────────────────────────

const NarrativeArc = ({ emotions }: { emotions: EmotionData[] }) => {
  const { t } = useLocale();
  return (
  <div className="py-4">
    <h3 className="text-sm font-medium uppercase tracking-[0.15em] text-butter-muted mb-6">Narrative Arc — Weekly Intensity</h3>
    <div className="h-[300px] w-full">
      {emotions.length === 0 ? (
        <EmptyState {...{message: t('map.empty')}} />
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={emotions}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis hide domain={[0, 10]} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
            />
            <Line
              type="monotone"
              dataKey="intensity"
              stroke="#755b00"
              strokeWidth={3}
              dot={{ r: 6, fill: '#755b00', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
  );
};

// ── IntensityMatrix ────────────────────────────────────────────────────────

const LEGEND_OPACITIES = [0.1, 0.3, 0.5, 0.7, 1] as const;

const IntensityMatrix = ({ emotions }: { emotions: EmotionData[] }) => {
  const { t } = useLocale();
  const cells = Array.from({ length: MATRIX_CELLS }).map((_, i) => {
    const entry = emotions.length > 0 ? emotions[i % emotions.length] : null;
    return {
      intensity: entry?.intensity ?? 0,
      label: entry ? `${entry.emotion} — ${entry.intensity}` : '',
    };
  });

  return (
    <div className="py-4">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-5 md:mb-8">Intensity Matrix</h3>
      {emotions.length === 0 ? (
        <EmptyState {...{message: t('map.empty.data')}} />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((cell, i) => (
              <div
                key={i}
                className="aspect-square rounded-md"
                style={{ backgroundColor: `rgba(117, 91, 0, ${cell.intensity / 10})` }}
                title={cell.label}
              />
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-butter-muted">
            <span>{t('map.low')}</span>
            <div className="flex gap-1">
              {LEGEND_OPACITIES.map((o) => (
                <div
                  key={o}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `rgba(117, 91, 0, ${o})` }}
                />
              ))}
            </div>
            <span>{t('map.high')}</span>
          </div>
        </>
      )}
    </div>
  );
};

// ── LexiconCloud ───────────────────────────────────────────────────────────

interface LexiconCloudProps {
  emotions: EmotionData[];
  summary: EmotionSummary | null;
}

const LexiconCloud = ({ emotions, summary }: LexiconCloudProps) => {
  const lexicon: string[] =
    summary?.topEmotions?.map((e) => e.emotion) ??
    [...new Set(emotions.map((e) => e.emotion))].slice(0, 8);

  return (
    <div className="bg-butter-primary text-white p-8 md:p-12 rounded-2xl overflow-hidden relative">
      <div className="relative z-10">
        <h3 className="text-sm font-bold uppercase tracking-[0.3em] mb-8 opacity-60">
          Lexicon of Feelings
        </h3>
        {lexicon.length === 0 ? (
          <p className="opacity-60 font-serif italic text-xl">
            Save journal entries with a mood to build your lexicon.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-12 gap-y-8">
            {lexicon.map((word, i) => (
              <span
                key={word}
                className="font-serif italic opacity-80 hover:opacity-100 transition-opacity cursor-default"
                style={{ fontSize: `${Math.max(1.2, 3.2 - i * 0.3)}rem` }}
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl -ml-48 -mb-48" />
    </div>
  );
};
