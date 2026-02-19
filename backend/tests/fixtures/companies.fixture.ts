import mongoose from 'mongoose';
import { ICompany, CompanyType, CompanyStatus } from '../../src/modules/companies/schema';

export const createTestCompany = (overrides: Partial<ICompany> = {}): Partial<ICompany> => {
  return {
    _id: new mongoose.Types.ObjectId(),
    name: overrides.name || 'Test Company',
    registrationNumber: overrides.registrationNumber || 'TEST123456',
    type: overrides.type || CompanyType.SUPPLIER,
    status: overrides.status || CompanyStatus.APPROVED,
    email: overrides.email || 'test@company.com',
    phone: overrides.phone || '+971501234567',
    address: overrides.address || {
      street: '123 Test Street',
      city: 'Dubai',
      state: 'Dubai',
      country: 'UAE',
      zipCode: '00000',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const createBuyerCompany = (): Partial<ICompany> => {
  return createTestCompany({
    name: 'UAE Government',
    type: CompanyType.BUYER,
    status: CompanyStatus.APPROVED,
    email: 'contact@uae.gov.ae',
  });
};

export const createSupplierCompany = (): Partial<ICompany> => {
  return createTestCompany({
    name: 'Tech Supplies LLC',
    type: CompanyType.SUPPLIER,
    status: CompanyStatus.APPROVED,
    email: 'contact@techsupplies.ae',
  });
};

export const createLogisticsCompany = (): Partial<ICompany> => {
  return createTestCompany({
    name: 'Fast Logistics LLC',
    type: CompanyType.LOGISTICS,
    status: CompanyStatus.APPROVED,
    email: 'contact@fastlogistics.ae',
  });
};
