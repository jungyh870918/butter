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
  'nav.explore': { en: 'Explore', ko: '탐색' },
  'nav.journal': { en: 'Journal', ko: '저널' },
  'nav.map': { en: 'Map', ko: '지도' },
  'nav.search.placeholder': { en: 'Search the library…', ko: '책을 검색하세요…' },

  // ── Footer ──
  'footer.manifesto': { en: 'The Manifesto', ko: '선언문' },
  'footer.archive': { en: 'Library Archive', ko: '도서관 아카이브' },
  'footer.ethics': { en: 'Journaling Ethics', ko: '저널링 윤리' },
  'footer.privacy': { en: 'Privacy', ko: '개인정보' },
  'footer.contact': { en: 'Contact', ko: '문의' },
  'footer.tagline': { en: 'Curating the slow reading movement.', ko: '느린 독서 문화를 큐레이팅합니다.' },
  'footer.quiet': { en: 'A quiet place on the internet.', ko: '인터넷 속 조용한 공간.' },

  // ── Explore ──
  'explore.label': { en: 'Curated Readings', ko: '큐레이션 도서' },
  'explore.title': { en: 'Explore', ko: '탐색' },
  'explore.title.em': { en: 'the library', ko: '도서관' },
  'explore.subtitle': { en: 'A sanctuary for slow reading. Discover volumes curated for contemplation, curiosity, and the quiet pursuit of knowledge.', ko: '느린 독서를 위한 성소. 사색과 호기심, 조용한 지식 탐구를 위해 큐레이션된 책들을 만나보세요.' },
  'explore.empty': { en: 'No books found', ko: '책을 찾을 수 없습니다' },
  'explore.cat.all': { en: 'All', ko: '전체' },
  'explore.cat.fiction': { en: 'Fiction', ko: '소설' },
  'explore.cat.poetry': { en: 'Poetry Anthology', ko: '시선집' },
  'explore.cat.philosophy': { en: 'Philosophy', ko: '철학' },
  'explore.cat.scifi': { en: 'Sci-Fi', ko: 'SF' },
  'explore.cat.historical': { en: 'Classic Lit', ko: '고전문학' },
  'explore.trending': { en: 'Trending Now', ko: '지금 인기' },
  'explore.journal.title': { en: 'The Journaling Circle', ko: '저널링 서클' },
  'explore.journal.desc': { en: 'Join our weekly correspondence on the art of slow reading and curated lists from our library.', ko: '느린 독서의 예술과 도서관 큐레이션 목록에 대한 주간 서신에 참여하세요.' },
  'explore.journal.email': { en: 'Email address', ko: '이메일 주소' },
  'explore.journal.subscribe': { en: 'Subscribe', ko: '구독하기' },
  'explore.didyouknow': { en: 'Did you know?', ko: '알고 계셨나요?' },

  // ── Home ──
  'home.label': { en: 'Community', ko: '커뮤니티' },
  'home.title': { en: 'Recent Reflections', ko: '최근 리플렉션' },
  'home.subtitle': { en: 'A curated stream of thoughts and insights from our community of deep readers.', ko: '깊이 읽는 독자들의 생각과 통찰을 모아 전합니다.' },
  'home.empty': { en: 'No reflections yet', ko: '아직 리플렉션이 없습니다' },

  // ── BookDetail ──
  'book.start': { en: 'Start Reading', ko: '읽기 시작' },
  'book.add': { en: 'Add to Library', ko: '서재에 추가' },
  'book.write': { en: 'Write in Journal', ko: '저널 작성' },
  'book.save': { en: 'Save', ko: '저장' },
  'book.share': { en: 'Share', ko: '공유' },
  'book.share.link': { en: 'Share link', ko: '링크 공유' },
  'book.copy': { en: 'Copy', ko: '복사' },
  'book.copied': { en: 'Done', ko: '완료' },
  'book.readmore': { en: 'Read more', ko: '더 보기' },
  'book.readless': { en: 'Show less', ko: '접기' },
  'book.published': { en: 'Published', ko: '출판' },
  'book.length': { en: 'Length', ko: '페이지' },
  'book.pages': { en: 'Pages', ko: '쪽' },
  'book.genre': { en: 'Genre', ko: '장르' },
  'book.rating': { en: 'Rating', ko: '평점' },
  'book.author_note': { en: "Author's Note", ko: '저자 노트' },
  'book.historical': { en: 'Historical Context', ko: '역사적 맥락' },
  'book.about': { en: 'About the Author', ko: '저자 소개' },
  'book.reflections': { en: 'Community Reflections', ko: '커뮤니티 리플렉션' },
  'book.no_reflections': { en: 'No reflections for this book yet', ko: '아직 이 책에 대한 리플렉션이 없습니다' },
  'book.collection': { en: 'From the Same Collection', ko: '같은 컬렉션에서' },
  'book.back': { en: 'Explore', ko: '탐색으로' },

  // ── Journal — Write ──
  'journal.label': { en: 'Daily Practice', ko: '일상 루틴' },
  'journal.title': { en: 'Your', ko: '나의' },
  'journal.title.em': { en: 'journal', ko: '저널' },
  'journal.subtitle': { en: 'A private space for slow reading, quiet reflection, and the thoughts books leave behind.', ko: '느린 독서와 조용한 사색, 책이 남긴 생각들을 위한 개인 공간.' },
  'journal.tab.write': { en: 'Write', ko: '쓰기' },
  'journal.tab.archive': { en: 'Archive', ko: '아카이브' },

  // Journal prompts
  'prompt.opening.label': { en: 'Opening', ko: '시작' },
  'prompt.opening.q': { en: 'What were you reading today, and what first impression did it leave on you?', ko: '오늘 무엇을 읽었나요? 처음 받은 인상은 어떠했나요?' },
  'prompt.opening.p': { en: 'Describe the book, a scene, a passage — anything that caught your attention first…', ko: '책, 장면, 구절 — 처음 눈에 들어온 어떤 것이든 묘사해 보세요…' },
  'prompt.opening.h': { en: 'Let the first thing that comes to mind lead you.', ko: '가장 먼저 떠오른 것을 따라가 보세요.' },
  'prompt.passage.label': { en: 'A Passage', ko: '구절' },
  'prompt.passage.q': { en: 'Is there a sentence or image from the reading that you want to keep?', ko: '읽은 내용 중 간직하고 싶은 문장이나 이미지가 있나요?' },
  'prompt.passage.p': { en: '"The world is not what it is, but what we remember of it."', ko: '"세상은 있는 그대로가 아니라, 우리가 기억하는 모습으로 존재한다."' },
  'prompt.passage.h': { en: 'A line, a phrase, a detail. Even a single word.', ko: '한 줄, 구절, 세부 묘사. 단 하나의 단어도 좋습니다.' },
  'prompt.emotion.label': { en: 'Emotion', ko: '감정' },
  'prompt.emotion.q': { en: 'What emotion surfaced most strongly while you read?', ko: '읽는 동안 가장 강하게 떠오른 감정은 무엇인가요?' },
  'prompt.emotion.p': { en: 'Was it curiosity, unease, longing, joy? Try to name it precisely…', ko: '호기심, 불안, 그리움, 기쁨? 정확하게 이름을 붙여 보세요…' },
  'prompt.emotion.h': { en: 'Precision here matters more than being right.', ko: '여기서는 정확성이 맞고 틀림보다 중요합니다.' },
  'prompt.reflection.label': { en: 'Reflection', ko: '성찰' },
  'prompt.reflection.q': { en: 'Did anything in the text mirror something in your own life right now?', ko: '텍스트 속 무언가가 지금 당신의 삶을 비추고 있나요?' },
  'prompt.reflection.p': { en: "A character's situation, a theme, a single line — what felt personally true?", ko: '인물의 상황, 주제, 한 줄의 문장 — 개인적으로 진실하게 느껴진 것은 무엇인가요?' },
  'prompt.reflection.h': { en: 'The most honest answer is usually the first one.', ko: '가장 솔직한 답은 보통 처음 떠오르는 것입니다.' },
  'prompt.lingering.label': { en: 'Lingering', ko: '여운' },
  'prompt.lingering.q': { en: 'What single image, sentence, or idea will stay with you after you close the book?', ko: '책을 덮은 뒤에도 남아있을 하나의 이미지, 문장, 생각은 무엇인가요?' },
  'prompt.lingering.p': { en: "Something you'll still be thinking about tomorrow…", ko: '내일도 생각하게 될 무언가…' },
  'prompt.lingering.h': { en: 'What refuses to leave?', ko: '무엇이 떠나지 않나요?' },
  'prompt.atmosphere.label': { en: 'Atmosphere', ko: '분위기' },
  'prompt.atmosphere.q': { en: "How would you describe the atmosphere of today's reading?", ko: '오늘 독서의 분위기를 어떻게 표현하겠나요?' },
  'prompt.atmosphere.h': { en: 'Select everything that resonates.', ko: '공감되는 것을 모두 선택하세요.' },

  // Atmosphere options
  'atm.contemplative': { en: 'Contemplative', ko: '사색적' },
  'atm.moved': { en: 'Moved', ko: '감동적' },
  'atm.melancholy': { en: 'Melancholy', ko: '우울한' },
  'atm.nostalgic': { en: 'Nostalgic', ko: '향수어린' },
  'atm.inspired': { en: 'Inspired', ko: '영감받은' },
  'atm.unsettled': { en: 'Unsettled', ko: '불안한' },
  'atm.joyful': { en: 'Joyful', ko: '기쁜' },
  'atm.awe': { en: 'Awe', ko: '경이로운' },
  'atm.anxious': { en: 'Anxious', ko: '초조한' },
  'atm.pensive': { en: 'Pensive', ko: '생각에 잠긴' },
  'atm.calm': { en: 'Calm', ko: '평온한' },

  // Journal write flow
  'journal.step': { en: '/', ko: '/' },
  'journal.next': { en: 'Next', ko: '다음' },
  'journal.back': { en: 'Back', ko: '이전' },
  'journal.skip': { en: 'Skip', ko: '건너뛰기' },
  'journal.review': { en: 'Review', ko: '검토' },
  'journal.edit': { en: 'Edit', ko: '수정' },
  'journal.save': { en: 'Save Reflection', ko: '리플렉션 저장' },
  'journal.saving': { en: 'Saving…', ko: '저장 중…' },
  'journal.saved': { en: 'Saved', ko: '저장됨' },
  'journal.progress': { en: 'Progress', ko: '진행' },
  'journal.review.title': { en: "Here's what emerged from today's reading.", ko: '오늘 독서에서 나온 것들입니다.' },
  'journal.review.subtitle': { en: 'Review your responses before saving to your private archive.', ko: '개인 아카이브에 저장하기 전에 응답을 검토하세요.' },
  'journal.review.label': { en: 'Your Reflection', ko: '나의 리플렉션' },
  'journal.archive.note': { en: 'Added to your private journal archive.', ko: '개인 저널 아카이브에 추가되었습니다.' },

  // Book context in journal
  'journal.book.label': { en: 'Currently Reflecting On', ko: '지금 성찰 중인 책' },
  'journal.book.link': { en: 'Link a book', ko: '책 연결하기' },
  'journal.book.link.desc': { en: 'Search to connect this entry to a book', ko: '이 항목을 책과 연결하려면 검색하세요' },
  'journal.book.search': { en: 'Search by title or author…', ko: '제목 또는 저자로 검색…' },
  'journal.book.typing': { en: 'Type a title or author name to search.', ko: '제목 또는 저자 이름을 입력하세요.' },
  'journal.book.keeptyping': { en: 'Keep typing…', ko: '계속 입력하세요…' },
  'journal.book.noresult': { en: 'No books found for', ko: '검색 결과 없음:' },
  'journal.book.change': { en: 'Change', ko: '변경' },
  'journal.book.remove': { en: 'Remove', ko: '제거' },
  'journal.book.viewdetails': { en: 'View Details', ko: '상세 보기' },
  'journal.book.searchfail': { en: 'Search failed. Please try again.', ko: '검색에 실패했습니다. 다시 시도하세요.' },

  // Questions to consider
  'journal.questions.label': { en: 'Questions to Consider', ko: '생각해볼 질문' },

  // ── Archive ──
  'archive.nothing': { en: 'Nothing here yet.', ko: '아직 아무것도 없습니다.' },
  'archive.nothing.sub': { en: 'Write your first reflection to begin your archive.', ko: '첫 번째 리플렉션을 작성하여 아카이브를 시작하세요.' },
  'archive.new': { en: '+ New Journal Entry', ko: '+ 새 저널 작성' },
  'archive.select': { en: 'Select an entry to read.', ko: '읽을 항목을 선택하세요.' },
  'archive.recent': { en: 'Recent Entries', ko: '최근 항목' },
  'archive.entries': { en: 'entries', ko: '개 항목' },
  'archive.entry': { en: 'entry', ko: '개 항목' },
  'archive.since': { en: 'since', ko: '부터' },
  'archive.today': { en: 'TODAY', ko: '오늘' },
  'archive.free': { en: 'Free reflection', ko: '자유 리플렉션' },
  'archive.edit': { en: 'Edit Entry', ko: '수정' },
  'archive.delete': { en: 'Delete', ko: '삭제' },
  'archive.cancel': { en: 'Cancel', ko: '취소' },
  'archive.save': { en: 'Save', ko: '저장' },
  'archive.update.fail': { en: 'Update failed: ', ko: '업데이트 실패: ' },
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
  'map.subtitle': { en: 'A visual record of the emotional landscape of your reading life.', ko: '독서 생활의 감정 풍경을 시각적으로 기록한 것입니다.' },
  'map.low': { en: 'Low Intensity', ko: '낮은 강도' },
  'map.high': { en: 'High Intensity', ko: '높은 강도' },
  'map.empty': { en: 'Log moods in your journal to see your arc', ko: '저널에 기분을 기록하면 여정을 볼 수 있습니다' },
  'map.empty.data': { en: 'No emotion data yet', ko: '아직 감정 데이터가 없습니다' },

  // ── NotFound ──
  '404.title': { en: 'Page not found', ko: '페이지를 찾을 수 없습니다' },
  '404.desc': { en: "The page you're looking for doesn't exist or has been moved.", ko: '찾으시는 페이지가 존재하지 않거나 이동되었습니다.' },
  '404.back': { en: 'Back to Home', ko: '홈으로 돌아가기' },

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
