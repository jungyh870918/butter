-- AlterTable: Reflection에 userId, journalEntryId 컬럼 추가
ALTER TABLE "Reflection"
  ADD COLUMN "userId"         TEXT,
  ADD COLUMN "journalEntryId" TEXT;

-- journalEntryId는 1:1 관계이므로 UNIQUE 제약
ALTER TABLE "Reflection"
  ADD CONSTRAINT "Reflection_journalEntryId_key" UNIQUE ("journalEntryId");

-- AddForeignKey: Reflection → User
ALTER TABLE "Reflection"
  ADD CONSTRAINT "Reflection_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Reflection → JournalEntry
ALTER TABLE "Reflection"
  ADD CONSTRAINT "Reflection_journalEntryId_fkey"
  FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
