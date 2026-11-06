import { Linking, Platform } from 'react-native';

/**
 * Calculates distance between two coordinates in miles using the Haversine formula.
 */
export function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Formats miles into a readable string (e.g. "0.4 mi away" or "12.8 mi away").
 */
export function formatDistance(miles: number): string {
  if (miles < 0.1) return 'Under 0.1 mi away';
  if (miles < 1) return `${miles.toFixed(1)} mi away`;
  return `${miles.toFixed(1)} mi away`;
}

/**
 * Provides an estimated delivery time string based on distance in miles.
 */
export function getDeliveryEstimate(miles: number): {
  time: string;
  badge: string;
  color: string;
} {
  if (miles <= 1.5) {
    return { time: '~15-20 mins', badge: 'Instant Delivery', color: '#10B981' };
  }
  if (miles <= 5) {
    return { time: '~25-35 mins', badge: 'Express Delivery', color: '#2563EB' };
  }
  if (miles <= 15) {
    return { time: '~45-60 mins', badge: 'Standard Delivery', color: '#8B5CF6' };
  }
  return { time: 'Same-day / Next-day', badge: 'Regional Delivery', color: '#F59E0B' };
}

/**
 * Opens Google Maps app or browser pinned to specified coordinates with a label.
 */
export async function openGoogleMaps(
  lat: number,
  lng: number,
  label?: string
): Promise<void> {
  const encodedLabel = encodeURIComponent(label || 'Location');
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const nativeUrl = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${lat},${lng}`,
    android: `geo:0,0?q=${lat},${lng}(${encodedLabel})`,
    default: webUrl,
  });

  try {
    const supported = await Linking.canOpenURL(nativeUrl);
    if (supported) {
      await Linking.openURL(nativeUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  } catch {
    await Linking.openURL(webUrl);
  }
}

/**
 * Opens Google Maps directions from current location to destination.
 */
export async function openGoogleMapsDirections(
  destLat: number,
  destLng: number,
  destAddress?: string
): Promise<void> {
  const query = destAddress ? encodeURIComponent(destAddress) : `${destLat},${destLng}`;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.warn('Could not open Google Maps directions:', err);
  }
}

/**
 * Searches an address or location query on Google Maps.
 */
export async function openGoogleMapsSearch(query: string): Promise<void> {
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.warn('Could not open Google Maps search:', err);
  }
}

