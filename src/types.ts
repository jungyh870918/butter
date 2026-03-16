export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  tags: string[];
  rating: number;
  historicalContext?: string;
  quote?: string;
}

export interface Reflection {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  date: string;
  tags: string[];
  image?: string;
  bookId?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  prompt?: string;
  mood?: string;
  intensity: number; // 1-10
}

export interface EmotionData {
  date: string;
  intensity: number;
  emotion: string;
}
