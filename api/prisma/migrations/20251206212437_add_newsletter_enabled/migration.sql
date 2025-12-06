-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'FLAGGED', 'BANNED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "newsletterEnabled" BOOLEAN NOT NULL DEFAULT true;
