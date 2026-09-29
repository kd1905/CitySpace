/**
 * Geoapify Location Service
 * Provides address autocomplete, reverse geocoding, and nearby places biased for India.
 * Captures real coordinates and preserves building/society/street granularity.
 * API key is loaded dynamically from environment variables (.env).
 */

export interface GeoapifyPlace {
  formatted: string;
  name?: string;
  primary_text: string;
  secondary_text: string;
  address_line1?: string;
  address_line2?: string;
  street?: string;
  housenumber?: string;
  suburb?: string;
  district?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  lat: number;
  lon: number;
  place_id?: string;
  result_type?: string;
  confidence?: number;
}

export interface NearbyPoi {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  address?: string;
  lat: number;
  lon: number;
  distance?: number;
}

const getApiKey = (): string => {
  return (
    process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY ||
    (process.env as any)?.VITE_GEOAPIFY_API_KEY ||
    ''
  );
};

const getGoogleApiKey = (): string => {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (process.env as any)?.GOOGLE_PLACES_API_KEY ||
    (process.env as any)?.VITE_GOOGLE_PLACES_API_KEY ||
    (process.env as any)?.VITE_GOOGLE_MAPS_API_KEY ||
    ''
  );
};

/**
 * Resolves full place details (exact coordinates & address components)
 * from Google Places API (New) by Place ID.
 */
export async function resolvePlaceDetails(
  placeId: string,
  signal?: AbortSignal
): Promise<Partial<GeoapifyPlace> | null> {
  const googleKey = getGoogleApiKey();
  if (!googleKey || !placeId) return null;

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const res = await fetch(url, {
      signal,
      headers: {
        'X-Goog-Api-Key': googleKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,addressComponents,types',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();

    let street = '';
    let housenumber = '';
    let suburb = '';
    let city = '';
    let state = '';
    let postcode = '';

    for (const comp of data.addressComponents || []) {
      const types = comp.types || [];
      if (types.includes('street_number')) housenumber = comp.longText;
      if (types.includes('route')) street = comp.longText;
      if (
        types.includes('sublocality') ||
        types.includes('sublocality_level_1') ||
        types.includes('neighborhood')
      ) {
        if (!suburb) suburb = comp.longText;
      }
      if (types.includes('locality')) city = comp.longText;
      if (types.includes('administrative_area_level_1')) state = comp.longText;
      if (types.includes('postal_code')) postcode = comp.longText;
    }

    const name = data.displayName?.text || '';
    return {
      name,
      formatted: data.formattedAddress || '',
      street: street || undefined,
      housenumber: housenumber || undefined,
      suburb: suburb || undefined,
      city: city || undefined,
      state: state || undefined,
      postcode: postcode || undefined,
      lat: Number(data.location?.latitude || 0),
      lon: Number(data.location?.longitude || 0),
    };
  } catch (err) {
    return null;
  }
}

/**
 * Autocomplete via Google Places API (New) biased for India.
 */
async function searchGooglePlaces(
  trimmed: string,
  googleKey: string,
  signal?: AbortSignal
): Promise<GeoapifyPlace[]> {
  const url = 'https://places.googleapis.com/v1/places:autocomplete';
  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleKey,
    },
    body: JSON.stringify({
      input: trimmed,
      includedRegionCodes: ['in'],
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places Autocomplete request failed: ${response.status}`);
  }

  const data = await response.json();
  const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
  if (suggestions.length === 0) return [];

  // Fetch coordinates & components in parallel for top suggestions
  const resolved = await Promise.all(
    suggestions.slice(0, 6).map(async (s: any): Promise<GeoapifyPlace | null> => {
      const p = s.placePrediction;
      if (!p) return null;
      const pid = p.placeId;
      const primaryText = p.structuredFormat?.mainText?.text || p.text?.text || 'Location';
      const secondaryText = p.structuredFormat?.secondaryText?.text || '';
      const fallbackFormatted = p.text?.text || primaryText;

      const details = pid ? await resolvePlaceDetails(pid, signal) : null;
      return {
        formatted: details?.formatted || fallbackFormatted,
        name: details?.name || primaryText,
        primary_text: primaryText,
        secondary_text: secondaryText,
        address_line1: primaryText,
        address_line2: secondaryText,
        street: details?.street,
        housenumber: details?.housenumber,
        suburb: details?.suburb,
        city: details?.city,
        state: details?.state,
        postcode: details?.postcode,
        country: 'India',
        lat: details?.lat || 0,
        lon: details?.lon || 0,
        place_id: pid,
        result_type: p.types?.[0] || 'place',
        confidence: 1,
      };
    })
  );

  return resolved.filter(Boolean) as GeoapifyPlace[];
}

// Priority for search quality: exact building/society/street over broad administrative regions
const TYPE_PRIORITY: Record<string, number> = {
  amenity: 1,
  building: 2,
  place: 3,
  commercial: 4,
  residential: 5,
  neighbourhood: 6,
  suburb: 7,
  street: 8,
  postcode: 9,
  locality: 10,
  city: 11,
  county: 12,
  district: 13,
  state: 14,
  country: 15,
};

/**
 * Autocomplete address & places search biased for India.
 * Supports society names, apartments, buildings, landmarks, streets, localities, and PIN codes.
 */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeoapifyPlace[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  // 1. Try Google Places API (New) Autocomplete first when key is configured
  const googleKey = getGoogleApiKey();
  if (googleKey) {
    try {
      const googleResults = await searchGooglePlaces(trimmed, googleKey, signal);
      if (googleResults && googleResults.length > 0) {
        return googleResults;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return [];
      console.warn('[GooglePlaces] Search fallback to Geoapify:', err?.message || err);
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Geoapify] Missing API key in environment variables (VITE_GEOAPIFY_API_KEY / EXPO_PUBLIC_GEOAPIFY_API_KEY).');
    return [];
  }

  // Request up to 10 suggestions with country filter for India, unrestricted types
  const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
    trimmed
  )}&apiKey=${apiKey}&format=json&filter=countrycode:in&bias=countrycode:in&limit=10`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Geoapify autocomplete request failed: ${response.status} ${response.statusText}`);
    }

    let data = await response.json();
    let rawResults = Array.isArray(data?.results) ? data.results : [];

    // If autocomplete returned no matches (e.g. multi-word society names like "Karishma Society"),
    // fallback to full-text geocode search which handles fuzzy place & society queries
    if (rawResults.length === 0) {
      const searchUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        trimmed
      )}&apiKey=${apiKey}&format=json&filter=countrycode:in&bias=countrycode:in&limit=10`;
      const searchResponse = await fetch(searchUrl, { signal });
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (Array.isArray(searchData?.results)) {
          rawResults = searchData.results;
        }
      }
    }

    if (rawResults.length === 0) {
      return [];
    }

    const mapped: GeoapifyPlace[] = rawResults.map((item: any): GeoapifyPlace => {
      const name = item.name || '';
      const street = item.street || '';
      const housenumber = item.housenumber || '';
      const suburb = item.suburb || item.neighbourhood || item.district || '';
      const city = item.city || item.county || item.suburb || '';
      const state = item.state || '';
      const postcode = item.postcode || '';

      // Primary text: Place / Society / Building / Amenity / Street name
      let primaryText = name;
      if (!primaryText) {
        if (street) {
          primaryText = housenumber ? `${housenumber} ${street}` : street;
        } else {
          primaryText = item.address_line1 || item.formatted?.split(',')?.[0] || 'Unknown Location';
        }
      }

      // Secondary text: Locality / Suburb / Area, City, State, PIN
      const localityCity = [suburb, city].filter(Boolean).join(', ');
      const statePin = [state, postcode].filter(Boolean).join(' ');
      let secondaryText = [localityCity, statePin].filter(Boolean).join(', ');
      if (!secondaryText) {
        secondaryText = item.address_line2 || item.formatted || '';
      }

      // Construct formatted address ensuring society/building name is preserved at front
      let formatted = item.formatted || '';
      if (name && formatted && !formatted.toLowerCase().startsWith(name.toLowerCase())) {
        formatted = `${name}, ${formatted}`;
      } else if (!formatted) {
        formatted = [name, street, suburb, city, state, postcode, 'India']
          .filter(Boolean)
          .join(', ');
      }

      return {
        formatted,
        name: name || undefined,
        primary_text: primaryText,
        secondary_text: secondaryText,
        address_line1: item.address_line1 || primaryText,
        address_line2: item.address_line2 || secondaryText,
        street: street || undefined,
        housenumber: housenumber || undefined,
        suburb: suburb || undefined,
        district: item.district || undefined,
        city: city || undefined,
        state: state || undefined,
        postcode: postcode || undefined,
        country: item.country || 'India',
        lat: Number(item.lat),
        lon: Number(item.lon),
        place_id: item.place_id,
        result_type: item.result_type || 'unknown',
        confidence: item.rank?.confidence || 0,
      };
    });

    // Sort: Specific places/buildings/streets prioritized over broad city/state regions
    mapped.sort((a, b) => {
      const rankA = TYPE_PRIORITY[a.result_type || ''] || 20;
      const rankB = TYPE_PRIORITY[b.result_type || ''] || 20;
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      return (b.confidence || 0) - (a.confidence || 0);
    });

    return mapped;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return [];
    }
    console.error('[Geoapify] searchAddress error:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to an address.
 * Uses default reverse-geocoding without forcing generic postcode types.
 * Preserves society, building, and street granularity.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<GeoapifyPlace | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[Geoapify] Missing API key in environment variables.');
    return null;
  }

  // Use default reverse geocoding associated with the exact coordinate
  const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geoapify reverse geocoding failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.results) || data.results.length === 0) {
      return null;
    }

    const item = data.results[0];
    const name = item.name || '';
    const street = item.street || '';
    const housenumber = item.housenumber || '';
    const suburb = item.suburb || item.neighbourhood || item.district || '';
    const city = item.city || item.county || item.suburb || '';
    const state = item.state || '';
    // Use postcode ONLY if actually returned by the reverse geocode result
    const postcode = item.postcode || '';

    let primaryText = name;
    if (!primaryText) {
      if (street) {
        primaryText = housenumber ? `${housenumber} ${street}` : street;
      } else {
        primaryText = item.address_line1 || item.formatted?.split(',')?.[0] || 'Selected Point';
      }
    }

    const secondaryParts = [suburb, city, state, postcode].filter(Boolean);
    const secondaryText = secondaryParts.join(', ') || item.address_line2 || '';

    let formatted = item.formatted || '';
    if (name && formatted && !formatted.toLowerCase().startsWith(name.toLowerCase())) {
      formatted = `${name}, ${formatted}`;
    } else if (!formatted) {
      formatted = [name, street, suburb, city, state, postcode, 'India']
        .filter(Boolean)
        .join(', ');
    }

    return {
      formatted,
      name: name || undefined,
      primary_text: primaryText,
      secondary_text: secondaryText,
      address_line1: item.address_line1 || primaryText,
      address_line2: item.address_line2 || secondaryText,
      street: street || undefined,
      housenumber: housenumber || undefined,
      suburb: suburb || undefined,
      district: item.district || undefined,
      city: city || undefined,
      state: state || undefined,
      postcode: postcode || undefined,
      country: item.country || 'India',
      lat: Number(item.lat),
      lon: Number(item.lon),
      place_id: item.place_id,
      result_type: item.result_type || 'unknown',
    };
  } catch (error) {
    console.error('[Geoapify] reverseGeocode error:', error);
    throw error;
  }
}

const GOOGLE_TYPE_MAP: Record<string, { types: string[]; label: string }> = {
  'catering.restaurant': { types: ['restaurant', 'cafe'], label: 'Restaurant' },
  'healthcare.hospital': { types: ['hospital', 'medical_clinic'], label: 'Hospital' },
  'education.school': { types: ['school', 'university'], label: 'School' },
  'commercial.supermarket,commercial.shopping_mall': { types: ['shopping_mall', 'supermarket'], label: 'Shopping' },
  'service.financial.atm,service.financial.bank': { types: ['atm', 'bank'], label: 'Bank / ATM' },
  'healthcare.pharmacy': { types: ['pharmacy'], label: 'Pharmacy' },
};

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

async function getNearbyPlacesWithGoogle(
  lat: number,
  lon: number,
  category: string,
  googleKey: string,
  signal?: AbortSignal
): Promise<NearbyPoi[]> {
  const target = GOOGLE_TYPE_MAP[category];
  if (!target) return [];

  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const response = await fetch(url, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify({
      includedTypes: target.types,
      maxResultCount: 15,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lon },
          radius: 2500.0,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places searchNearby failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data?.places)) return [];

  return data.places.map((place: any): NearbyPoi => {
    const pLat = Number(place.location?.latitude || lat);
    const pLon = Number(place.location?.longitude || lon);
    const dist = getDistanceMeters(lat, lon, pLat, pLon);
    return {
      id: place.id || `${pLat}-${pLon}`,
      name: place.displayName?.text || 'Place of Interest',
      category,
      categoryLabel: target.label,
      address: place.formattedAddress || '',
      lat: pLat,
      lon: pLon,
      distance: dist,
    };
  });
}

/**
 * Fetches real nearby places from Google Places API (New) or Geoapify Places API v2.
 * Supports bounding box (current map viewport) or radius around coordinates.
 */
export async function getNearbyPlaces(
  lat: number,
  lon: number,
  category: string,
  bounds?: { minLat: number; minLon: number; maxLat: number; maxLon: number } | null,
  signal?: AbortSignal
): Promise<NearbyPoi[]> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return [];
  }

  // 1. Try Google Places API (New) Nearby Search first
  const googleKey = getGoogleApiKey();
  if (googleKey) {
    try {
      const googlePois = await getNearbyPlacesWithGoogle(lat, lon, category, googleKey, signal);
      if (googlePois && googlePois.length > 0) {
        return googlePois;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return [];
      console.warn('[GooglePlaces] getNearbyPlaces fallback to Geoapify:', err?.message || err);
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return [];
  }

  let filterParam = `circle:${lon},${lat},2500`;
  if (bounds && bounds.minLat && bounds.minLon && bounds.maxLat && bounds.maxLon) {
    filterParam = `rect:${bounds.minLon},${bounds.minLat},${bounds.maxLon},${bounds.maxLat}`;
  }

  const url = `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(
    category
  )}&filter=${filterParam}&bias=proximity:${lon},${lat}&limit=20&apiKey=${apiKey}`;

  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.features)) {
      return [];
    }

    return data.features.map((feat: any): NearbyPoi => {
      const props = feat.properties || {};
      const coords = feat.geometry?.coordinates || [lon, lat];
      return {
        id: props.place_id || `${coords[0]}-${coords[1]}`,
        name: props.name || props.address_line1 || 'Place of Interest',
        category,
        categoryLabel: props.categories?.[0] || 'Point of Interest',
        address: props.formatted || props.address_line2 || '',
        lat: Number(coords[1]),
        lon: Number(coords[0]),
        distance: props.distance,
      };
    });
  } catch (err: any) {
    if (err.name === 'AbortError') return [];
    console.warn('[Geoapify] getNearbyPlaces error:', err);
    return [];
  }
}
