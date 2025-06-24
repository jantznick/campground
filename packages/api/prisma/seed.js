import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to create a specified number of projects for a team
const createProjects = (teamName, count) => {
	const projects = [];
	for (let i = 1; i <= count; i++) {
		projects.push({ name: `${teamName} Project ${i}` });
	}
	return projects;
};

// Helper function to create teams and their projects
const createTeams = (companyName, teamNames) => {
	const teams = {};
	for (const teamName of teamNames) {
		teams[teamName] = {
			name: teamName,
			projects: {
				create: createProjects(teamName, 3),
			},
		};
	}
	return Object.values(teams);
};

async function main() {
	console.log('--- Start seeding ---');

	// 1. Clean up existing data in the correct order
	console.log('Cleaning up previous data...');
	await prisma.membership.deleteMany({});
	await prisma.invitation.deleteMany({});
	await prisma.project.deleteMany({});
	await prisma.team.deleteMany({});
	await prisma.domain.deleteMany({});
	await prisma.oidcConnection.deleteMany({});
	await prisma.company.deleteMany({});
	await prisma.organization.deleteMany({});
	await prisma.user.deleteMany({});
	console.log('Previous data cleaned.');

	// 2. Create Users
	console.log('Creating users...');
	const users = {};
	const userEmails = [
		'global_admin@test.com',
		'techcorp_reader@test.com',
		'cloud_services_admin@test.com',
		'analytics_admin@test.com',
		'cross_company_manager@test.com',
		'compute_editor@test.com',
		'storage_reader@test.com',
		'devops_admin@test.com',
		'solodev_admin@test.com',
		'main_app_admin@test.com',
		'side_project_admin@test.com',
		'multirole_dev@test.com',
		'pixelperfect_admin@test.com',
		'web_ux_admin@test.com',
		'lead_designer@test.com',
		'external_auditor@test.com',
		'guest_client@test.com',
		'pending_user@test.com',
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
	console.log('Users created.');

	// 3. Create Hierarchies
	console.log('Creating TechCorp (Enterprise) hierarchy...');
	const techCorp = await prisma.organization.create({
		data: {
			name: 'TechCorp',
			accountType: 'ENTERPRISE',
			companies: {
				create: [
					{
						name: 'Cloud Services',
						teams: {
							create: createTeams('Cloud Services', ['Compute', 'Storage', 'DevOps']),
						},
					},
					{
						name: 'Analytics Inc.',
						teams: {
							create: createTeams('Analytics Inc.', ['Data Platform', 'BI', 'Data Engineering']),
						},
					},
				],
			},
		},
	});
	console.log('TechCorp hierarchy created.');

	console.log('Creating SoloDev (Standard) hierarchy...');
	const soloDevOrg = await prisma.organization.create({
		data: {
			name: 'SoloDev',
			accountType: 'STANDARD',
			companies: {
				create: [
					{
						name: 'Main App',
						teams: { create: createTeams('Main App', ['Mobile', 'Web', 'Backend']) },
					},
					{
						name: 'Side Project',
						teams: { create: createTeams('Side Project', ['Game Dev', 'Marketing Site', 'API']) },
					},
				],
			},
		},
	});
	console.log('SoloDev hierarchy created.');

	console.log('Creating PixelPerfect Designs (Pro) hierarchy...');
	const pixelPerfectOrg = await prisma.organization.create({
		data: {
			name: 'PixelPerfect Designs',
			accountType: 'PRO',
			companies: {
				create: [
					{
						name: 'Web UX',
						teams: { create: createTeams('Web UX', ['E-Commerce', 'Portfolio', 'Landing Pages']) },
					},
					{
						name: 'Mobile UI',
						teams: { create: createTeams('Mobile UI', ['iOS', 'Android', 'Design Systems']) },
					},
				],
			},
		},
	});
	console.log('PixelPerfect Designs hierarchy created.');

	// 4. Fetch created entities to assign memberships
	console.log('Fetching created entities for permission assignment...');
	const allOrgs = await prisma.organization.findMany({ include: { companies: { include: { teams: { include: { projects: true } } } } } });
	const orgMap = Object.fromEntries(allOrgs.map(o => [o.name, o]));
	const companyMap = Object.fromEntries(allOrgs.flatMap(o => o.companies).map(c => [`${o.name}-${c.name}`, c]));
	const teamMap = Object.fromEntries(allOrgs.flatMap(o => o.companies.flatMap(c => c.teams)).map(t => [`${t.name}`, t]));
	const projectMap = Object.fromEntries(allOrgs.flatMap(o => o.companies.flatMap(c => c.teams.flatMap(t => t.projects))).map(p => [`${p.name}`, p]));

	// 5. Create Memberships (Permissions)
	console.log('Assigning roles and permissions...');
	await prisma.membership.createMany({
		data: [
			// --- TechCorp Users ---
			{ userId: users['global_admin@test.com'].id, organizationId: orgMap['TechCorp'].id, role: 'ADMIN' },
			{ userId: users['techcorp_reader@test.com'].id, organizationId: orgMap['TechCorp'].id, role: 'READER' },
			{ userId: users['cloud_services_admin@test.com'].id, companyId: companyMap['TechCorp-Cloud Services'].id, role: 'ADMIN' },
			{ userId: users['analytics_admin@test.com'].id, companyId: companyMap['TechCorp-Analytics Inc.'].id, role: 'ADMIN' },
			{ userId: users['devops_admin@test.com'].id, teamId: teamMap['DevOps'].id, role: 'ADMIN' },
			{ userId: users['compute_editor@test.com'].id, teamId: teamMap['Compute'].id, role: 'EDITOR' },
			{ userId: users['storage_reader@test.com'].id, teamId: teamMap['Storage'].id, role: 'READER' },
			{ userId: users['cross_company_manager@test.com'].id, teamId: teamMap['Compute'].id, role: 'EDITOR' },
			{ userId: users['cross_company_manager@test.com'].id, teamId: teamMap['BI'].id, role: 'READER' },
			{ userId: users['cross_company_manager@test.com'].id, projectId: projectMap['Data Platform Project 1'].id, role: 'ADMIN' },

			// --- SoloDev Users ---
			{ userId: users['solodev_admin@test.com'].id, organizationId: orgMap['SoloDev'].id, role: 'ADMIN' },
			{ userId: users['main_app_admin@test.com'].id, companyId: companyMap['SoloDev-Main App'].id, role: 'ADMIN' },
			{ userId: users['side_project_admin@test.com'].id, companyId: companyMap['SoloDev-Side Project'].id, role: 'ADMIN' },
			{ userId: users['multirole_dev@test.com'].id, teamId: teamMap['Mobile'].id, role: 'EDITOR' },
			{ userId: users['multirole_dev@test.com'].id, teamId: teamMap['Game Dev'].id, role: 'EDITOR' },
			{ userId: users['multirole_dev@test.com'].id, projectId: projectMap['API Project 2'].id, role: 'READER' },

			// --- PixelPerfect Users ---
			{ userId: users['pixelperfect_admin@test.com'].id, organizationId: orgMap['PixelPerfect Designs'].id, role: 'ADMIN' },
			{ userId: users['web_ux_admin@test.com'].id, companyId: companyMap['PixelPerfect Designs-Web UX'].id, role: 'ADMIN' },
			{ userId: users['lead_designer@test.com'].id, teamId: teamMap['E-Commerce'].id, role: 'ADMIN' }, // Admin of team
			{ userId: users['lead_designer@test.com'].id, companyId: companyMap['PixelPerfect Designs-Web UX'].id, role: 'READER' }, // But just a reader of the company
			{ userId: users['lead_designer@test.com'].id, projectId: projectMap['iOS Project 1'].id, role: 'EDITOR' },
			
			// --- Cross-Org Users ---
			{ userId: users['external_auditor@test.com'].id, companyId: companyMap['TechCorp-Analytics Inc.'].id, role: 'READER' },
			{ userId: users['external_auditor@test.com'].id, companyId: companyMap['PixelPerfect Designs-Mobile UI'].id, role: 'READER' },
			{ userId: users['guest_client@test.com'].id, projectId: projectMap['E-Commerce Project 1'].id, role: 'READER' },
			
			// --- Direct Project-level Roles to satisfy requirements ---
			{ userId: users['global_admin@test.com'].id, projectId: projectMap['DevOps Project 3'].id, role: 'EDITOR' },
			{ userId: users['solodev_admin@test.com'].id, projectId: projectMap['Marketing Site Project 2'].id, role: 'EDITOR' },
			{ userId: users['pixelperfect_admin@test.com'].id, projectId: projectMap['Design Systems Project 1'].id, role: 'EDITOR' },

			// --- Pending User ---
			{ userId: users['pending_user@test.com'].id, teamId: teamMap['Web'].id, role: 'READER' },
		],
	});

	// 6. Create pending user invitation
	await prisma.invitation.create({
		data: {
			userId: users['pending_user@test.com'].id,
			email: 'pending_user@test.com',
			token: 'test-token-12345',
			expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
		},
	});

	console.log('Roles and permissions assigned.');
	console.log('--- Seeding finished successfully! ---');
}

main()
	.catch(e => {
		console.error('An error occurred during seeding:');
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	}); 