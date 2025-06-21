/*
  Warnings:

  - A unique constraint covering the columns `[verificationCode]` on the table `AutoJoinDomain` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `verificationCode` to the `AutoJoinDomain` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED');

-- AlterTable
ALTER TABLE "AutoJoinDomain" ADD COLUMN     "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verificationCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AutoJoinDomain_verificationCode_key" ON "AutoJoinDomain"("verificationCode");
