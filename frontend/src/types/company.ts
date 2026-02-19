export enum CompanyType {
  BUYER = 'Buyer',
  SUPPLIER = 'Supplier',
  LOGISTICS = 'Logistics',
  CLEARANCE = 'Clearance',
  SERVICE_PROVIDER = 'Service Provider',
  GOVERNMENT = 'Government',
}

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface CompanyDocument {
  type: string;
  url: string;
  uploadedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  registrationNumber: string;
  type: CompanyType;
  email: string;
  phone: string;
  address: CompanyAddress;
  documents: CompanyDocument[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: Partial<CompanyAddress>;
  documents?: CompanyDocument[];
}

export interface AddCompanyDocumentDto {
  type: string;
  url: string;
}

export interface CreateCompanyDto {
  name: string;
  registrationNumber: string;
  type: CompanyType;
  email: string;
  phone: string;
  address: CompanyAddress;
  documents?: CompanyDocument[];
}

export interface CompanyFilters {
  type?: CompanyType;
  status?: string;
}