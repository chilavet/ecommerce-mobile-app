import React, { createContext, useContext, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocation, Product } from '../types';
import { calculateDistanceMiles } from '../utils/location';

export const PRESET_LOCATIONS: UserLocation[] = [
  {
    id: 'loc_ikeja',
    name: 'Ikeja (Allen & Alausa)',
    city: 'Ikeja, Lagos',
    state: 'Lagos State',
    formattedAddress: 'Allen Avenue, Ikeja, Lagos State, Nigeria',
    latitude: 6.6018,
    longitude: 3.3515,
    isCurrent: true,
  },
  {
    id: 'loc_lekki',
    name: 'Lekki Phase 1 (Admiralty Way)',
    city: 'Lekki Phase 1, Lagos',
    state: 'Lagos State',
    formattedAddress: 'Admiralty Way, Lekki Phase 1, Lagos State, Nigeria',
    latitude: 6.4474,
    longitude: 3.4723,
  },
  {
    id: 'loc_vi',
    name: 'Victoria Island (Adeola Odeku)',
    city: 'Victoria Island, Lagos',
    state: 'Lagos State',
    formattedAddress: 'Adeola Odeku St, Victoria Island, Lagos, Nigeria',
    latitude: 6.4281,
    longitude: 3.4219,
  },
  {
    id: 'loc_yaba',
    name: 'Yaba (Commercial Ave / Tech Hub)',
    city: 'Yaba, Lagos',
    state: 'Lagos State',
    formattedAddress: 'Commercial Ave, Yaba, Lagos State, Nigeria',
    latitude: 6.5142,
    longitude: 3.3762,
  },
  {
    id: 'loc_abuja',
    name: 'Abuja Central (Wuse II)',
    city: 'Wuse II, Abuja',
    state: 'FCT Abuja',
    formattedAddress: 'Aminu Kano Crescent, Wuse II, Abuja FCT, Nigeria',
    latitude: 9.0765,
    longitude: 7.4253,
  },
  {
    id: 'loc_ph',
    name: 'Port Harcourt (GRA Phase 2)',
    city: 'Port Harcourt, Rivers',
    state: 'Rivers State',
    formattedAddress: 'Tombia Street, GRA Phase 2, Port Harcourt, Rivers State',
    latitude: 4.8156,
    longitude: 7.0498,
  },
];

interface LocationContextType {
  currentLocation: UserLocation;
  presetLocations: UserLocation[];
  loadingLocation: boolean;
  permissionGranted: boolean | null;
  setLocation: (loc: UserLocation) => void;
  setCustomAddress: (address: string, city?: string) => void;
  requestDeviceLocation: () => Promise<{ success: boolean; message: string }>;
  enrichProductWithDistance: (product: Product) => Product;
  enrichAndSortProducts: (
    products: Product[],
    sortByDistance?: boolean
  ) => Product[];
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<UserLocation>(PRESET_LOCATIONS[0]);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const enrichProductWithDistance = (product: Product): Product => {
    if (!product.location) {
      return { ...product, distanceMiles: undefined };
    }
    const dist = calculateDistanceMiles(
      currentLocation.latitude,
      currentLocation.longitude,
      product.location.latitude,
      product.location.longitude
    );
    return {
      ...product,
      distanceMiles: dist,
    };
  };

  const enrichAndSortProducts = (
    products: Product[],
    sortByDistance: boolean = false
  ): Product[] => {
    const enriched = products.map(enrichProductWithDistance);
    if (!sortByDistance) return enriched;

    return [...enriched].sort((a, b) => {
      const distA = a.distanceMiles ?? 999999;
      const distB = b.distanceMiles ?? 999999;
      return distA - distB;
    });
  };

  const setLocation = (loc: UserLocation) => {
    setCurrentLocation(loc);
  };

  const setCustomAddress = (address: string, city: string = 'Custom Location') => {
    // Generate deterministic coordinate offset near current location for simulation
    const newLoc: UserLocation = {
      id: `loc_custom_${Date.now()}`,
      name: city,
      city: city,
      state: '',
      formattedAddress: address,
      latitude: currentLocation.latitude + 0.015,
      longitude: currentLocation.longitude + 0.012,
    };
    setCurrentLocation(newLoc);
  };

  const requestDeviceLocation = async (): Promise<{ success: boolean; message: string }> => {
    setLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        return {
          success: false,
          message: 'Location permission was denied. You can still select from available cities or search an address.',
        };
      }

      setPermissionGranted(true);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      let city = 'Current Device Location';
      let state = '';
      let formattedAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

      try {
        const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocoded) {
          city = geocoded.city || geocoded.subregion || geocoded.region || 'Nearby';
          state = geocoded.region || '';
          formattedAddress = [
            geocoded.name || geocoded.streetNumber ? `${geocoded.streetNumber || ''} ${geocoded.street || geocoded.name || ''}`.trim() : '',
            city,
            state,
            geocoded.postalCode,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch (geocodeErr) {
        console.warn('Reverse geocode error:', geocodeErr);
      }

      const deviceLoc: UserLocation = {
        id: 'loc_device',
        name: `${city}${state ? `, ${state}` : ''}`,
        city,
        state,
        formattedAddress: formattedAddress || `${city}, ${state}`,
        latitude,
        longitude,
        isCurrent: true,
      };

      setCurrentLocation(deviceLoc);
      return {
        success: true,
        message: `Location updated to: ${deviceLoc.formattedAddress}`,
      };
    } catch (err: any) {
      console.error('Error fetching device location:', err);
      return {
        success: false,
        message: err.message || 'Could not determine GPS coordinates. Please select a city.',
      };
    } finally {
      setLoadingLocation(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        presetLocations: PRESET_LOCATIONS,
        loadingLocation,
        permissionGranted,
        setLocation,
        setCustomAddress,
        requestDeviceLocation,
        enrichProductWithDistance,
        enrichAndSortProducts,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

