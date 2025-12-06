-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PhoneOTP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneOTP_userId_idx" ON "PhoneOTP"("userId");

-- AddForeignKey
ALTER TABLE "PhoneOTP" ADD CONSTRAINT "PhoneOTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
