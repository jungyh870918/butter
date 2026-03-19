import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Book as BookIcon,
  PenTool,
  Map,
  Home as HomeIcon,
  Star,
  Clock,
  MessageSquare,
  Share2,
  Heart,
  Filter,
  ArrowLeft,
  Plus,
  History,
  TrendingUp,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { Book, Reflection, JournalEntry, EmotionData, EmotionSummary } from './types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  getBooks,
  getBookReflections,
  getReflections,
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getEmotions,
  getEmotionSummary,
  createEmotionLog,
} from './lib/api';
import { formatDate, getWeekdayLabel } from './lib/format';

// --- Shared UI helpers ---

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 rounded-full border-2 border-butter-accent border-t-butter-primary animate-spin" />
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-butter-muted">
    <p className="text-sm uppercase tracking-widest font-bold mb-2">Something went wrong</p>
    <p className="text-xs opacity-60">{message}</p>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-butter-muted">
    <p className="text-sm uppercase tracking-widest font-bold">{message}</p>
  </div>
);

// --- Navbar ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-butter-bg/80 backdrop-blur-md border-b border-butter-accent px-6 py-4 flex justify-between items-center">
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
      <div className="w-8 h-8 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-xl">B</div>
      <span className="font-serif text-2xl font-bold tracking-tight">Butter</span>
    </div>
    <div className="flex gap-8 items-center">
      {[
        { id: 'home', icon: HomeIcon, label: 'Home' },
        { id: 'explore', icon: BookIcon, label: 'Explore' },
        { id: 'journal', icon: PenTool, label: 'Journal' },
        { id: 'cartography', icon: Map, label: 'Cartography' }
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`flex items-center gap-2 transition-colors ${activeTab === item.id ? 'text-butter-primary font-semibold' : 'text-butter-muted hover:text-butter-text'}`}
        >
          <item.icon size={20} />
          <span className="hidden md:inline text-sm uppercase tracking-widest">{item.label}</span>
        </button>
      ))}
    </div>
    <div className="flex items-center gap-4">
      <Search size={20} className="text-butter-muted cursor-pointer hover:text-butter-text" />
      <div className="w-8 h-8 rounded-full bg-butter-accent overflow-hidden border border-butter-accent">
        <img src="https://i.pravatar.cc/150?u=user" alt="User" referrerPolicy="no-referrer" />
      </div>
    </div>
  </nav>
);

// --- Home ---

const Home = ({ onSelectReflection }: { onSelectReflection: (r: Reflection) => void }) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getReflections({ limit: 10 })
      .then((data) => setReflections(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-5xl font-serif mb-4">Recent Reflections</h1>
        <p className="text-butter-muted max-w-2xl">A curated stream of thoughts and insights from our community of deep readers.</p>
      </header>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}
      {!loading && !error && reflections.length === 0 && <EmptyState message="No reflections yet" />}

      {!loading && !error && (
        <div className="grid gap-12">
          {reflections.map((reflection) => (
            <motion.article
              key={reflection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group cursor-pointer"
              onClick={() => onSelectReflection(reflection)}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {reflection.image && (
                  <div className="overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[4/3]">
                    <img
                      src={reflection.image}
                      alt={reflection.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className={reflection.image ? '' : 'md:col-span-2'}>
                  <div className="flex gap-2 mb-4">
                    {(reflection.tags || []).map(tag => (
                      <span key={tag} className="text-[10px] uppercase tracking-widest bg-butter-accent px-2 py-1 rounded-full text-butter-muted font-semibold">{tag}</span>
                    ))}
                  </div>
                  <h2 className="text-3xl font-serif mb-4 group-hover:text-butter-primary transition-colors">{reflection.title}</h2>
                  <p className="text-butter-muted line-clamp-3 mb-6 font-light leading-relaxed">{reflection.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={reflection.authorAvatar} alt={reflection.author} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      <div>
                        <p className="text-sm font-semibold">{reflection.author}</p>
                        <p className="text-[10px] text-butter-muted uppercase tracking-wider">{formatDate(reflection.date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-butter-muted">
                      <button className="flex items-center gap-1 hover:text-butter-primary"><Heart size={16} /> <span className="text-xs">24</span></button>
                      <button className="flex items-center gap-1 hover:text-butter-primary"><MessageSquare size={16} /> <span className="text-xs">8</span></button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Explore ---

const Explore = ({ onSelectBook }: { onSelectBook: (b: Book) => void }) => {
  const [filter, setFilter] = useState('All');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = filter === 'All' ? {} : { tag: filter };
    getBooks(params)
      .then((data) => setBooks(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="md:w-64 shrink-0">
          <div className="sticky top-24">
            <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
              <Filter size={18} /> Curated Readings
            </h2>
            <div className="flex flex-col gap-2">
              {['All', 'Fiction', 'Poetry', 'Philosophy', 'Sci-Fi', 'Historical'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`text-left px-4 py-2 rounded-lg transition-all ${filter === cat ? 'bg-butter-primary text-white shadow-lg' : 'hover:bg-butter-accent text-butter-muted'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            {books.length > 0 && (
              <div className="mt-12 p-6 bg-butter-accent/50 rounded-2xl border border-butter-accent">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Trending Now</h3>
                <div className="space-y-4">
                  {books.slice(0, 2).map(book => (
                    <div key={book.id} className="flex gap-3 items-center cursor-pointer" onClick={() => onSelectBook(book)}>
                      <img src={book.cover} alt={book.title} className="w-12 h-16 object-cover rounded shadow-sm" referrerPolicy="no-referrer" />
                      <div>
                        <p className="text-xs font-bold line-clamp-1">{book.title}</p>
                        <p className="text-[10px] text-butter-muted">{book.author}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1">
          {loading && <LoadingSpinner />}
          {!loading && error && <ErrorMessage message={error} />}
          {!loading && !error && books.length === 0 && <EmptyState message="No books found" />}
          {!loading && !error && books.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {books.map((book) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group cursor-pointer"
                  onClick={() => onSelectBook(book)}
                >
                  <div className="relative aspect-[2/3] mb-4 overflow-hidden rounded-2xl shadow-xl transition-all group-hover:-translate-y-2 group-hover:shadow-2xl">
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white text-butter-text px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">View Details</button>
                    </div>
                  </div>
                  <h3 className="font-serif text-lg mb-1 group-hover:text-butter-primary transition-colors">{book.title}</h3>
                  <p className="text-sm text-butter-muted mb-2">{book.author}</p>
                  <div className="flex items-center gap-1 text-butter-primary">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold">{book.rating}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// --- BookDetail ---

const BookDetail = ({ book, onBack }: { book: Book; onBack: () => void }) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getBookReflections(book.id)
      .then((data) => setReflections(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [book.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-24 pb-12 px-6 max-w-6xl mx-auto"
    >
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-butter-muted hover:text-butter-text transition-colors">
        <ArrowLeft size={20} /> <span className="uppercase tracking-widest text-xs font-bold">Back to Explore</span>
      </button>

      <div className="grid md:grid-cols-2 gap-16">
        <div>
          <div className="sticky top-24">
            <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl mb-8">
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex gap-4">
              <button className="flex-1 bg-butter-primary text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">Start Reading</button>
              <button className="p-4 rounded-2xl border border-butter-accent hover:bg-butter-accent transition-all"><Heart size={24} /></button>
              <button className="p-4 rounded-2xl border border-butter-accent hover:bg-butter-accent transition-all"><Share2 size={24} /></button>
            </div>
          </div>
        </div>

        <div>
          <div className="flex gap-2 mb-6">
            {(book.tags || []).map(tag => (
              <span key={tag} className="text-[10px] uppercase tracking-widest bg-butter-accent px-3 py-1.5 rounded-full text-butter-muted font-bold">{tag}</span>
            ))}
          </div>
          <h1 className="text-6xl font-serif mb-4 leading-tight">{book.title}</h1>
          <p className="text-2xl font-serif italic text-butter-muted mb-8">by {book.author}</p>

          <div className="prose prose-stone max-w-none mb-12">
            <p className="text-lg leading-relaxed text-butter-muted font-light">{book.description}</p>
          </div>

          {book.quote && (
            <div className="bg-butter-primary/5 border-l-4 border-butter-primary p-8 rounded-r-2xl mb-12">
              <p className="text-2xl font-serif italic mb-4">"{book.quote}"</p>
              <p className="text-sm uppercase tracking-widest font-bold text-butter-primary">— Author's Note</p>
            </div>
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
                {reflections.map(reflection => (
                  <div key={reflection.id} className="p-6 bg-white rounded-2xl border border-butter-accent shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={reflection.authorAvatar} alt={reflection.author} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
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
      </div>
    </motion.div>
  );
};

// --- Journal ---

const MOODS = ['Nostalgic', 'Inspired', 'Calm', 'Melancholy', 'Joyful', 'Pensive', 'Anxious', 'Awe'];

const Journal = () => {
  const [view, setView] = useState<'write' | 'archive'>('write');

  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const prompt = 'How did your reading today mirror your current emotional landscape?';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState('');
  const [editIntensity, setEditIntensity] = useState(5);

  const fetchEntries = () => {
    setArchiveLoading(true);
    setArchiveError('');
    getJournalEntries()
      .then(setEntries)
      .catch((e) => setArchiveError(e.message))
      .finally(() => setArchiveLoading(false));
  };

  useEffect(() => {
    if (view === 'archive') fetchEntries();
  }, [view]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await createJournalEntry({ content, prompt, mood: mood || null, intensity });
      if (mood) {
        await createEmotionLog({ date: getWeekdayLabel(), intensity, emotion: mood });
      }
      setContent('');
      setMood('');
      setIntensity(5);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setView('archive');
      }, 1200);
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (e: any) {
      alert('Delete failed: ' + e.message);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditMood(entry.mood || '');
    setEditIntensity(entry.intensity);
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateJournalEntry(id, { content: editContent, mood: editMood, intensity: editIntensity });
      setEntries(prev => prev.map(e => e.id === id ? { ...e, content: editContent, mood: editMood, intensity: editIntensity } : e));
      setEditingId(null);
    } catch (e: any) {
      alert('Update failed: ' + e.message);
    }
  };

  return (
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
      <div className="flex justify-center mb-12">
        <div className="bg-butter-accent p-1 rounded-full flex">
          <button
            onClick={() => setView('write')}
            className={`px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${view === 'write' ? 'bg-white shadow-md' : 'text-butter-muted'}`}
          >
            Daily Reflection
          </button>
          <button
            onClick={() => setView('archive')}
            className={`px-8 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${view === 'archive' ? 'bg-white shadow-md' : 'text-butter-muted'}`}
          >
            Your Archive
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'write' ? (
          <motion.div
            key="write"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[40px] p-12 shadow-2xl border border-butter-accent min-h-[600px] flex flex-col"
          >
            <div className="mb-12">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-butter-primary mb-2 block">Inquiry</span>
              <h2 className="text-3xl font-serif">{prompt}</h2>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin your silent reflection..."
              className="flex-1 w-full bg-transparent border-none focus:ring-0 text-xl font-serif leading-relaxed resize-none placeholder:text-butter-accent"
            />

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-2 block">Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-butter-accent/30 border border-butter-accent rounded-xl px-3 py-2 text-sm font-serif focus:ring-0 focus:border-butter-primary"
                >
                  <option value="">— Select a mood —</option>
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-2 block">Intensity: {intensity}</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-butter-primary mt-3"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between items-center pt-8 border-t border-butter-accent">
              <div className="flex gap-4">
                <button className="text-butter-muted hover:text-butter-primary transition-colors"><Plus size={24} /></button>
                <button className="text-butter-muted hover:text-butter-primary transition-colors"><Clock size={24} /></button>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !content.trim()}
                className={`px-8 py-3 rounded-full font-bold uppercase tracking-widest shadow-lg transition-all ${saveSuccess ? 'bg-green-500 text-white' : 'bg-butter-primary text-white hover:brightness-110'} disabled:opacity-50`}
              >
                {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save Reflection'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="archive"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6"
          >
            {archiveLoading && <LoadingSpinner />}
            {!archiveLoading && archiveError && <ErrorMessage message={archiveError} />}
            {!archiveLoading && !archiveError && entries.length === 0 && (
              <EmptyState message="No journal entries yet — write your first reflection!" />
            )}
            {!archiveLoading && !archiveError && entries.map(entry => (
              <div key={entry.id} className="bg-white p-8 rounded-3xl border border-butter-accent shadow-sm hover:shadow-md transition-all">
                {editingId === entry.id ? (
                  <div className="flex flex-col gap-4">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-butter-accent/20 border border-butter-accent rounded-2xl px-4 py-3 text-base font-serif leading-relaxed resize-none focus:ring-0 focus:border-butter-primary min-h-[120px]"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-1 block">Mood</label>
                        <select
                          value={editMood}
                          onChange={(e) => setEditMood(e.target.value)}
                          className="w-full bg-butter-accent/30 border border-butter-accent rounded-xl px-3 py-2 text-sm font-serif focus:ring-0"
                        >
                          <option value="">— None —</option>
                          {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-1 block">Intensity: {editIntensity}</label>
                        <input
                          type="range" min={1} max={10} value={editIntensity}
                          onChange={(e) => setEditIntensity(Number(e.target.value))}
                          className="w-full accent-butter-primary mt-2"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-4 py-2 rounded-full border border-butter-accent text-butter-muted hover:bg-butter-accent text-xs font-bold uppercase tracking-widest transition-all">
                        <X size={14} /> Cancel
                      </button>
                      <button onClick={() => handleUpdate(entry.id)} className="flex items-center gap-1 px-4 py-2 rounded-full bg-butter-primary text-white text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all">
                        <Check size={14} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-1">{entry.date}</p>
                        <h3 className="text-xl font-serif">{entry.mood || 'Reflection'}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-butter-primary">
                          <TrendingUp size={14} />
                          <span className="text-xs font-bold">Intensity: {entry.intensity}</span>
                        </div>
                        <button onClick={() => startEdit(entry)} className="text-butter-muted hover:text-butter-primary transition-colors p-1">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="text-butter-muted hover:text-red-400 transition-colors p-1">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-butter-muted font-light leading-relaxed">{entry.content}</p>
                  </>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Cartography ---

const Cartography = () => {
  const [emotions, setEmotions] = useState<EmotionData[]>([]);
  const [summary, setSummary] = useState<EmotionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([getEmotions(), getEmotionSummary()])
      .then(([emotionData, summaryData]) => {
        setEmotions(emotionData);
        setSummary(summaryData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const matrixCells = Array.from({ length: 28 }).map((_, i) => {
    const entry = emotions.length > 0 ? emotions[i % emotions.length] : null;
    const intensity = entry ? entry.intensity : 0;
    return { intensity, label: entry ? `${entry.emotion} — ${entry.intensity}` : '' };
  });

  const lexicon: string[] = summary?.topEmotions?.map((e: any) => e.emotion) ||
    [...new Set(emotions.map((e) => e.emotion))].slice(0, 8);

  return (
    <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-serif mb-4">Personal Cartography</h1>
        <p className="text-butter-muted">Mapping the emotional terrain of your literary journey.</p>
      </header>

      {loading && <LoadingSpinner />}
      {!loading && error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-8 rounded-[32px] border border-butter-accent shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Narrative Arc (Weekly Intensity)</h3>
              <div className="h-[300px] w-full">
                {emotions.length === 0 ? (
                  <EmptyState message="Log moods in your journal to see your arc" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emotions}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                      <YAxis hide domain={[0, 10]} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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

            <div className="bg-white p-8 rounded-[32px] border border-butter-accent shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Intensity Matrix</h3>
              {emotions.length === 0 ? (
                <EmptyState message="No emotion data yet" />
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-2">
                    {matrixCells.map((cell, i) => {
                      const opacity = cell.intensity / 10;
                      return (
                        <div
                          key={i}
                          className="aspect-square rounded-md"
                          style={{ backgroundColor: `rgba(117, 91, 0, ${opacity})` }}
                          title={cell.label}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-6 flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-butter-muted">
                    <span>Low Intensity</span>
                    <div className="flex gap-1">
                      {[0.1, 0.3, 0.5, 0.7, 1].map(o => (
                        <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(117, 91, 0, ${o})` }} />
                      ))}
                    </div>
                    <span>High Intensity</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-butter-primary text-white p-12 rounded-[40px] shadow-2xl overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-sm font-bold uppercase tracking-[0.3em] mb-8 opacity-60">Lexicon of Feelings</h3>
              {lexicon.length === 0 ? (
                <p className="opacity-60 font-serif italic text-xl">Save journal entries with a mood to build your lexicon.</p>
              ) : (
                <div className="flex flex-wrap gap-x-12 gap-y-8">
                  {lexicon.map((word, i) => (
                    <span
                      key={word}
                      className="font-serif italic opacity-80 hover:opacity-100 transition-opacity cursor-default"
                      style={{ fontSize: `${Math.max(2, 5 - i * 0.4)}rem` }}
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
        </>
      )}
    </div>
  );
};

// --- App Root ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);

  useEffect(() => {
    setSelectedBook(null);
    setSelectedReflection(null);
  }, [activeTab]);

  return (
    <div className="min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="min-h-screen">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Home onSelectReflection={setSelectedReflection} />
            </motion.div>
          )}

          {activeTab === 'explore' && !selectedBook && (
            <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Explore onSelectBook={setSelectedBook} />
            </motion.div>
          )}

          {activeTab === 'explore' && selectedBook && (
            <motion.div key="book-detail" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
              <BookDetail book={selectedBook} onBack={() => setSelectedBook(null)} />
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div key="journal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Journal />
            </motion.div>
          )}

          {activeTab === 'cartography' && (
            <motion.div key="cartography" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Cartography />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-butter-accent/30 py-12 px-6 border-t border-butter-accent">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-sm">B</div>
            <span className="font-serif text-xl font-bold tracking-tight">Butter</span>
          </div>
          <div className="flex gap-8 text-[10px] uppercase tracking-widest font-bold text-butter-muted">
            <a href="#" className="hover:text-butter-text">About</a>
            <a href="#" className="hover:text-butter-text">Privacy</a>
            <a href="#" className="hover:text-butter-text">Terms</a>
            <a href="#" className="hover:text-butter-text">Contact</a>
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-butter-muted">© 2023 Butter Literary. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
