-- CreateTable
CREATE TABLE "wrong_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "myAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "errorReason" TEXT NOT NULL,
    "questionModule" TEXT NOT NULL,
    "isGuessed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wrong_questions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
