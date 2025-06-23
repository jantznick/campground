import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Clean up existing data
    await prisma.membership.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Cleaned up previous data.');

    // --- Create Users ---
    const users = {};
    const userEmails = [
        'globaladmin@test.com',
        'companya_admin@test.com',
        'teamb1_editor@test.com',
        'projecta21_reader@test.com',
        'solodev_admin@test.com',
        'pending_user@test.com',
        'consultant@test.com',
    ];

    const password = await bcrypt.hash('password123', 10);

    for (const email of userEmails) {
        users[email] = await prisma.user.create({
            data: {
                email,
                password: email === 'pending_user@test.com' ? null : password,
                emailVerified: true,
            },
        });
    }
    console.log('Created users.');
    
    // --- Create TechCorp (Enterprise) Hierarchy ---
    const techCorp = await prisma.organization.create({
        data: {
            name: 'TechCorp',
            accountType: 'ENTERPRISE',
            description: 'An enterprise-level technology corporation.',
            memberships: {
                create: { userId: users['globaladmin@test.com'].id, role: 'ADMIN' },
            },
        },
    });

    const companyA = await prisma.company.create({
        data: {
            name: 'Cloud Services',
            organizationId: techCorp.id,
            memberships: {
                create: { userId: users['companya_admin@test.com'].id, role: 'ADMIN' },
            },
        },
    });

    const teamA1 = await prisma.team.create({
        data: { name: 'Compute', companyId: companyA.id },
    });
    await prisma.project.create({
        data: { name: 'Serverless V2', teamId: teamA1.id },
    });

    const teamA2 = await prisma.team.create({
        data: { name: 'Storage', companyId: companyA.id },
    });
    const projectA2_1 = await prisma.project.create({
        data: { 
            name: 'BlobStore', 
            teamId: teamA2.id,
            memberships: {
                create: { userId: users['projecta21_reader@test.com'].id, role: 'READER' },
            }
        },
    });
    
    const companyB = await prisma.company.create({
        data: { name: 'Analytics Inc.', organizationId: techCorp.id },
    });
    const teamB1 = await prisma.team.create({
        data: { 
            name: 'Data Platform', 
            companyId: companyB.id,
            memberships: {
                create: { userId: users['teamb1_editor@test.com'].id, role: 'EDITOR' },
            }
        },
    });
    await prisma.project.create({
        data: { name: 'Query Engine', teamId: teamB1.id },
    });
    console.log('Created TechCorp hierarchy.');

    // --- Create SoloDev (Standard) Hierarchy ---
    const soloDevOrg = await prisma.organization.create({
        data: {
            name: 'SoloDev',
            accountType: 'STANDARD',
            description: 'A standard account for a solo developer.',
            memberships: {
                create: { userId: users['solodev_admin@test.com'].id, role: 'ADMIN' },
            }
        },
    });
    const companyC = await prisma.company.create({
        data: {
            name: 'Main App',
            organizationId: soloDevOrg.id
        }
    });

    // Set default company for the standard org
    await prisma.organization.update({
        where: { id: soloDevOrg.id },
        data: { defaultCompanyId: companyC.id }
    });

    const teamC1 = await prisma.team.create({
        data: { name: 'Mobile', companyId: companyC.id }
    });
    await prisma.project.create({
        data: { name: 'iOS App', teamId: teamC1.id }
    });
    
    // --- Create Pending User Invitation ---
     const teamC2 = await prisma.team.create({
        data: { 
            name: 'Web', 
            companyId: companyC.id,
            memberships: {
                create: { userId: users['pending_user@test.com'].id, role: 'READER' }
            }
        },
    });
    await prisma.invitation.create({
        data: {
            userId: users['pending_user@test.com'].id,
            email: 'pending_user@test.com',
            token: 'test-token-12345',
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
    });
    console.log('Created SoloDev hierarchy and pending invitation.');

    // --- Grant Implicit Parent Permissions ---
    // This logic needs to be manually replicated for the seed data
    // to match what the application does.

    // For consultant@test.com
    await prisma.membership.createMany({
        data: [
            // Reader of Company B in TechCorp
            { userId: users['consultant@test.com'].id, role: 'READER', companyId: companyB.id },
            // Editor of Team C1 in SoloDev
            { userId: users['consultant@test.com'].id, role: 'EDITOR', teamId: teamC1.id },
        ]
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 