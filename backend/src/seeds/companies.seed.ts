import mongoose from 'mongoose';
import { Company, CompanyType } from '../modules/companies/schema';
import { Status } from '../types/common';

export interface SeedCompany {
  name: string;
  registrationNumber: string;
  type: CompanyType;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
}

export const seedCompanies = async (): Promise<Record<string, mongoose.Types.ObjectId>> => {
  console.log('📦 Seeding Companies...');

  const companiesData: SeedCompany[] = [
    {
      name: 'UAE Government Procurement Authority',
      registrationNumber: 'GOV-PROC-2024-001',
      type: CompanyType.BUYER,
      email: 'procurement@gov.ae',
      phone: '+971-2-111-2222',
      address: {
        street: 'Government Complex, Al Bateen',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'UAE',
        zipCode: '00001',
      },
    },
    {
      name: 'Dubai Municipality Procurement',
      registrationNumber: 'DM-PROC-2024-001',
      type: CompanyType.BUYER,
      email: 'procurement@dm.gov.ae',
      phone: '+971-4-222-3333',
      address: {
        street: 'Dubai Municipality Building',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '12345',
      },
    },
    {
      name: 'Tech Solutions Middle East FZCO',
      registrationNumber: 'TSME-2024-001',
      type: CompanyType.SUPPLIER,
      email: 'info@techsolutions.ae',
      phone: '+971-4-333-4444',
      address: {
        street: 'Dubai Internet City, Building 5',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '23456',
      },
    },
    {
      name: 'Gulf Industrial Supplies LLC',
      registrationNumber: 'GIS-2024-001',
      type: CompanyType.SUPPLIER,
      email: 'sales@gulfindustrial.ae',
      phone: '+971-4-444-5555',
      address: {
        street: 'Jebel Ali Industrial Area, Block A',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '34567',
      },
    },
    {
      name: 'Middle East Procurement Solutions LLC',
      registrationNumber: 'MEPS-2024-001',
      type: CompanyType.SUPPLIER,
      email: 'info@meprocsolutions.ae',
      phone: '+971-4-555-6666',
      address: {
        street: 'Sheikh Zayed Road, Business Tower 3, Floor 15',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '89012',
      },
    },
    {
      name: 'Arabian Logistics Network',
      registrationNumber: 'ALN-2024-001',
      type: CompanyType.LOGISTICS,
      email: 'operations@arabianlogistics.ae',
      phone: '+971-4-555-6666',
      address: {
        street: 'Port Rashid, Logistics District',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '45678',
      },
    },
    {
      name: 'Emirates Express Shipping',
      registrationNumber: 'EES-2024-001',
      type: CompanyType.LOGISTICS,
      email: 'info@emiratesexpress.ae',
      phone: '+971-4-666-7777',
      address: {
        street: 'Dubai Logistics City, Terminal 2',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '56789',
      },
    },
    {
      name: 'UAE Customs Clearance Services',
      registrationNumber: 'UCCS-2024-001',
      type: CompanyType.CLEARANCE,
      email: 'clearance@uaecustoms.ae',
      phone: '+971-4-777-8888',
      address: {
        street: 'Dubai Customs Building, Port Area',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '67890',
      },
    },
    {
      name: 'Gulf Quality Inspection Services',
      registrationNumber: 'GQIS-2024-001',
      type: CompanyType.SERVICE_PROVIDER,
      email: 'inspection@gulfquality.ae',
      phone: '+971-4-888-9999',
      address: {
        street: 'Al Quoz Industrial Area 3, Warehouse 12',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '78901',
      },
    },
  ];

  const companyIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const companyData of companiesData) {
    // Check if company already exists
    let company = await Company.findOne({
      registrationNumber: companyData.registrationNumber,
    });

    if (!company) {
      company = await Company.create({
        ...companyData,
        status: Status.APPROVED,
        documents: [
          {
            type: 'trade_license',
            url: `https://docs.trilink.ae/${companyData.registrationNumber}/license.pdf`,
            uploadedAt: new Date(),
          },
        ],
      });
      console.log(`  ✓ Created ${companyData.type}: ${companyData.name}`);
    } else {
      // Update existing company to ensure it's approved
      company.status = Status.APPROVED;
      await company.save();
      console.log(`  ✓ Found existing ${companyData.type}: ${companyData.name}`);
    }

    // Store company ID by type (last one wins for same type)
    companyIds[companyData.type] = company._id;

    // Also store by registration number for specific access
    companyIds[companyData.registrationNumber] = company._id;

    // Store specific supplier companies with unique keys
    if (companyData.type === CompanyType.SUPPLIER) {
      if (companyData.registrationNumber === 'MEPS-2024-001') {
        companyIds['Supplier2'] = company._id; // New supplier company
      } else if (companyData.registrationNumber === 'TSME-2024-001') {
        companyIds['Supplier1'] = company._id; // First supplier
      } else if (companyData.registrationNumber === 'GIS-2024-001') {
        companyIds['Supplier'] = company._id; // Keep this for backward compatibility
      }
    }
  }

  console.log(`✅ Seeded ${companiesData.length} companies\n`);
  return companyIds;
};
