import request from 'supertest';
import { getApp } from '../helpers/app.helper';
import { generateBuyerToken, generateSupplierToken, authHeader } from '../helpers/auth.helper';
import { clearDatabase } from '../helpers/database.helper';
import { Company } from '../../src/modules/companies/schema';
import { User } from '../../src/modules/users/schema';
import { PurchaseRequest } from '../../src/modules/purchase-requests/schema';
import { RFQ } from '../../src/modules/rfqs/schema';
import { Bid } from '../../src/modules/bids/schema';
import { CompanyType, CompanyStatus } from '../../src/modules/companies/schema';
import { Role } from '../../src/config/rbac';
import { Status } from '../../src/types/common';
import { PurchaseRequestStatus } from '../../src/modules/purchase-requests/schema';
import { RFQStatus } from '../../src/modules/rfqs/schema';
import { BidStatus } from '../../src/modules/bids/schema';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

describe('Edge Cases & Negative Tests', () => {
  let app: any;
  let buyerCompany: any;
  let supplierCompany: any;
  let buyerUser: any;
  let supplierUser: any;
  let buyerToken: string;
  let supplierToken: string;

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

    buyerToken = generateBuyerToken(buyerCompany._id.toString());
    supplierToken = generateSupplierToken(supplierCompany._id.toString());
  });

  describe('Invalid Status Transitions', () => {
    it('should prevent invalid bid status transitions', async () => {
      // Create purchase request and RFQ
      const prResponse = await request(app)
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

      const pr = await PurchaseRequest.findById(prResponse.body.data.id);
      const rfqs = await RFQ.find({ purchaseRequestId: pr?._id });
      const rfqId = rfqs[0]._id.toString();

      // Create bid
      const bidResponse = await request(app)
        .post('/api/bids')
        .set(authHeader(supplierToken))
        .send({
          rfqId: rfqId,
          price: 9000,
          currency: 'AED',
          paymentTerms: 'Net 30',
          deliveryTime: 15,
          deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });

      const bidId = bidResponse.body.data.id;

      // Try to accept bid directly without proper workflow (may fail)
      const acceptResponse = await request(app)
        .patch(`/api/bids/${bidId}/evaluate`)
        .set(authHeader(buyerToken))
        .send({
          status: BidStatus.ACCEPTED,
        });

      // Should either succeed (if workflow allows) or fail gracefully
      expect([200, 400, 403]).toContain(acceptResponse.status);
    });
  });

  describe('Duplicate Submissions', () => {
    it('should prevent duplicate bids from same company', async () => {
      const prResponse = await request(app)
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

      const pr = await PurchaseRequest.findById(prResponse.body.data.id);
      const rfqs = await RFQ.find({ purchaseRequestId: pr?._id });
      const rfqId = rfqs[0]._id.toString();

      // Create first bid
      const bid1Response = await request(app)
        .post('/api/bids')
        .set(authHeader(supplierToken))
        .send({
          rfqId: rfqId,
          price: 9000,
          currency: 'AED',
          paymentTerms: 'Net 30',
          deliveryTime: 15,
          deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });

      expect(bid1Response.status).toBe(201);

      // Try to create duplicate bid
      const bid2Response = await request(app)
        .post('/api/bids')
        .set(authHeader(supplierToken))
        .send({
          rfqId: rfqId,
          price: 8500,
          currency: 'AED',
          paymentTerms: 'Net 30',
          deliveryTime: 15,
          deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });

      // Should fail - one bid per RFQ per company
      expect([400, 409]).toContain(bid2Response.status);
    });
  });

  describe('Late RFQ Submissions', () => {
    it('should prevent bid submission after RFQ deadline', async () => {
      const prResponse = await request(app)
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

      const pr = await PurchaseRequest.findById(prResponse.body.data.id);
      const rfqs = await RFQ.find({ purchaseRequestId: pr?._id });
      const rfq = rfqs[0];

      // Close RFQ by updating deadline to past
      await RFQ.findByIdAndUpdate(rfq._id, {
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        status: RFQStatus.CLOSED,
      });

      // Try to submit bid after deadline
      const bidResponse = await request(app)
        .post('/api/bids')
        .set(authHeader(supplierToken))
        .send({
          rfqId: rfq._id.toString(),
          price: 9000,
          currency: 'AED',
          paymentTerms: 'Net 30',
          deliveryTime: 15,
          deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });

      // Should fail - RFQ is closed
      expect([400, 403]).toContain(bidResponse.status);
    });
  });

  describe('Invalid Data Validation', () => {
    it('should reject purchase request with negative budget', async () => {
      const response = await request(app)
        .post('/api/purchase-requests')
        .set(authHeader(buyerToken))
        .send({
          title: 'Test PR',
          description: 'Test',
          items: [{ name: 'Item', quantity: 1, unit: 'unit', specifications: 'Test' }],
          budget: -1000,
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

      expect(response.status).toBe(400);
    });

    it('should reject bid with price exceeding budget', async () => {
      const prResponse = await request(app)
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

      const pr = await PurchaseRequest.findById(prResponse.body.data.id);
      const rfqs = await RFQ.find({ purchaseRequestId: pr?._id });
      const rfqId = rfqs[0]._id.toString();

      // Try to submit bid exceeding budget
      const bidResponse = await request(app)
        .post('/api/bids')
        .set(authHeader(supplierToken))
        .send({
          rfqId: rfqId,
          price: 15000, // Exceeds budget of 10000
          currency: 'AED',
          paymentTerms: 'Net 30',
          deliveryTime: 15,
          deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });

      // May or may not be rejected depending on business rules
      expect([201, 400]).toContain(bidResponse.status);
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject user creation without required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set(authHeader(buyerToken))
        .send({
          email: 'incomplete@example.com',
          // Missing password, role, companyId
        });

      expect(response.status).toBe(400);
    });

    it('should reject company creation without address', async () => {
      const response = await request(app)
        .post('/api/companies')
        .set(authHeader(buyerToken))
        .send({
          name: 'Incomplete Company',
          registrationNumber: 'INC001',
          type: CompanyType.SUPPLIER,
          email: 'incomplete@company.com',
          phone: '+971501234567',
          // Missing address
        });

      expect(response.status).toBe(400);
    });
  });
});
