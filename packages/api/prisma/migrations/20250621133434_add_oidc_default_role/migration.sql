/*
  Warnings:

  - You are about to drop the column `buttonText` on the `OIDCConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `clientID` on the `OIDCConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `OIDCConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `issuerURL` on the `OIDCConfiguration` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[issuer]` on the table `OIDCConfiguration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `authorizationUrl` to the `OIDCConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `OIDCConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issuer` to the `OIDCConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenUrl` to the `OIDCConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userInfoUrl` to the `OIDCConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OIDCConfiguration" DROP COLUMN "buttonText",
DROP COLUMN "clientID",
DROP COLUMN "isEnabled",
DROP COLUMN "issuerURL",
ADD COLUMN     "authorizationUrl" TEXT NOT NULL,
ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "defaultRole" "Role" NOT NULL DEFAULT 'READER',
ADD COLUMN     "issuer" TEXT NOT NULL,
ADD COLUMN     "tokenUrl" TEXT NOT NULL,
ADD COLUMN     "userInfoUrl" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OIDCConfiguration_issuer_key" ON "OIDCConfiguration"("issuer");
