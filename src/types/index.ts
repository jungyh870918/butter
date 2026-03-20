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
  authorNote?: string;
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
  intensity: number;
}

export interface EmotionData {
  date: string;
  intensity: number;
  emotion: string;
}

export interface EmotionSummary {
  topEmotions: Array<{ emotion: string; count: number; avgIntensity: number }>;
  totalEntries: number;
  avgIntensity: number;
}
