-- CreateTable
CREATE TABLE "AutoJoinDomain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "organizationId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoJoinDomain_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutoJoinDomain_domain_organizationId_key" ON "AutoJoinDomain"("domain", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AutoJoinDomain_domain_companyId_key" ON "AutoJoinDomain"("domain", "companyId");

-- AddForeignKey
ALTER TABLE "AutoJoinDomain" ADD CONSTRAINT "AutoJoinDomain_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoJoinDomain" ADD CONSTRAINT "AutoJoinDomain_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
