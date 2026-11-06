import React, { createContext, useContext, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocation, Product } from '../types';
import { calculateDistanceMiles } from '../utils/location';

export const PRESET_LOCATIONS: UserLocation[] = [
  {
    id: 'loc_mv',
    name: 'Mountain View (Googleplex)',
    city: 'Mountain View',
    state: 'CA',
    formattedAddress: '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
    latitude: 37.4220,
    longitude: -122.0841,
    isCurrent: true,
  },
  {
    id: 'loc_pa',
    name: 'Palo Alto (Stanford)',
    city: 'Palo Alto',
    state: 'CA',
    formattedAddress: '379 Stanford Shopping Ctr, Palo Alto, CA 94304',
    latitude: 37.4435,
    longitude: -122.1712,
  },
  {
    id: 'loc_sv',
    name: 'Sunnyvale Tech District',
    city: 'Sunnyvale',
    state: 'CA',
    formattedAddress: '1020 W El Camino Real, Sunnyvale, CA 94087',
    latitude: 37.3718,
    longitude: -122.0450,
  },
  {
    id: 'loc_sj',
    name: 'San Jose (Santana Row)',
    city: 'San Jose',
    state: 'CA',
    formattedAddress: '377 Santana Row, San Jose, CA 95128',
    latitude: 37.3218,
    longitude: -121.9478,
  },
  {
    id: 'loc_sf',
    name: 'San Francisco (Downtown / SOMA)',
    city: 'San Francisco',
    state: 'CA',
    formattedAddress: '855 Folsom St, San Francisco, CA 94107',
    latitude: 37.7815,
    longitude: -122.4010,
  },
  {
    id: 'loc_ny',
    name: 'New York (Manhattan)',
    city: 'New York',
    state: 'NY',
    formattedAddress: '350 5th Ave, New York, NY 10118',
    latitude: 40.7484,
    longitude: -73.9857,
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
