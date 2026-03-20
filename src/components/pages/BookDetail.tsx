import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Heart, Share2, MessageSquare, History, Link, Check, Copy } from 'lucide-react';
import { Book, Reflection } from '../../types';
import { useBook } from '../../hooks/useBook';
import { useReflections } from '../../hooks/useReflections';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage, AvatarImage } from '../ui';
import { formatDate } from '../../lib/format';

export const BookDetail = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { book, loading: bookLoading, error: bookError } = useBook(bookId);
  const { reflections, loading: refLoading, error: refError } = useReflections({ bookId });

  if (bookLoading) return <div className="pt-24"><LoadingSpinner /></div>;
  if (bookError || !book) return <div className="pt-24"><ErrorMessage message={bookError || 'Book not found'} /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
      <button onClick={() => navigate('/explore')} className="mb-8 flex items-center gap-2 text-butter-muted hover:text-butter-text transition-colors">
        <ArrowLeft size={20} />
        <span className="uppercase tracking-widest text-xs font-bold">Back to Explore</span>
      </button>
      <div className="grid md:grid-cols-2 gap-16">
        <BookCover book={book} bookId={bookId!} />
        <BookInfo book={book} reflections={reflections} loading={refLoading} error={refError} />
      </div>
    </motion.div>
  );
};

const BookCover = ({ book, bookId }: { book: Book; bookId: string }) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pageUrl = `${window.location.origin}/share/${bookId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="sticky top-24">
        <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl mb-8">
          <BookCoverImage src={book.cover} alt={book.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex gap-4 mb-4">
          <button className="flex-1 bg-butter-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">
            Start Reading
          </button>
          <button className="p-4 rounded-2xl border border-butter-accent hover:bg-butter-accent transition-all">
            <Heart size={24} />
          </button>
          <button
            onClick={() => setLinkOpen((prev) => !prev)}
            className={`p-4 rounded-2xl border transition-all ${linkOpen ? 'border-butter-primary bg-butter-primary/10 text-butter-primary' : 'border-butter-accent hover:bg-butter-accent'}`}
          >
            <Share2 size={24} />
          </button>
        </div>
        <AnimatePresence>
          {linkOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="bg-white border border-butter-accent rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-3 flex items-center gap-1.5">
                  <Link size={12} /> 링크 생성하기
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly value={pageUrl}
                    className="flex-1 bg-butter-accent/40 border border-butter-accent rounded-xl px-3 py-2 text-xs font-mono text-butter-text truncate focus:outline-none"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${copied ? 'bg-green-500 text-white' : 'bg-butter-primary text-white hover:brightness-110'}`}
                  >
                    {copied ? <><Check size={13} /> 복사됨</> : <><Copy size={13} /> 복사</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const BookInfo = ({ book, reflections, loading, error }: { book: Book; reflections: Reflection[]; loading: boolean; error: string }) => (
  <div>
    <div className="flex gap-2 mb-6">
      {(book.tags || []).map((tag) => (
        <span key={tag} className="text-[10px] uppercase tracking-widest bg-butter-accent px-3 py-1.5 rounded-full text-butter-muted font-bold">{tag}</span>
      ))}
    </div>
    <h1 className="text-6xl font-serif mb-4 leading-tight">{book.title}</h1>
    <p className="text-2xl font-serif italic text-butter-muted mb-8">by {book.author}</p>
    <div className="prose prose-stone max-w-none mb-12">
      <p className="text-lg leading-relaxed text-butter-muted font-light">{book.description}</p>
    </div>
    {book.quote && (
      <blockquote className="bg-butter-primary/5 border-l-4 border-butter-primary p-8 rounded-r-2xl mb-12">
        <p className="text-2xl font-serif italic mb-4">"{book.quote}"</p>
        <footer className="text-sm uppercase tracking-widest font-bold text-butter-primary">— Author's Note</footer>
      </blockquote>
    )}
    {book.historicalContext && (
      <div className="mb-12">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
          <History size={18} /> Historical Context
        </h3>
        <p className="text-butter-muted leading-relaxed font-light">{book.historicalContext}</p>
      </div>
    )}
    <div>
      <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
        <MessageSquare size={18} /> Community Reflections
      </h3>
      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && reflections.length === 0 && <EmptyState message="No reflections for this book yet" />}
      {!loading && !error && reflections.length > 0 && (
        <div className="space-y-6">
          {reflections.map((reflection) => (
            <div key={reflection.id} className="p-6 bg-white rounded-2xl border border-butter-accent shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <AvatarImage src={reflection.authorAvatar} alt={reflection.author} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="text-sm font-bold">{reflection.author}</p>
                  <p className="text-[10px] text-butter-muted uppercase tracking-wider">{formatDate(reflection.date)}</p>
                </div>
              </div>
              <h4 className="font-serif text-xl mb-2">{reflection.title}</h4>
              <p className="text-sm text-butter-muted line-clamp-2 font-light">{reflection.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
