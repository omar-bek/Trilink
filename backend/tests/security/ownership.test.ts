import request from 'supertest';
import { getApp } from '../helpers/app.helper';
import { generateBuyerToken, generateSupplierToken, authHeader } from '../helpers/auth.helper';
import { clearDatabase } from '../helpers/database.helper';
import { Company } from '../../src/modules/companies/schema';
import { User } from '../../src/modules/users/schema';
import { CompanyType, CompanyStatus } from '../../src/modules/companies/schema';
import { Role } from '../../src/config/rbac';
import { Status } from '../../src/types/common';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

describe('Company Isolation & Ownership Tests', () => {
  let app: any;
  let companyA: any;
  let companyB: any;
  let userA: any;
  let userB: any;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    await clearDatabase();

    const hashedPassword = await bcrypt.hash('Password123!', 12);

    // Create two separate companies
    companyA = await Company.create({
      name: 'Company A',
      registrationNumber: 'COMPA001',
      type: CompanyType.BUYER,
      status: CompanyStatus.APPROVED,
      email: 'companya@example.com',
      phone: '+971501234567',
      address: {
        street: '123 Company A St',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '00000',
      },
    });

    companyB = await Company.create({
      name: 'Company B',
      registrationNumber: 'COMPB001',
      type: CompanyType.BUYER,
      status: CompanyStatus.APPROVED,
      email: 'companyb@example.com',
      phone: '+971501234568',
      address: {
        street: '456 Company B St',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '11111',
      },
    });

    // Create users for each company
    userA = await User.create({
      email: 'usera@example.com',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: companyA._id,
      status: Status.ACTIVE,
      firstName: 'User',
      lastName: 'A',
    });

    userB = await User.create({
      email: 'userb@example.com',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: companyB._id,
      status: Status.ACTIVE,
      firstName: 'User',
      lastName: 'B',
    });

    tokenA = generateBuyerToken(companyA._id.toString());
    tokenB = generateBuyerToken(companyB._id.toString());
  });

  describe('User Access Isolation', () => {
    it('should prevent user from accessing users in different company', async () => {
      const response = await request(app)
        .get(`/api/users/${userB._id}`)
        .set(authHeader(tokenA));

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Access denied');
    });

    it('should allow user to access users in same company', async () => {
      // Create another user in company A
      const userA2 = await User.create({
        email: 'usera2@example.com',
        password: await bcrypt.hash('Password123!', 12),
        role: Role.BUYER,
        companyId: companyA._id,
        status: Status.ACTIVE,
      });

      const response = await request(app)
        .get(`/api/users/${userA2._id}`)
        .set(authHeader(tokenA));

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(userA2._id.toString());
    });

    it('should prevent user from updating users in different company', async () => {
      const response = await request(app)
        .patch(`/api/users/${userB._id}`)
        .set(authHeader(tokenA))
        .send({
          firstName: 'Hacked',
        });

      expect(response.status).toBe(403);
    });

    it('should prevent user from deleting users in different company', async () => {
      const response = await request(app)
        .delete(`/api/users/${userB._id}`)
        .set(authHeader(tokenA));

      expect(response.status).toBe(403);
    });
  });

  describe('Company Data Isolation', () => {
    it('should prevent user from accessing company data from different company', async () => {
      const response = await request(app)
        .get(`/api/users/company/${companyB._id}`)
        .set(authHeader(tokenA));

      expect(response.status).toBe(403);
    });

    it('should allow user to access company data from same company', async () => {
      const response = await request(app)
        .get(`/api/users/company/${companyA._id}`)
        .set(authHeader(tokenA));

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Purchase Request Isolation', () => {
    it('should prevent user from accessing purchase requests from different company', async () => {
      // Create purchase request for company B
      const prResponse = await request(app)
        .post('/api/purchase-requests')
        .set(authHeader(tokenB))
        .send({
          title: 'Company B PR',
          description: 'Test',
          items: [{ name: 'Item', quantity: 1, unit: 'unit', specifications: 'Test' }],
          budget: 10000,
          currency: 'AED',
          deliveryLocation: {
            address: 'Test',
            city: 'Dubai',
            state: 'Dubai',
            country: 'UAE',
            zipCode: '00000',
          },
          requiredDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });

      const prId = prResponse.body.data.id;

      // Try to access from company A
      const response = await request(app)
        .get(`/api/purchase-requests/${prId}`)
        .set(authHeader(tokenA));

      expect(response.status).toBe(403);
    });
  });

  describe('Cross-Company Data Leakage Prevention', () => {
    it('should not return data from other companies in list endpoints', async () => {
      // Create multiple users in both companies
      await User.create({
        email: 'usera3@example.com',
        password: await bcrypt.hash('Password123!', 12),
        role: Role.BUYER,
        companyId: companyA._id,
        status: Status.ACTIVE,
      });

      await User.create({
        email: 'userb2@example.com',
        password: await bcrypt.hash('Password123!', 12),
        role: Role.BUYER,
        companyId: companyB._id,
        status: Status.ACTIVE,
      });

      // User from company A should only see users from company A
      const response = await request(app)
        .get(`/api/users/company/${companyA._id}`)
        .set(authHeader(tokenA));

      expect(response.status).toBe(200);
      response.body.data.forEach((user: any) => {
        expect(user.companyId).toBe(companyA._id.toString());
      });
    });
  });
});
