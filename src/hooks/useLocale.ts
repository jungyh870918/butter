// ── Butter i18n ───────────────────────────────────────────────────────────
// 모든 고정 UI 문구를 여기서 관리.
// 새 문구 추가 시 EN/KO 양쪽 모두 추가할 것.

export type Locale = 'en' | 'ko';

export const STORAGE_KEY = 'butter-locale';
export const DEFAULT_LOCALE: Locale = 'en';

// ── 번역 사전 ───────────────────────────────────────────────────────────────

const translations = {
  // ── Navbar ──
  'nav.home': { en: 'Home', ko: '홈' },
  'nav.explore': { en: 'Explore', ko: '둘러보기' },
  'nav.journal': { en: 'Journal', ko: '기록' },
  'nav.map': { en: 'Map', ko: '지도' },
  'nav.search.placeholder': { en: 'Search the library…', ko: '책 검색…' },

  // ── Footer ──
  'footer.manifesto': { en: 'The Manifesto', ko: '선언문' },
  'footer.archive': { en: 'Library Archive', ko: '도서관 기록 보관함' },
  'footer.ethics': { en: 'Journaling Ethics', ko: '기록 윤리' },
  'footer.privacy': { en: 'Privacy', ko: '개인정보' },
  'footer.contact': { en: 'Contact', ko: '문의' },
  'footer.tagline': { en: 'For readers who like to think while they read.', ko: '읽으면서 생각하는 사람들을 위해.' },
  'footer.quiet': { en: 'A quiet place on the internet.', ko: '인터넷 속 조용한 공간.' },

  // ── Explore ──
  'explore.label': { en: 'Curated Readings', ko: '엄선된 도서' },
  'explore.title': { en: 'Explore', ko: '둘러보기' },
  'explore.title.em': { en: 'the library', ko: '도서관' },
  'explore.subtitle': { en: 'Books worth slowing down for. Picked for curiosity, depth, and the occasional rabbit hole.', ko: '천천히 읽을 만한 책들. 호기심과 깊이를 기준으로 골랐습니다.' },
  'explore.empty': { en: 'No books found', ko: '검색 결과가 없습니다' },
  'explore.cat.all': { en: 'All', ko: '전체' },
  'explore.cat.fiction': { en: 'Fiction', ko: '소설' },
  'explore.cat.poetry': { en: 'Poetry Anthology', ko: '시선집' },
  'explore.cat.philosophy': { en: 'Philosophy', ko: '철학' },
  'explore.cat.scifi': { en: 'Sci-Fi', ko: 'SF' },
  'explore.cat.historical': { en: 'Classic Lit', ko: '고전문학' },
  'explore.cat.essay': { en: 'Essay', ko: '에세이' },
  'explore.cat.psychology': { en: 'Psychology', ko: '심리/자기계발' },
  'explore.cat.mystery': { en: 'Mystery', ko: '추리/스릴러' },
  'explore.cat.history': { en: 'History', ko: '역사/인물' },
  'explore.cat.comics': { en: 'Comics', ko: '만화' },
  'explore.trending': { en: 'Trending Now', ko: '지금 인기' },
  'explore.journal.title': { en: 'The Reading Notes', ko: '독서 기록 노트' },
  'explore.journal.desc': { en: 'A weekly newsletter on books, notes, and what we\'ve been reading lately.', ko: '매주 책과 독서 메모를 공유하는 뉴스레터입니다.' },
  'explore.journal.email': { en: 'Your email', ko: '이메일 주소' },
  'explore.journal.subscribe': { en: 'Subscribe', ko: '구독' },
  'explore.didyouknow': { en: 'Did you know?', ko: '알고 계셨나요?' },

  // ── Home ──
  'home.label': { en: 'Community', ko: '커뮤니티' },
  'home.title': { en: 'What people are', ko: '지금 쓰이고' },
  'home.title.em': { en: 'writing', ko: '있는 것들' },
  'home.subtitle': { en: 'Notes, reactions, and passing thoughts from readers in the community.', ko: '독자들이 남긴 감상과 짧은 기록들.' },
  'home.empty': { en: 'Nothing written yet', ko: '아직 남긴 기록이 없습니다.' },
  'home.from': { en: 'from', ko: '' },

  // ── BookDetail ──
  'book.start': { en: 'Start Reading', ko: '읽기 시작' },
  'book.add': { en: 'Add to Library', ko: '서재에 추가' },
  'book.write': { en: 'Add your thoughts', ko: '감상 남기기' },
  'book.save': { en: 'Save', ko: '보관하기' },
  'book.share': { en: 'Share', ko: '공유하기' },
  'book.share.link': { en: 'Share link', ko: '링크 공유' },
  'book.copy': { en: 'Copy', ko: '복사' },
  'book.copied': { en: 'Done', ko: '완료' },
  'book.readmore': { en: 'Read more', ko: '더 보기' },
  'book.readless': { en: 'Show less', ko: '접기' },
  'book.published': { en: 'Published', ko: '출판' },
  'book.length': { en: 'Length', ko: '분량' },
  'book.pages': { en: 'Pages', ko: '쪽' },
  'book.genre': { en: 'Genre', ko: '장르' },
  'book.rating': { en: 'Rating', ko: '평점' },
  'book.author_note': { en: "Author's Note", ko: '저자 한마디' },
  'book.historical': { en: 'Historical Context', ko: '배경 정보' },
  'book.about': { en: 'About the Author', ko: '저자 소개' },
  'book.reflections': { en: 'Reader Notes', ko: '독자 감상' },
  'book.no_reflections': { en: 'No notes for this book yet', ko: '아직 이 책에 남긴 감상이 없습니다.' },
  'book.collection': { en: 'More Like This', ko: '비슷한 책' },
  'book.back': { en: 'Explore', ko: '둘러보기로' },

  // ── Journal — Write ──
  'journal.label': { en: 'Reading Notes', ko: '독서 노트' },
  'journal.title': { en: 'Your', ko: '나의' },
  'journal.title.em': { en: 'journal', ko: '기록' },
  'journal.subtitle': { en: 'Jot down what you read, what stuck, and what you want to remember.', ko: '읽은 것, 기억에 남은 것, 오래 간직하고 싶은 것을 적어보세요.' },
  'journal.tab.write': { en: 'Write', ko: '쓰기' },
  'journal.tab.archive': { en: 'Archive', ko: '기록 보관함' },

  // Journal prompts
  'prompt.opening.label': { en: 'Opening', ko: '시작' },
  'prompt.opening.q': { en: 'What were you reading, and what was your first reaction?', ko: '무엇을 읽었나요? 처음 든 생각은요?' },
  'prompt.opening.p': { en: 'The book, a scene, a line — whatever came to mind first…', ko: '책, 장면, 구절 — 처음 떠오른 것이라면 무엇이든…' },
  'prompt.opening.h': { en: 'Start anywhere. There\'s no wrong answer.', ko: '어디서든 시작해도 됩니다.' },
  'prompt.passage.label': { en: 'A Passage', ko: '구절' },
  'prompt.passage.q': { en: 'Any line or image you want to hold onto?', ko: '기억해두고 싶은 문장이나 장면이 있나요?' },
  'prompt.passage.p': { en: '"The world is not what it is, but what we remember of it."', ko: '"세상은 있는 그대로가 아니라, 우리가 기억하는 모습으로 존재한다."' },
  'prompt.passage.h': { en: 'A line, a phrase, even just a word.', ko: '문장 하나, 구절, 단어 하나도 괜찮습니다.' },
  'prompt.emotion.label': { en: 'Feeling', ko: '느낌' },
  'prompt.emotion.q': { en: 'How did reading this make you feel?', ko: '읽으면서 어떤 기분이었나요?' },
  'prompt.emotion.p': { en: 'Curious? Uneasy? Surprised? Just try to name it…', ko: '궁금했나요? 불편했나요? 놀랐나요? 그냥 말해보세요…' },
  'prompt.emotion.h': { en: 'There\'s no right answer. Just what was true for you.', ko: '정답은 없습니다. 느낀 대로 쓰면 됩니다.' },
  'prompt.reflection.label': { en: 'Connection', ko: '연결' },
  'prompt.reflection.q': { en: 'Did anything in the book connect to your own life?', ko: '책 내용 중 내 삶과 연결되는 게 있었나요?' },
  'prompt.reflection.p': { en: 'A situation, a character, a moment that felt close to home…', ko: '상황, 인물, 내 얘기처럼 느껴진 순간…' },
  'prompt.reflection.h': { en: 'Even a loose connection counts.', ko: '느슨한 연결이어도 괜찮습니다.' },
  'prompt.lingering.label': { en: 'What Stayed', ko: '남은 것' },
  'prompt.lingering.q': { en: 'What\'s still on your mind after closing the book?', ko: '책을 덮고 나서도 머릿속에 남아 있는 건 뭔가요?' },
  'prompt.lingering.p': { en: 'Something you might still think about tomorrow…', ko: '내일도 떠올릴 것 같은 무언가…' },
  'prompt.lingering.h': { en: 'The thing that won\'t quite leave.', ko: '계속 마음에 걸리는 것.' },
  'prompt.atmosphere.label': { en: 'Mood', ko: '분위기' },
  'prompt.atmosphere.q': { en: 'How would you describe the mood of today\'s reading?', ko: '오늘 읽은 것의 분위기를 한 마디로 표현하면요?' },
  'prompt.atmosphere.h': { en: 'Pick what fits.', ko: '맞는 것을 골라보세요.' },

  // Atmosphere options
  'atm.contemplative': { en: 'Contemplative', ko: '사색적' },
  'atm.moved': { en: 'Moved', ko: '뭉클한' },
  'atm.melancholy': { en: 'Melancholy', ko: '쓸쓸한' },
  'atm.nostalgic': { en: 'Nostalgic', ko: '그리운' },
  'atm.inspired': { en: 'Inspired', ko: '자극받은' },
  'atm.unsettled': { en: 'Unsettled', ko: '찜찜한' },
  'atm.joyful': { en: 'Joyful', ko: '즐거운' },
  'atm.awe': { en: 'Awe', ko: '경이로운' },
  'atm.anxious': { en: 'Anxious', ko: '불안한' },
  'atm.pensive': { en: 'Pensive', ko: '생각이 많아지는' },
  'atm.calm': { en: 'Calm', ko: '차분한' },

  // Journal write flow
  'journal.step': { en: '/', ko: '/' },
  'journal.next': { en: 'Next', ko: '다음' },
  'journal.back': { en: 'Back', ko: '이전' },
  'journal.skip': { en: 'Skip', ko: '건너뛰기' },
  'journal.review': { en: 'Review', ko: '확인' },
  'journal.edit': { en: 'Edit', ko: '수정' },
  'journal.save': { en: 'Save to Journal', ko: '기록 남기기' },
  'journal.saving': { en: 'Saving…', ko: '저장 중…' },
  'journal.saved': { en: 'Saved', ko: '저장됨' },
  'journal.progress': { en: 'Progress', ko: '진행' },
  'journal.review.title': { en: "Here's what you wrote today.", ko: '오늘 쓴 내용입니다.' },
  'journal.review.subtitle': { en: 'Take a look before saving. You can always edit it later.', ko: '저장 전에 한 번 확인해보세요. 나중에 언제든 수정할 수 있습니다.' },
  'journal.review.label': { en: 'Your Notes', ko: '오늘의 기록' },
  'journal.archive.note': { en: 'Saved to your journal.', ko: '기록이 보관되었습니다.' },

  // Book context in journal
  'journal.book.label': { en: 'Reading Now', ko: '지금 읽는 책' },
  'journal.book.link': { en: 'Link a book', ko: '책 연결하기' },
  'journal.book.link.desc': { en: 'Connect this entry to a book', ko: '이 항목과 책을 연결하세요' },
  'journal.book.search': { en: 'Search by title or author…', ko: '제목이나 저자로 검색…' },
  'journal.book.typing': { en: 'Type to search books.', ko: '제목이나 저자를 입력하세요.' },
  'journal.book.keeptyping': { en: 'Keep typing…', ko: '계속 입력하세요…' },
  'journal.book.noresult': { en: 'No results for', ko: '검색 결과 없음:' },
  'journal.book.change': { en: 'Change', ko: '변경' },
  'journal.book.remove': { en: 'Remove', ko: '제거' },
  'journal.book.viewdetails': { en: 'View Details', ko: '상세 보기' },
  'journal.book.searchfail': { en: 'Search failed. Try again.', ko: '검색에 실패했습니다. 다시 시도하세요.' },

  // Questions to consider
  'journal.questions.label': { en: 'Things to think about', ko: '떠올려볼 것들' },

  // ── Archive ──
  'archive.nothing': { en: 'Nothing here yet.', ko: '아직 아무것도 없습니다.' },
  'archive.nothing.sub': { en: 'Write your first entry to get started.', ko: '첫 번째 기록을 남겨 시작해보세요.' },
  'archive.new': { en: '+ New Entry', ko: '+ 새 기록 남기기' },
  'archive.select': { en: 'Pick something to read.', ko: '기록을 선택해보세요.' },
  'archive.recent': { en: 'What you\'ve been writing', ko: '최근에 남긴 기록들' },
  'archive.entries': { en: 'entries', ko: '개' },
  'archive.entry': { en: 'entry', ko: '개' },
  'archive.since': { en: 'since', ko: '부터' },
  'archive.today': { en: 'TODAY', ko: '오늘' },
  'archive.free': { en: 'Something that stayed', ko: '기억에 남은 것' },
  'archive.edit': { en: 'Edit', ko: '수정' },
  'archive.delete': { en: 'Delete', ko: '삭제' },
  'archive.cancel': { en: 'Cancel', ko: '취소' },
  'archive.save': { en: 'Save', ko: '저장' },
  'archive.update.fail': { en: 'Could not save: ', ko: '저장 실패: ' },
  'archive.cal.su': { en: 'Su', ko: '일' },
  'archive.cal.mo': { en: 'Mo', ko: '월' },
  'archive.cal.tu': { en: 'Tu', ko: '화' },
  'archive.cal.we': { en: 'We', ko: '수' },
  'archive.cal.th': { en: 'Th', ko: '목' },
  'archive.cal.fr': { en: 'Fr', ko: '금' },
  'archive.cal.sa': { en: 'Sa', ko: '토' },

  // Seasons
  'season.spring': { en: 'Spring', ko: '봄' },
  'season.summer': { en: 'Summer', ko: '여름' },
  'season.autumn': { en: 'Autumn', ko: '가을' },
  'season.winter': { en: 'Winter', ko: '겨울' },

  // ── Cartography ──
  'map.label': { en: 'Emotional Cartography', ko: '감정 지도' },
  'map.title': { en: 'Your', ko: '나의' },
  'map.title.em': { en: 'reading arc', ko: '독서 여정' },
  'map.subtitle': { en: 'A visual record of the emotional landscape of your reading life.', ko: '독서 생활의 감정 흐름을 시각화한 기록입니다.' },
  'map.low': { en: 'Low Intensity', ko: '낮음' },
  'map.high': { en: 'High Intensity', ko: '높음' },
  'map.empty': { en: 'Add moods in your journal to see them here', ko: '기록에 분위기를 담으면 여기에 나타납니다.' },
  'map.empty.data': { en: 'No data yet', ko: '아직 쌓인 기록이 없습니다.' },

  // ── NotFound ──
  '404.title': { en: 'Page not found', ko: '페이지를 찾을 수 없습니다' },
  '404.desc': { en: "The page you're looking for doesn't exist or has been moved.", ko: '찾으시는 페이지가 없거나 이동되었습니다.' },
  '404.back': { en: 'Back to Home', ko: '홈으로' },

  // ── Common ──
  'common.something_wrong': { en: 'Something went wrong', ko: '오류가 발생했습니다' },
  'common.error': { en: 'error', ko: '오류' },
  'common.by': { en: 'by', ko: '저자' },
} as const;

export type TranslationKey = keyof typeof translations;

// ── 번역 함수 ───────────────────────────────────────────────────────────────

export function createT(locale: Locale) {
  return function t(key: TranslationKey): string {
    const entry = translations[key];
    if (!entry) return key;
    return entry[locale] ?? entry.en;
  };
}

// ── useLocale hook ──────────────────────────────────────────────────────────

import { useState, useCallback, createContext, useContext } from 'react';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: createT(DEFAULT_LOCALE),
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function initLocale(): Locale {
  return (localStorage.getItem(STORAGE_KEY) as Locale) ?? DEFAULT_LOCALE;
}
