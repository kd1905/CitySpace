import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  DimensionValue,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LocationVisibility } from '@/types/property';
import { LeafletPropertyMap } from './LeafletPropertyMap';

export interface GooglePropertyMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  height?: DimensionValue;
  isInteractive?: boolean;
  locationVisibility?: LocationVisibility;
  title?: string;
  address?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Global script loading tracker to avoid duplicate script tags on web
let googleMapsScriptPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject();
  if ((window as any).google && (window as any).google.maps) {
    return Promise.resolve();
  }
  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-js-sdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Google Maps script load error')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

export const GooglePropertyMap: React.FC<GooglePropertyMapProps> = ({
  latitude,
  longitude,
  zoom = 15,
  height = 320,
  isInteractive = false,
  locationVisibility = 'PUBLIC_EXACT',
  title = 'Property Location',
  address,
  onLocationSelect,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  // Use dedicated Maps JS API key (do not inadvertently use Places-only keys that lack Maps JS activation)
  const apiKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    (process.env as any)?.VITE_GOOGLE_MAPS_API_KEY ||
    '';

  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [usingFallback, setUsingFallback] = useState<boolean>(!apiKey);

  // Approximate calculation for PUBLIC_APPROXIMATE mode
  const displayLat =
    locationVisibility === 'PUBLIC_APPROXIMATE'
      ? Number((latitude + 0.003).toFixed(4))
      : latitude;
  const displayLng =
    locationVisibility === 'PUBLIC_APPROXIMATE'
      ? Number((longitude + 0.003).toFixed(4))
      : longitude;

  useEffect(() => {
    // Catch Google Maps authentication or activation failure (e.g. ApiNotActivatedMapError)
    if (typeof window !== 'undefined') {
      (window as any).gm_authFailure = () => {
        console.warn(
          '[GooglePropertyMap] Google Maps JavaScript API authentication failed (e.g. ApiNotActivatedMapError). Gracefully falling back to OpenStreetMap / Leaflet.'
        );
        setHasError(true);
        setUsingFallback(true);
        setLoading(false);
      };
    }

    // If HIDDEN mode, don't attempt to load map
    if (locationVisibility === 'HIDDEN') {
      setLoading(false);
      return;
    }

    if (Platform.OS !== 'web' || !apiKey) {
      setUsingFallback(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!isMounted || !mapRef.current) return;
        const google = (window as any).google;
        if (!google || !google.maps) {
          setUsingFallback(true);
          setLoading(false);
          return;
        }

        // Initialize Map
        const mapOptions = {
          center: { lat: displayLat, lng: displayLng },
          zoom,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          mapId: 'DEMO_MAP_ID',
        };

        const map = new google.maps.Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Helper to create legacy Marker
        const createLegacyMarker = () => {
          const marker = new google.maps.Marker({
            position: { lat: displayLat, lng: displayLng },
            map,
            draggable: isInteractive,
            title: title || 'Property',
            animation: google.maps.Animation?.DROP,
          });
          markerInstanceRef.current = marker;

          if (isInteractive && onLocationSelect) {
            marker.addListener('dragend', (e: any) => {
              const newLat = e.latLng.lat();
              const newLng = e.latLng.lng();
              onLocationSelect(newLat, newLng);
            });

            map.addListener('click', (e: any) => {
              const newLat = e.latLng.lat();
              const newLng = e.latLng.lng();
              marker.setPosition({ lat: newLat, lng: newLng });
              onLocationSelect(newLat, newLng);
            });
          }
        };

        // Initialize Marker
        if (locationVisibility === 'PUBLIC_APPROXIMATE') {
          // Circle overlay for approximate location
          new google.maps.Circle({
            strokeColor: '#0284C7',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#38BDF8',
            fillOpacity: 0.25,
            map,
            center: { lat: displayLat, lng: displayLng },
            radius: 500, // 500 meter approximate radius
          });
        } else {
          // Prefer modern AdvancedMarkerElement (Google Maps 2024+)
          let markerPlaced = false;
          if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
            try {
              const advMarker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: displayLat, lng: displayLng },
                map,
                title: title || 'Property',
                gmpDraggable: isInteractive,
              });
              markerInstanceRef.current = advMarker;
              markerPlaced = true;

              if (isInteractive && onLocationSelect) {
                advMarker.addListener('dragend', () => {
                  const pos = advMarker.position;
                  if (pos) {
                    const newLat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
                    const newLng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;
                    onLocationSelect(Number(newLat), Number(newLng));
                  }
                });

                map.addListener('click', (e: any) => {
                  const newLat = e.latLng.lat();
                  const newLng = e.latLng.lng();
                  advMarker.position = { lat: newLat, lng: newLng };
                  onLocationSelect(newLat, newLng);
                });
              }
            } catch (err) {
              console.warn('[GooglePropertyMap] AdvancedMarkerElement failed, using fallback:', err);
            }
          }

          if (!markerPlaced) {
            createLegacyMarker();
          }
        }

        setLoading(false);
        setUsingFallback(false);
      })
      .catch((err) => {
        console.warn('Google Maps Script load failed:', err);
        if (isMounted) {
          setHasError(true);
          setUsingFallback(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [apiKey, latitude, longitude, zoom, isInteractive, locationVisibility]);

  // Handle fallback click to simulate location picking when API key is missing
  const handleFallbackClick = (e: any) => {
    if (!isInteractive || !onLocationSelect) return;
    // Simulate slight offset calculation for fallback map click
    const rect = e.currentTarget?.getBoundingClientRect?.();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const latOffset = (0.5 - y / rect.height) * 0.01;
    const lngOffset = (x / rect.width - 0.5) * 0.01;
    const newLat = Number((latitude + latOffset).toFixed(5));
    const newLng = Number((longitude + lngOffset).toFixed(5));
    onLocationSelect(newLat, newLng);
  };

  // 1. HIDDEN Mode
  if (locationVisibility === 'HIDDEN') {
    return (
      <View style={[styles.hiddenCard, { height: height as DimensionValue }]}>
        <View style={styles.hiddenIconCircle}>
          <Feather name="lock" size={24} color="#64748B" />
        </View>
        <Text style={styles.hiddenTitle}>Location Available on Enquiry</Text>
        <Text style={styles.hiddenSub}>
          The property owner has requested exact geographic privacy prior to buyer consultation.
        </Text>
      </View>
    );
  }

  // 2. Interactive Google Maps (Web with active key)
  if (Platform.OS === 'web' && apiKey && !usingFallback && !hasError) {
    return (
      <View style={[styles.mapContainer, { height: height as DimensionValue }]}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#0F172A" />
            <Text style={styles.loadingText}>Loading Google Map...</Text>
          </View>
        )}
        <div ref={mapRef as any} style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }

  // 3. Fallback to Leaflet + OpenStreetMap on Web when Google Maps key is missing
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.mapContainer, { height: height as DimensionValue }]}>
        <LeafletPropertyMap
          latitude={displayLat}
          longitude={displayLng}
          height={height}
          isInteractive={isInteractive}
          onLocationChange={
            onLocationSelect
              ? (loc) => onLocationSelect(loc.lat, loc.lng)
              : undefined
          }
        />
      </View>
    );
  }

  // 4. Native Fallback Simulator (When non-web)
  return (
    <View style={[styles.fallbackContainer, { height: height as DimensionValue }]}>

      {/* Stylized Grid Canvas */}
      <TouchableOpacity
        activeOpacity={isInteractive ? 0.95 : 1}
        onPress={handleFallbackClick}
        style={styles.canvasBackground}
      >
        {/* Latitude & Longitude grid lines background */}
        <View style={styles.gridOverlay}>
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
          <View style={styles.gridLineVertical} />
        </View>

        {/* Center Marker or Approximate Radius */}
        {locationVisibility === 'PUBLIC_APPROXIMATE' ? (
          <View style={styles.approxCircle}>
            <Text style={styles.approxCircleText}>Approximate Neighborhood Area</Text>
          </View>
        ) : (
          <View style={styles.markerGroup}>
            <View style={styles.markerPulse} />
            <View style={styles.markerPin}>
              <Feather name="map-pin" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.markerLabelCard}>
              <Text style={styles.markerLabelTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.markerLabelCoords}>
                {displayLat.toFixed(4)}° N, {displayLng.toFixed(4)}° E
              </Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Footer Info */}
      <View style={styles.fallbackFooter}>
        <View style={styles.coordsRow}>
          <Feather name="navigation" size={13} color="#64748B" style={{ marginRight: 5 }} />
          <Text style={styles.coordsText}>
            Lat: {displayLat.toFixed(5)}, Lng: {displayLng.toFixed(5)}
          </Text>
        </View>
        {isInteractive && (
          <Text style={styles.hintText}>Tap canvas to set coordinates</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  hiddenCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  hiddenIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  hiddenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  hiddenSub: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 360,
    lineHeight: 20,
  },
  fallbackContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    zIndex: 5,
  },
  devBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  canvasBackground: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-around',
    alignItems: 'center',
    opacity: 0.15,
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  gridLineVertical: {
    height: '100%',
    width: 1,
    backgroundColor: '#FFFFFF',
  },
  markerGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(2, 132, 199, 0.3)',
  },
  markerPin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  markerLabelCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    maxWidth: 220,
  },
  markerLabelTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  markerLabelCoords: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  approxCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  approxCircleText: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  fallbackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordsText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  hintText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
});
