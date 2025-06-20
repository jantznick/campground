/*
  Warnings:

  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "hierarchyDisplayNames" JSONB;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status";
