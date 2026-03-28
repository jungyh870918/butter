export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  tags: string[];
  rating: number;
  publishedDate?: string;
  pageCount?: number;
  // EN enrichment
  historicalContext?: string;
  quote?: string;
  authorNote?: string;
  // KO enrichment
  quoteKo?: string;
  authorNoteKo?: string;
  historicalContextKo?: string;
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
  bookTitle?: string;
  bookAuthor?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  prompt?: string;
  mood?: string;           // 기존 단일 mood — 하위 호환
  emotions: string[];      // 신규 다중 감정 배열
  intensity: number;
  // book context (soft link)
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
  // guided extras
  highlight?: string;
  isPublic: boolean;
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

export interface UserProfile {
  id: string;
  userId: string;
  readingVolumeLevel: 'low' | 'mid' | 'high';
  recentEmotions: string[];
  dominantThemes: string[];
  writingStyleSignal: 'introspective' | 'factual' | 'emotional';
  notableFragments: string[];
  recentBookCategories: string[];
  sourceEntryCount: number;
  profileVersion: number;
  promptVersion: string;
  generatedAt: string;
  updatedAt: string;
}
