import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  ScrollView,
  DimensionValue,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  reverseGeocode,
  getNearbyPlaces,
  GeoapifyPlace,
  NearbyPoi,
} from '@/services/geoapifyService';

export interface LeafletPropertyMapProps {
  latitude: number;
  longitude: number;
  height?: DimensionValue;
  isInteractive?: boolean;
  showNearbyControls?: boolean;
  onLocationChange?: (location: {
    lat: number;
    lng: number;
    place?: GeoapifyPlace | null;
  }) => void;
  style?: any;
}

// Inject Leaflet CSS once
function ensureLeafletCss() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('leaflet-css-bundle')) return;
  const link = document.createElement('link');
  link.id = 'leaflet-css-bundle';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

// Google Maps style red pin marker
const GOOGLE_PIN_SVG = `
<svg width="34" height="46" viewBox="0 0 34 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 0C7.61 0 0 7.61 0 17C0 29.75 17 46 17 46C17 46 34 29.75 34 17C34 7.61 26.39 0 17 0Z" fill="#EA4335"/>
  <ellipse cx="17" cy="17" rx="7" ry="7" fill="#FFFFFF"/>
  <circle cx="17" cy="17" r="4.2" fill="#B31412"/>
</svg>
`;

const POI_CATEGORIES = [
  { id: 'catering.restaurant', label: 'Restaurants', icon: 'coffee', color: '#EA580C' },
  { id: 'healthcare.hospital', label: 'Hospitals', icon: 'activity', color: '#DC2626' },
  { id: 'education.school', label: 'Schools', icon: 'book-open', color: '#2563EB' },
  { id: 'commercial.supermarket,commercial.shopping_mall', label: 'Shopping', icon: 'shopping-bag', color: '#9333EA' },
  { id: 'service.financial.atm,service.financial.bank', label: 'ATMs & Banks', icon: 'dollar-sign', color: '#059669' },
  { id: 'healthcare.pharmacy', label: 'Pharmacies', icon: 'plus-circle', color: '#0D9488' },
];

export const LeafletPropertyMap: React.FC<LeafletPropertyMapProps> = ({
  latitude,
  longitude,
  height = 300,
  isInteractive = true,
  showNearbyControls = true,
  onLocationChange,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const poiLayerRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loadingPois, setLoadingPois] = useState(false);
  const [poiCount, setPoiCount] = useState<number | null>(null);

  // Initialize Map
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    ensureLeafletCss();

    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default || (await import('leaflet'));

        if (!isMounted || !containerRef.current) return;

        // Clean up previous instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const initialLat = Number.isFinite(latitude) && latitude !== 0 ? latitude : 18.5204;
        const initialLng = Number.isFinite(longitude) && longitude !== 0 ? longitude : 73.8567;

        const map = L.map(containerRef.current, {
          center: [initialLat, initialLng],
          zoom: 17,
          minZoom: 4,
          maxZoom: 19,
          zoomControl: isInteractive,
          dragging: isInteractive,
          scrollWheelZoom: isInteractive,
          doubleClickZoom: isInteractive,
          touchZoom: isInteractive,
        });

        // High quality OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Layer group for nearby POI markers
        poiLayerRef.current = L.layerGroup().addTo(map);

        const customIcon = L.divIcon({
          className: 'cityspace-google-marker',
          html: `<div style="transform: translate(-17px, -46px); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4)); cursor: ${
            isInteractive ? 'grab' : 'default'
          };">${GOOGLE_PIN_SVG}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const marker = L.marker([initialLat, initialLng], {
          icon: customIcon,
          draggable: isInteractive,
          title: 'Property Location',
        }).addTo(map);

        // Position update from user interaction: captures exact Leaflet coordinates
        const handlePositionUpdate = async (exactLat: number, exactLng: number) => {
          if (!onLocationChange) return;

          setIsGeocoding(true);
          setErrorMessage(null);
          try {
            const place = await reverseGeocode(exactLat, exactLng);
            // Pass exact clicked/dragged coordinates alongside the resolved place
            onLocationChange({ lat: exactLat, lng: exactLng, place });
          } catch (err) {
            console.error('[LeafletMap] Reverse geocode error:', err);
            setErrorMessage('Could not resolve address details. Exact position saved.');
            onLocationChange({ lat: exactLat, lng: exactLng, place: null });
          } finally {
            setIsGeocoding(false);
          }
        };

        if (isInteractive) {
          // Marker drag event
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            handlePositionUpdate(pos.lat, pos.lng);
          });

          // Map click event: captures exact clicked point
          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            map.panTo([lat, lng]);
            handlePositionUpdate(lat, lng);
          });

          // Refresh POIs on map pan / zoom when a category is active
          map.on('moveend', () => {
            if (activeCategoryRef.current) {
              loadPoisForCurrentBounds(activeCategoryRef.current);
            }
          });
        }

        mapInstanceRef.current = map;
        markerRef.current = marker;
        setLoading(false);

        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      } catch (err: any) {
        console.error('[LeafletMap] Initialization error:', err);
        setErrorMessage('Failed to load interactive map.');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const activeCategoryRef = useRef<string | null>(null);
  activeCategoryRef.current = activeCategory;

  // Load nearby POIs for current map bounds
  const loadPoisForCurrentBounds = useCallback(
    async (catId: string) => {
      if (!mapInstanceRef.current || !poiLayerRef.current) return;
      const L = (window as any).L || (await import('leaflet')).default;

      setLoadingPois(true);
      try {
        const bounds = mapInstanceRef.current.getBounds();
        const pois = await getNearbyPlaces(
          latitude,
          longitude,
          catId,
          {
            minLat: bounds.getSouth(),
            minLon: bounds.getWest(),
            maxLat: bounds.getNorth(),
            maxLon: bounds.getEast(),
          }
        );

        poiLayerRef.current.clearLayers();
        setPoiCount(pois.length);

        const categoryInfo = POI_CATEGORIES.find((c) => c.id === catId);
        const catColor = categoryInfo?.color || '#2563EB';

        pois.forEach((poi) => {
          const poiIcon = L.divIcon({
            className: 'cityspace-poi-marker',
            html: `
              <div style="
                transform: translate(-12px, -12px);
                width: 24px;
                height: 24px;
                border-radius: 12px;
                background-color: ${catColor};
                border: 2px solid #FFFFFF;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              ">
                <div style="width: 7px; height: 7px; border-radius: 4px; background-color: #FFFFFF;"></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const poiMarker = L.marker([poi.lat, poi.lon], { icon: poiIcon });
          poiMarker.bindPopup(`
            <div style="font-family: sans-serif; padding: 4px;">
              <strong style="font-size: 13px; color: #0F172A;">${poi.name}</strong>
              ${poi.address ? `<div style="font-size: 11px; color: #64748B; margin-top: 3px;">${poi.address}</div>` : ''}
              ${poi.distance ? `<div style="font-size: 10px; color: #059669; margin-top: 2px; font-weight: 600;">~${poi.distance}m away</div>` : ''}
            </div>
          `);
          poiLayerRef.current.addLayer(poiMarker);
        });
      } catch (err) {
        console.warn('[LeafletMap] Failed to load POIs:', err);
      } finally {
        setLoadingPois(false);
      }
    },
    [latitude, longitude]
  );

  const toggleCategory = (catId: string) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
      setPoiCount(null);
      if (poiLayerRef.current) {
        poiLayerRef.current.clearLayers();
      }
    } else {
      setActiveCategory(catId);
      loadPoisForCurrentBounds(catId);
    }
  };

  // Fly to exact coordinates when external coordinates change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const currentPos = markerRef.current.getLatLng();
    const latDiff = Math.abs(currentPos.lat - latitude);
    const lngDiff = Math.abs(currentPos.lng - longitude);

    if (latDiff > 0.00001 || lngDiff > 0.00001) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.flyTo([latitude, longitude], 17, { duration: 0.8 });
    }
  }, [latitude, longitude]);

  return (
    <View style={[styles.wrapper, style]}>
      {/* Optional Google Maps-style Nearby POI Category Controls */}
      {showNearbyControls && isInteractive && (
        <View style={styles.poiBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.poiScrollContent}
          >
            {POI_CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={[
                    styles.poiChip,
                    isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                  ]}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={cat.icon as any}
                    size={12}
                    color={isSelected ? '#FFFFFF' : '#475569'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.poiChipText, isSelected && styles.poiChipTextActive]}>
                    {cat.label}
                  </Text>
                  {isSelected && typeof poiCount === 'number' && (
                    <View style={styles.poiCountBadge}>
                      <Text style={styles.poiCountText}>{poiCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[styles.container, { height }]}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#EA4335" />
            <Text style={styles.statusText}>Loading map...</Text>
          </View>
        )}

        {isGeocoding && (
          <View style={styles.geocodingBadge}>
            <ActivityIndicator size="small" color="#EA4335" />
            <Text style={styles.geocodingText}>Resolving address details...</Text>
          </View>
        )}

        {loadingPois && (
          <View style={styles.poisLoadingBadge}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.poisLoadingText}>Searching nearby places...</Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorBadge}>
            <Feather name="alert-circle" size={13} color="#DC2626" />
            <Text style={styles.errorBadgeText}>{errorMessage}</Text>
          </View>
        )}

        {/* Leaflet Map DOM Element */}
        <div
          ref={containerRef as any}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            zIndex: 1,
          }}
        />

        {isInteractive && (
          <View style={styles.mapHintBadge}>
            <Feather name="info" size={12} color="#475569" style={{ marginRight: 5 }} />
            <Text style={styles.mapHintText}>
              Click map or drag the pin to pinpoint exact property location
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    gap: 8,
  },
  poiBarContainer: {
    marginBottom: 4,
  },
  poiScrollContent: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  poiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        ':hover': { borderColor: '#94A3B8' },
      } as any,
    }),
  },
  poiChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  poiChipTextActive: {
    color: '#FFFFFF',
  },
  poiCountBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  poiCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  container: {
    position: 'relative',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  geocodingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  geocodingText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  poisLoadingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  poisLoadingText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  errorBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 20,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBadgeText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '500',
  },
  mapHintBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapHintText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
});
