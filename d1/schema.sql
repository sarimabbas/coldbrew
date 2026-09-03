PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "accessToken" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Cask" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "name" TEXT,
  "homepage" TEXT,
  "logoUrl" TEXT,
  "ranking" INTEGER,
  "installCount" TEXT,
  "installPercent" TEXT
);

CREATE TABLE IF NOT EXISTS "_CaskToSession" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  PRIMARY KEY ("A", "B"),
  FOREIGN KEY ("A") REFERENCES "Cask"("id") ON DELETE CASCADE,
  FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Cask_ranking_idx" ON "Cask"("ranking");
CREATE INDEX IF NOT EXISTS "Cask_name_idx" ON "Cask"("name");
CREATE INDEX IF NOT EXISTS "CaskToSession_B_idx" ON "_CaskToSession"("B");
