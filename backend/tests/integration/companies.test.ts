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

describe('Companies Integration Tests', () => {
  let app: any;
  let adminCompany: any;
  let adminUser: any;
  let adminToken: string;

  beforeAll(async () => {
    app = getApp();
  });

  beforeEach(async () => {
    await clearDatabase();

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

    const hashedPassword = await bcrypt.hash('Password123!', 12);
    adminUser = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      role: Role.ADMIN,
      companyId: adminCompany._id,
      status: Status.ACTIVE,
    });

    adminToken = generateAdminToken(adminCompany._id.toString());
  });

  describe('POST /api/companies', () => {
    it('should create company successfully', async () => {
      const response = await request(app)
        .post('/api/companies')
        .set(authHeader(adminToken))
        .send({
          name: 'New Company',
          registrationNumber: 'NEW123',
          type: CompanyType.SUPPLIER,
          email: 'new@company.com',
          phone: '+971501234567',
          address: {
            street: '123 New St',
            city: 'Dubai',
            state: 'Dubai',
            country: 'UAE',
            zipCode: '00000',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Company');
      expect(response.body.data.status).toBe(CompanyStatus.PENDING);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/companies')
        .send({
          name: 'New Company',
          registrationNumber: 'NEW123',
          type: CompanyType.SUPPLIER,
          email: 'new@company.com',
          phone: '+971501234567',
          address: {
            street: '123 New St',
            city: 'Dubai',
            state: 'Dubai',
            country: 'UAE',
            zipCode: '00000',
          },
        });

      expect(response.status).toBe(401);
    });

    it('should fail with duplicate registration number', async () => {
      const response = await request(app)
        .post('/api/companies')
        .set(authHeader(adminToken))
        .send({
          name: 'Duplicate Company',
          registrationNumber: adminCompany.registrationNumber,
          type: CompanyType.SUPPLIER,
          email: 'duplicate@company.com',
          phone: '+971501234567',
          address: {
            street: '123 Duplicate St',
            city: 'Dubai',
            state: 'Dubai',
            country: 'UAE',
            zipCode: '00000',
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should get company by ID', async () => {
      const response = await request(app)
        .get(`/api/companies/${adminCompany._id}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(adminCompany._id.toString());
    });

    it('should return 404 for non-existent company', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const response = await request(app)
        .get(`/api/companies/${fakeId}`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/companies/:id/approve', () => {
    let pendingCompany: any;

    beforeEach(async () => {
      pendingCompany = await Company.create({
        name: 'Pending Company',
        registrationNumber: 'PENDING123',
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
    });

    it('should approve company as admin', async () => {
      const response = await request(app)
        .post(`/api/companies/${pendingCompany._id}/approve`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(CompanyStatus.APPROVED);

      // Verify in database
      const updated = await Company.findById(pendingCompany._id);
      expect(updated?.status).toBe(CompanyStatus.APPROVED);
    });

    it('should fail if not admin', async () => {
      const buyerToken = generateBuyerToken(adminCompany._id.toString());
      const response = await request(app)
        .post(`/api/companies/${pendingCompany._id}/approve`)
        .set(authHeader(buyerToken));

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/companies/:id/reject', () => {
    let pendingCompany: any;

    beforeEach(async () => {
      pendingCompany = await Company.create({
        name: 'Pending Company',
        registrationNumber: 'PENDING456',
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
    });

    it('should reject company as admin', async () => {
      const response = await request(app)
        .post(`/api/companies/${pendingCompany._id}/reject`)
        .set(authHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(CompanyStatus.REJECTED);
    });
  });
});
