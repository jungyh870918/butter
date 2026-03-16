import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Mock Data ---
  let books = [
    {
      id: '1',
      title: 'The Unbearable Lightness of Being',
      author: 'Milan Kundera',
      cover: 'https://picsum.photos/seed/lightness/400/600',
      description: 'A philosophical novel about two women, two men, a dog and their lives in the 1968 Prague Spring period of Czechoslovak history.',
      tags: ['Philosophy', 'Fiction'],
      rating: 4.8,
      historicalContext: 'Set during the Prague Spring of 1968, a period of political liberalization in Czechoslovakia.',
      quote: 'The heavier the burden, the closer our lives come to the earth, the more real and truthful they become.'
    },
    {
      id: '2',
      title: 'Meditations',
      author: 'Marcus Aurelius',
      cover: 'https://picsum.photos/seed/meditations/400/600',
      description: 'A series of personal writings by Marcus Aurelius, Roman Emperor from 161 to 180 AD, recording his private notes to himself and ideas on Stoic philosophy.',
      tags: ['Philosophy', 'Historical'],
      rating: 4.9,
      historicalContext: 'Written while on campaign between 170 and 180 AD.',
      quote: 'You have power over your mind - not outside events. Realize this, and you will find strength.'
    },
    {
      id: '3',
      title: 'The Waste Land',
      author: 'T.S. Eliot',
      cover: 'https://picsum.photos/seed/wasteland/400/600',
      description: 'A poem by T. S. Eliot, widely regarded as one of the most important poems of the 20th century and a central work of Modernist poetry.',
      tags: ['Poetry', 'Fiction'],
      rating: 4.7,
      historicalContext: 'Published in 1922, reflecting the disillusionment of the post-WWI generation.',
      quote: 'I will show you fear in a handful of dust.'
    }
  ];

  let reflections = [
    {
      id: 'r1',
      title: 'The Weight of Freedom',
      content: 'Reading Kundera makes me realize how much we fear the "lightness" of our choices. Every decision feels heavy because it defines us, yet in the grand scheme, it is light as air.',
      author: 'Elena Wright',
      authorAvatar: 'https://i.pravatar.cc/150?u=elena',
      date: new Date().toISOString(),
      tags: ['Existentialism', 'Freedom'],
      image: 'https://picsum.photos/seed/freedom/800/400',
      bookId: '1'
    },
    {
      id: 'r2',
      title: 'Stoicism in the Modern Age',
      content: 'Marcus Aurelius reminds us that our internal world is the only thing we truly control. In a world of constant notifications and noise, this is the ultimate sanctuary.',
      author: 'Julian Thorne',
      authorAvatar: 'https://i.pravatar.cc/150?u=julian',
      date: new Date().toISOString(),
      tags: ['Stoicism', 'Mindfulness'],
      image: 'https://picsum.photos/seed/stoic/800/400',
      bookId: '2'
    }
  ];

  let journalEntries = [
    {
      id: 'j1',
      date: '2023-10-24',
      content: 'Today I felt a strange resonance with the themes of isolation in The Waste Land. The "dryness" Eliot describes feels like my own creative block.',
      mood: 'Melancholy',
      intensity: 7
    }
  ];

  let emotionLogs = [
    { date: 'Mon', intensity: 4, emotion: 'Calm' },
    { date: 'Tue', intensity: 7, emotion: 'Inspired' },
    { date: 'Wed', intensity: 5, emotion: 'Pensive' },
    { date: 'Thu', intensity: 8, emotion: 'Excited' },
    { date: 'Fri', intensity: 6, emotion: 'Melancholy' },
    { date: 'Sat', intensity: 9, emotion: 'Euphoric' },
    { date: 'Sun', intensity: 5, emotion: 'Quietude' }
  ];

  // --- API Routes ---

  // Books
  app.get('/api/books', (req, res) => {
    const { tag, search } = req.query;
    let filtered = [...books];
    if (tag && tag !== 'All') {
      filtered = filtered.filter(b => b.tags.includes(tag as string));
    }
    if (search) {
      const s = (search as string).toLowerCase();
      filtered = filtered.filter(b => b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s));
    }
    res.json(filtered);
  });

  app.get('/api/books/:id', (req, res) => {
    const book = books.find(b => b.id === req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  });

  app.get('/api/books/:id/reflections', (req, res) => {
    const bookReflections = reflections.filter(r => r.bookId === req.params.id);
    res.json(bookReflections);
  });

  // Reflections
  app.get('/api/reflections', (req, res) => {
    const { bookId, limit } = req.query;
    let filtered = [...reflections];
    if (bookId) {
      filtered = filtered.filter(r => r.bookId === bookId);
    }
    if (limit) {
      filtered = filtered.slice(0, parseInt(limit as string));
    }
    res.json(filtered);
  });

  app.get('/api/reflections/:id', (req, res) => {
    const reflection = reflections.find(r => r.id === req.params.id);
    if (!reflection) return res.status(404).json({ message: 'Reflection not found' });
    res.json(reflection);
  });

  app.post('/api/reflections', (req, res) => {
    const newReflection = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      author: 'You',
      authorAvatar: 'https://i.pravatar.cc/150?u=you',
      ...req.body
    };
    reflections.unshift(newReflection);
    res.status(201).json(newReflection);
  });

  // Journal
  app.get('/api/journal', (req, res) => {
    res.json(journalEntries);
  });

  app.post('/api/journal', (req, res) => {
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      ...req.body
    };
    journalEntries.unshift(newEntry);
    res.status(201).json(newEntry);
  });

  app.patch('/api/journal/:id', (req, res) => {
    const index = journalEntries.findIndex(e => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ message: 'Entry not found' });
    journalEntries[index] = { ...journalEntries[index], ...req.body };
    res.json(journalEntries[index]);
  });

  app.delete('/api/journal/:id', (req, res) => {
    journalEntries = journalEntries.filter(e => e.id !== req.params.id);
    res.status(204).send();
  });

  // Emotions
  app.get('/api/emotions', (req, res) => {
    res.json(emotionLogs);
  });

  app.get('/api/emotions/summary', (req, res) => {
    const topEmotions = Array.from(new Set(emotionLogs.map(e => e.emotion))).slice(0, 5);
    const averageIntensity = emotionLogs.reduce((acc, curr) => acc + curr.intensity, 0) / (emotionLogs.length || 1);
    res.json({ topEmotions, averageIntensity });
  });

  app.post('/api/emotions', (req, res) => {
    const newLog = req.body;
    emotionLogs.push(newLog);
    if (emotionLogs.length > 28) emotionLogs.shift();
    res.status(201).json(newLog);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
