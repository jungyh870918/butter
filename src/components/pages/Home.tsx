import { motion } from 'motion/react';
import { Heart, MessageSquare } from 'lucide-react';
import { Reflection } from '../../types';
import { useReflections } from '../../hooks/useReflections';
import { LoadingSpinner, ErrorMessage, EmptyState, AvatarImage } from '../ui';
import { formatDate } from '../../lib/format';

export const Home = () => {
  const { reflections, loading, error } = useReflections({ limit: 10 });

  return (
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-5xl font-serif mb-4">Recent Reflections</h1>
        <p className="text-butter-muted max-w-2xl">
          A curated stream of thoughts and insights from our community of deep readers.
        </p>
      </header>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && reflections.length === 0 && <EmptyState message="No reflections yet" />}

      {!loading && !error && (
        <div className="grid gap-12">
          {reflections.map((reflection) => (
            <ReflectionCard key={reflection.id} reflection={reflection} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReflectionCard = ({ reflection }: { reflection: Reflection }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="group"
  >
    <div className="grid md:grid-cols-2 gap-8 items-center">
      {reflection.image && (
        <div className="overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[4/3]">
          <img
            src={reflection.image}
            alt={reflection.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onError={(e) => { (e.target as HTMLElement).parentElement!.style.display = 'none'; }}
          />
        </div>
      )}
      <div className={reflection.image ? '' : 'md:col-span-2'}>
        <div className="flex gap-2 mb-4">
          {(reflection.tags || []).map((tag) => (
            <span key={tag} className="text-[10px] uppercase tracking-widest bg-butter-accent px-2 py-1 rounded-full text-butter-muted font-semibold">
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-3xl font-serif mb-4">{reflection.title}</h2>
        <p className="text-butter-muted line-clamp-3 mb-6 font-light leading-relaxed">{reflection.content}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AvatarImage
              src={reflection.authorAvatar}
              alt={reflection.author}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="text-sm font-semibold">{reflection.author}</p>
              <p className="text-[10px] text-butter-muted uppercase tracking-wider">{formatDate(reflection.date)}</p>
            </div>
          </div>
          <div className="flex gap-4 text-butter-muted">
            <button className="flex items-center gap-1 hover:text-butter-primary">
              <Heart size={16} /> <span className="text-xs">24</span>
            </button>
            <button className="flex items-center gap-1 hover:text-butter-primary">
              <MessageSquare size={16} /> <span className="text-xs">8</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </motion.article>
);
