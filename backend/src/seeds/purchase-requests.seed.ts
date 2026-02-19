import mongoose from 'mongoose';
import { PurchaseRequest, PurchaseRequestStatus } from '../modules/purchase-requests/schema';

export interface SeedPurchaseRequest {
  buyerId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId; // Required: Main category
  subCategoryId?: mongoose.Types.ObjectId; // Optional: Sub-category
  title: string;
  description: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    specifications: string;
    estimatedPrice?: number;
  }>;
  budget: number;
  currency: string;
  deliveryLocation: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  requiredDeliveryDate: Date;
}

export const seedPurchaseRequests = async (
  buyerIds: Record<string, mongoose.Types.ObjectId>,
  buyerCompanyId: mongoose.Types.ObjectId,
  categoryIds: Record<string, mongoose.Types.ObjectId>
): Promise<Record<string, mongoose.Types.ObjectId>> => {
  console.log('📋 Seeding Purchase Requests...');

  const purchaseRequestsData: Array<SeedPurchaseRequest & { status: PurchaseRequestStatus; rfqGenerated: boolean }> = [
    {
      buyerId: buyerIds['buyer1@trilink.ae'],
      companyId: buyerCompanyId,
      categoryId: categoryIds['Information Technology'],
      subCategoryId: categoryIds['Computers & Laptops'],
      title: 'IT Infrastructure & Office Equipment Procurement 2024',
      description: 'Comprehensive procurement of IT infrastructure, office equipment, and furniture for government office expansion. Includes computers, networking equipment, printers, and ergonomic office furniture to support 100+ employees.',
      items: [
        {
          name: 'Desktop Workstations',
          quantity: 80,
          unit: 'units',
          specifications: 'Intel Core i7-13700, 32GB DDR4 RAM, 1TB NVMe SSD, NVIDIA RTX 4060, Windows 11 Pro, 3-year warranty',
          estimatedPrice: 4500,
        },
        {
          name: 'Laptop Computers',
          quantity: 30,
          unit: 'units',
          specifications: 'Intel Core i7-1365U, 16GB RAM, 512GB SSD, 14" FHD Display, Windows 11 Pro, 3-year warranty',
          estimatedPrice: 5500,
        },
        {
          name: 'Network Printers',
          quantity: 15,
          unit: 'units',
          specifications: 'Multifunction Laser Printer, Color, Duplex, Network-enabled, 50ppm, Cloud printing support',
          estimatedPrice: 3200,
        },
        {
          name: 'Office Furniture Package',
          quantity: 100,
          unit: 'sets',
          specifications: 'Ergonomic office chairs (adjustable height, lumbar support), Height-adjustable desks (120cm x 60cm), 2-drawer filing cabinets, Desk organizers',
          estimatedPrice: 2800,
        },
        {
          name: 'Network Switches',
          quantity: 10,
          unit: 'units',
          specifications: '48-port Gigabit Ethernet Switch, Managed, PoE+, Layer 3 capable, 5-year warranty',
          estimatedPrice: 8500,
        },
        {
          name: 'Wireless Access Points',
          quantity: 20,
          unit: 'units',
          specifications: 'Wi-Fi 6 (802.11ax), Dual-band, PoE powered, Enterprise-grade security, Centralized management',
          estimatedPrice: 1800,
        },
      ],
      budget: 850000,
      currency: 'AED',
      deliveryLocation: {
        address: 'Government Complex, Al Bateen, Building 3',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'UAE',
        zipCode: '00001',
        coordinates: {
          lat: 24.4539,
          lng: 54.3773,
        },
      },
      requiredDeliveryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: PurchaseRequestStatus.SUBMITTED,
      rfqGenerated: true,
    },
    {
      buyerId: buyerIds['buyer2@trilink.ae'],
      companyId: buyerCompanyId,
      categoryId: categoryIds['Medical & Healthcare'],
      subCategoryId: categoryIds['Medical Equipment'],
      title: 'Medical Equipment & Supplies Procurement Q1 2024',
      description: 'Procurement of medical equipment, supplies, and consumables for healthcare facilities. Includes diagnostic equipment, patient monitoring systems, and medical consumables.',
      items: [
        {
          name: 'Patient Monitoring Systems',
          quantity: 25,
          unit: 'units',
          specifications: 'Multi-parameter patient monitor, 12.1" color display, SpO2, NIBP, Temperature, ECG, 3-year warranty',
          estimatedPrice: 12000,
        },
        {
          name: 'Portable Ultrasound Machines',
          quantity: 8,
          unit: 'units',
          specifications: 'Handheld ultrasound device, wireless connectivity, multiple probe options, 2-year warranty',
          estimatedPrice: 45000,
        },
        {
          name: 'Medical Consumables Package',
          quantity: 500,
          unit: 'boxes',
          specifications: 'Syringes, needles, gloves, gauze, bandages, IV sets, catheters - various sizes',
          estimatedPrice: 150,
        },
        {
          name: 'Defibrillators',
          quantity: 12,
          unit: 'units',
          specifications: 'Automated External Defibrillator (AED), pediatric and adult pads, battery included, 5-year warranty',
          estimatedPrice: 8500,
        },
      ],
      budget: 650000,
      currency: 'AED',
      deliveryLocation: {
        address: 'Dubai Healthcare City, Building 15',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        zipCode: '12345',
        coordinates: {
          lat: 25.1868,
          lng: 55.2644,
        },
      },
      requiredDeliveryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: PurchaseRequestStatus.SUBMITTED,
      rfqGenerated: true,
    },
    {
      buyerId: buyerIds['buyer3@trilink.ae'],
      companyId: buyerCompanyId,
      categoryId: categoryIds['Construction & Building Materials'],
      subCategoryId: categoryIds['Cement & Concrete'],
      title: 'Construction Materials & Building Supplies',
      description: 'Procurement of construction materials for infrastructure development project. Includes cement, steel, electrical supplies, and plumbing materials.',
      items: [
        {
          name: 'Portland Cement',
          quantity: 500,
          unit: 'tons',
          specifications: 'Type I Portland Cement, 50kg bags, UAE standard compliant',
          estimatedPrice: 350,
        },
        {
          name: 'Reinforcement Steel Bars',
          quantity: 200,
          unit: 'tons',
          specifications: 'Grade 60 rebar, various diameters (12mm, 16mm, 20mm, 25mm)',
          estimatedPrice: 2800,
        },
        {
          name: 'Electrical Cables',
          quantity: 10000,
          unit: 'meters',
          specifications: 'Copper cables, various gauges (2.5mm², 4mm², 6mm², 10mm²), fire-resistant',
          estimatedPrice: 25,
        },
        {
          name: 'PVC Pipes',
          quantity: 5000,
          unit: 'meters',
          specifications: 'Schedule 40 PVC pipes, various diameters (1/2", 3/4", 1", 2"), pressure rated',
          estimatedPrice: 45,
        },
      ],
      budget: 1200000,
      currency: 'AED',
      deliveryLocation: {
        address: 'Construction Site, Al Reem Island, Plot 12',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'UAE',
        zipCode: '00002',
        coordinates: {
          lat: 24.5,
          lng: 54.4,
        },
      },
      requiredDeliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: PurchaseRequestStatus.SUBMITTED,
      rfqGenerated: true,
    },
    {
      buyerId: buyerIds['buyer4@trilink.ae'],
      companyId: buyerCompanyId,
      categoryId: categoryIds['Logistics & Transportation'],
      subCategoryId: categoryIds['Freight Services'],
      title: 'Fleet Vehicles & Transportation Equipment',
      description: 'Procurement of fleet vehicles and transportation equipment for government services. Includes sedans, SUVs, and maintenance equipment.',
      items: [
        {
          name: 'Sedan Vehicles',
          quantity: 20,
          unit: 'units',
          specifications: 'Mid-size sedan, 2.0L engine, automatic transmission, air conditioning, safety features',
          estimatedPrice: 95000,
        },
        {
          name: 'SUV Vehicles',
          quantity: 10,
          unit: 'units',
          specifications: 'Full-size SUV, 4WD, 7-seater, advanced safety systems, navigation',
          estimatedPrice: 180000,
        },
        {
          name: 'Vehicle Maintenance Equipment',
          quantity: 5,
          unit: 'sets',
          specifications: 'Diagnostic tools, tire changers, battery chargers, oil change equipment',
          estimatedPrice: 25000,
        },
      ],
      budget: 4200000,
      currency: 'AED',
      deliveryLocation: {
        address: 'Government Fleet Management Center, Industrial Area',
        city: 'Sharjah',
        state: 'Sharjah',
        country: 'UAE',
        zipCode: '23456',
        coordinates: {
          lat: 25.3573,
          lng: 55.4033,
        },
      },
      requiredDeliveryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      status: PurchaseRequestStatus.DRAFT,
      rfqGenerated: false,
    },
  ];

  const purchaseRequestIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const prData of purchaseRequestsData) {
    // Check if purchase request already exists
    let purchaseRequest = await PurchaseRequest.findOne({
      buyerId: prData.buyerId,
      title: prData.title,
    });

    if (!purchaseRequest) {
      purchaseRequest = await PurchaseRequest.create({
        buyerId: prData.buyerId,
        companyId: prData.companyId,
        categoryId: prData.categoryId,
        subCategoryId: prData.subCategoryId,
        title: prData.title,
        description: prData.description,
        items: prData.items,
        budget: prData.budget,
        currency: prData.currency,
        deliveryLocation: prData.deliveryLocation,
        requiredDeliveryDate: prData.requiredDeliveryDate,
        status: prData.status,
        rfqGenerated: prData.rfqGenerated,
      });
      console.log(`  ✓ Created Purchase Request: ${prData.title}`);
    } else {
      // Update existing PR
      Object.assign(purchaseRequest, {
        categoryId: prData.categoryId,
        subCategoryId: prData.subCategoryId,
        description: prData.description,
        items: prData.items,
        budget: prData.budget,
        deliveryLocation: prData.deliveryLocation,
        requiredDeliveryDate: prData.requiredDeliveryDate,
        status: prData.status,
        rfqGenerated: prData.rfqGenerated,
      });
      await purchaseRequest.save();
      console.log(`  ✓ Updated Purchase Request: ${prData.title}`);
    }

    purchaseRequestIds[prData.title] = purchaseRequest._id;
  }

  console.log(`✅ Seeded ${purchaseRequestsData.length} Purchase Requests\n`);
  return purchaseRequestIds;
};
