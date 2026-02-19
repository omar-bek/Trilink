import request from 'supertest';
import { getApp } from '../helpers/app.helper';
import { clearDatabase } from '../helpers/database.helper';
import { Company } from '../../src/modules/companies/schema';
import { User } from '../../src/modules/users/schema';
import { CompanyType, CompanyStatus } from '../../src/modules/companies/schema';
import { Role } from '../../src/config/rbac';
import { Status } from '../../src/types/common';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

describe('Auth Integration Tests', () => {
  let app: any;
  let testCompany: any;
  let testUser: any;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create test company
    testCompany = await Company.create({
      name: 'Test Company',
      registrationNumber: 'TEST123',
      type: CompanyType.SUPPLIER,
      status: CompanyStatus.APPROVED,
      email: 'test@company.com',
      phone: '+971501234567',
      address: {
        street: '123 Test St',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '00000',
      },
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    testUser = await User.create({
      email: 'test@example.com',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: testCompany._id,
      status: Status.ACTIVE,
      firstName: 'Test',
      lastName: 'User',
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          role: Role.BUYER,
          companyId: testCompany._id.toString(),
          firstName: 'New',
          lastName: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          role: Role.BUYER,
          companyId: testCompany._id.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: '123',
          role: Role.BUYER,
          companyId: testCompany._id.toString(),
        });

      expect(response.status).toBe(400);
    });

    it('should fail if email already exists', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testUser.email,
          password: 'Password123!',
          role: Role.BUYER,
          companyId: testCompany._id.toString(),
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail if company not found', async () => {
      const fakeCompanyId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user@example.com',
          password: 'Password123!',
          role: Role.BUYER,
          companyId: fakeCompanyId,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail if account is inactive', async () => {
      await User.findByIdAndUpdate(testUser._id, { status: Status.INACTIVE });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'Password123!',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // First login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'Password123!',
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      // Refresh token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken).not.toBe(refreshToken); // Token rotation
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid.token.here',
        });

      expect(response.status).toBe(401);
    });

    it('should fail if user is inactive', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'Password123!',
        });

      await User.findByIdAndUpdate(testUser._id, { status: Status.INACTIVE });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: loginResponse.body.data.refreshToken,
        });

      expect(response.status).toBe(403);
    });
  });
});
