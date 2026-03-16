import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Book as BookIcon, 
  PenTool, 
  Map, 
  Home as HomeIcon, 
  ChevronRight, 
  Star, 
  Clock, 
  MessageSquare, 
  Share2, 
  Heart,
  Filter,
  ArrowLeft,
  Plus,
  History,
  TrendingUp
} from 'lucide-react';
import { Book, Reflection, JournalEntry, EmotionData } from './types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import ReactMarkdown from 'react-markdown';

import { api } from './lib/api';
import { formatDate, getWeekdayLabel } from './lib/format';

// --- Components ---

const Navbar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => (
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

const Home = ({ onSelectReflection }: { onSelectReflection: (r: Reflection) => void }) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getReflections({ limit: 10 })
      .then(setReflections)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="pt-32 text-center font-serif text-butter-muted">Loading reflections...</div>;
  if (error) return <div className="pt-32 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-5xl font-serif mb-4">Recent Reflections</h1>
        <p className="text-butter-muted max-w-2xl">A curated stream of thoughts and insights from our community of deep readers.</p>
      </header>
      
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
              <div className="overflow-hidden rounded-2xl aspect-[16/9] md:aspect-[4/3]">
                <img 
                  src={reflection.image || 'https://picsum.photos/seed/default/800/400'} 
                  alt={reflection.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex gap-2 mb-4">
                  {reflection.tags.map(tag => (
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
    </div>
  );
};

const Explore = ({ onSelectBook }: { onSelectBook: (b: Book) => void }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trending, setTrending] = useState<Book[]>([]);

  useEffect(() => {
    setLoading(true);
    api.getBooks({ tag: filter })
      .then(setBooks)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    api.getBooks()
      .then(all => setTrending(all.slice(0, 2)))
      .catch(() => {});
  }, []);

  if (error) return <div className="pt-32 text-center text-red-500">Error: {error}</div>;

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
            <div className="mt-12 p-6 bg-butter-accent/50 rounded-2xl border border-butter-accent">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Trending Now</h3>
              <div className="space-y-4">
                {trending.map(book => (
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
          </div>
        </aside>
        
        <main className="flex-1">
          {loading ? (
            <div className="text-center font-serif text-butter-muted py-20">Loading books...</div>
          ) : (
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

const BookDetail = ({ book, onBack }: { book: Book, onBack: () => void }) => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getBookReflections(book.id)
      .then(setReflections)
      .catch(err => setError(err.message))
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
            {book.tags.map(tag => (
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
            {loading ? (
              <p className="text-butter-muted italic">Loading reflections...</p>
            ) : error ? (
              <p className="text-red-500 italic">Error loading reflections: {error}</p>
            ) : (
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
                {reflections.length === 0 && <p className="text-butter-muted italic">No reflections yet for this book.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Journal = () => {
  const [view, setView] = useState<'write' | 'archive'>('write');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const fetchEntries = () => {
    setLoading(true);
    api.getJournalEntries()
      .then(setEntries)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (view === 'archive') {
      fetchEntries();
    }
  }, [view]);

  const handleSave = async () => {
    if (!content.trim()) return;
    try {
      const newEntry = await api.createJournalEntry({ content, mood, intensity });
      
      // Auto-log emotion if mood exists
      if (mood.trim()) {
        await api.createEmotionLog({
          date: getWeekdayLabel(),
          intensity,
          emotion: mood
        });
      }

      setSuccessMsg('Reflection saved to your archive.');
      setContent('');
      setMood('');
      setIntensity(5);
      
      setTimeout(() => {
        setSuccessMsg(null);
        setView('archive');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reflection?')) return;
    try {
      await api.deleteJournalEntry(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateJournalEntry(id, { content: editContent });
      setEntries(entries.map(e => e.id === id ? { ...e, content: editContent } : e));
      setEditingId(null);
    } catch (err: any) {
      alert(err.message);
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
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-center font-bold">
                {successMsg}
              </div>
            )}
            <div className="mb-12">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-butter-primary mb-2 block">Inquiry</span>
              <h2 className="text-3xl font-serif">How did your reading today mirror your current emotional landscape?</h2>
            </div>
            
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin your silent reflection..."
              className="flex-1 w-full bg-transparent border-none focus:ring-0 text-xl font-serif leading-relaxed resize-none placeholder:text-butter-accent"
            />

            <div className="grid md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-butter-accent">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-2 block">Current Mood</label>
                <input 
                  type="text" 
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  placeholder="e.g. Melancholy, Inspired"
                  className="w-full bg-butter-bg border-none rounded-xl px-4 py-2 focus:ring-1 focus:ring-butter-primary"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-2 block">Intensity (1-10): {intensity}</label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={intensity}
                  onChange={(e) => setIntensity(parseInt(e.target.value))}
                  className="w-full h-2 bg-butter-accent rounded-lg appearance-none cursor-pointer accent-butter-primary"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              <div className="flex gap-4">
                <button className="text-butter-muted hover:text-butter-primary transition-colors"><Plus size={24} /></button>
                <button className="text-butter-muted hover:text-butter-primary transition-colors"><Clock size={24} /></button>
              </div>
              <button 
                onClick={handleSave}
                disabled={!content.trim()}
                className="bg-butter-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all disabled:opacity-50"
              >
                Save Reflection
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
            {loading && <p className="text-center text-butter-muted italic">Loading archive...</p>}
            {error && <p className="text-center text-red-500">Error: {error}</p>}
            {!loading && entries.length === 0 && <p className="text-center text-butter-muted italic">No reflections in your archive yet.</p>}
            
            {entries.map(entry => (
              <div key={entry.id} className="bg-white p-8 rounded-3xl border border-butter-accent shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-1">{entry.date}</p>
                    <h3 className="text-xl font-serif">{entry.mood || 'Untitled Reflection'}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-butter-primary">
                      <TrendingUp size={14} />
                      <span className="text-xs font-bold">Intensity: {entry.intensity}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(entry)} className="text-butter-muted hover:text-butter-text text-xs font-bold uppercase tracking-widest">Edit</button>
                      <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest">Delete</button>
                    </div>
                  </div>
                </div>
                
                {editingId === entry.id ? (
                  <div className="mt-4">
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-butter-bg border-none rounded-xl p-4 focus:ring-1 focus:ring-butter-primary min-h-[100px]"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button onClick={() => setEditingId(null)} className="text-butter-muted text-xs font-bold uppercase tracking-widest">Cancel</button>
                      <button onClick={() => handleUpdate(entry.id)} className="bg-butter-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Update</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-butter-muted font-light leading-relaxed">{entry.content}</p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Cartography = () => {
  const [emotions, setEmotions] = useState<EmotionData[]>([]);
  const [summary, setSummary] = useState<{ topEmotions: string[]; averageIntensity: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getEmotions(),
      api.getEmotionSummary()
    ]).then(([data, summ]) => {
      setEmotions(data);
      setSummary(summ);
    }).catch(err => {
      setError(err.message);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="pt-32 text-center font-serif text-butter-muted">Mapping your landscape...</div>;
  if (error) return <div className="pt-32 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-serif mb-4">Personal Cartography</h1>
        <p className="text-butter-muted">Mapping the emotional terrain of your literary journey.</p>
      </header>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-[32px] border border-butter-accent shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Narrative Arc (Emotion Logs)</h3>
          <div className="h-[300px] w-full">
            {emotions.length > 0 ? (
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
            ) : (
              <div className="h-full flex items-center justify-center text-butter-muted italic">No emotion data yet.</div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[32px] border border-butter-accent shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Intensity Matrix</h3>
          <div className="grid grid-cols-7 gap-2">
            {/* Render deterministic matrix based on emotion data, padding with empty if needed */}
            {Array.from({ length: 28 }).map((_, i) => {
              const emotion = emotions[i % emotions.length];
              const intensity = emotion ? emotion.intensity : 0;
              const opacity = intensity / 10;
              return (
                <div 
                  key={i} 
                  className="aspect-square rounded-md" 
                  style={{ backgroundColor: intensity > 0 ? `rgba(117, 91, 0, ${opacity})` : '#f5f5f5' }}
                  title={emotion ? `${emotion.emotion}: ${intensity}` : 'No data'}
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
        </div>
      </div>
      
      <div className="bg-butter-primary text-white p-12 rounded-[40px] shadow-2xl overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-sm font-bold uppercase tracking-[0.3em] mb-8 opacity-60">Lexicon of Feelings</h3>
          <div className="flex flex-wrap gap-x-12 gap-y-8">
            {(summary?.topEmotions && summary.topEmotions.length > 0 ? summary.topEmotions : ['Quietude', 'Pensive', 'Inspired']).map((word, i) => (
              <span 
                key={word} 
                className="font-serif italic text-4xl md:text-6xl opacity-80 hover:opacity-100 transition-opacity cursor-default"
                style={{ fontSize: `${Math.max(2, 5 - i * 0.4)}rem` }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl -ml-48 -mb-48" />
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);

  // Reset sub-selections when tab changes
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
