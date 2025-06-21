/*
  Warnings:

  - You are about to drop the column `verifierHash` on the `PasswordResetToken` table. All the data in the column will be lost.
  - Added the required column `token` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PasswordResetToken_verifierHash_key";

-- AlterTable
ALTER TABLE "PasswordResetToken" DROP COLUMN "verifierHash",
ADD COLUMN     "token" TEXT NOT NULL;
