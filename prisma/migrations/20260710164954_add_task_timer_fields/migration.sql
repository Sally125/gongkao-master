-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT '中',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "deadline" TEXT,
    "subjectTag" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "startedAt" DATETIME,
    "pausedAt" DATETIME,
    "totalPausedSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tasks" ("createdAt", "deadline", "estimatedMinutes", "id", "imageUrl", "priority", "sortOrder", "source", "status", "subjectTag", "title", "updatedAt", "userId") SELECT "createdAt", "deadline", "estimatedMinutes", "id", "imageUrl", "priority", "sortOrder", "source", "status", "subjectTag", "title", "updatedAt", "userId" FROM "tasks";
DROP TABLE "tasks";
ALTER TABLE "new_tasks" RENAME TO "tasks";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
