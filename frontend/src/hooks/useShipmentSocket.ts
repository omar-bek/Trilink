import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketService } from '@/services/socket.service';
import { useAuthStore } from '@/store/auth.store';
import { ShipmentStatusUpdate, GPSLocationUpdate } from '@/types/shipment';
import { queryKeys, invalidateListQueries, invalidateDetailQuery } from '@/lib/queryKeys';

/**
 * Hook for subscribing to shipment socket updates
 * Automatically connects to shipments namespace and subscribes to shipment room
 */
export const useShipmentSocket = (shipmentId: string | undefined) => {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!shipmentId || !accessToken) {
      // Cleanup if no shipmentId or token
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Connect to shipments namespace if not connected
    if (!socketService.isConnected('shipments')) {
      socketService.connect(accessToken, ['shipments']);
    }

    // Subscribe to shipment updates
    const unsubscribe = socketService.subscribeToShipment(shipmentId, {
      onStatusUpdate: (data: ShipmentStatusUpdate) => {
        // Invalidate and refetch shipment data
        invalidateDetailQuery(queryClient, 'shipments', shipmentId);
        invalidateListQueries(queryClient, 'shipments');
      },
      onLocationUpdate: (data: GPSLocationUpdate) => {
        // Update shipment data optimistically
        queryClient.setQueryData(queryKeys.shipments.detail(shipmentId), (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: {
              ...old.data,
              currentLocation: {
                ...((data as any).location || data),
                lastUpdated: new Date().toISOString(),
              },
            },
          };
        });
      },
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [shipmentId, accessToken, queryClient]);
};
