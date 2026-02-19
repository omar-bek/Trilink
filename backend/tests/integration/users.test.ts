import request from 'supertest';
import { getApp } from '../helpers/app.helper';
import { generateAdminToken, generateBuyerToken, authHeader } from '../helpers/auth.helper';
import { clearDatabase } from '../helpers/database.helper';
import { Company } from '../../src/modules/companies/schema';
import { User } from '../../src/modules/users/schema';
import { CompanyType, CompanyStatus } from '../../src/modules/companies/schema';
import { Role } from '../../src/config/rbac';
import { Status } from '../../src/types/common';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

describe('Users Integration Tests', () => {
  let app: any;
  let adminCompany: any;
  let buyerCompany: any;
  let adminUser: any;
  let buyerUser: any;
  let adminToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create companies
    adminCompany = await Company.create({
      name: 'Admin Company',
      registrationNumber: 'ADMIN123',
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.APPROVED,
      email: 'admin@company.com',
      phone: '+971501234567',
      address: {
        street: '123 Admin St',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '00000',
      },
    });

    buyerCompany = await Company.create({
      name: 'Buyer Company',
      registrationNumber: 'BUYER123',
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

    // Create users
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    
    adminUser = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
      companyId: adminCompany._id,
      status: Status.ACTIVE,
      firstName: 'Admin',
      lastName: 'User',
    });

    buyerUser = await User.create({
      email: 'buyer@example.com',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: buyerCompany._id,
      status: Status.ACTIVE,
      firstName: 'Buyer',
      lastName: 'User',
    });

    adminToken = generateAdminToken(adminCompany._id.toString());
    buyerToken = generateBuyerToken(buyerCompany._id.toString());
  });

  describe('POST /api/users', () => {
    it('should create user successfully as admin', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: Role.BUYER,
          companyId: buyerCompany._id.toString(),
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('newuser@example.com');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: Role.BUYER,
          companyId: buyerCompany._id.toString(),
        });

      expect(response.status).toBe(401);
    });

    it('should fail with invalid payload', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({
          email: 'invalid-email',
          password: '123',
        });

      expect(response.status).toBe(400);
    });

    it('should fail if email already exists', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({
          email: buyerUser.email,
          password: 'Password123!',
          role: Role.BUYER,
          companyId: buyerCompany._id.toString(),
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID as admin', async () => {
      const response = await request(app)
        .get(`/api/users/${buyerUser._id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(buyerUser._id.toString());
    });

    it('should get own user as buyer', async () => {
      const response = await request(app)
        .get(`/api/users/${buyerUser._id}`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(buyerUser._id.toString());
    });

    it('should fail to access user from different company', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser._id}`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${buyerUser._id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/users/company/:companyId', () => {
    it('should get users by company ID', async () => {
      const response = await request(app)
        .get(`/api/users/company/${buyerCompany._id}`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get(`/api/users/company/${buyerCompany._id}?role=${Role.BUYER}`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(200);
      response.body.data.forEach((user: any) => {
        expect(user.role).toBe(Role.BUYER);
      });
    });

    it('should fail to access users from different company', async () => {
      const response = await request(app)
        .get(`/api/users/company/${adminCompany._id}`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user successfully', async () => {
      const response = await request(app)
        .patch(`/api/users/${buyerUser._id}`)
        .set(authHeader(buyerToken))
        .send({
          firstName: 'Updated',
          lastName: 'Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
    });

    it('should fail to update user from different company', async () => {
      const response = await request(app)
        .patch(`/api/users/${adminUser._id}`)
        .set(authHeader(buyerToken))
        .send({
          firstName: 'Updated',
        });

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .patch(`/api/users/${buyerUser._id}`)
        .send({
          firstName: 'Updated',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully (soft delete)', async () => {
      const response = await request(app)
        .delete(`/api/users/${buyerUser._id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify user still exists but is soft deleted
      const deletedUser = await User.findById(buyerUser._id);
      expect(deletedUser?.deletedAt).toBeDefined();
    });

    it('should fail to delete user from different company', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser._id}`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${buyerUser._id}`);

      expect(response.status).toBe(401);
    });
  });
});
