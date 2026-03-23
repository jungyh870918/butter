-- AlterTable: JournalEntry에 book context, emotions[], highlight 추가
-- 모든 컬럼은 nullable / default 값 있음 → 기존 rows 영향 없음

ALTER TABLE "JournalEntry"
  ADD COLUMN "emotions"   TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN "bookId"     TEXT,
  ADD COLUMN "bookTitle"  TEXT,
  ADD COLUMN "bookAuthor" TEXT,
  ADD COLUMN "bookCover"  TEXT,
  ADD COLUMN "highlight"  TEXT;
