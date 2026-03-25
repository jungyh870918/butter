import { useLocale } from '../../hooks/useLocale';
import { motion } from 'motion/react';
import { Heart, MessageSquare } from 'lucide-react';
import { Reflection } from '../../types';
import { useReflections } from '../../hooks/useReflections';
import { LoadingSpinner, ErrorMessage, EmptyState, AvatarImage } from '../ui';
import { formatDate } from '../../lib/format';

export const Home = () => {
  const { reflections, loading, error } = useReflections({ limit: 10 });
  const { t } = useLocale();

  return (
    <div className="pt-24 pb-20 px-6 md:px-10 max-w-4xl mx-auto">
      <header className="mb-16">
        <p className="text-[11px] uppercase tracking-[0.25em] text-butter-muted mb-4">{t('home.label')}</p>
        <h1 className="text-4xl md:text-5xl font-serif font-light leading-tight mb-4">
          {t('home.title')}
        </h1>
        <p className="text-butter-muted text-base leading-relaxed max-w-xl font-light">
          {t('home.subtitle')}
        </p>
      </header>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && reflections.length === 0 && <EmptyState {...{message: t('home.empty')}} />}

      {!loading && !error && (
        <div className="space-y-16">
          {reflections.map((reflection, i) => (
            <ReflectionCard key={reflection.id} reflection={reflection} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReflectionCard = ({ reflection, index }: { reflection: Reflection; index: number }) => (
  <motion.article
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.06, duration: 0.4 }}
    className="group"
    style={{ borderTop: index === 0 ? 'none' : '1px solid rgba(0,0,0,0.06)', paddingTop: index === 0 ? 0 : '4rem' }}
  >
    <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-12 items-start md:items-center">
      {reflection.image && (
        <div className="w-full overflow-hidden rounded-lg aspect-[4/3]">
          <img
            src={reflection.image}
            alt={reflection.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}
      <div className={reflection.image ? '' : 'md:col-span-2'}>
        {(reflection.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(reflection.tags || []).map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-widest text-butter-muted font-medium">
                {tag}
              </span>
            )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="text-butter-muted/40 text-[10px]">/</span>, el], [] as React.ReactNode[])}
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-serif font-light leading-snug mb-4 group-hover:text-butter-primary transition-colors duration-300">
          {reflection.title}
        </h2>
        <p className="text-butter-muted line-clamp-3 mb-6 font-light leading-[1.8] text-sm md:text-base">
          {reflection.content}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarImage src={reflection.authorAvatar} alt={reflection.author} className="w-7 h-7 rounded-full opacity-90" />
            <div>
              <p className="text-sm font-medium">{reflection.author}</p>
              <p className="text-[10px] text-butter-muted tracking-wide">{formatDate(reflection.date)}</p>
            </div>
          </div>
          <div className="flex gap-5 text-butter-muted">
            <button className="flex items-center gap-1.5 hover:text-butter-primary transition-colors">
              <Heart size={14} strokeWidth={1.5} />
              <span className="text-[11px]">24</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-butter-primary transition-colors">
              <MessageSquare size={14} strokeWidth={1.5} />
              <span className="text-[11px]">8</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </motion.article>
);
