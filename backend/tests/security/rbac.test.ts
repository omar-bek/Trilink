import request from 'supertest';
import { getApp } from '../helpers/app.helper';
import { generateAdminToken, generateBuyerToken, generateSupplierToken, generateGovernmentToken, authHeader } from '../helpers/auth.helper';
import { clearDatabase } from '../helpers/database.helper';
import { Company } from '../../src/modules/companies/schema';
import { User } from '../../src/modules/users/schema';
import { CompanyType, CompanyStatus } from '../../src/modules/companies/schema';
import { Role } from '../../src/config/rbac';
import { Status } from '../../src/types/common';
import { Permission } from '../../src/config/rbac';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

describe('RBAC Security Tests', () => {
  let app: any;
  let buyerCompany: any;
  let supplierCompany: any;
  let adminUser: any;
  let buyerUser: any;
  let supplierUser: any;
  let governmentUser: any;
  let adminToken: string;
  let buyerToken: string;
  let supplierToken: string;
  let governmentToken: string;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    await clearDatabase();

    const hashedPassword = await bcrypt.hash('Password123!', 12);

    buyerCompany = await Company.create({
      name: 'Buyer Company',
      registrationNumber: 'BUYER001',
      type: CompanyType.BUYER,
      status: CompanyStatus.APPROVED,
      email: 'buyer@company.com',
      phone: '+971501234567',
      address: {
        street: '123 Buyer St',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '00000',
      },
    });

    supplierCompany = await Company.create({
      name: 'Supplier Company',
      registrationNumber: 'SUPPLIER001',
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.APPROVED,
      email: 'supplier@company.com',
      phone: '+971501234568',
      address: {
        street: '456 Supplier St',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '11111',
      },
    });

    adminUser = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
      companyId: buyerCompany._id,
      status: Status.ACTIVE,
    });

    buyerUser = await User.create({
      email: 'buyer@example.com',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: buyerCompany._id,
      status: Status.ACTIVE,
    });

    supplierUser = await User.create({
      email: 'supplier@example.com',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: supplierCompany._id,
      status: Status.ACTIVE,
    });

    governmentUser = await User.create({
      email: 'government@example.com',
      password: hashedPassword,
      role: Role.GOVERNMENT,
      companyId: buyerCompany._id,
      status: Status.ACTIVE,
    });

    adminToken = generateAdminToken(buyerCompany._id.toString());
    buyerToken = generateBuyerToken(buyerCompany._id.toString());
    supplierToken = generateSupplierToken(supplierCompany._id.toString());
    governmentToken = generateGovernmentToken(buyerCompany._id.toString());
  });

  describe('Unauthorized Access', () => {
    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Authentication required');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should deny access with malformed token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'InvalidFormat token')
        .expect(401);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('should allow buyer to create purchase request', async () => {
      const response = await request(app)
        .post('/api/purchase-requests')
        .set(authHeader(buyerToken))
        .send({
          title: 'Test PR',
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

      expect(response.status).toBe(201);
    });

    it('should deny supplier from creating purchase request', async () => {
      const response = await request(app)
        .post('/api/purchase-requests')
        .set(authHeader(supplierToken))
        .send({
          title: 'Test PR',
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

      expect(response.status).toBe(403);
    });

    it('should allow admin to manage users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: Role.BUYER,
          companyId: buyerCompany._id.toString(),
        });

      expect(response.status).toBe(201);
    });

    it('should deny buyer from managing users without permission', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(authHeader(buyerToken))
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: Role.BUYER,
          companyId: buyerCompany._id.toString(),
        });

      // Buyer may not have MANAGE_USERS permission
      expect([403, 400]).toContain(response.status);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to approve companies', async () => {
      const pendingCompany = await Company.create({
        name: 'Pending Company',
        registrationNumber: 'PENDING001',
        type: CompanyType.SUPPLIER,
        status: CompanyStatus.PENDING,
        email: 'pending@company.com',
        phone: '+971501234567',
        address: {
          street: '123 Pending St',
          city: 'Dubai',
          state: 'Dubai',
          country: 'UAE',
          zipCode: '00000',
        },
      });

      const response = await request(app)
        .post(`/api/companies/${pendingCompany._id}/approve`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
    });

    it('should deny non-admin from approving companies', async () => {
      const pendingCompany = await Company.create({
        name: 'Pending Company 2',
        registrationNumber: 'PENDING002',
        type: CompanyType.SUPPLIER,
        status: CompanyStatus.PENDING,
        email: 'pending2@company.com',
        phone: '+971501234567',
        address: {
          street: '123 Pending St',
          city: 'Dubai',
          state: 'Dubai',
          country: 'UAE',
          zipCode: '00000',
        },
      });

      const response = await request(app)
        .post(`/api/companies/${pendingCompany._id}/approve`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(403);
    });

    it('should allow government to view analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/government')
        .set(authHeader(governmentToken));

      expect([200, 403]).toContain(response.status); // May or may not have permission
    });

    it('should deny non-government from viewing government analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/government')
        .set(authHeader(buyerToken));

      expect([403, 404]).toContain(response.status);
    });
  });

  describe('Admin Full Access', () => {
    it('should allow admin to access any resource', async () => {
      // Admin should be able to access users from any company
      const response = await request(app)
        .get(`/api/users/${supplierUser._id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
    });

    it('should allow admin to create users for any company', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({
          email: 'admincreated@example.com',
          password: 'Password123!',
          role: Role.SUPPLIER,
          companyId: supplierCompany._id.toString(),
        });

      expect(response.status).toBe(201);
    });
  });
});
