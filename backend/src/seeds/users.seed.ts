import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../modules/users/schema';
import { Role, Permission } from '../config/rbac';
import { Status } from '../types/common';
import { config } from '../config/env';

export interface SeedUser {
  email: string;
  password: string;
  role: Role;
  companyId?: mongoose.Types.ObjectId; // Optional for Admin/Government
  firstName: string;
  lastName: string;
  phone: string;
  customPermissions?: Permission[]; // Custom permissions for enhanced access
  status?: Status; // Optional status override
}

export const seedUsers = async (
  companyIds: Record<string, mongoose.Types.ObjectId>
): Promise<Record<string, mongoose.Types.ObjectId>> => {
  console.log('👥 Seeding Users...');

  const hashedPassword = await bcrypt.hash('Password123!', config.security.bcryptRounds);

  // Create a dummy company ID for Admin/Government (they still need companyId per schema)
  // In real scenario, Admin/Government might have their own company or null handling
  const adminCompanyId = companyIds['Buyer'] || new mongoose.Types.ObjectId();
  const govCompanyId = companyIds['Buyer'] || new mongoose.Types.ObjectId();

  const usersData: SeedUser[] = [
    // Admin User - Full system access
    {
      email: 'admin@trilink.ae',
      password: hashedPassword,
      role: Role.ADMIN,
      companyId: adminCompanyId,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+971-50-100-0001',
      status: Status.ACTIVE,
    },
    // Government User - Enhanced permissions for dispute resolution and analytics
    {
      email: 'gov@trilink.ae',
      password: hashedPassword,
      role: Role.GOVERNMENT,
      companyId: govCompanyId,
      firstName: 'Mariam',
      lastName: 'Al-Ketbi',
      phone: '+971-50-200-0002',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.RESOLVE_DISPUTE,
        Permission.ASSIGN_DISPUTE,
        Permission.CLOSE_DISPUTE,
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA,
      ],
    },
    // Buyer Users - Enhanced with payment approval permissions
    {
      email: 'buyer1@trilink.ae',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: companyIds['Buyer'],
      firstName: 'Ahmed',
      lastName: 'Al-Mansoori',
      phone: '+971-50-300-0003',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.APPROVE_PAYMENT,
        Permission.REJECT_PAYMENT,
        Permission.VIEW_PAYMENT_SCHEDULE,
      ],
    },
    {
      email: 'buyer2@trilink.ae',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: companyIds['Buyer'],
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      phone: '+971-50-300-0004',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.VIEW_PAYMENT_SCHEDULE,
        Permission.VIEW_REPORTS,
      ],
    },
    {
      email: 'supplier1@trilink.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: companyIds['Supplier'],
      firstName: 'Mohammed',
      lastName: 'Hassan',
      phone: '+971-50-400-0005',
      status: Status.ACTIVE,
    },
    {
      email: 'supplier2@trilink.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: companyIds['Supplier'],
      firstName: 'Sara',
      lastName: 'Al-Mazrouei',
      phone: '+971-50-400-0006',
      status: Status.ACTIVE,
    },
    // Logistics Users - Enhanced with GPS tracking permissions
    {
      email: 'logistics1@trilink.ae',
      password: hashedPassword,
      role: Role.LOGISTICS,
      companyId: companyIds['Logistics'],
      firstName: 'Khalid',
      lastName: 'Al-Suwaidi',
      phone: '+971-50-500-0007',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.MANAGE_GPS_TRACKING,
        Permission.VIEW_GPS_HISTORY,
        Permission.UPDATE_GPS,
      ],
    },
    {
      email: 'logistics2@trilink.ae',
      password: hashedPassword,
      role: Role.LOGISTICS,
      companyId: companyIds['Logistics'],
      firstName: 'Omar',
      lastName: 'Al-Nuaimi',
      phone: '+971-50-500-0008',
      status: Status.ACTIVE,
    },
    {
      email: 'clearance@trilink.ae',
      password: hashedPassword,
      role: Role.CLEARANCE,
      companyId: companyIds['Clearance'],
      firstName: 'Yasmin',
      lastName: 'Al-Hosani',
      phone: '+971-50-600-0009',
      status: Status.ACTIVE,
    },
    {
      email: 'service@trilink.ae',
      password: hashedPassword,
      role: Role.SERVICE_PROVIDER,
      companyId: companyIds['Service Provider'],
      firstName: 'Hamdan',
      lastName: 'Al-Mazrouei',
      phone: '+971-50-700-0010',
      status: Status.ACTIVE,
    },
    {
      email: 'buyer3@trilink.ae',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: companyIds['Buyer'],
      firstName: 'Khalifa',
      lastName: 'Al-Qasimi',
      phone: '+971-50-300-0011',
      status: Status.ACTIVE,
    },
    {
      email: 'buyer4@trilink.ae',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: companyIds['Buyer'],
      firstName: 'Layla',
      lastName: 'Al-Shamsi',
      phone: '+971-50-300-0012',
      status: Status.ACTIVE,
    },
    {
      email: 'supplier3@trilink.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: companyIds['Supplier'],
      firstName: 'Abdullah',
      lastName: 'Al-Kaabi',
      phone: '+971-50-400-0013',
      status: Status.ACTIVE,
    },
    {
      email: 'supplier4@trilink.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: companyIds['Supplier'],
      firstName: 'Noor',
      lastName: 'Al-Dhaheri',
      phone: '+971-50-400-0014',
      status: Status.ACTIVE,
    },
    // Users for new supplier company (Middle East Procurement Solutions LLC)
    {
      email: 'supplier5@trilink.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: companyIds['Supplier2'] || companyIds['MEPS-2024-001'],
      firstName: 'Khalid',
      lastName: 'Al-Mansoori',
      phone: '+971-50-400-0015',
      status: Status.ACTIVE,
    },
    {
      email: 'supplier6@trilink.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: companyIds['Supplier2'] || companyIds['MEPS-2024-001'],
      firstName: 'Amina',
      lastName: 'Al-Suwaidi',
      phone: '+971-50-400-0016',
      status: Status.ACTIVE,
    },
    {
      email: 'logistics3@trilink.ae',
      password: hashedPassword,
      role: Role.LOGISTICS,
      companyId: companyIds['Logistics'],
      firstName: 'Salem',
      lastName: 'Al-Ameri',
      phone: '+971-50-500-0015',
      status: Status.ACTIVE,
    },
    {
      email: 'logistics4@trilink.ae',
      password: hashedPassword,
      role: Role.LOGISTICS,
      companyId: companyIds['Logistics'],
      firstName: 'Aisha',
      lastName: 'Al-Rashidi',
      phone: '+971-50-500-0016',
      status: Status.ACTIVE,
    },
    {
      email: 'clearance2@trilink.ae',
      password: hashedPassword,
      role: Role.CLEARANCE,
      companyId: companyIds['Clearance'],
      firstName: 'Majid',
      lastName: 'Al-Falasi',
      phone: '+971-50-600-0017',
      status: Status.ACTIVE,
    },
    {
      email: 'clearance3@trilink.ae',
      password: hashedPassword,
      role: Role.CLEARANCE,
      companyId: companyIds['Clearance'],
      firstName: 'Hessa',
      lastName: 'Al-Mansoori',
      phone: '+971-50-600-0018',
      status: Status.ACTIVE,
    },
    {
      email: 'service2@trilink.ae',
      password: hashedPassword,
      role: Role.SERVICE_PROVIDER,
      companyId: companyIds['Service Provider'],
      firstName: 'Saeed',
      lastName: 'Al-Ketbi',
      phone: '+971-50-700-0019',
      status: Status.ACTIVE,
    },
    {
      email: 'service3@trilink.ae',
      password: hashedPassword,
      role: Role.SERVICE_PROVIDER,
      companyId: companyIds['Service Provider'],
      firstName: 'Maryam',
      lastName: 'Al-Suwaidi',
      phone: '+971-50-700-0020',
      status: Status.ACTIVE,
    },

    // New Enhanced Users with Custom Permissions

    // Senior Buyer with Advanced Permissions
    {
      email: 'senior.buyer@trilink.ae',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: companyIds['Buyer'],
      firstName: 'Khalifa',
      lastName: 'Al-Qasimi',
      phone: '+971-50-300-0101',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.APPROVE_PAYMENT,
        Permission.REJECT_PAYMENT,
        Permission.VIEW_PAYMENT_SCHEDULE,
        Permission.MANAGE_PAYMENT_SCHEDULE,
        Permission.CREATE_AMENDMENT,
        Permission.VIEW_AMENDMENT,
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA,
      ],
    },

    // Senior Logistics Coordinator with GPS Management
    {
      email: 'gps.coordinator@trilink.ae',
      password: hashedPassword,
      role: Role.LOGISTICS,
      companyId: companyIds['Logistics'],
      firstName: 'Sultan',
      lastName: 'Al-Nuaimi',
      phone: '+971-50-500-0102',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.MANAGE_GPS_TRACKING,
        Permission.VIEW_GPS_HISTORY,
        Permission.UPDATE_GPS,
        Permission.VIEW_PAYMENT_SCHEDULE,
        Permission.GENERATE_REPORTS,
      ],
    },

    // Government Dispute Resolver
    {
      email: 'dispute.resolver@trilink.ae',
      password: hashedPassword,
      role: Role.GOVERNMENT,
      companyId: govCompanyId,
      firstName: 'Noor',
      lastName: 'Al-Mansoori',
      phone: '+971-50-200-0103',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.RESOLVE_DISPUTE,
        Permission.ASSIGN_DISPUTE,
        Permission.CLOSE_DISPUTE,
        Permission.ESCALATE_DISPUTE,
        Permission.VIEW_GOVERNMENT_ANALYTICS,
        Permission.GENERATE_REPORTS,
        Permission.EXPORT_DATA,
      ],
    },

    // Supplier with Document Management
    {
      email: 'doc.manager@trilink.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: companyIds['Supplier'],
      firstName: 'Rashid',
      lastName: 'Al-Kaabi',
      phone: '+971-50-400-0104',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.UPLOAD_DOCUMENT,
        Permission.DELETE_DOCUMENT,
        Permission.VIEW_DOCUMENT,
        Permission.VIEW_PAYMENT_SCHEDULE,
        Permission.VIEW_REPORTS,
      ],
    },

    // Clearance Officer with Enhanced Access
    {
      email: 'clearance.officer@trilink.ae',
      password: hashedPassword,
      role: Role.CLEARANCE,
      companyId: companyIds['Clearance'],
      firstName: 'Hessa',
      lastName: 'Al-Falasi',
      phone: '+971-50-600-0105',
      status: Status.ACTIVE,
      customPermissions: [
        Permission.UPDATE_SHIPMENT,
        Permission.VIEW_PAYMENT_SCHEDULE,
        Permission.UPLOAD_DOCUMENT,
        Permission.VIEW_DOCUMENT,
        Permission.VIEW_REPORTS,
      ],
    },
  ];

  const userIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const userData of usersData) {
    // Check if user already exists
    let user = await User.findOne({ email: userData.email });

    if (!user) {
      user = await User.create({
        email: userData.email,
        password: userData.password,
        role: userData.role,
        companyId: userData.companyId!,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        status: userData.status || Status.ACTIVE,
        customPermissions: userData.customPermissions || [],
      });
      const permissionsInfo = userData.customPermissions?.length
        ? ` (${userData.customPermissions.length} custom permissions)`
        : '';
      console.log(`  ✓ Created ${userData.role}: ${userData.email}${permissionsInfo}`);
    } else {
      // Update existing user with new structure
      user.password = userData.password;
      user.role = userData.role;
      user.companyId = userData.companyId!;
      user.firstName = userData.firstName;
      user.lastName = userData.lastName;
      user.phone = userData.phone;
      user.status = userData.status || Status.ACTIVE;
      user.customPermissions = userData.customPermissions || [];
      await user.save();
      const permissionsInfo = userData.customPermissions?.length
        ? ` (${userData.customPermissions.length} custom permissions)`
        : '';
      console.log(`  ✓ Updated ${userData.role}: ${userData.email}${permissionsInfo}`);
    }

    // Store first user of each role (for workflow seeding)
    // Store all users by email for reference
    if (!userIds[userData.role]) {
      userIds[userData.role] = user._id;
    }
    userIds[userData.email] = user._id;
  }

  // Create Company Managers for each company
  console.log('  📋 Creating Company Managers...');
  console.log(`  📊 Available company types: ${Object.keys(companyIds).join(', ')}`);
  const companyManagerNames: Record<string, { firstName: string; lastName: string; email: string }> = {
    'Buyer': { firstName: 'Khalid', lastName: 'Al-Mansoori', email: 'manager@buyer.trilink.ae' },
    'Supplier': { firstName: 'Fatima', lastName: 'Al-Hashimi', email: 'manager@supplier.trilink.ae' },
    'Supplier2': { firstName: 'Youssef', lastName: 'Al-Ketbi', email: 'manager@supplier2.trilink.ae' },
    'Logistics': { firstName: 'Omar', lastName: 'Al-Suwaidi', email: 'manager@logistics.trilink.ae' },
    'Clearance': { firstName: 'Mariam', lastName: 'Al-Kaabi', email: 'manager@clearance.trilink.ae' },
    'Service Provider': { firstName: 'Ahmed', lastName: 'Al-Mazrouei', email: 'manager@serviceprovider.trilink.ae' },
  };

  let managerCounter = 1;
  let managersCreated = 0;

  // Create managers for specific company keys
  const managerCompanyKeys = ['Buyer', 'Supplier', 'Supplier2', 'Logistics', 'Clearance', 'Service Provider'];

  for (const companyKey of managerCompanyKeys) {
    const companyId = companyIds[companyKey];
    const managerInfo = companyManagerNames[companyKey];

    if (managerInfo && companyId) {
      let manager = await User.findOne({ email: managerInfo.email });

      if (!manager) {
        manager = await User.create({
          email: managerInfo.email,
          password: hashedPassword,
          role: Role.COMPANY_MANAGER,
          companyId: companyId,
          firstName: managerInfo.firstName,
          lastName: managerInfo.lastName,
          phone: `+971-50-800-${String(managerCounter).padStart(4, '0')}`,
          status: Status.ACTIVE,
          customPermissions: [
            Permission.MANAGE_PAYMENT_SCHEDULE,
            Permission.CREATE_AMENDMENT,
            Permission.APPROVE_AMENDMENT,
            Permission.GENERATE_REPORTS,
            Permission.EXPORT_DATA,
            Permission.DELETE_DOCUMENT,
          ],
        });
        console.log(`  ✓ Created Company Manager for ${companyKey}: ${managerInfo.email} (with enhanced permissions)`);
        managersCreated++;
      } else {
        // Update existing manager with new structure
        manager.password = hashedPassword;
        manager.role = Role.COMPANY_MANAGER;
        manager.companyId = companyId;
        manager.status = Status.ACTIVE;
        manager.customPermissions = [
          Permission.MANAGE_PAYMENT_SCHEDULE,
          Permission.CREATE_AMENDMENT,
          Permission.APPROVE_AMENDMENT,
          Permission.GENERATE_REPORTS,
          Permission.EXPORT_DATA,
          Permission.DELETE_DOCUMENT,
        ];
        await manager.save();
        console.log(`  ✓ Updated Company Manager for ${companyKey}: ${managerInfo.email} (with enhanced permissions)`);
        managersCreated++;
      }

      // Store manager ID
      if (!userIds[Role.COMPANY_MANAGER]) {
        userIds[Role.COMPANY_MANAGER] = manager._id;
      }
      userIds[`${companyKey}Manager`] = manager._id;
      userIds[managerInfo.email] = manager._id;
      managerCounter++;
    } else if (companyId) {
      console.log(`  ⚠️  No manager mapping found for company key: ${companyKey}`);
    }
  }

  console.log(`✅ Seeded ${usersData.length} users + ${managersCreated} company managers\n`);
  return userIds;
};
