import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Filter, Star } from 'lucide-react';
import { Book } from '../../types';
import { useBooks } from '../../hooks/useBooks';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage } from '../ui';

const CATEGORIES = ['All', 'Fiction', 'Poetry', 'Philosophy', 'Sci-Fi', 'Historical'] as const;

export const Explore = () => {
  const [filter, setFilter] = useState('All');
  const { books, loading, error } = useBooks(filter);
  const navigate = useNavigate();

  const handleSelectBook = (book: Book) => navigate(`/explore/${book.id}`);

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row gap-12">
        <Sidebar filter={filter} onFilterChange={setFilter} trendingBooks={books.slice(0, 2)} onSelectBook={handleSelectBook} />
        <main className="flex-1">
          {loading && <LoadingSpinner />}
          {!loading && error && <ErrorMessage message={error} />}
          {!loading && !error && books.length === 0 && <EmptyState message="No books found" />}
          {!loading && !error && books.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {books.map((book) => (
                <BookCard key={book.id} book={book} onClick={() => handleSelectBook(book)} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

interface SidebarProps {
  filter: string;
  onFilterChange: (f: string) => void;
  trendingBooks: Book[];
  onSelectBook: (b: Book) => void;
}

const Sidebar = ({ filter, onFilterChange, trendingBooks, onSelectBook }: SidebarProps) => (
  <aside className="md:w-64 shrink-0">
    <div className="sticky top-24">
      <h2 className="text-xl font-serif mb-6 flex items-center gap-2">
        <Filter size={18} /> Curated Readings
      </h2>
      <div className="flex flex-col gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onFilterChange(cat)}
            className={`text-left px-4 py-2 rounded-lg transition-all ${
              filter === cat ? 'bg-butter-primary text-white shadow-lg' : 'hover:bg-butter-accent text-butter-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      {trendingBooks.length > 0 && (
        <div className="mt-12 p-6 bg-butter-accent/50 rounded-2xl border border-butter-accent">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Trending Now</h3>
          <div className="space-y-4">
            {trendingBooks.map((book) => (
              <div key={book.id} className="flex gap-3 items-center cursor-pointer" onClick={() => onSelectBook(book)}>
                <BookCoverImage
                  src={book.cover}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded shadow-sm"
                />
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
);

const BookCard = ({ book, onClick }: { book: Book; onClick: () => void }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="group cursor-pointer"
    onClick={onClick}
  >
    <div className="relative aspect-[2/3] mb-4 overflow-hidden rounded-2xl shadow-xl transition-all group-hover:-translate-y-2 group-hover:shadow-2xl">
      <BookCoverImage src={book.cover} alt={book.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button className="bg-white text-butter-text px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
          View Details
        </button>
      </div>
    </div>
    <h3 className="font-serif text-lg mb-1 group-hover:text-butter-primary transition-colors">{book.title}</h3>
    <p className="text-sm text-butter-muted mb-2">{book.author}</p>
    <div className="flex items-center gap-1 text-butter-primary">
      <Star size={14} fill="currentColor" />
      <span className="text-xs font-bold">{book.rating}</span>
    </div>
  </motion.div>
);
