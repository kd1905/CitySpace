import { PropertyLocation } from '@/types/property';
import { Linking, Platform } from 'react-native';

/**
 * Generates a dynamic Google Maps URL to view a property's exact location.
 * ALWAYS presents the human-readable Place Name (society, building, neighborhood, or address)
 * rather than raw latitude and longitude coordinates.
 */
export function getPropertyMapUrl(
  location?: (PropertyLocation & { latitude?: number; longitude?: number; name?: string; placeName?: string; googlePlaceId?: string }) | any,
  title?: string
): string | null {
  if (!location) return null;

  const lat = location.coordinates?.lat ?? location.latitude;
  const lng = location.coordinates?.lng ?? location.longitude;
  const placeId = location.googlePlaceId || location.place_id;

  // 1. Identify specific place / society / building / neighborhood name
  const specificName = (
    location.name ||
    location.placeName ||
    ''
  ).trim();

  // 2. Build human-readable descriptive query
  // Priority: Specific Place Name -> Full Address -> Neighborhood -> Title -> City
  let queryText = '';

  if (specificName) {
    const parts = [
      specificName,
      location.neighborhood && !specificName.toLowerCase().includes(location.neighborhood.toLowerCase())
        ? location.neighborhood
        : '',
      location.city && !specificName.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    queryText = parts.join(', ');
  } else if (location.address) {
    const parts = [
      location.address,
      location.neighborhood && !location.address.toLowerCase().includes(location.neighborhood.toLowerCase())
        ? location.neighborhood
        : '',
      location.city && !location.address.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    queryText = parts.join(', ');
  } else if (location.neighborhood) {
    const parts = [
      location.neighborhood,
      location.city && !location.neighborhood.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    queryText = parts.join(', ');
  } else if (title) {
    const parts = [
      title,
      location.city && !title.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    queryText = parts.join(', ');
  } else if (location.city) {
    queryText = location.city;
  }

  // 3. Priority 1: Verified Google Place ID
  // Directly opens the Google Maps place card with the verified place name, rating, photos, and pin
  if (placeId && typeof placeId === 'string' && placeId.startsWith('ChIJ')) {
    const placeQuery = queryText || 'Property Location';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeQuery)}&query_place_id=${encodeURIComponent(placeId)}`;
  }

  // 4. Priority 2: Text search by Place Name / Address / Society
  // Using query=<place_name> ensures Google Maps displays the real name on the card title, NOT coordinates
  if (queryText.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryText.trim())}`;
  }

  // 5. Priority 3: Coordinate fallback only when no text or address information is present
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    (lat !== 0 || lng !== 0)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  return null;
}

/**
 * Generates a dynamic Google Maps Directions URL from user's current location to property.
 * Targets the Place Name or Address rather than coordinates for clear navigation destination.
 * 
 * Flow:
 * Property Details -> [Start Direction] -> Google Maps -> Current Location -> Property -> Route Displayed
 * 
 * Format:
 * https://www.google.com/maps/dir/?api=1&destination=PROPERTY&dir_action=navigate
 * (and &destination_place_id=PLACE_ID if available)
 * 
 * Origin is intentionally omitted so Google Maps uses the device's Current Location automatically.
 * Raw coordinates are NEVER displayed as the destination text.
 */
export function getPropertyDirectionsUrl(
  location?: (PropertyLocation & { latitude?: number; longitude?: number; name?: string; placeName?: string; googlePlaceId?: string }) | any,
  title?: string
): string | null {
  if (!location) return null;

  const placeId = location.googlePlaceId || location.place_id;

  // 1. Identify specific place / society / building / neighborhood name
  const specificName = (
    location.name ||
    location.placeName ||
    ''
  ).trim();

  // 2. Build human-readable descriptive destination text (never raw coordinates)
  let destText = '';

  if (specificName) {
    const parts = [
      specificName,
      location.neighborhood && !specificName.toLowerCase().includes(location.neighborhood.toLowerCase())
        ? location.neighborhood
        : '',
      location.city && !specificName.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    destText = parts.join(', ');
  } else if (location.address) {
    const parts = [
      location.address,
      location.neighborhood && !location.address.toLowerCase().includes(location.neighborhood.toLowerCase())
        ? location.neighborhood
        : '',
      location.city && !location.address.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    destText = parts.join(', ');
  } else if (location.neighborhood) {
    const parts = [
      location.neighborhood,
      location.city && !location.neighborhood.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    destText = parts.join(', ');
  } else if (title) {
    const parts = [
      title,
      location.city && !title.toLowerCase().includes(location.city.toLowerCase())
        ? location.city
        : '',
    ].filter(Boolean);
    destText = parts.join(', ');
  } else if (location.city) {
    destText = `${location.city}, India`;
  } else {
    destText = 'Property Location';
  }

  // 3. Construct Google Maps Directions Universal URL
  // Parameters per Google Maps Universal URLs Specification:
  // - api=1 (required)
  // - destination (required, human-readable name/address)
  // - destination_place_id (optional, pinpoint Google Place ID)
  // - dir_action=navigate (launches turn-by-turn navigation / route view immediately)
  // Origin is omitted so Google Maps uses the user's current device location automatically
  const params: string[] = [
    'api=1',
    `destination=${encodeURIComponent(destText.trim())}`,
  ];

  if (placeId && typeof placeId === 'string' && placeId.startsWith('ChIJ')) {
    params.push(`destination_place_id=${encodeURIComponent(placeId)}`);
  }

  params.push('dir_action=navigate');

  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

/**
 * Safely opens an external map URL in a new browser tab on web or native Linking.
 */
export function openExternalMap(url: string | null): void {
  if (!url) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert('Location not available for this property.');
    }
    return;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(url).catch((err) => {
      console.warn('Failed to open map URL:', err);
    });
  }
}
