import { useLocale } from '../../hooks/useLocale';
import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Trash2, Check, X, ArrowRight, ArrowLeft, BookOpen, Search, Loader2, Share2, Link as LinkIcon, Copy, Library, X as XIcon } from 'lucide-react';
import { JournalEntry, Book } from '../../types';
import { useJournal } from '../../hooks/useJournal';
import { getBooks, getBookShelf, removeFromBookShelf } from '../../lib/api';
import { LoadingSpinner, ErrorMessage, EmptyState, BookCoverImage } from '../ui';
import { getReflectionQuestions } from '../../lib/api';

const DEMO_USER_ID = 'demo-user-id'; // legacy — 더 이상 사용 안 함

// ── Prompt steps — backend content fields ─────────────────────────────────
interface Prompt {
  id: string;
  label: string;
  question: string;
  placeholder: string;
  hint: string;
  isHighlight?: boolean;
  isAtmosphere?: boolean;
}

// ── 단계 구조 세트 3종 × 각 단계 질문 8개 레파토리 ─────────────────────────
// 세트 A: 분석형 (현재 구조 기반, 책→감정→삶 순)
// 세트 B: 감각·이미지형 (몸과 장면 우선)
// 세트 C: 관계·맥락형 (책을 읽은 시간과 이유 중심)
// atmosphere 단계는 항상 고정 (UserProfile emotions 연동)

interface PromptSet {
  id: string;
  steps: {
    id: string;
    isHighlight?: boolean;
    labels:   { en: string; ko: string };
    questions: { en: string; ko: string }[];
    placeholders: { en: string[]; ko: string[] };
  }[];
}

const PROMPT_SETS: PromptSet[] = [
  // ── SET A: 분석형 ──────────────────────────────────────────────────────
  {
    id: 'A',
    steps: [
      {
        id: 'opening',
        labels: { en: 'Opening', ko: '시작' },
        questions: [
          { en: 'What were you reading, and what was your first reaction?', ko: '무엇을 읽었나요? 처음 든 생각은요?' },
          { en: 'Where did you pick this up, and what made you keep going?', ko: '어떻게 이 책을 펼치게 됐나요? 계속 읽게 된 이유는?' },
          { en: 'What did you expect, and how close were you?', ko: '어떤 책일 것 같았나요? 예상이 맞았나요?' },
          { en: 'What is the first thing you would say if someone asked what you read today?', ko: '오늘 뭐 읽었냐고 물으면 제일 먼저 꺼낼 말은?' },
          { en: 'How did reading feel today — easy, effortful, somewhere in between?', ko: '오늘 읽기는 어땠나요 — 술술 읽혔나요, 아니면 힘이 들었나요?' },
          { en: 'What pulled you in from the first few pages?', ko: '처음 몇 페이지에서 무엇이 끌어당겼나요?' },
          { en: 'Did you notice anything about the writing before you noticed the story?', ko: '이야기보다 글 자체가 먼저 눈에 들어온 게 있었나요?' },
          { en: 'What kind of mood did you bring to the reading today?', ko: '오늘 어떤 상태로 책을 펼쳤나요?' },
        ],
        placeholders: {
          en: ['The first thing that comes back when you think of it.', 'What you noticed before you even realized you were paying attention.', 'The moment the book stopped feeling like a book.', 'Something you were not expecting.', 'Where you were, and what the reading felt like from the outside.'],
          ko: ['떠올리면 가장 먼저 생각나는 것.', '의식하기도 전에 눈에 들어왔던 것.', '책이 책처럼 느껴지지 않았던 순간.', '예상하지 못했던 무언가.', '읽던 장소, 그때의 분위기.'],
        },
      },
      {
        id: 'highlight',
        isHighlight: true,
        labels: { en: 'A Passage', ko: '구절' },
        questions: [
          { en: 'Any line or image you want to hold onto?', ko: '기억해두고 싶은 문장이나 장면이 있나요?' },
          { en: 'Was there a sentence that made you slow down?', ko: '읽다가 멈추게 된 문장이 있었나요?' },
          { en: 'Something the book said that you wish you had said first?', ko: '내가 먼저 쓰고 싶었던 문장이 있었나요?' },
          { en: 'A moment in the writing that felt exact — not a word too many?', ko: '한 글자도 더 없어도 될 것 같았던 표현이 있었나요?' },
          { en: 'A line that meant something different from what it said on the surface?', ko: '표면적 의미 너머로 다르게 읽힌 구절이 있었나요?' },
          { en: 'Something you would read aloud if you could?', ko: '소리 내어 읽어보고 싶었던 부분이 있었나요?' },
          { en: 'A passage that connected to something outside the book?', ko: '책 밖의 무언가와 연결되었던 구절이 있었나요?' },
          { en: 'What would you underline if this were your own copy?', ko: '이 책이 내 것이라면 밑줄 그을 부분은 어디인가요?' },
        ],
        placeholders: {
          en: ['Something you read slowly, or read twice.', 'A line that landed differently than the ones around it.', 'A sentence you might write down somewhere.', 'Something that felt more precise than you expected.', 'The part where the writing got out of the way.'],
          ko: ['천천히 읽었거나, 두 번 읽게 된 부분.', '주변 문장들과 다르게 느껴진 한 줄.', '어딘가 적어두고 싶었던 문장.', '생각보다 정확하게 표현된 것.', '문장이 사라지고 내용만 남았던 순간.'],
        },
      },
      {
        id: 'emotion',
        labels: { en: 'Feeling', ko: '느낌' },
        questions: [
          { en: 'How did reading this make you feel?', ko: '읽으면서 어떤 기분이었나요?' },
          { en: 'What shifted in you while reading — even slightly?', ko: '읽는 동안 조금이라도 달라진 게 있었나요?' },
          { en: 'Did the book ask something of you emotionally?', ko: '감정적으로 무언가를 요구하는 책이었나요?' },
          { en: 'What was the emotional weather of today\'s reading?', ko: '오늘 읽기의 감정적 날씨를 표현해본다면?' },
          { en: 'Did anything make you uncomfortable — and was that useful?', ko: '불편하게 만든 부분이 있었나요? 그게 의미있었나요?' },
          { en: 'Was there a moment you wanted to set the book down, or couldn\'t?', ko: '책을 내려놓고 싶었던 순간이 있었나요, 아니면 반대로?' },
          { en: 'What feeling did the book leave behind after you stopped?', ko: '멈추고 나서 남은 감정은 뭔가요?' },
          { en: 'Did the book meet you where you were today, or take you somewhere else?', ko: '책이 지금 나의 상태를 만나주었나요, 아니면 다른 곳으로 데려갔나요?' },
        ],
        placeholders: {
          en: ['A mood, a tension, something that shifted while reading.', 'How the book sat with you — heavy, light, somewhere in between.', 'Whether it felt good to read, or necessary, or neither.', 'The tone it left behind after you stopped.', 'What changed between the first page and where you are now.'],
          ko: ['읽는 동안 바뀐 기분이나 분위기.', '책이 남긴 무게감 — 가볍거나, 무겁거나, 그 사이 어딘가.', '읽기 좋았는지, 아니면 읽어야 했는지.', '멈추고 난 뒤 남은 톤.', '처음 펼쳤을 때와 지금 사이에 달라진 것.'],
        },
      },
      {
        id: 'mirror',
        labels: { en: 'Connection', ko: '연결' },
        questions: [
          { en: 'Did anything in the book connect to your own life?', ko: '책 내용 중 내 삶과 연결되는 게 있었나요?' },
          { en: 'Was there a character or moment you recognized without knowing why?', ko: '이유는 모르겠지만 낯설지 않았던 인물이나 순간이 있었나요?' },
          { en: 'Did the book show you something about yourself you hadn\'t named before?', ko: '이름 붙이지 않았던 나의 무언가를 보여준 부분이 있었나요?' },
          { en: 'Was there a situation in the book that rhymed with something you\'ve lived?', ko: '살면서 겪은 일과 닮아 있는 장면이 있었나요?' },
          { en: 'Who in your life did you think about while reading?', ko: '읽으면서 누가 떠올랐나요?' },
          { en: 'Did the book disagree with something you usually believe?', ko: '평소 생각과 다른 입장을 가진 책이었나요?' },
          { en: 'What would a younger version of you have made of this book?', ko: '예전의 나라면 이 책을 어떻게 읽었을까요?' },
          { en: 'Is there something you want to do differently after reading this?', ko: '이 책을 읽고 나서 달리 하고 싶어진 일이 있나요?' },
        ],
        placeholders: {
          en: ['A moment in the book that felt oddly close.', 'Something a character did that you understood without explanation.', 'A situation that rhymed with something in your own life.', 'A detail that made you think of someone specific.', 'Where the book seemed to know something it had no reason to know.'],
          ko: ['어쩐지 낯설지 않았던 장면이나 인물.', '설명 없이도 이해된 인물의 행동.', '내 삶의 어떤 순간과 겹쳐 보였던 것.', '누군가 특정한 사람이 떠올랐던 대목.', '책이 알 리 없는 걸 알고 있는 것 같았던 순간.'],
        },
      },
      {
        id: 'linger',
        labels: { en: 'What Stayed', ko: '남은 것' },
        questions: [
          { en: 'What\'s still on your mind after closing the book?', ko: '책을 덮고 나서도 머릿속에 남아 있는 건 뭔가요?' },
          { en: 'What are you still thinking about, without meaning to?', ko: '의도하지 않아도 자꾸 다시 떠오르는 건 무엇인가요?' },
          { en: 'What from today\'s reading would you want to come back to?', ko: '오늘 읽은 것 중 나중에 다시 찾고 싶은 게 있나요?' },
          { en: 'Is there something unresolved — something the book left open?', ko: '해결되지 않은 채로 남겨진 것이 있었나요?' },
          { en: 'What image or sentence is still somewhere in your head right now?', ko: '지금도 머릿속 어딘가에 걸려 있는 이미지나 문장이 있나요?' },
          { en: 'What would you tell someone about this book in one sentence?', ko: '이 책에 대해 한 문장으로 말한다면 뭐라고 할 것 같나요?' },
          { en: 'Did the book feel finished when you stopped, or not quite?', ko: '멈췄을 때 책이 완결된 느낌이었나요, 아니었나요?' },
          { en: 'What question did this book leave you with?', ko: '이 책이 남긴 질문이 있다면 무엇인가요?' },
        ],
        placeholders: {
          en: ['The part that comes up first if someone asks.', 'What you are still turning over, without meaning to.', 'An image or sentence that is still sitting somewhere.', 'Something you would want to come back to.', 'The part that felt unfinished — in a good way, or not.'],
          ko: ['누군가 물으면 먼저 꺼낼 말.', '의도하지 않아도 자꾸 다시 떠오르는 것.', '아직 어딘가에 걸려 있는 이미지나 문장.', '나중에 다시 찾아보고 싶은 부분.', '끝난 것 같지 않은 느낌 — 좋은 의미로든, 아니든.'],
        },
      },
    ],
  },

  // ── SET B: 감각·이미지형 ───────────────────────────────────────────────
  {
    id: 'B',
    steps: [
      {
        id: 'opening',
        labels: { en: 'First Impression', ko: '첫인상' },
        questions: [
          { en: 'What was the atmosphere of the book before you got into the story?', ko: '이야기 속으로 들어가기 전, 이 책의 분위기는 어땠나요?' },
          { en: 'What did the book feel like to hold and read — before you knew what it was about?', ko: '내용을 알기 전, 이 책을 읽는 느낌 자체는 어땠나요?' },
          { en: 'What color or texture comes to mind when you think of today\'s reading?', ko: '오늘 읽기를 생각하면 어떤 색이나 질감이 떠오르나요?' },
          { en: 'What was the pace of the reading — and how did your body respond to it?', ko: '읽기의 속도는 어땠나요 — 그리고 그게 몸에 어떻게 느껴졌나요?' },
          { en: 'If this book had a sound, what would it be?', ko: '이 책에 소리가 있다면 어떤 소리일까요?' },
          { en: 'Where in your body did you feel this book most?', ko: '이 책이 몸 어느 부분에서 가장 느껴졌나요?' },
          { en: 'What season does this book feel like to you?', ko: '이 책은 어떤 계절 같은 느낌인가요?' },
          { en: 'Did the language have a texture — rough, smooth, dense, airy?', ko: '이 책의 문장에는 어떤 질감이 있었나요 — 거칠거나, 부드럽거나, 빽빽하거나, 가볍거나?' },
        ],
        placeholders: {
          en: ['A sensation or texture that stays with you.', 'The physical feeling of reading today.', 'Something sensory that the book gave you.', 'A mood that arrived before you understood why.', 'What reading this felt like from the outside.'],
          ko: ['남아 있는 감각이나 질감.', '오늘 읽기의 신체적인 느낌.', '책이 준 감각적인 무언가.', '이유를 알기 전에 온 기분.', '외부에서 보면 어떤 모습의 독서였는지.'],
        },
      },
      {
        id: 'highlight',
        isHighlight: true,
        labels: { en: 'A Scene', ko: '장면' },
        questions: [
          { en: 'A moment in the book you could picture clearly — what did it look like?', ko: '선명하게 그려진 장면이 있었나요 — 어떤 모습이었나요?' },
          { en: 'Was there an image that kept returning as you read?', ko: '읽는 동안 자꾸 다시 떠오른 이미지가 있었나요?' },
          { en: 'A moment where you felt like you were in the scene, not just reading it?', ko: '읽는 게 아니라 그 장면 안에 있는 것 같았던 순간이 있었나요?' },
          { en: 'Which part would you want to illustrate, if you could draw it?', ko: '그림으로 그릴 수 있다면 어떤 장면을 고르겠어요?' },
          { en: 'A detail so specific it made everything feel real?', ko: '너무 구체적이어서 오히려 모든 것을 현실처럼 느끼게 해준 묘사가 있었나요?' },
          { en: 'A quiet moment that stuck with you more than the dramatic ones?', ko: '극적인 장면보다 조용한 순간이 더 오래 남은 게 있었나요?' },
          { en: 'Something the book described that you\'ve seen or felt before, somewhere?', ko: '언젠가 본 것 같거나 느껴본 것 같은 묘사가 있었나요?' },
          { en: 'An image from today\'s reading you\'d keep if you could only keep one?', ko: '하나만 가져갈 수 있다면 오늘 읽기에서 어떤 이미지를 가져가겠어요?' },
        ],
        placeholders: {
          en: ['A visual that appeared and stayed.', 'Something you almost saw rather than read.', 'A detail that made the scene feel inhabited.', 'The image that appeared before the words did.', 'The moment description became experience.'],
          ko: ['나타나서 남아 있는 장면.', '읽었다기보다 거의 본 것 같았던 것.', '장면에 사람이 있는 것처럼 느끼게 한 세부묘사.', '언어보다 먼저 온 이미지.', '묘사가 경험이 된 순간.'],
        },
      },
      {
        id: 'emotion',
        labels: { en: 'Body Response', ko: '몸의 반응' },
        questions: [
          { en: 'Did your reading pace change at any point — why?', ko: '읽는 속도가 달라진 지점이 있었나요 — 왜 그랬을 것 같나요?' },
          { en: 'Was there a moment you held your breath, or let it go?', ko: '숨을 참게 된 순간이 있었나요, 아니면 반대로 내쉬게 된 순간이?' },
          { en: 'Did anything make your shoulders tighten — or relax?', ko: '어깨가 긴장되거나 반대로 풀리게 된 부분이 있었나요?' },
          { en: 'Did reading today feel like effort, or like rest?', ko: '오늘 읽기는 수고처럼 느껴졌나요, 아니면 쉬는 것 같았나요?' },
          { en: 'Was there a physical sensation — warmth, unease, a kind of fullness?', ko: '따뜻함, 불편함, 어떤 충만함 같은 신체적 감각이 있었나요?' },
          { en: 'Where did the energy of the book land — head, chest, somewhere else?', ko: '이 책의 에너지는 어디에 닿았나요 — 머리, 가슴, 아니면 다른 곳?' },
          { en: 'Did you feel alert or drowsy, absorbed or distant?', ko: '집중이 됐나요 아니면 멍했나요, 몰입됐나요 아니면 멀어졌나요?' },
          { en: 'If the book had a temperature, what would it be?', ko: '이 책에 온도가 있다면 몇 도일까요?' },
        ],
        placeholders: {
          en: ['Something physical that happened while reading.', 'Where in you the book arrived.', 'A physical response you didn\'t expect.', 'The sensation of finishing or stopping.', 'What your body was doing while your mind was in the book.'],
          ko: ['읽는 동안 일어난 신체적인 무언가.', '책이 내 안에서 어디에 도착했는지.', '예상하지 못한 신체 반응.', '멈추거나 끝냈을 때의 감각.', '마음이 책 속에 있는 동안 몸이 하고 있던 것.'],
        },
      },
      {
        id: 'mirror',
        labels: { en: 'Association', ko: '연상' },
        questions: [
          { en: 'What memory surfaced while reading — recent or distant?', ko: '읽는 동안 떠오른 기억이 있었나요 — 최근의 것이든, 오래된 것이든?' },
          { en: 'Did the book remind you of another book, film, or piece of music?', ko: '다른 책, 영화, 음악이 떠오른 부분이 있었나요?' },
          { en: 'Was there a character whose inner world felt familiar?', ko: '내면의 세계가 낯설지 않은 인물이 있었나요?' },
          { en: 'A place described in the book that overlapped with a place you know?', ko: '책 속 장소가 내가 아는 어떤 공간과 겹쳐 보인 게 있었나요?' },
          { en: 'Did reading this bring a specific person to mind?', ko: '읽으면서 특정한 사람이 생각났나요?' },
          { en: 'What earlier version of you would this book have meant something to?', ko: '이 책이 의미 있었을 과거의 나는 어떤 시기의 나였을까요?' },
          { en: 'Is there a word in this book that belongs to a different part of your life?', ko: '이 책에서 내 삶의 다른 부분과 연결되는 단어나 표현이 있었나요?' },
          { en: 'Did the book arrive at a good time — or not quite?', ko: '이 책을 지금 읽은 게 좋은 타이밍이었나요, 아니면 아닌 것 같나요?' },
        ],
        placeholders: {
          en: ['A memory the book brought back, unexpectedly.', 'Something you recognized without knowing why.', 'A connection that surprised you.', 'A crossover between the book and your own world.', 'Something that doesn\'t belong to the book, but arrived with it.'],
          ko: ['예상치 못하게 책이 불러온 기억.', '이유 없이 알아본 무언가.', '놀라웠던 연결.', '책과 내 세계의 교차점.', '책에 속하지 않지만 따라온 무언가.'],
        },
      },
      {
        id: 'linger',
        labels: { en: 'Aftertaste', ko: '여운' },
        questions: [
          { en: 'What aftertaste did the reading leave?', ko: '독서가 남긴 여운이 있다면 어떤 맛이었나요?' },
          { en: 'What do you think you\'ll remember in a week?', ko: '일주일 뒤에 뭐가 기억에 남아 있을 것 같나요?' },
          { en: 'Is there something the book planted that hasn\'t grown yet?', ko: '아직 자라지 않은 씨앗 같은 걸 심어준 게 있었나요?' },
          { en: 'What would you want to return to — a scene, an idea, a feeling?', ko: '나중에 다시 돌아오고 싶은 장면, 생각, 감정이 있나요?' },
          { en: 'Is the book still with you right now, in some way?', ko: '지금도 어떤 식으로든 이 책이 함께 있는 느낌인가요?' },
          { en: 'What\'s the shape of what the book left behind?', ko: '책이 남긴 것의 형태를 말해본다면 어떤 모양인가요?' },
          { en: 'Did reading this make you want to do, make, or say something?', ko: '읽고 나서 무언가 하거나, 만들거나, 말하고 싶어진 게 있나요?' },
          { en: 'What would be lost if you never read this?', ko: '이 책을 읽지 않았다면 놓쳤을 것은 무엇일까요?' },
        ],
        placeholders: {
          en: ['The taste that stayed after finishing.', 'Something still dissolving.', 'What remains when you stop thinking about it.', 'A residue — good or otherwise.', 'What would be missing if you hadn\'t read this.'],
          ko: ['끝난 뒤에도 남아 있는 맛.', '아직 가라앉고 있는 무언가.', '생각을 멈춰도 남아 있는 것.', '잔여물 — 좋은 것이든, 아니든.', '이 책을 읽지 않았다면 없었을 것.'],
        },
      },
    ],
  },

  // ── SET C: 관계·맥락형 ────────────────────────────────────────────────
  {
    id: 'C',
    steps: [
      {
        id: 'opening',
        labels: { en: 'Why This Book', ko: '이 책을 고른 이유' },
        questions: [
          { en: 'What drew you to this book — and does that reason still stand?', ko: '이 책을 고른 이유가 있었나요 — 지금도 그 이유가 맞는 것 같나요?' },
          { en: 'Was this a deliberate choice, or did the book find you somehow?', ko: '이 책을 의식적으로 고른 건가요, 아니면 어쩌다 만난 건가요?' },
          { en: 'What were you looking for when you started this?', ko: '이걸 시작했을 때 무언가를 찾고 있었나요?' },
          { en: 'Is this the kind of book you usually read, or something different?', ko: '평소에 읽는 스타일의 책인가요, 아니면 다른 종류인가요?' },
          { en: 'Who or what recommended this book to you — directly or indirectly?', ko: '직접적이든 간접적이든, 누가 또는 무엇이 이 책을 권해줬나요?' },
          { en: 'Was there something specific happening in your life when you started this?', ko: '이 책을 시작했을 때 삶에서 특별한 일이 있었나요?' },
          { en: 'Did the title or cover tell you something true?', ko: '제목이나 표지가 뭔가 진실을 말해주고 있었나요?' },
          { en: 'If you had to explain why you read this to someone who doesn\'t know you — what would you say?', ko: '나를 모르는 사람에게 왜 이 책을 읽었는지 설명한다면 뭐라고 할 것 같나요?' },
        ],
        placeholders: {
          en: ['The reason, or the lack of one.', 'What you were after before you knew what you\'d find.', 'What made you pick this over everything else.', 'The context around choosing this.', 'What the cover or title promised.'],
          ko: ['이유, 혹은 이유 없음.', '무엇을 찾을지 알기 전에 찾고 있던 것.', '다른 것들 대신 이걸 고른 이유.', '선택을 둘러싼 맥락.', '표지나 제목이 약속한 것.'],
        },
      },
      {
        id: 'highlight',
        isHighlight: true,
        labels: { en: 'A Moment', ko: '한 순간' },
        questions: [
          { en: 'A moment that felt like the real subject of the book?', ko: '이 책의 진짜 주제가 여기에 있다는 느낌이 든 순간이 있었나요?' },
          { en: 'Something the book said that you\'ve been thinking about separately?', ko: '따로 생각해왔던 것을 책이 말해준 부분이 있었나요?' },
          { en: 'A line that seemed to arrive from outside the story?', ko: '이야기 밖에서 온 것 같은 한 줄이 있었나요?' },
          { en: 'Something that surprised you, but shouldn\'t have?', ko: '놀랐지만 놀라지 말았어야 할 것 같은 부분이 있었나요?' },
          { en: 'A sentence that made the whole book feel worth it?', ko: '이 책 전체를 읽을 가치가 있게 만들어준 한 문장이 있었나요?' },
          { en: 'A passage that felt addressed to you, specifically?', ko: '나 개인에게 말하는 것 같은 구절이 있었나요?' },
          { en: 'Something you read that changed the meaning of something earlier in the book?', ko: '앞부분의 의미를 달리 보이게 만든 부분이 있었나요?' },
          { en: 'A moment where the author and you seemed to agree on something unspoken?', ko: '말로 하지 않아도 작가와 내가 뭔가 동의하고 있는 것 같은 순간이 있었나요?' },
        ],
        placeholders: {
          en: ['A point of contact between you and the text.', 'Something the book seemed to know about you.', 'The sentence that felt like a message.', 'A place the book and your life briefly met.', 'Something the author put there for someone exactly like you.'],
          ko: ['나와 텍스트 사이의 접점.', '책이 나에 대해 알고 있는 것 같았던 것.', '메시지처럼 느껴진 문장.', '잠깐 책과 내 삶이 만난 지점.', '작가가 정확히 나 같은 사람을 위해 넣어둔 것.'],
        },
      },
      {
        id: 'emotion',
        labels: { en: 'Honest Feeling', ko: '솔직한 느낌' },
        questions: [
          { en: 'Were you fully honest with yourself while reading this?', ko: '읽는 동안 스스로에게 솔직했나요?' },
          { en: 'Was there something in the book you resisted — and why?', ko: '거부감이 든 부분이 있었나요 — 왜 그랬을 것 같나요?' },
          { en: 'Did you find yourself agreeing with something you\'d rather not agree with?', ko: '인정하고 싶지 않은 것에 동의하게 된 부분이 있었나요?' },
          { en: 'What did the book demand from you that you weren\'t sure you could give?', ko: '책이 당신에게 줄 수 있을지 확신이 없는 것을 요구한 게 있었나요?' },
          { en: 'Was there a feeling you kept at a distance while reading?', ko: '읽는 동안 거리를 두려 했던 감정이 있었나요?' },
          { en: 'Did anything make you feel exposed — seen in a way you didn\'t expect?', ko: '예상치 못한 방식으로 들킨 것 같은 느낌이 든 부분이 있었나요?' },
          { en: 'What were you unwilling to sit with — and did you sit with it anyway?', ko: '함께 있고 싶지 않았던 감정이 있었나요 — 그래도 결국 함께 있었나요?' },
          { en: 'Did the book make you want to be different, or confirm how you already are?', ko: '이 책이 달라지고 싶게 만들었나요, 아니면 이미 나인 것을 확인시켜줬나요?' },
        ],
        placeholders: {
          en: ['Something true, even if it\'s uncomfortable.', 'The feeling you didn\'t quite name.', 'What you would admit only here.', 'The resistance, and what was underneath it.', 'What the book asked that you weren\'t ready to answer.'],
          ko: ['불편하더라도 진실한 것.', '이름 붙이지 않은 감정.', '여기에서만 인정할 수 있는 것.', '거부감, 그리고 그 아래에 있는 것.', '아직 답할 준비가 안 된 책의 질문.'],
        },
      },
      {
        id: 'mirror',
        labels: { en: 'Then and Now', ko: '그때와 지금' },
        questions: [
          { en: 'Would this book have meant the same to you five years ago?', ko: '5년 전의 나도 이 책을 같은 방식으로 읽었을까요?' },
          { en: 'Is there something you understand now that a past version of you couldn\'t?', ko: '지금의 나는 알지만 과거의 나는 이해하지 못했을 게 있나요?' },
          { en: 'Has your relationship to this kind of book changed over time?', ko: '이런 종류의 책과 나의 관계가 시간이 지나면서 바뀌었나요?' },
          { en: 'What does reading this tell you about where you are right now?', ko: '이 책을 읽는 것이 지금 내가 어디에 있는지 말해주는 것 같나요?' },
          { en: 'Is there something you used to believe that this book complicates?', ko: '이 책이 예전에 믿었던 것을 복잡하게 만드나요?' },
          { en: 'What would you have missed in this book at a different point in your life?', ko: '삶의 다른 시점에서 읽었다면 놓쳤을 것이 있나요?' },
          { en: 'Is there a version of yourself you\'re reading toward — or away from?', ko: '이 책을 읽으면서 향하고 있는 나의 모습이 있나요 — 아니면 벗어나려는 모습이?' },
          { en: 'If you read this again in ten years, what do you think would change?', ko: '10년 후에 다시 읽는다면 무엇이 달라질 것 같나요?' },
        ],
        placeholders: {
          en: ['What this means now, versus before.', 'The version of you that would have read this differently.', 'Something time changed in how you read this.', 'What you brought to the book that only you could bring now.', 'The distance between who you were and who you are.'],
          ko: ['지금의 의미, 그리고 예전의 의미.', '이 책을 다르게 읽었을 나의 모습.', '시간이 이 책을 읽는 방식을 바꾼 것.', '지금의 나만 가져올 수 있는 것.', '과거의 나와 현재의 나 사이의 거리.'],
        },
      },
      {
        id: 'linger',
        labels: { en: 'What\'s Next', ko: '그 다음' },
        questions: [
          { en: 'Is there a question this book left open that you want to follow?', ko: '이 책이 열어둔 질문 중 따라가고 싶은 게 있나요?' },
          { en: 'Did this reading lead you toward another book, or away from one?', ko: '이 책을 읽고 다른 책 쪽으로 이끌리나요, 아니면 멀어지나요?' },
          { en: 'What would you do differently with this book if you could start over?', ko: '다시 처음부터 읽는다면 어떻게 다르게 읽고 싶나요?' },
          { en: 'Is there someone you\'d want to read this alongside, or discuss it with?', ko: '함께 읽거나 이야기를 나누고 싶은 사람이 있나요?' },
          { en: 'What does finishing (or stopping) this book feel like?', ko: '이 책을 다 읽은 것 (또는 멈춘 것)은 어떤 느낌인가요?' },
          { en: 'Did this book open a door or close one?', ko: '이 책이 문을 열었나요, 아니면 닫았나요?' },
          { en: 'What would you want to remember about reading this, ten years from now?', ko: '10년 후에 이 독서에 대해 기억하고 싶은 것은 무엇인가요?' },
          { en: 'What habit or question will this book leave behind in your reading life?', ko: '이 책이 앞으로의 독서 생활에 남길 습관이나 질문이 있을까요?' },
        ],
        placeholders: {
          en: ['What comes after the reading.', 'A door the book opened, or closed.', 'The question that will stay.', 'What reading this changed about what comes next.', 'Where the book sends you.'],
          ko: ['독서 이후에 오는 것.', '책이 열거나 닫은 문.', '남을 질문.', '이 책을 읽은 것이 다음을 어떻게 바꿨는지.', '책이 향하게 하는 곳.'],
        },
      },
    ],
  },
];

// 세트 랜덤 선택 후 각 단계 질문도 랜덤 선택
function getPrompts(t: (k: any) => string, locale: string): Prompt[] {
  const set = PROMPT_SETS[Math.floor(Math.random() * PROMPT_SETS.length)];
  const lang = locale === 'ko' ? 'ko' : 'en';

  const steps = set.steps.map((step) => {
    const qi = Math.floor(Math.random() * step.questions.length);
    const pool = step.placeholders;
    return {
      id: step.id,
      label: step.labels[lang],
      question: step.questions[qi][lang],
      placeholder: pool[lang][Math.floor(Math.random() * pool[lang].length)],
      hint: '',
      isHighlight: step.isHighlight,
    };
  });

  // atmosphere 단계는 항상 고정 (UserProfile emotions 연동 보호)
  steps.push({
    id: 'atmosphere',
    label: t('prompt.atmosphere.label'),
    question: t('prompt.atmosphere.q'),
    placeholder: '',
    hint: t('prompt.atmosphere.h'),
    isAtmosphere: true,
  });

  return steps;
}


function getAtmospheres(t: (k: any) => string): string[] {
  return [
    t('atm.contemplative'), t('atm.moved'), t('atm.melancholy'), t('atm.nostalgic'),
    t('atm.inspired'), t('atm.unsettled'), t('atm.joyful'), t('atm.awe'),
    t('atm.anxious'), t('atm.pensive'), t('atm.calm'),
  ];
}

type PromptId = 'opening' | 'highlight' | 'emotion' | 'mirror' | 'linger' | 'atmosphere';
type JournalView = 'write' | 'archive';

// ── Book context type ──────────────────────────────────────────────────────
interface BookContext {
  bookId: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  bookCover: string | null;
}

const EMPTY_BOOK: BookContext = {
  bookId: null,
  bookTitle: null,
  bookAuthor: null,
  bookCover: null,
};

// ── Journal page ──────────────────────────────────────────────────────────
export const Journal = () => {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const bookContext: BookContext = location.state ?? EMPTY_BOOK;

  const [view, setView] = useState<JournalView>('write');
  const [shelfOpen, setShelfOpen] = useState(false);
  const [shelfItems, setShelfItems] = useState<any[]>([]);
  const [shelfLoading, setShelfLoading] = useState(false);

  const openShelf = () => {
    setShelfOpen(true);
    setShelfLoading(true);
    getBookShelf()
      .then(setShelfItems)
      .catch(() => {})
      .finally(() => setShelfLoading(false));
  };
  const { entries, loading, error, create, update, remove, refetch } = useJournal();

  return (
    <div className="min-h-screen bg-butter-bg">

      {/* ── Page header ── */}
      <div className="pt-16 md:pt-24 pb-6 md:pb-8 px-5 md:px-14 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] text-butter-muted/70 font-medium mb-4">
          {t('journal.label')}
        </p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-[1.6rem] md:text-[2.6rem] font-serif font-black leading-[1.1] tracking-tight mb-3 md:mb-4">
              {t('journal.title')}{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--color-butter-primary)', fontWeight: 700 }}>
                {t('journal.title.em')}
              </em>
            </h1>
            <p className="text-butter-muted leading-[1.75] max-w-sm font-light text-[15px]">
              {t('journal.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-5 pb-1 shrink-0">
            {(['write', 'archive'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`pb-1.5 text-[11px] uppercase tracking-[0.18em] font-medium transition-all duration-200 ${
                  view === v ? 'text-butter-text' : 'text-butter-muted hover:text-butter-text'
                }`}
                style={view === v ? { borderBottom: '1px solid var(--color-butter-text)' } : {}}
              >
                {v === 'write' ? t('journal.tab.write') : t('journal.tab.archive')}
              </button>
            ))}
            <button
              onClick={openShelf}
              className="pb-1.5 text-[11px] uppercase tracking-[0.18em] font-medium text-butter-muted hover:text-butter-text transition-all duration-200"
            >
              {locale === 'ko' ? '서재' : 'Library'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }} />

      <div className="px-5 md:px-14 max-w-7xl mx-auto py-8 md:py-14">
        <AnimatePresence mode="wait">
          {view === 'write' ? (
            <WriteView key="write" onCreate={create} onSaved={() => setView('archive')} bookContext={bookContext} />
          ) : (
            <ArchiveView
              key="archive"
              entries={entries}
              loading={loading}
              error={error}
              onUpdate={update}
              onDelete={remove}
              onSwitchToWrite={() => setView('write')}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── 서재 모달 ── */}
      <AnimatePresence>
        {shelfOpen && (
          <>
            {/* 백드롭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              onClick={() => setShelfOpen(false)}
            />
            {/* 모달 패널 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed z-50 rounded-xl overflow-hidden"
              style={{
                background: 'var(--color-butter-bg)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                width: 'min(480px, calc(100vw - 2rem))',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                margin: 'auto',
                height: 'fit-content',
              }}
            >
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-butter-rule)' }}>
                <div className="flex items-center gap-2">
                  <Library size={15} strokeWidth={1.5} style={{ color: 'var(--color-butter-primary)' }} />
                  <h2 className="text-[13px] font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--color-butter-text)' }}>
                    {locale === 'ko' ? '내 서재' : 'My Library'}
                  </h2>
                </div>
                <button
                  onClick={() => setShelfOpen(false)}
                  className="transition-opacity hover:opacity-60"
                  style={{ color: 'var(--color-butter-muted)' }}
                >
                  <XIcon size={16} strokeWidth={1.5} />
                </button>
              </div>

              {/* 모달 바디 */}
              <div className="overflow-y-auto flex-1 px-6 py-4">
                {shelfLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--color-butter-accent)', borderTopColor: 'var(--color-butter-primary)' }} />
                  </div>
                ) : shelfItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Library size={28} strokeWidth={1} className="mx-auto mb-3" style={{ color: 'var(--color-butter-muted)', opacity: 0.4 }} />
                    <p className="font-serif italic text-[14px]" style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}>
                      {locale === 'ko' ? '서재가 비어 있습니다.' : 'Your library is empty.'}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-0">
                    {shelfItems.map((item, i) => (
                      <li
                        key={item.id}
                        className="flex items-center gap-4 py-4 group"
                        style={{ borderBottom: i < shelfItems.length - 1 ? '1px solid var(--color-butter-rule)' : 'none' }}
                      >
                        {/* 커버 썸네일 — 클릭 시 상세 페이지 */}
                        <div
                          className="w-9 h-12 rounded-sm overflow-hidden shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ background: 'var(--color-butter-accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                          onClick={() => { setShelfOpen(false); navigate(`/explore/${item.bookId}`); }}
                        >
                          {item.bookCover ? (
                            <img src={item.bookCover} alt={item.bookTitle} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : null}
                        </div>

                        {/* 텍스트 — 제목 클릭 시 상세 페이지 */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-serif font-light leading-snug truncate cursor-pointer hover:text-butter-primary transition-colors"
                            style={{ fontSize: '14px', color: 'var(--color-butter-text)' }}
                            onClick={() => { setShelfOpen(false); navigate(`/explore/${item.bookId}`); }}
                          >
                            {item.bookTitle}
                          </p>
                          <p className="font-light italic truncate mt-0.5" style={{ fontSize: '12px', color: 'var(--color-butter-muted)' }}>
                            {item.bookAuthor}
                          </p>
                          <p className="mt-1" style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.55, letterSpacing: '0.05em' }}>
                            {new Date(item.addedAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>

                        {/* 삭제 버튼 */}
                        <button
                          onClick={async () => {
                            await removeFromBookShelf(item.bookId).catch(() => {});
                            setShelfItems(prev => prev.filter(s => s.id !== item.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          style={{ color: 'var(--color-butter-muted)' }}
                          title={locale === 'ko' ? '서재에서 제거' : 'Remove'}
                        >
                          <XIcon size={13} strokeWidth={1.5} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 모달 푸터 */}
              {shelfItems.length > 0 && (
                <div className="px-6 py-3" style={{ borderTop: '1px solid var(--color-butter-rule)' }}>
                  <p className="text-center" style={{ fontSize: '11px', color: 'var(--color-butter-muted)', opacity: 0.55 }}>
                    {locale === 'ko'
                      ? `${shelfItems.length}권이 서재에 보관되어 있습니다.`
                      : `${shelfItems.length} book${shelfItems.length > 1 ? 's' : ''} in your library.`}
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── WriteView ──────────────────────────────────────────────────────────────

interface WriteViewProps {
  onCreate: (payload: {
    content: string;
    prompt: string;
    mood: string;
    emotions: string[];
    intensity: number;
    highlight?: string | null;
    bookId?: string | null;
    bookTitle?: string | null;
    bookAuthor?: string | null;
    bookCover?: string | null;
  }) => Promise<{ id: string }>;
  onSaved: () => void;
  bookContext: BookContext;
}

type WritePhase = 'prompts' | 'summary';

const WriteView = ({ onCreate, onSaved, bookContext }: WriteViewProps) => {
  const { t, locale } = useLocale();
  const ATMOSPHERES = getAtmospheres(t);
  const [step, setStep] = useState(0);
  // PROMPTS를 useState로 고정 — 세션 내에서 placeholder가 바뀌지 않도록
  const [PROMPTS] = useState(() => getPrompts(t, locale));
  const [direction, setDirection] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<PromptId, string>>({
    opening: '', highlight: '', emotion: '', mirror: '', linger: '', atmosphere: '',
  });
  const [selectedAtmospheres, setSelectedAtmospheres] = useState<string[]>([]);
  const [phase, setPhase] = useState<WritePhase>('prompts');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [bookRequiredOpen, setBookRequiredOpen] = useState(false);
  const [confirmPublicOpen, setConfirmPublicOpen] = useState(false);
  const [pendingPublic, setPendingPublic] = useState<boolean | null>(null);

  // activeBook: navigation에서 전달된 bookContext로 초기화, 검색으로 교체 가능
  const [activeBook, setActiveBook] = useState<BookContext>(bookContext);

  // ── GPT 질문 state (EN + KO 분리 보관) ──
  const [gptQuestions, setGptQuestions]     = useState<string[]>([]);
  const [gptQuestionsKo, setGptQuestionsKo] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  // 책이 변경될 때마다 GPT 질문 fetch
  const handleBookChange = (book: BookContext) => {
    setActiveBook(book);
    
    setSkipLoading(false);
    if (book.bookTitle && book.bookAuthor) {
      setGptQuestions([]);
      setGptQuestionsKo([]);
      setQuestionsLoading(true);
      getReflectionQuestions({
        bookTitle: book.bookTitle,
        bookAuthor: book.bookAuthor,
      })
        .then((res) => {
          setGptQuestions(res.questions);
          setGptQuestionsKo(res.questionsKo ?? []);
          
        })
        .catch(() => { setGptQuestions([]); setGptQuestionsKo([]); })
        .finally(() => setQuestionsLoading(false));
    } else {
      setGptQuestions([]);
      setGptQuestionsKo([]);
    }
  };

  // BookDetail에서 책과 함께 진입한 경우 초기 질문 자동 fetch
  useEffect(() => {
    if (bookContext.bookTitle && bookContext.bookAuthor) {
      setQuestionsLoading(true);
      getReflectionQuestions({
        bookTitle: bookContext.bookTitle,
        bookAuthor: bookContext.bookAuthor,
      })
        .then((res) => {
          setGptQuestions(res.questions);
          setGptQuestionsKo(res.questionsKo ?? []);
          
        })
        .catch(() => { setGptQuestions([]); setGptQuestionsKo([]); })
        .finally(() => setQuestionsLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 1회만

  const current = PROMPTS[step];
  const isFirst = step === 0;
  const isLast = step === PROMPTS.length - 1;
  const progress = phase === 'summary' ? 100 : ((step + 1) / PROMPTS.length) * 100;

  const canProceed = current.isAtmosphere
    ? selectedAtmospheres.length > 0
    : answers[current.id as PromptId].trim().length > 0;

  const goNext = () => { setDirection(1); setStep((s) => s + 1); };
  const goPrev = () => { setDirection(-1); setStep((s) => s - 1); };
  const skipStep = () => { setDirection(1); setStep((s) => s + 1); };

  const handleFinish = () => {
    setDirection(1);
    setPhase('summary');
  };

  const handleSave = async () => {
    // 책이 지정되지 않았으면 모달로 안내
    if (!activeBook.bookTitle) {
      setBookRequiredOpen(true);
      return;
    }
    await doSave();
  };

  const doSave = async (bookOverride?: BookContext) => {
    setSaving(true);
    const book = bookOverride ?? activeBook;
    try {
      const journalContent = PROMPTS
        .filter((p) => !p.isAtmosphere && answers[p.id as PromptId].trim())
        .map((p) => `[${p.label}]\n${answers[p.id as PromptId].trim()}`)
        .join('\n\n');

      const primaryMood = selectedAtmospheres[0] ?? '';
      const intensity = Math.min(10, Math.max(1, selectedAtmospheres.length * 2 + 3));

      const entry = await onCreate({
        content: journalContent || answers.opening.trim() || 'A quiet reflection.',
        prompt: PROMPTS[step]?.question ?? '',
        mood: primaryMood,
        emotions: selectedAtmospheres,
        intensity,
        highlight: answers.highlight.trim() || null,
        bookId: book.bookId ?? null,
        bookTitle: book.bookTitle ?? null,
        bookAuthor: book.bookAuthor ?? null,
        bookCover: book.bookCover ?? null,
        isPublic,
      });

      // Reflection 생성 + EmotionLog 기록은 백엔드 journal POST에서 처리됨

      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); onSaved(); }, 1200);
    } catch (e: any) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    {/* ── 책 지정 요청 모달 ── */}
    <AnimatePresence>
      {bookRequiredOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)' }}
            onClick={() => setBookRequiredOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed z-50 overflow-hidden"
            style={{
              background: 'var(--color-butter-surface)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
              width: 'min(460px, calc(100vw - 2rem))',
              top: 0, left: 0, right: 0, bottom: 0,
              margin: 'auto',
              height: 'fit-content',
              maxHeight: '78vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '3px',
            }}
          >
            {/* 헤더 */}
            <div className="px-7 pt-7 pb-5 shrink-0 flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-2" style={{ color: 'var(--color-butter-primary)', opacity: 0.8 }}>
                  {locale === 'ko' ? '책 연결' : 'Link a book'}
                </p>
                <h2 className="font-serif font-light leading-snug" style={{ fontSize: '1.25rem', color: 'var(--color-butter-text)' }}>
                  {locale === 'ko' ? '어떤 책에 대한 기록인가요?' : 'Which book is this about?'}
                </h2>
              </div>
              <button
                onClick={() => setBookRequiredOpen(false)}
                className="mt-1 ml-4 shrink-0 transition-opacity hover:opacity-50"
                style={{ color: 'var(--color-butter-muted)' }}
              >
                <XIcon size={15} strokeWidth={1.5} />
              </button>
            </div>

            {/* 검색 바디 */}
            <BookSearchInModal
              locale={locale}
              onSelect={(book) => {
                handleBookChange(book);
                setBookRequiredOpen(false);
                doSave(book);
              }}
              onSkip={() => {
                setBookRequiredOpen(false);
                doSave();
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* ── 공개/비공개 전환 확인 모달 ── */}
    <AnimatePresence>
      {confirmPublicOpen && pendingPublic !== null && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(2px)' }}
            onClick={() => setConfirmPublicOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-50"
            style={{
              background: 'var(--color-butter-surface)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
              width: 'min(360px, calc(100vw - 2rem))',
              top: 0, left: 0, right: 0, bottom: 0,
              margin: 'auto',
              height: 'fit-content',
              padding: '2rem',
              borderRadius: '3px',
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-3" style={{ color: 'var(--color-butter-primary)', opacity: 0.75 }}>
              {pendingPublic
                ? (locale === 'ko' ? '공개로 전환' : 'Make public')
                : (locale === 'ko' ? '비공개로 전환' : 'Make private')}
            </p>
            <p className="font-serif font-light leading-relaxed mb-8" style={{ fontSize: '15px', color: 'var(--color-butter-text)' }}>
              {pendingPublic
                ? (locale === 'ko' ? '홈과 책 페이지 피드에 노출됩니다.' : 'This entry will appear in home and book page feeds.')
                : (locale === 'ko' ? '피드에서 더 이상 표시되지 않습니다.' : 'This entry will no longer appear in any feeds.')}
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setConfirmPublicOpen(false)}
                className="font-light transition-opacity hover:opacity-50"
                style={{ fontSize: '11px', letterSpacing: '0.05em', color: 'var(--color-butter-muted)' }}
              >
                {locale === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setIsPublic(pendingPublic!);
                  setConfirmPublicOpen(false);
                  setPendingPublic(null);
                }}
                className="font-medium transition-all hover:brightness-110"
                style={{
                  fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
                  background: 'var(--color-butter-primary)',
                  color: 'var(--color-butter-bg)',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '2px',
                }}
              >
                {locale === 'ko' ? '확인' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row gap-8 md:gap-16 xl:gap-24 pb-0">

        {/* ── Left col: book + progress context ── */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
          <div className="lg:sticky lg:top-28 space-y-5 md:space-y-8">

            {/* Book context — search 기능 포함 */}
            <BookContextPanel
              bookContext={activeBook}
              onBookChange={handleBookChange}
            />

            {/* GPT 질문 — 책이 선택됐을 때 좌측 패널에 표시 */}
            {phase === 'prompts' && (activeBook.bookTitle) && (
              <GptQuestionsPanel
                questions={gptQuestions}
                questionsKo={gptQuestionsKo}
                loading={questionsLoading}
              />
            )}

            {/* {t('journal.progress')} indicator — 현재 스텝과 전체 흐름 */}
            {phase === 'prompts' && (
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}>
                <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-butter-muted/60 mb-4">
                  Progress
                </p>
                <div className="space-y-2.5">
                  {PROMPTS.map((p, i) => {
                    const done = i < step;
                    const active = i === step;
                    const hasAnswer = p.isAtmosphere
                      ? selectedAtmospheres.length > 0
                      : answers[p.id as PromptId].trim().length > 0;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div
                          className="w-1 h-1 rounded-full shrink-0 transition-all duration-300"
                          style={{
                            background: active
                              ? 'var(--color-butter-primary)'
                              : done && hasAnswer
                              ? 'var(--color-butter-primary)'
                              : 'rgba(0,0,0,0.15)',
                            width: active ? '6px' : '4px',
                            height: active ? '6px' : '4px',
                          }}
                        />
                        <span
                          className="text-[11px] transition-colors duration-200"
                          style={{
                            color: active
                              ? 'var(--color-butter-text)'
                              : done && hasAnswer
                              ? 'var(--color-butter-primary)'
                              : 'var(--color-butter-muted)',
                            fontWeight: active ? 500 : 400,
                          }}
                        >
                          {p.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hint for current step */}
            {phase === 'prompts' && current.hint && (
              <p className="text-[12px] text-butter-muted/65 font-light italic leading-[1.7]">
                {current.hint}
              </p>
            )}
          </div>
        </aside>

        {/* ── Right col: writing area ── */}
        <main className="flex-1 min-w-0 max-w-2xl">

          {/* ── 질문 로딩 바 ── */}
          <AnimatePresence>
            {questionsLoading && !skipLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden mb-6"
              >
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-sm"
                  style={{ background: 'var(--color-butter-surface)', border: '1px solid var(--color-butter-rule)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* 인디케이터 도트 */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="rounded-full"
                          style={{ width: 4, height: 4, background: 'var(--color-butter-primary)', opacity: 0.5 }}
                          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
                          transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-light" style={{ color: 'var(--color-butter-muted)' }}>
                      {locale === 'ko' ? '생각할 거리를 준비하는 중입니다…' : 'Preparing reflection prompts…'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSkipLoading(true)}
                    className="text-[10px] uppercase tracking-[0.14em] font-medium ml-4 shrink-0 transition-opacity hover:opacity-60"
                    style={{ color: 'var(--color-butter-muted)' }}
                  >
                    {locale === 'ko' ? '먼저 작성하기' : 'Write now'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {phase === 'prompts' && (
              <motion.div
                key={`step-${step}`}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: d * 32 }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: d * -32 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.26, ease: 'easeInOut' }}
              >
                {/* Progress bar */}
                <div
                  className="mb-5 md:mb-10"
                  style={{ background: 'rgba(0,0,0,0.06)', height: '1px' }}
                >
                  <motion.div
                    style={{ background: 'var(--color-butter-primary)', height: '1px' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  />
                </div>

                {/* Step label + counter */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-butter-primary">
                    {current.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-medium text-butter-muted/65">
                    {step + 1} / {PROMPTS.length}
                  </span>
                </div>

                {/* Question */}
                <h2
                  
                  className="question-ripple-container text-2xl md:text-[1.75rem] font-serif font-light leading-[1.35] mb-5 md:mb-8 text-butter-text"
                >
                  {current.question}
                </h2>

                {/* Input area */}
                {current.isAtmosphere ? (
                  <div className="mb-10">
                    <div className="flex flex-wrap gap-2.5">
                      {ATMOSPHERES.map((a) => {
                        const active = selectedAtmospheres.includes(a);
                        return (
                          <button
                            key={a}
                            onClick={() =>
                              setSelectedAtmospheres((prev) =>
                                prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                              )
                            }
                            className="px-4 py-1.5 text-[12px] font-medium transition-all duration-150"
                            style={{
                              borderRadius: '2px',
                              border: active
                                ? '1px solid var(--color-butter-primary)'
                                : '1px solid rgba(0,0,0,0.12)',
                              background: active ? 'var(--color-butter-primary)' : 'transparent',
                              color: active ? '#ffffff' : 'var(--color-butter-muted)',
                            }}
                          >
                            {a}
                          </button>
                        );
                      })}
                    </div>

                    {/* ── 공개/비공개 토글 ── */}
                    <div
                      className="mt-8 flex items-center justify-between px-4 py-3"
                      style={{
                        border: '1px solid var(--color-butter-rule)',
                        borderRadius: '4px',
                        background: 'var(--color-butter-surface)',
                      }}
                    >
                      <div>
                        <p className="text-[12px] font-medium" style={{ color: 'var(--color-butter-text)' }}>
                          {isPublic
                            ? (locale === 'ko' ? '커뮤니티에 공개' : 'Share with community')
                            : (locale === 'ko' ? '나만 보기' : 'Only visible to me')}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-butter-muted)' }}>
                          {isPublic
                            ? (locale === 'ko' ? '홈과 책 페이지 피드에 노출됩니다' : 'Appears in home & book page feeds')
                            : (locale === 'ko' ? '피드에 노출되지 않습니다' : 'Won\'t appear in any feeds')}
                        </p>
                      </div>
                      {/* 토글 스위치 */}
                      <button
                        onClick={() => {
                          setPendingPublic(!isPublic);
                          setConfirmPublicOpen(true);
                        }}
                        className="relative shrink-0 transition-all duration-200"
                        style={{
                          width: '40px',
                          height: '22px',
                          borderRadius: '11px',
                          background: isPublic ? 'var(--color-butter-primary)' : 'var(--color-butter-accent)',
                          border: '1px solid var(--color-butter-rule)',
                        }}
                      >
                        <span
                          className="absolute top-[2px] transition-all duration-200"
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: isPublic ? '#ffffff' : 'var(--color-butter-muted)',
                            left: isPublic ? '20px' : '2px',
                          }}
                        />
                      </button>
                    </div>
                  </div>
                ) : current.isHighlight ? (
                  // Highlight input — borderLeft quote style
                  <div
                    className="mb-10 relative"
                    style={{ borderLeft: '2px solid rgba(107,82,0,0.18)' }}
                  >
                    <span
                      className="absolute -top-3 left-4 font-serif text-3xl leading-none select-none"
                      style={{ color: 'rgba(107,82,0,0.15)' }}
                    >
                      "
                    </span>
                    <textarea
                      autoFocus
                      value={answers[current.id as PromptId]}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
                      }
                      placeholder={current.placeholder}
                      rows={4}
                      className="w-full bg-transparent pl-6 pr-4 pt-4 pb-4 text-[16px] font-serif italic leading-[1.85] resize-none focus:outline-none text-butter-text/80 placeholder:text-butter-muted/55"
                    />
                  </div>
                ) : (
                  // Regular textarea
                  <textarea
                    autoFocus
                    value={answers[current.id as PromptId]}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
                    }
                    placeholder={current.placeholder}
                    rows={5}
                    className="w-full bg-transparent text-[17px] font-serif leading-[1.9] resize-none focus:outline-none text-butter-text/85 placeholder:text-butter-muted/55 mb-6 md:mb-10"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.07)', paddingBottom: '1.5rem' }}
                  />
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={goPrev}
                    disabled={isFirst}
                    className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-butter-muted hover:text-butter-text transition-colors disabled:opacity-0 disabled:pointer-events-none px-4 py-2"
                    style={{ border: '1px solid rgba(0,0,0,0.10)', borderRadius: '2px' }}
                  >
                    <ArrowLeft size={12} /> {t('journal.back')}
                  </button>

                  <button
                    onClick={skipStep}
                    className={`text-[11px] font-medium uppercase tracking-[0.14em] text-butter-muted/65 hover:text-butter-muted transition-colors px-3 py-2 ${
                      isLast ? 'invisible' : ''
                    }`}
                  >
                    {t('journal.skip')}
                  </button>

                  {isLast ? (
                    <button
                      onClick={handleFinish}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-7 py-2.5 bg-butter-primary text-white font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all text-[11px] disabled:opacity-40"
                      style={{ borderRadius: '2px' }}
                    >
                      {t('journal.review')} <ArrowRight size={12} />
                    </button>
                  ) : (
                    <button
                      onClick={goNext}
                      disabled={!canProceed}
                      className="flex items-center gap-2 px-7 py-2.5 bg-butter-primary text-white font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all text-[11px] disabled:opacity-40"
                      style={{ borderRadius: '2px' }}
                    >
                      {t('journal.next')} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {phase === 'summary' && (
              <motion.div
                key="summary"
                custom={1}
                variants={{
                  enter: () => ({ opacity: 0, x: 32 }),
                  center: { opacity: 1, x: 0 },
                  exit: () => ({ opacity: 0, x: -32 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Summary header */}
                <div className="mb-10" style={{ background: 'var(--color-butter-primary)', height: '1px' }} />
                <span className="text-[10px] uppercase tracking-[0.22em] font-medium text-butter-primary mb-4 block">
                  {t('journal.review.label')}
                </span>
                <h2 className="text-2xl md:text-[1.75rem] font-serif font-light leading-[1.35] mb-2 text-butter-text">
                  {t('journal.review.title')}
                </h2>
                <p className="text-[13px] text-butter-muted font-light leading-[1.7] mb-10">
                  {t('journal.review.subtitle')}
                </p>

                {/* Answers review */}
                <div className="space-y-8 mb-10">
                  {PROMPTS.filter((p) => !p.isAtmosphere).map((p) => {
                    const val = answers[p.id as PromptId].trim();
                    if (!val) return null;
                    return (
                      <div
                        key={p.id}
                        style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}
                      >
                        <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-butter-primary/70 mb-2">
                          {p.label}
                        </p>
                        {p.isHighlight ? (
                          <p className="text-[15px] font-serif italic text-butter-text/70 leading-[1.85]">
                            "{val}"
                          </p>
                        ) : (
                          <p className="text-[15px] text-butter-text/80 font-light leading-[1.85]">{val}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Atmosphere summary */}
                {selectedAtmospheres.length > 0 && (
                  <div
                    className="mb-10"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}
                  >
                    <p className="text-[9px] uppercase tracking-[0.25em] font-medium text-butter-primary/70 mb-3">
                      Atmosphere
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAtmospheres.map((a) => (
                        <span
                          key={a}
                          className="text-[11px] font-medium px-3 py-1 uppercase tracking-[0.1em]"
                          style={{
                            border: '1px solid rgba(107,82,0,0.30)',
                            borderRadius: '2px',
                            color: 'var(--color-butter-primary)',
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save CTA */}
                <div
                  className="flex items-center justify-between pt-6"
                  style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
                >
                  <button
                    onClick={() => { setDirection(-1); setPhase('prompts'); setStep(PROMPTS.length - 1); }}
                    className="flex items-center gap-2 px-5 py-2.5 text-butter-muted hover:text-butter-text text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                    style={{ border: '1px solid rgba(0,0,0,0.10)', borderRadius: '2px' }}
                  >
                    <ArrowLeft size={12} /> {t('journal.edit')}
                  </button>

                  <div className="text-right">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`flex items-center gap-2.5 px-8 py-3 font-medium uppercase tracking-[0.14em] text-[11px] transition-all disabled:opacity-50 ${
                        saveSuccess ? 'bg-green-600 text-white' : 'bg-butter-primary text-white hover:brightness-110'
                      }`}
                      style={{ borderRadius: '2px' }}
                    >
                      {saveSuccess ? (
                        <><Check size={12} /> {t('journal.saved')}</>
                      ) : saving ? t('journal.saving') : (
                        <><span style={{ fontSize: '14px' }}>📖</span> {t('journal.save')}</>
                      )}
                    </button>
                    <p className="text-[10px] text-butter-muted/55 mt-2 font-light italic">
                      {t('journal.archive.note')}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </motion.div>
    </>
  );
};

// ── BookSearchInModal ──────────────────────────────────────────────────────
// 책 지정 요청 모달 내부 검색 UI

const BookSearchInModal = ({
  locale,
  onSelect,
  onSkip,
}: {
  locale: string;
  onSelect: (book: BookContext) => void;
  onSkip: () => void;
}) => {
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    if (!trimmed || trimmed.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const books = await getBooks({ search: trimmed, lang: locale });
        setResults(books.slice(0, 6));
      } catch { setResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
  };

  return (
    <div className="flex flex-col overflow-hidden">
      {/* 검색 input */}
      <div className="px-7 pb-4 shrink-0">
        <div
          className="flex items-center gap-2.5 px-0 py-2"
          style={{ borderBottom: '1px solid var(--color-butter-rule)' }}
        >
          <Search size={13} style={{ color: 'var(--color-butter-muted)', opacity: 0.5 }} className="shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder={locale === 'ko' ? '제목 또는 저자' : 'Title or author'}
            className="flex-1 bg-transparent focus:outline-none font-serif font-light"
            style={{ fontSize: '16px', color: 'var(--color-butter-text)' }}
          />
          {searchLoading && <Loader2 size={12} style={{ color: 'var(--color-butter-muted)', opacity: 0.5 }} className="animate-spin shrink-0" />}
          {query && !searchLoading && (
            <button onClick={() => { setQuery(''); setResults([]); }} className="shrink-0 transition-opacity hover:opacity-50" style={{ color: 'var(--color-butter-muted)' }}>
              <X size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="overflow-y-auto flex-1 px-7 pb-2">
        {results.length > 0 ? (
          <ul>
            {results.map((book, i) => (
              <li
                key={book.id}
                className="flex items-center gap-4 py-3.5 cursor-pointer group"
                style={{ borderBottom: i < results.length - 1 ? '1px solid var(--color-butter-rule)' : 'none' }}
                onClick={() => onSelect({ bookId: book.id, bookTitle: book.title, bookAuthor: book.author, bookCover: book.cover })}
              >
                <div
                  className="shrink-0 overflow-hidden"
                  style={{ width: '28px', height: '40px', background: 'var(--color-butter-accent)', borderRadius: '1px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                >
                  {book.cover && (
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-light truncate transition-colors" style={{ fontSize: '13px', color: 'var(--color-butter-text)' }}>
                    {book.title}
                  </p>
                  <p className="font-light italic truncate mt-0.5" style={{ fontSize: '11px', color: 'var(--color-butter-muted)', opacity: 0.6 }}>
                    {book.author}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : query.length >= 2 && !searchLoading ? (
          <p className="py-8 text-center font-serif italic font-light" style={{ fontSize: '13px', color: 'var(--color-butter-muted)', opacity: 0.45 }}>
            {locale === 'ko' ? '검색 결과가 없습니다.' : 'Nothing found.'}
          </p>
        ) : null}
      </div>

      {/* 건너뛰기 */}
      <div className="px-7 py-5 shrink-0 flex justify-end">
        <button
          onClick={onSkip}
          className="font-light transition-opacity hover:opacity-70"
          style={{ fontSize: '11px', letterSpacing: '0.05em', color: 'var(--color-butter-muted)', opacity: 0.5 }}
        >
          {locale === 'ko' ? '책 없이 저장' : 'Save without a book'}
        </button>
      </div>
    </div>
  );
};

// ── GptQuestionsPanel ──────────────────────────────────────────────────────
// 책이 선택됐을 때 좌측 패널에 표시되는 GPT 생성 질문 힌트

const GptQuestionsPanel = ({
  questions,
  questionsKo,
  loading,
}: {
  questions: string[];
  questionsKo: string[];
  loading: boolean;
}) => {
  const { locale, t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(loading);

  const displayQuestions = locale === 'ko' && questionsKo.length > 0 ? questionsKo : questions;

  // loading true → false 전환 시 (질문 도착) ripple 발사
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = loading;

    if (!wasLoading || loading) return; // 로딩이 끝나는 순간만
    const el = panelRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const cx = W / 2;
    const cy = H / 2;
    // 원이 아닌 타원 — 컨테이너 가로/세로를 딱 채우도록
    const rW = W * 1.05;
    const rH = H * 1.05;

    const RIPPLE_COUNT = 1;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < RIPPLE_COUNT; i++) {
      timeouts.push(setTimeout(() => {
        const ripple = document.createElement('span');
        ripple.className = 'question-ripple';
        ripple.style.cssText = `
          width: ${rW}px;
          height: ${rH}px;
          left: ${cx - rW / 2}px;
          top: ${cy - rH / 2}px;
          animation-duration: ${1800 + i * 400}ms;
          animation-delay: 0ms;
          border-radius: 50%;
        `;
        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
      }, i * 350));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [loading]);

  if (!loading && displayQuestions.length === 0) return null;

  return (
    <div
      ref={panelRef}
      className="question-ripple-container"
      style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '1.5rem' }}
    >
      <p className="text-[9px] uppercase tracking-[0.25em] font-semibold text-butter-muted/65 mb-1">
        {t('journal.questions.label')}
      </p>
      <p className="text-[9px] font-light mb-4" style={{ color: 'var(--color-butter-muted)', opacity: 0.45 }}>
        {t('journal.questions.hint')}
      </p>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 rounded-sm animate-pulse"
              style={{ background: 'rgba(0,0,0,0.06)', width: `${70 + i * 8}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {displayQuestions.map((q, i) => (
            <p
              key={i}
              className="text-[12px] text-butter-muted font-light leading-[1.7] italic"
              style={{ color: 'var(--color-butter-muted)' }}
            >
              — {q}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};

// ── BookContextPanel — with inline book search ─────────────────────────────

const BookContextPanel = ({
  bookContext,
  onBookChange,
}: {
  bookContext: BookContext;
  onBookChange: (book: BookContext) => void;
}) => {
  const { locale, t } = useLocale();
  const hasBook = !!(bookContext.bookTitle && bookContext.bookAuthor);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSearch = () => {
    setSearching(true);
    setQuery('');
    setResults([]);
    setSearchError('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearching(false);
    setQuery('');
    setResults([]);
    setSearchError('');
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = value.trim();
    // 1글자 이하: 자동검색 없음 (한글 자음/모음 조합 중 상태 등 노이즈 방지)
    // 2글자 이상: 자동검색 실행
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError('');
      try {
        const books = await getBooks({ search: trimmed, lang: locale });
        setResults(books.slice(0, 6));
      } catch {
        setSearchError(t('journal.book.searchfail'));
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  };

  const handleSelect = (book: Book) => {
    onBookChange({
      bookId: book.id,
      bookTitle: book.title,
      bookAuthor: book.author,
      bookCover: book.cover,
    });
    closeSearch();
  };

  const handleClear = () => {
    onBookChange({ bookId: null, bookTitle: null, bookAuthor: null, bookCover: null });
  };

  // ── 검색 모드 ──
  if (searching) {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-butter-muted/60 mb-4">
          {t('journal.book.label')}
        </p>

        {/* 비활성 상태와 동일한 surface 컨테이너 */}
        <div
          className="p-4"
          style={{ background: 'var(--color-butter-surface)', borderRadius: '3px' }}
        >
          {/* 검색 input — 컨테이너 안에 자연스럽게 */}
          <div
            className="flex items-center gap-2 px-3 py-2 mb-3"
            style={{
              background: 'var(--color-butter-bg)',
              borderRadius: '2px',
              border: '1px solid var(--color-butter-rule)',
            }}
          >
            <Search size={12} className="text-butter-muted/65 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              {...{placeholder: t('journal.book.search')}}
              className="flex-1 text-[13px] bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/35 font-light"
            />
            {searchLoading && <Loader2 size={12} className="text-butter-muted/65 animate-spin shrink-0" />}
            <button onClick={closeSearch} className="text-butter-muted/55 hover:text-butter-muted transition-colors shrink-0">
              <X size={13} />
            </button>
          </div>

          {/* 안내 문구 */}
          {!query.trim() && (
            <p className="text-[11px] text-butter-muted/65 font-light italic leading-[1.6]">
              {t('journal.book.typing')}
            </p>
          )}
          {query.trim().length > 0 && query.trim().length < 3 && (
            <p className="text-[11px] text-butter-muted/65 font-light italic leading-[1.6]">
              {t('journal.book.keeptyping')}
            </p>
          )}
          {searchError && (
            <p className="text-[11px] text-red-400 font-light">{searchError}</p>
          )}

          {/* 검색 결과 */}
          {!searchLoading && results.length > 0 && (
            <div className="space-y-0.5">
              {results.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleSelect(book)}
                  className="w-full flex items-center gap-3 px-2 py-2 text-left transition-colors group"
                  style={{ borderRadius: '2px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-butter-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="shrink-0 overflow-hidden"
                    style={{ width: '28px', aspectRatio: '2/3', borderRadius: '1px', background: 'var(--color-butter-accent)' }}
                  >
                    <BookCoverImage
                      src={book.cover}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium text-butter-text leading-snug line-clamp-1 group-hover:text-butter-primary transition-colors">
                      {book.title}
                    </p>
                    <p className="text-[11px] text-butter-muted font-light italic line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searchLoading && query.trim().length >= 3 && results.length === 0 && !searchError && (
            <p className="text-[12px] text-butter-muted/65 font-light italic">
              {t('journal.book.noresult')} \"{query}\"
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── 책이 선택된 상태 ──
  if (hasBook) {
    return (
      <div>
        <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-butter-muted/60 mb-4">
          Currently Reflecting On
        </p>
        <div className="flex gap-4 items-start mb-4">
          <div
            className="shrink-0 overflow-hidden"
            style={{
              width: '88px',
              aspectRatio: '2/3',
              boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
              borderRadius: '2px',
            }}
          >
            <BookCoverImage
              src={bookContext.bookCover ?? ''}
              alt={bookContext.bookTitle ?? ''}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="pt-0.5 min-w-0">
            <h2
              className="font-serif italic font-light leading-[1.2] mb-2 text-butter-text"
              style={{ fontSize: '1.35rem' }}
            >
              {bookContext.bookTitle}
            </h2>
            <p className="text-[13px] text-butter-muted font-light tracking-wide">
              {bookContext.bookAuthor}
            </p>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={openSearch}
            className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/60 hover:text-butter-primary transition-colors"
          >
            {t('journal.book.change')}
          </button>
          <span className="text-butter-muted/25 text-[10px]">·</span>
          <button
            onClick={handleClear}
            className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/55 hover:text-red-400 transition-colors"
          >
            {t('journal.book.remove')}
          </button>
          {bookContext.bookId && (
            <>
              <span className="text-butter-muted/25 text-[10px]">·</span>
              <Link
                to={`/explore/${bookContext.bookId}`}
                className="text-[10px] uppercase tracking-[0.14em] font-medium text-butter-muted/60 hover:text-butter-primary transition-colors"
              >
                {t('journal.book.viewdetails')}
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── 책이 없는 상태 — 검색 유도 ──
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.28em] font-medium text-butter-muted/60 mb-4">
        Currently Reflecting On
      </p>
      <button
        onClick={openSearch}
        className="w-full flex items-center gap-3 p-4 text-left transition-all group"
        style={{ background: 'var(--color-butter-surface)', borderRadius: '3px' }}
      >
        <BookOpen size={13} className="text-butter-primary/50 shrink-0" />
        <div>
          <p className="text-[12px] font-medium text-butter-muted group-hover:text-butter-primary transition-colors">
            {t('journal.book.link')}
          </p>
          <p className="text-[11px] text-butter-muted/60 font-light mt-0.5">
            {t('journal.book.link.desc')}
          </p>
        </div>
        <Search size={12} className="text-butter-muted/45 shrink-0 ml-auto group-hover:text-butter-primary/50 transition-colors" />
      </button>
    </div>
  );
};


// ── Archive 헬퍼 함수들 ────────────────────────────────────────────────────

function groupEntriesByMonth(entries: JournalEntry[]): Map<string, JournalEntry[]> {
  const map = new Map<string, JournalEntry[]>();
  entries.forEach((e) => {
    const key = e.date.slice(0, 7);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  });
  return map;
}

function formatMonthYear(yyyyMm: string, locale: string): string {
  const [y, m] = yyyyMm.split('-');
  const loc = locale === 'ko' ? 'ko-KR' : 'en-US';
  return new Date(Number(y), Number(m) - 1).toLocaleString(loc, { month: 'long', year: 'numeric' });
}

// 날짜 → 계절 레이블 (디자인의 "AUTUMN EQUINOX · 2024" 스타일)
function getSeasonLabel(dateStr: string, t: (k: any) => string): string {
  const date = new Date(dateStr);
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 2 && month <= 4) return `${t('season.spring')} · ${year}`;
  if (month >= 5 && month <= 7) return `${t('season.summer')} · ${year}`;
  if (month >= 8 && month <= 10) return `${t('season.autumn')} · ${year}`;
  return `${t('season.winter')} · ${year}`;
}

// 엔트리의 첫 번째 의미있는 텍스트 줄 (서브타이틀용)
function getEntrySubtitle(entry: JournalEntry): string {
  const sections = entry.content.split(/\n\n(?=\[)/);
  const first = sections[0];
  const match = first.match(/^\[.+?\]\n([\s\S]+)/);
  const raw = match ? match[1] : first;
  const firstLine = raw.trim().split('\n')[0].trim();
  return firstLine.length > 60 ? firstLine.slice(0, 57) + '…' : firstLine;
}

// 해당 월의 날짜에 엔트리가 있는지 확인
function getEntryDatesInMonth(entries: JournalEntry[], year: number, month: number): Set<number> {
  const set = new Set<number>();
  entries.forEach((e) => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      set.add(d.getDate());
    }
  });
  return set;
}

// ── ArchiveView ────────────────────────────────────────────────────────────

interface ArchiveViewProps {
  entries: JournalEntry[];
  loading: boolean;
  error: string;
  onUpdate: (id: string, payload: { content: string; mood: string; intensity: number; isPublic?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSwitchToWrite: () => void;
}

const ArchiveView = ({ entries, loading, error, onUpdate, onDelete, onSwitchToWrite }: ArchiveViewProps) => {
  const { locale, t } = useLocale();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 캘린더 상태 — 현재 표시 월 (YYYY, MM 0-indexed)
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  // entries 변경 시 선택된 항목이 없으면 최신(첫 번째) 항목 자동 선택
  useEffect(() => {
    if (entries.length > 0 && !selectedId) {
      setSelectedId(entries[0].id);
    }
  }, [entries]);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  // 캘린더용 데이터
  const entryDates = getEntryDatesInMonth(entries, calYear, calMonth);
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  // 캘린더에서 날짜 클릭 → 해당 날짜의 첫 엔트리 선택
  const handleCalDateClick = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const found = entries.find((e) => e.date === dateStr);
    if (found) setSelectedId(found.id);
  };

  // Recent entries — 최근 10개
  const recentEntries = entries.slice(0, 10);

  // 첫 엔트리 날짜 (아카이브 시작일)
  const firstEntryDate = entries.length > 0
    ? new Date(entries[entries.length - 1].date).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' })
    : null;

  if (loading) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-32">
      <LoadingSpinner />
    </motion.div>
  );
  if (error) return <ErrorMessage message={error} />;
  if (entries.length === 0) return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-32 text-center"
    >
      <p className="font-serif text-2xl font-light mb-3 italic" style={{ color: 'var(--color-butter-muted)' }}>
        {t('archive.nothing')}
      </p>
      <p className="text-[13px] font-light mb-6" style={{ color: 'var(--color-butter-muted)' }}>
        {t('archive.nothing.sub')}
      </p>
      <button
        onClick={onSwitchToWrite}
        className="flex items-center gap-2 px-6 py-2.5 bg-butter-primary text-white text-[11px] font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all"
        style={{ borderRadius: '2px' }}
      >
        {t('archive.new')}
      </button>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col lg:flex-row gap-0 lg:gap-16 xl:gap-20"
    >
      {/* ══════════════════════════════════════════════
          LEFT — 엔트리 상세 뷰
          ══════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0">
        {selectedEntry ? (
          <AnimatePresence mode="wait">
            <ArchiveDetailView
              key={selectedEntry.id}
              entry={selectedEntry}
              allEntries={entries}
              onUpdate={onUpdate}
              onDelete={async (id) => {
                await onDelete(id).catch(() => {});
                setSelectedId(entries.find((e) => e.id !== id)?.id ?? null);
              }}
              onSwitchToWrite={onSwitchToWrite}
            />
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-[13px] italic font-light" style={{ color: 'var(--color-butter-muted)' }}>
              {t('archive.select')}
            </p>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════
          RIGHT — 캘린더 + 엔트리 목록
          ══════════════════════════════════════════════ */}
      <aside
        className="lg:w-72 xl:w-80 shrink-0 mt-10 lg:mt-0"
        style={{ borderLeft: '1px solid var(--color-butter-rule)', paddingLeft: '2rem' }}
      >
        {/* 모바일 전용 상단 구분선 */}
        <div className="block lg:hidden mb-8" style={{ height: '1px', background: 'var(--color-butter-rule)' }} />

        {/* ── 캘린더 ── */}
        <div className="mb-8">
          {/* 캘린더 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-serif text-[1.1rem] font-light" style={{ color: 'var(--color-butter-text)' }}>
              {new Date(calYear, calMonth).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
                  else setCalMonth(m => m - 1);
                }}
                className="w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-butter-muted)', borderRadius: '2px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-butter-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-butter-muted)')}
              >
                <ArrowLeft size={13} />
              </button>
              <button
                onClick={() => {
                  if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
                  else setCalMonth(m => m + 1);
                }}
                className="w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: 'var(--color-butter-muted)', borderRadius: '2px' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-butter-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-butter-muted)')}
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-2">
            {[t('archive.cal.su'), t('archive.cal.mo'), t('archive.cal.tu'), t('archive.cal.we'), t('archive.cal.th'), t('archive.cal.fr'), t('archive.cal.sa')].map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-medium uppercase tracking-[0.08em] py-1"
                style={{ color: 'var(--color-butter-muted)', opacity: 0.65 }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-y-1">
            {/* 첫 주 빈 칸 */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {/* 날짜 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasEntry = entryDates.has(day);
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedEntry?.date === dateStr;
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={day}
                  onClick={() => hasEntry && handleCalDateClick(day)}
                  disabled={!hasEntry}
                  className="relative flex flex-col items-center justify-center py-1 transition-all"
                  style={{ cursor: hasEntry ? 'pointer' : 'default' }}
                >
                  <span
                    className="w-7 h-7 flex items-center justify-center text-[12px] font-medium transition-all"
                    style={{
                      borderRadius: '50%',
                      background: isSelected
                        ? 'var(--color-butter-primary)'
                        : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : hasEntry
                        ? 'var(--color-butter-text)'
                        : 'var(--color-butter-muted)',
                      opacity: hasEntry ? 1 : 0.3,
                      fontWeight: isToday && !isSelected ? 600 : undefined,
                    }}
                  >
                    {day}
                  </span>
                  {/* 엔트리 있는 날 도트 */}
                  {hasEntry && !isSelected && (
                    <span
                      className="absolute bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: 'var(--color-butter-primary)', opacity: 0.6 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── [1] Accumulation text ── */}
        {entries.length >= 3 && (
          <p
            className="font-serif italic font-light mb-6"
            style={{
              fontSize: '11px',
              lineHeight: 1.7,
              color: 'var(--color-butter-muted)',
              opacity: 0.6,
            }}
          >
            {locale === 'ko'
              ? `${entries.length}개의 기록이 조용히 쌓이고 있습니다.`
              : `You've been quietly building a record of your reading.`}
          </p>
        )}

        {/* ── {t('archive.recent')} ── */}
        <div className="mb-6">
          <p
            className="text-[9px] uppercase tracking-[0.25em] font-semibold mb-4"
            style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
          >
            Recent Entries
          </p>
          <div className="space-y-1">
            {recentEntries.map((entry) => {
              const isSelected = entry.id === selectedId;
              const displayEmotions = (entry.emotions ?? []).length > 0
                ? entry.emotions.slice(0, 2)
                : entry.mood ? [entry.mood] : [];
              // 날짜 포맷 — "Sep 09" 스타일
              const d = new Date(entry.date);
              const dateLabel = d.toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: '2-digit' });

              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedId(entry.id)}
                  className="w-full text-left py-3 px-3 transition-all group"
                  style={{
                    borderRadius: '2px',
                    background: isSelected
                      ? 'var(--color-butter-surface)'
                      : 'transparent',
                    borderLeft: isSelected
                      ? '2px solid var(--color-butter-primary)'
                      : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = 'var(--color-butter-faint)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* 제목 */}
                      <p
                        className="text-[13px] font-serif font-light leading-snug line-clamp-1 transition-colors mb-1"
                        style={{
                          color: isSelected ? 'var(--color-butter-text)' : 'var(--color-butter-text)',
                          opacity: isSelected ? 1 : 0.85,
                        }}
                      >
                        {entry.bookTitle ?? getEntrySubtitle(entry) ?? t('archive.free')}
                      </p>
                      {/* 감정 태그들 */}
                      {displayEmotions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {displayEmotions.map((em) => (
                            <span
                              key={em}
                              className="text-[9px] uppercase tracking-[0.1em] font-semibold"
                              style={{ color: 'var(--color-butter-muted)', opacity: 0.7 }}
                            >
                              {em}
                            </span>
                          ))}
                          {isSelected && (
                            <span
                              className="text-[9px] uppercase tracking-[0.1em] font-semibold"
                              style={{ color: 'var(--color-butter-primary)' }}
                            >
                              · {t('archive.today')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* 날짜 */}
                    <span
                      className="text-[10px] font-medium shrink-0 mt-0.5"
                      style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                    >
                      {dateLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── New Journal Entry CTA ── */}
        <div>
          <button
            onClick={onSwitchToWrite}
            className="w-full flex items-center justify-center gap-2 py-3 font-medium uppercase tracking-[0.14em] text-[11px] hover:brightness-110 transition-all text-white bg-butter-primary"
            style={{ borderRadius: '2px' }}
          >
            + New Journal Entry
          </button>
          {firstEntryDate && (
            <p
              className="text-center text-[11px] font-light italic mt-3"
              style={{ color: 'var(--color-butter-muted)', opacity: 0.65 }}
            >
              {entries.length} {t('archive.entries')} {t('archive.since')} {firstEntryDate}
            </p>
          )}

          {/* ── [3] Soft CTA ── */}
          <p
            className="text-center font-serif italic font-light mt-4"
            style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
          >
            {locale === 'ko' ? '짧은 메모도 괜찮습니다.' : 'Even a small note counts.'}
          </p>
        </div>
      </aside>
    </motion.div>
  );
};

// ── ArchiveDetailView ──────────────────────────────────────────────────────

interface ArchiveDetailViewProps {
  entry: JournalEntry;
  allEntries: JournalEntry[];
  onUpdate: (id: string, payload: { content: string; mood: string; intensity: number; isPublic?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSwitchToWrite: () => void;
}

const ArchiveDetailView = ({ entry, allEntries, onUpdate, onDelete, onSwitchToWrite }: ArchiveDetailViewProps) => {
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [editMood, setEditMood] = useState(entry.mood || '');
  const [confirmPublicOpen, setConfirmPublicOpen] = useState(false);
  const [pendingPublic, setPendingPublic] = useState<boolean | null>(null);
  const [editIntensity, setEditIntensity] = useState(entry.intensity);

  // [4] 이 책에 연결된 엔트리 수
  const bookEntryCount = entry.bookId
    ? allEntries.filter((e) => e.bookId === entry.bookId && e.id !== entry.id).length
    : 0;

  // [2] 약 한 달 전 비슷한 감정의 엔트리 찾기
  const entryDate = new Date(entry.date);
  const oneMonthAgo = new Date(entryDate);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const twoMonthsAgo = new Date(entryDate);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  const currentEmotions = new Set(entry.emotions ?? []);
  const similarEntry = allEntries.find((e) => {
    if (e.id === entry.id) return false;
    const d = new Date(e.date);
    if (d > twoMonthsAgo && d < oneMonthAgo) {
      // 감정이 겹치거나, 같은 책이거나
      const sharedEmotion = (e.emotions ?? []).some((em) => currentEmotions.has(em));
      const sameBook = e.bookId && e.bookId === entry.bookId;
      return sharedEmotion || sameBook;
    }
    return false;
  }) ?? null;

  useEffect(() => {
    setEditContent(entry.content);
    setEditMood(entry.mood || '');
    setEditIntensity(entry.intensity);
    setEditing(false);
  }, [entry.id]);

  const sections = entry.content
    .split(/\n\n(?=\[)/)
    .map((block) => {
      const match = block.match(/^\[(.+?)\]\n([\s\S]+)$/);
      return match ? { label: match[1], text: match[2] } : null;
    })
    .filter(Boolean) as { label: string; text: string }[];

  const displayEmotions = (entry.emotions ?? []).length > 0
    ? entry.emotions
    : entry.mood ? [entry.mood] : [];

  const subtitle = getEntrySubtitle(entry);

  const handleUpdate = async () => {
    try {
      await onUpdate(entry.id, { content: editContent, mood: editMood, intensity: editIntensity });
      setEditing(false);
    } catch (e: any) {
      alert(t('archive.update.fail') + e.message);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ── 헤더 영역 ── */}
      <header className="mb-12">

        {/* 계절 레이블 */}
        <p
          className="text-[10px] uppercase tracking-[0.3em] font-medium mb-5"
          style={{ color: 'var(--color-butter-muted)', opacity: 0.55 }}
        >
          {getSeasonLabel(entry.date, t)}
        </p>

        {/* 책 커버 + 제목 — 책이 있을 때 */}
        {entry.bookTitle ? (
          <div className="flex items-start gap-6 mb-6">
            {entry.bookCover && (
              <div
                className="shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  width: '80px',
                  aspectRatio: '2/3',
                  borderRadius: '2px',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
                }}
                onClick={() => entry.bookId && navigate(`/explore/${entry.bookId}`)}
              >
                <BookCoverImage
                  src={entry.bookCover}
                  alt={entry.bookTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* 제목 + 저자 — 단일 블록으로 */}
            <div className="flex flex-col justify-center" style={{ paddingTop: '0.25rem' }}>
              <h1
                className={`font-serif leading-[1.12] tracking-tight mb-1.5 ${entry.bookId ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                style={{
                  fontSize: 'clamp(1.85rem, 3.2vw, 2.6rem)',
                  fontWeight: 300,
                  color: 'var(--color-butter-text)',
                }}
                onClick={() => entry.bookId && navigate(`/explore/${entry.bookId}`)}
              >
                {entry.bookTitle}
              </h1>
              {entry.bookAuthor && (
                <p
                  className="font-serif italic font-light"
                  style={{ fontSize: '1rem', color: 'var(--color-butter-muted)', opacity: 0.75 }}
                >
                  {t('common.by')} {entry.bookAuthor}
                </p>
              )}
              {/* [4] Book-level accumulation */}
              {bookEntryCount > 0 && (
                <p
                  className="font-light mt-2"
                  style={{ fontSize: '11px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
                >
                  {locale === 'ko'
                    ? `이 책에 대한 메모 ${bookEntryCount}개 더`
                    : `${bookEntryCount} more ${bookEntryCount === 1 ? 'note' : 'notes'} for this book`}
                </p>
              )}
            </div>
          </div>
        ) : (
          /* 책이 없을 때 — 첫 줄을 제목처럼 */
          <h1
            className="font-serif font-light leading-[1.15] tracking-tight mb-4"
            style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', color: 'var(--color-butter-text)' }}
          >
            {subtitle || t('archive.free')}
          </h1>
        )}

        {/* 서브타이틀 — 책 있을 때만 */}
        {entry.bookTitle && subtitle && (
          <p
            className="font-serif italic font-light mb-6"
            style={{ fontSize: '1rem', color: 'var(--color-butter-muted)', opacity: 0.7 }}
          >
            {subtitle}
          </p>
        )}

        {/* 감정 pill들 */}
        {displayEmotions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-1">
            {displayEmotions.map((em) => (
              <span
                key={em}
                className="text-[10px] uppercase tracking-[0.14em] font-semibold px-3 py-1"
                style={{
                  background: 'var(--color-butter-accent)',
                  color: 'var(--color-butter-primary)',
                  borderRadius: '2px',
                }}
              >
                {em}
              </span>
            ))}
          </div>
        )}
      </header>

      {editing ? (
        <div className="flex flex-col gap-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full text-[15px] font-serif leading-relaxed resize-none focus:outline-none min-h-[240px] p-4"
            style={{
              background: 'var(--color-butter-surface)',
              border: '1px solid var(--color-butter-rule)',
              borderRadius: '2px',
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] transition-all"
              style={{
                color: 'var(--color-butter-muted)',
                border: '1px solid var(--color-butter-rule)',
                borderRadius: '2px',
              }}
            >
              <X size={12} /> {t('archive.cancel')}
            </button>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-1 px-4 py-2 bg-butter-primary text-white text-[11px] font-medium uppercase tracking-[0.14em] hover:brightness-110 transition-all"
              style={{ borderRadius: '2px' }}
            >
              <Check size={12} /> {t('archive.save')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── 하이라이트 인용 — 페이지의 감정적 앵커 ── */}
          {entry.highlight && (
            <blockquote
              style={{
                borderLeft: '2px solid var(--color-butter-primary)',
                paddingLeft: '1.75rem',
                marginBottom: '3rem',
                marginTop: '0.5rem',
                opacity: 0.88,
              }}
            >
              <p
                className="font-serif italic"
                style={{
                  fontSize: 'clamp(1.2rem, 2.2vw, 1.5rem)',
                  lineHeight: 1.95,
                  color: 'var(--color-butter-text)',
                }}
              >
                "{entry.highlight}"
              </p>
            </blockquote>
          )}

          {/* ── 본문 ── */}
          <div className="mb-14">
            {sections.length > 0 ? (
              <div className="space-y-5">
                {sections.map((s) => (
                  <p
                    key={s.label}
                    className="font-serif font-light"
                    style={{
                      fontSize: '1.0125rem',
                      lineHeight: 1.75,
                      color: 'var(--color-butter-text)',
                      opacity: 0.84,
                    }}
                  >
                    {s.text}
                  </p>
                ))}
              </div>
            ) : (
              <p
                className="font-serif font-light"
                style={{
                  fontSize: '1.0125rem',
                  lineHeight: 1.75,
                  color: 'var(--color-butter-text)',
                  opacity: 0.84,
                }}
              >
                {entry.content}
              </p>
            )}
          </div>

          {/* ── [2] Reflection revisit link ── */}
          {similarEntry && (
            <p
              className="font-serif italic font-light mb-10 -mt-6"
              style={{ fontSize: '12px', color: 'var(--color-butter-muted)', opacity: 0.45 }}
            >
              {locale === 'ko' ? '한 달 전에도 비슷한 내용을 썼습니다 —' : 'From a month ago, you wrote something similar —'}{' '}
              <button
                onClick={() => {/* 외부에서 selectedId를 바꿀 수 없으므로 향후 확장용 no-op */}}
                className="font-serif italic underline underline-offset-2 transition-opacity"
                style={{
                  fontSize: '12px',
                  color: 'var(--color-butter-primary)',
                  opacity: 0.6,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'default',
                  textDecorationColor: 'var(--color-butter-primary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
              >
                {similarEntry.bookTitle ?? getEntrySubtitle(similarEntry) ?? (locale === 'ko' ? '그 메모' : 'that note')}
              </button>
            </p>
          )}

          {/* ── 하단 메타 + 액션 ── */}
          <footer
            className="flex items-center justify-between pt-8"
            style={{ borderTop: '1px solid var(--color-butter-rule)' }}
          >
            {/* 좌: Edit / Delete / Share / 공개 토글 */}
            <div className="flex items-center gap-5">
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-primary)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-muted)'; }}
              >
                <Pencil size={12} /> {t('archive.edit')}
              </button>
              <button
                onClick={() => onDelete(entry.id).catch((e) => alert(e.message))}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                style={{ color: 'var(--color-butter-muted)', opacity: 0.6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.6'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-muted)'; }}
              >
                <Trash2 size={12} /> {t('archive.delete')}
              </button>
              <button
                onClick={() => setLinkOpen(p => !p)}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                style={{ color: linkOpen ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)', opacity: linkOpen ? 1 : 0.6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-primary)'; }}
                onMouseLeave={(e) => { if (!linkOpen) { (e.currentTarget as HTMLElement).style.opacity = '0.6'; (e.currentTarget as HTMLElement).style.color = 'var(--color-butter-muted)'; }}}
              >
                <Share2 size={12} /> {locale === 'ko' ? '공유하기' : 'Share'}
              </button>
              {/* 공개/비공개 토글 */}
              <button
                onClick={() => {
                  setPendingPublic(!entry.isPublic);
                  setConfirmPublicOpen(true);
                }}
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
                style={{ color: entry.isPublic ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)', opacity: entry.isPublic ? 1 : 0.6 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={(e) => { if (!entry.isPublic) (e.currentTarget as HTMLElement).style.opacity = '0.6'; }}
                title={entry.isPublic
                  ? (locale === 'ko' ? '클릭하면 비공개로 전환' : 'Click to make private')
                  : (locale === 'ko' ? '클릭하면 공개로 전환' : 'Click to make public')}
              >
                {entry.isPublic
                  ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>{locale === 'ko' ? '공개' : 'Public'}</>
                  : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>{locale === 'ko' ? '비공개' : 'Private'}</>
                }
              </button>

              {/* 공개/비공개 확인 모달 */}
              <AnimatePresence>
                {confirmPublicOpen && pendingPublic !== null && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 z-50"
                      style={{ background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(2px)' }}
                      onClick={() => setConfirmPublicOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="fixed z-50"
                      style={{
                        background: 'var(--color-butter-surface)',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
                        width: 'min(360px, calc(100vw - 2rem))',
                        top: 0, left: 0, right: 0, bottom: 0,
                        margin: 'auto',
                        height: 'fit-content',
                        padding: '2rem',
                        borderRadius: '3px',
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.28em] font-semibold mb-3" style={{ color: 'var(--color-butter-primary)', opacity: 0.75 }}>
                        {pendingPublic
                          ? (locale === 'ko' ? '공개로 전환' : 'Make public')
                          : (locale === 'ko' ? '비공개로 전환' : 'Make private')}
                      </p>
                      <p className="font-serif font-light leading-relaxed mb-8" style={{ fontSize: '15px', color: 'var(--color-butter-text)' }}>
                        {pendingPublic
                          ? (locale === 'ko' ? '홈과 책 페이지 피드에 노출됩니다.' : 'This entry will appear in home and book page feeds.')
                          : (locale === 'ko' ? '피드에서 더 이상 표시되지 않습니다.' : 'This entry will no longer appear in any feeds.')}
                      </p>
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => setConfirmPublicOpen(false)}
                          className="font-light transition-opacity hover:opacity-50"
                          style={{ fontSize: '11px', letterSpacing: '0.05em', color: 'var(--color-butter-muted)' }}
                        >
                          {locale === 'ko' ? '취소' : 'Cancel'}
                        </button>
                        <button
                          onClick={() => {
                            onUpdate(entry.id, { content: entry.content, mood: entry.mood ?? '', intensity: entry.intensity, isPublic: pendingPublic! }).catch((e) => alert(e.message));
                            setConfirmPublicOpen(false);
                            setPendingPublic(null);
                          }}
                          className="font-medium transition-all hover:brightness-110"
                          style={{
                            fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
                            background: 'var(--color-butter-primary)',
                            color: 'var(--color-butter-bg)',
                            padding: '0.5rem 1.25rem',
                            borderRadius: '2px',
                          }}
                        >
                          {locale === 'ko' ? '확인' : 'Confirm'}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 우: 날짜 — quiet context note */}
            <p
              className="font-light italic"
              style={{
                fontSize: '11px',
                letterSpacing: '0.02em',
                color: 'var(--color-butter-muted)',
                opacity: 0.55,
              }}
            >
              {new Date(entry.date).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </footer>

          {/* 링크 패널 — BookDetail과 동일한 패턴 */}
          <AnimatePresence>
            {linkOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="pt-4 pb-1">
                  <p
                    className="text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1"
                    style={{ color: 'var(--color-butter-muted)' }}
                  >
                    <LinkIcon size={9} /> {locale === 'ko' ? '공유 링크' : 'Share Link'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`${window.location.origin}/share/journal/${entry.id}`}
                      className="flex-1 rounded px-2.5 py-1.5 text-[11px] font-mono truncate focus:outline-none"
                      style={{ background: 'var(--color-butter-surface)', color: 'var(--color-butter-muted)', border: 'none' }}
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/share/journal/${entry.id}`)
                          .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
                      }}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded text-[11px] font-medium transition-all text-white"
                      style={{ background: copied ? '#22c55e' : 'var(--color-butter-primary)' }}
                    >
                      {copied
                        ? <><Check size={10} /> {locale === 'ko' ? '완료' : 'Done'}</>
                        : <><Copy size={10} /> {locale === 'ko' ? '복사' : 'Copy'}</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.article>
  );
};
