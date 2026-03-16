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

// --- Mock Data ---

const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Echoes of Distant Valleys',
    author: 'Elena Thorne',
    cover: 'https://picsum.photos/seed/book1/400/600',
    description: 'A sweeping saga of memory, loss, and the enduring power of the human spirit set against the backdrop of a changing world. Elena Thorne explores the delicate threads that bind generations together.',
    tags: ['Fiction', 'Historical', 'Emotional'],
    rating: 4.8,
    quote: "Memory is not a place we visit, but a landscape we inhabit.",
    historicalContext: "Written during the post-war era, this novel reflects the collective trauma and the search for identity in a fragmented society."
  },
  {
    id: '2',
    title: 'Silent Whispers',
    author: 'Julian Vane',
    cover: 'https://picsum.photos/seed/book2/400/600',
    description: 'A collection of minimalist poetry that captures the quiet moments of existence. Vane\'s words are like ripples on a still pond, profound and fleeting.',
    tags: ['Poetry', 'Minimalist'],
    rating: 4.5
  },
  {
    id: '3',
    title: 'The Architect of Dreams',
    author: 'Sarah Chen',
    cover: 'https://picsum.photos/seed/book3/400/600',
    description: 'A mind-bending exploration of consciousness and the nature of reality. A journey through the labyrinth of the human mind.',
    tags: ['Sci-Fi', 'Philosophical'],
    rating: 4.9
  },
  {
    id: '4',
    title: 'Autumn Leaves',
    author: 'Marcus Aurelius',
    cover: 'https://picsum.photos/seed/book4/400/600',
    description: 'Reflections on the passing of time and the beauty of decay. A meditative look at the seasons of life.',
    tags: ['Philosophy', 'Nature'],
    rating: 4.7
  }
];

const MOCK_REFLECTIONS: Reflection[] = [
  {
    id: '1',
    title: 'The Weight of Silence',
    content: 'Reading Thorne\'s latest work made me realize how much we carry in our silences. The valleys in the book aren\'t just geographical; they are the gaps in our conversations...',
    author: 'Clara Kim',
    authorAvatar: 'https://i.pravatar.cc/150?u=clara',
    date: 'Oct 24, 2023',
    tags: ['Reflection', 'Memory'],
    image: 'https://picsum.photos/seed/ref1/800/400',
    bookId: '1'
  },
  {
    id: '2',
    title: 'Finding Light in the Dark',
    content: 'Vane\'s poetry is a reminder that even in the darkest moments, there is a flicker of hope if we look close enough...',
    author: 'David Smith',
    authorAvatar: 'https://i.pravatar.cc/150?u=david',
    date: 'Oct 22, 2023',
    tags: ['Poetry', 'Hope'],
    image: 'https://picsum.photos/seed/ref2/800/400',
    bookId: '2'
  }
];

const MOCK_JOURNAL: JournalEntry[] = [
  { id: '1', date: '2023-10-20', content: 'Today I felt a strange sense of nostalgia while reading. It was as if the words were written specifically for me.', intensity: 7, mood: 'Nostalgic' },
  { id: '2', date: '2023-10-21', content: 'The concept of "Personal Cartography" is fascinating. Mapping my emotions through books feels like discovering a new continent.', intensity: 8, mood: 'Inspired' },
  { id: '3', date: '2023-10-22', content: 'A quiet day. Just me and my thoughts.', intensity: 4, mood: 'Calm' }
];

const MOCK_EMOTIONS: EmotionData[] = [
  { date: 'Mon', intensity: 4, emotion: 'Calm' },
  { date: 'Tue', intensity: 7, emotion: 'Inspired' },
  { date: 'Wed', intensity: 5, emotion: 'Melancholy' },
  { date: 'Thu', intensity: 8, emotion: 'Joy' },
  { date: 'Fri', intensity: 6, emotion: 'Pensive' },
  { date: 'Sat', intensity: 9, emotion: 'Awe' },
  { date: 'Sun', intensity: 5, emotion: 'Calm' },
];

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

const Home = ({ onSelectReflection }: { onSelectReflection: (r: Reflection) => void }) => (
  <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
    <header className="mb-12">
      <h1 className="text-5xl font-serif mb-4">Recent Reflections</h1>
      <p className="text-butter-muted max-w-2xl">A curated stream of thoughts and insights from our community of deep readers.</p>
    </header>
    
    <div className="grid gap-12">
      {MOCK_REFLECTIONS.map((reflection) => (
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
                src={reflection.image} 
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
                    <p className="text-[10px] text-butter-muted uppercase tracking-wider">{reflection.date}</p>
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

const Explore = ({ onSelectBook }: { onSelectBook: (b: Book) => void }) => {
  const [filter, setFilter] = useState('All');
  
  const filteredBooks = filter === 'All' ? MOCK_BOOKS : MOCK_BOOKS.filter(b => b.tags.includes(filter));

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
                {MOCK_BOOKS.slice(0, 2).map(book => (
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
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredBooks.map((book) => (
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
        </main>
      </div>
    </div>
  );
};

const BookDetail = ({ book, onBack }: { book: Book, onBack: () => void }) => (
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
          <div className="space-y-6">
            {MOCK_REFLECTIONS.filter(r => r.bookId === book.id).map(reflection => (
              <div key={reflection.id} className="p-6 bg-white rounded-2xl border border-butter-accent shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <img src={reflection.authorAvatar} alt={reflection.author} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                  <div>
                    <p className="text-sm font-bold">{reflection.author}</p>
                    <p className="text-[10px] text-butter-muted uppercase tracking-wider">{reflection.date}</p>
                  </div>
                </div>
                <h4 className="font-serif text-xl mb-2">{reflection.title}</h4>
                <p className="text-sm text-butter-muted line-clamp-2 font-light">{reflection.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const Journal = () => {
  const [view, setView] = useState<'write' | 'archive'>('write');
  const [content, setContent] = useState('');
  
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
              <h2 className="text-3xl font-serif">How did your reading today mirror your current emotional landscape?</h2>
            </div>
            
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Begin your silent reflection..."
              className="flex-1 w-full bg-transparent border-none focus:ring-0 text-xl font-serif leading-relaxed resize-none placeholder:text-butter-accent"
            />
            
            <div className="mt-8 flex justify-between items-center pt-8 border-t border-butter-accent">
              <div className="flex gap-4">
                <button className="text-butter-muted hover:text-butter-primary transition-colors"><Plus size={24} /></button>
                <button className="text-butter-muted hover:text-butter-primary transition-colors"><Clock size={24} /></button>
              </div>
              <button className="bg-butter-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">Save Reflection</button>
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
            {MOCK_JOURNAL.map(entry => (
              <div key={entry.id} className="bg-white p-8 rounded-3xl border border-butter-accent shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-butter-muted mb-1">{entry.date}</p>
                    <h3 className="text-xl font-serif">{entry.mood}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-butter-primary">
                    <TrendingUp size={14} />
                    <span className="text-xs font-bold">Intensity: {entry.intensity}</span>
                  </div>
                </div>
                <p className="text-butter-muted font-light leading-relaxed">{entry.content}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Cartography = () => {
  return (
    <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-serif mb-4">Personal Cartography</h1>
        <p className="text-butter-muted">Mapping the emotional terrain of your literary journey.</p>
      </header>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-8 rounded-[32px] border border-butter-accent shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Narrative Arc (Weekly Intensity)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_EMOTIONS}>
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
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[32px] border border-butter-accent shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Intensity Matrix</h3>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => {
              const intensity = Math.floor(Math.random() * 10);
              const opacity = intensity / 10;
              return (
                <div 
                  key={i} 
                  className="aspect-square rounded-md" 
                  style={{ backgroundColor: `rgba(117, 91, 0, ${opacity})` }}
                  title={`Intensity: ${intensity}`}
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
            {['Melancholy', 'Awe', 'Nostalgia', 'Solitude', 'Resilience', 'Ephemeral', 'Luminescence', 'Quietude'].map((word, i) => (
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
