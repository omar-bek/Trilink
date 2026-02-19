import mongoose from 'mongoose';
import { config } from '../config/env';
import { connectDatabase } from '../config/database';
import { User } from '../modules/users/schema';
import { Company, CompanyType } from '../modules/companies/schema';
import { Role } from '../config/rbac';
import { Status } from '../types/common';
import bcrypt from 'bcrypt';

/**
 * Seed script to populate database with sample data
 */
const seed = async (): Promise<void> => {
  try {
    await connectDatabase();

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});

    logger.info('Cleared existing data');

    // Create Companies
    const buyerCompany = await Company.create({
      name: 'UAE Government Procurement',
      registrationNumber: 'GOV-UAE-001',
      type: CompanyType.BUYER,
      email: 'procurement@uae.gov.ae',
      phone: '+971-2-123-4567',
      address: {
        street: 'Government Building',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'UAE',
        zipCode: '00000',
      },
      status: Status.ACTIVE,
    });

    const supplierCompany = await Company.create({
      name: 'Tech Supplies Co.',
      registrationNumber: 'SUP-001',
      type: CompanyType.SUPPLIER,
      email: 'info@techsupplies.ae',
      phone: '+971-4-123-4567',
      address: {
        street: 'Business Bay',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '12345',
      },
      status: Status.ACTIVE,
    });

    const logisticsCompany = await Company.create({
      name: 'Fast Logistics UAE',
      registrationNumber: 'LOG-001',
      type: CompanyType.LOGISTICS,
      email: 'info@fastlogistics.ae',
      phone: '+971-4-234-5678',
      address: {
        street: 'Jebel Ali',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '23456',
      },
      status: Status.ACTIVE,
    });

    const clearanceCompany = await Company.create({
      name: 'Clearance Services LLC',
      registrationNumber: 'CLR-001',
      type: CompanyType.CLEARANCE,
      email: 'info@clearance.ae',
      phone: '+971-4-345-6789',
      address: {
        street: 'Port Area',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '34567',
      },
      status: Status.ACTIVE,
    });

    const governmentCompany = await Company.create({
      name: 'UAE Government Analytics',
      registrationNumber: 'GOV-ANALYTICS-001',
      type: CompanyType.GOVERNMENT,
      email: 'analytics@uae.gov.ae',
      phone: '+971-2-999-9999',
      address: {
        street: 'Government Complex',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'UAE',
        zipCode: '00001',
      },
      status: Status.ACTIVE,
    });

    logger.info('Created companies');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123!', config.security.bcryptRounds);

    // Create Admin User
    const adminUser = await User.create({
      email: 'admin@trilink.ae',
      password: hashedPassword,
      role: Role.ADMIN,
      companyId: buyerCompany._id,
      status: Status.ACTIVE,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+971-50-111-1111',
    });

    // Create Buyer User
    const buyerUser = await User.create({
      email: 'buyer@uae.gov.ae',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: buyerCompany._id,
      status: Status.ACTIVE,
      firstName: 'Ahmed',
      lastName: 'Al-Mansoori',
      phone: '+971-50-222-2222',
    });

    // Create Supplier User
    const supplierUser = await User.create({
      email: 'supplier@techsupplies.ae',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: supplierCompany._id,
      status: Status.ACTIVE,
      firstName: 'Mohammed',
      lastName: 'Hassan',
      phone: '+971-50-333-3333',
    });

    // Create Logistics User
    const logisticsUser = await User.create({
      email: 'logistics@fastlogistics.ae',
      password: hashedPassword,
      role: Role.LOGISTICS,
      companyId: logisticsCompany._id,
      status: Status.ACTIVE,
      firstName: 'Fatima',
      lastName: 'Al-Zahra',
      phone: '+971-50-444-4444',
    });

    // Create Clearance User
    const clearanceUser = await User.create({
      email: 'clearance@clearance.ae',
      password: hashedPassword,
      role: Role.CLEARANCE,
      companyId: clearanceCompany._id,
      status: Status.ACTIVE,
      firstName: 'Khalid',
      lastName: 'Al-Suwaidi',
      phone: '+971-50-555-5555',
    });

    // Create Government User
    const governmentUser = await User.create({
      email: 'government@uae.gov.ae',
      password: hashedPassword,
      role: Role.GOVERNMENT,
      companyId: governmentCompany._id,
      status: Status.ACTIVE,
      firstName: 'Mariam',
      lastName: 'Al-Ketbi',
      phone: '+971-50-666-6666',
    });

    logger.info('Created users');

    logger.info('✅ Seed completed successfully!');
    logger.info('\n📋 Sample Users Created:');
    logger.info('Admin: admin@trilink.ae / Password123!');
    logger.info('Buyer: buyer@uae.gov.ae / Password123!');
    logger.info('Supplier: supplier@techsupplies.ae / Password123!');
    logger.info('Logistics: logistics@fastlogistics.ae / Password123!');
    logger.info('Clearance: clearance@clearance.ae / Password123!');
    logger.info('Government: government@uae.gov.ae / Password123!');

    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
};

// Import logger
import { logger } from '../utils/logger';

seed();
