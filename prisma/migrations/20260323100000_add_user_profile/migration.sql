-- CreateTable: UserProfile
-- User당 1개 row, upsert로 갱신됨. 기존 테이블 무변경.

CREATE TABLE "UserProfile" (
    "id"                   TEXT NOT NULL,
    "userId"               TEXT NOT NULL,
    "readingVolumeLevel"   TEXT NOT NULL DEFAULT 'low',
    "recentEmotions"       TEXT[] NOT NULL DEFAULT '{}',
    "dominantThemes"       TEXT[] NOT NULL DEFAULT '{}',
    "writingStyleSignal"   TEXT NOT NULL DEFAULT 'introspective',
    "notableFragments"     TEXT[] NOT NULL DEFAULT '{}',
    "recentBookCategories" TEXT[] NOT NULL DEFAULT '{}',
    "sourceEntryCount"     INTEGER NOT NULL DEFAULT 0,
    "profileVersion"       INTEGER NOT NULL DEFAULT 1,
    "promptVersion"        TEXT NOT NULL DEFAULT '1.0',
    "generatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- userId는 User당 1개만 허용
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");
