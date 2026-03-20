/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { AlertTriangle } from 'lucide-react';

// Re-use the existing supabase client if possible, but for now, 
// I'll assume it's imported or I'll pass it as a prop.
// Actually, I'll just import it from App.tsx if I could, but it's better to pass it.
// For this component, I'll assume it's available.

const riderIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2"/><circle cx="12" cy="7" r="4"/><path d="M7 21h10"/><path d="M12 18v3"/></svg>
        </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const customerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-10 h-10 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

interface RiderTrackingMapProps {
  customerLocation: { lat: number; lng: number } | null;
  customerAddress?: string;
  customerId?: string;
  riderLocationProp?: { lat: number; lng: number } | null;
  riderId: string;
  supabase: any;
  recenterTrigger?: number;
}

const FitBounds = ({ riderLocation, customerLocation, trigger }: { riderLocation: { lat: number; lng: number } | null, customerLocation: { lat: number; lng: number } | null, trigger?: number }) => {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (!hasFit.current) {
      if (riderLocation && customerLocation) {
        const bounds = L.latLngBounds([riderLocation, customerLocation]);
        map.fitBounds(bounds, { padding: [50, 50] });
        hasFit.current = true;
      } else if (riderLocation) {
        map.setView([riderLocation.lat, riderLocation.lng], 15);
        hasFit.current = true;
      } else if (customerLocation) {
        map.setView([customerLocation.lat, customerLocation.lng], 15);
        hasFit.current = true;
      }
    }
  }, [riderLocation, customerLocation, map]);

  useEffect(() => {
    if (trigger && trigger > 0) {
      if (riderLocation && customerLocation) {
        const bounds = L.latLngBounds([riderLocation, customerLocation]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (riderLocation) {
        map.setView([riderLocation.lat, riderLocation.lng], 15);
      } else if (customerLocation) {
        map.setView([customerLocation.lat, customerLocation.lng], 15);
      }
    }
  }, [trigger, riderLocation, customerLocation, map]);

  return null;
};

const RiderTrackingMap: React.FC<RiderTrackingMapProps> = ({ customerLocation: initialCustomerLocation, customerAddress, customerId, riderLocationProp, riderId, supabase, recenterTrigger }) => {
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(riderLocationProp || null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(initialCustomerLocation);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [hasAttemptedGeocode, setHasAttemptedGeocode] = useState(false);
  const lastRecalculation = useRef<number>(0);

  useEffect(() => {
    if (initialCustomerLocation) {
      setCustomerLocation(initialCustomerLocation);
    }
  }, [initialCustomerLocation]);

  useEffect(() => {
    setHasAttemptedGeocode(false);
    if (!initialCustomerLocation) {
      setCustomerLocation(null);
    }
  }, [customerAddress, initialCustomerLocation]);

  useEffect(() => {
    // If customer location is missing but address is available, try to fetch it from user_addresses
    if (!customerLocation && customerAddress && !isGeocoding && !hasAttemptedGeocode) {
      const fetchAddressCoordinates = async () => {
        setIsGeocoding(true);
        setHasAttemptedGeocode(true);
        try {
          let query = supabase.from('user_addresses').select('lat, lng').eq('address', customerAddress);
          if (customerId) {
            query = query.eq('user_id', customerId);
          }
          const { data, error } = await query.maybeSingle();
            
          if (data && data.lat != null && data.lng != null) {
            setCustomerLocation({ lat: Number(data.lat), lng: Number(data.lng) });
            console.log('Fetched address coordinates successfully:', { lat: data.lat, lng: data.lng });
          } else {
            console.warn('No coordinates found in user_addresses for address:', customerAddress);
          }
        } catch (error) {
          console.error('Error fetching address coordinates:', error);
        } finally {
          setIsGeocoding(false);
        }
      };
      fetchAddressCoordinates();
    }
  }, [customerLocation, customerAddress, isGeocoding, hasAttemptedGeocode]);

  useEffect(() => {
    if (riderLocationProp) {
      setRiderLocation(riderLocationProp);
    }
  }, [riderLocationProp]);

  useEffect(() => {
    const fetchCurrentOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select('lat, lng, rider_lat, rider_lng')
        .eq('rider_id', riderId)
        .neq('status', 'Delivered')
        .maybeSingle();
      
      if (data) {
        if (data.rider_lat && data.rider_lng) {
          setRiderLocation({ lat: Number(data.rider_lat), lng: Number(data.rider_lng) });
        }
        if (data.lat && data.lng) {
          setCustomerLocation({ lat: Number(data.lat), lng: Number(data.lng) });
        }
      }
    };
    fetchCurrentOrder();
  }, [riderId, supabase]);

  useEffect(() => {
    // Subscribe to rider location if not provided or to keep it updated
    const channel = supabase
      .channel(`rider_location_${riderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `rider_id=eq.${riderId}`
      }, (payload: any) => {
        const { rider_lat, rider_lng, lat, lng } = payload.new;
        if (rider_lat && rider_lng) {
          setRiderLocation({ lat: Number(rider_lat), lng: Number(rider_lng) });
        }
        if (lat && lng) {
          setCustomerLocation({ lat: Number(lat), lng: Number(lng) });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [riderId, supabase]);

  useEffect(() => {
    if (!riderLocation || !customerLocation) return;

    const now = Date.now();
    if (now - lastRecalculation.current > 10000) {
      lastRecalculation.current = now;
      
      // Fetch route from OpenRouteService
      const fetchRoute = async () => {
        try {
          const response = await axios.get(`/api/route`, {
            params: {
              start_lng: riderLocation.lng,
              start_lat: riderLocation.lat,
              end_lng: customerLocation.lng,
              end_lat: customerLocation.lat
            }
          });
          
          if (response.data.features && response.data.features.length > 0) {
            const coords = response.data.features[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
            setRoute(coords);
          }
        } catch (error) {
          console.error('Error fetching route:', error);
        }
      };
      fetchRoute();
    }
  }, [riderLocation, customerLocation]);

  const center = customerLocation ? [customerLocation.lat, customerLocation.lng] : (riderLocation ? [riderLocation.lat, riderLocation.lng] : [0, 0]);

  return (
    <>
      <MapContainer key={`${center[0]}-${center[1]}`} center={center as [number, number]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {customerLocation && <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon} />}
        {riderLocation && <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon} />}
        {route.length > 0 && <Polyline positions={route} color="#2563eb" weight={4} opacity={0.7} />}
        <FitBounds riderLocation={riderLocation} customerLocation={customerLocation} trigger={recenterTrigger} />
      </MapContainer>
      {!customerLocation && !isGeocoding && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-amber-50 border border-amber-200 px-4 py-2 rounded-full shadow-lg">
          <p className="text-amber-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <AlertTriangle size={12} /> Destination coordinates missing
          </p>
        </div>
      )}
    </>
  );
};

export default RiderTrackingMap;
