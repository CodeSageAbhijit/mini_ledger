ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "email" TEXT;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
