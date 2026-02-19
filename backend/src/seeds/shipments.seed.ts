import mongoose from 'mongoose';
import { Shipment, ShipmentStatus } from '../modules/shipments/schema';

export interface SeedShipment {
  contractId: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  logisticsCompanyId: mongoose.Types.ObjectId;
  origin: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  destination: {
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  estimatedDeliveryDate: Date;
}

export const seedShipment = async (
  contractIds: Record<string, mongoose.Types.ObjectId>,
  buyerCompanyId: mongoose.Types.ObjectId,
  logisticsCompanyId: mongoose.Types.ObjectId,
  logisticsUserId: mongoose.Types.ObjectId,
  purchaseRequests: Array<{
    title: string;
    deliveryLocation: {
      address: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
      coordinates?: { lat: number; lng: number };
    };
  }>
): Promise<Record<string, mongoose.Types.ObjectId>> => {
  console.log('🚚 Seeding Shipments...');

  const shipmentIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const pr of purchaseRequests) {
    const contractId = contractIds[pr.title];
    if (!contractId) continue;

    const shipmentData: SeedShipment = {
      contractId,
      companyId: buyerCompanyId,
      logisticsCompanyId,
      origin: {
        address: 'Jebel Ali Port, Logistics Hub',
        city: 'Dubai',
        country: 'UAE',
        coordinates: {
          lat: 24.9857,
          lng: 55.0267,
        },
      },
      destination: {
        address: pr.deliveryLocation.address,
        city: pr.deliveryLocation.city,
        country: pr.deliveryLocation.country,
        coordinates: pr.deliveryLocation.coordinates || {
          lat: 25.1868,
          lng: 55.2644,
        },
      },
      estimatedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    };

    // Check if shipment already exists
    let shipment = await Shipment.findOne({
      contractId,
    });

    if (!shipment) {
      shipment = await Shipment.create({
        ...shipmentData,
        status: ShipmentStatus.IN_TRANSIT,
        currentLocation: {
          address: 'Dubai-Al Ain Highway, KM 45',
          coordinates: {
            lat: 24.5,
            lng: 55.1,
          },
          lastUpdated: new Date(),
        },
        trackingEvents: [
          {
            status: ShipmentStatus.IN_PRODUCTION,
            description: 'Items being prepared at supplier facility',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            userId: logisticsUserId,
          },
          {
            status: ShipmentStatus.READY_FOR_PICKUP,
            location: {
              address: 'Jebel Ali Port, Logistics Hub',
              coordinates: {
                lat: 24.9857,
                lng: 55.0267,
              },
            },
            description: 'Items ready for pickup',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            userId: logisticsUserId,
          },
          {
            status: ShipmentStatus.IN_TRANSIT,
            location: {
              address: 'Dubai-Al Ain Highway, KM 45',
              coordinates: {
                lat: 24.5,
                lng: 55.1,
              },
            },
            description: 'In transit to destination',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            userId: logisticsUserId,
          },
        ],
      });
      console.log(`  ✓ Created Shipment for ${pr.title}: ${shipmentData.origin.city} → ${shipmentData.destination.city}`);
    } else {
      // Update existing shipment
      Object.assign(shipment, shipmentData);
      shipment.status = ShipmentStatus.IN_TRANSIT;
      if (!shipment.currentLocation) {
        shipment.currentLocation = {
          address: 'Dubai-Al Ain Highway, KM 45',
          coordinates: {
            lat: 24.5,
            lng: 55.1,
          },
          lastUpdated: new Date(),
        };
      }
      await shipment.save();
      console.log(`  ✓ Updated Shipment for ${pr.title}: ${shipmentData.origin.city} → ${shipmentData.destination.city}`);
    }

    shipmentIds[pr.title] = shipment._id;
  }

  console.log(`✅ Seeded ${Object.keys(shipmentIds).length} Shipments\n`);
  return shipmentIds;
};
