import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows } from '@/constants/layout';
import { agentService } from '@/services/agentService';
import {
  FurnishingStatus,
  ListingType,
  Property,
  PropertyCategoryType,
  PropertyStatus
} from '@/types/property';
import { Feather } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageUploader } from './ImageUploader';
import { PropertyPreview } from './PropertyPreview';
import { LeafletPropertyMap } from '../map/LeafletPropertyMap';
import { SelectOnMapModal } from '../map/SelectOnMapModal';
import { searchAddress, GeoapifyPlace } from '@/services/geoapifyService';
import { getPropertyMapUrl, openExternalMap } from '@/utils/mapUtils';

export interface PropertyFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Property>;
  onSubmit: (data: Omit<Property, 'id' | 'slug' | 'createdAt'>, action: 'draft' | 'published') => void;
  onCancel: () => void;
}

const ALL_AMENITIES = [
  { id: 'parking', name: 'Parking', icon: 'truck' },
  { id: 'lift', name: 'Lift', icon: 'arrow-up' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'pool', name: 'Swimming Pool', icon: 'droplet' },
  { id: 'gym', name: 'Gym', icon: 'activity' },
  { id: 'garden', name: 'Garden', icon: 'sun' },
  { id: 'backup', name: 'Power Backup', icon: 'zap' },
  { id: 'cctv', name: 'CCTV', icon: 'video' },
  { id: 'clubhouse', name: 'Clubhouse', icon: 'home' },
  { id: 'balcony', name: 'Balcony', icon: 'compass' },
  { id: 'water', name: 'Water Supply', icon: 'life-buoy' },
];

const PROPERTY_GROUPS: {
  group: string;
  types: { id: PropertyCategoryType; label: string }[];
}[] = [
    {
      group: 'Residential',
      types: [
        { id: 'apartment', label: 'Apartment' },
        { id: 'flat', label: 'Flat' },
        { id: 'house', label: 'House' },
        { id: 'villa', label: 'Villa' },
        { id: 'bungalow', label: 'Bungalow' },
      ],
    },
    {
      group: 'Land',
      types: [
        { id: 'plot', label: 'Plot' },
        { id: 'residential_plot', label: 'Residential Plot' },
        { id: 'commercial_plot', label: 'Commercial Plot' },
        { id: 'agricultural_land', label: 'Agricultural Land' },
        { id: 'farm_land', label: 'Farm Land' },
      ],
    },
    {
      group: 'Commercial',
      types: [
        { id: 'office', label: 'Office' },
        { id: 'shop', label: 'Shop' },
        { id: 'showroom', label: 'Showroom' },
        { id: 'warehouse', label: 'Warehouse' },
        { id: 'industrial', label: 'Industrial Property' },
        { id: 'commercial_building', label: 'Commercial Building' },
      ],
    },
  ];

const ALL_PROPERTY_TYPES = PROPERTY_GROUPS.flatMap((g) => g.types);

const STEPS = [
  { id: 1, title: 'Basic Info', desc: 'Title, typology & desc' },
  { id: 2, title: 'Details', desc: 'Pricing, beds & specs' },
  { id: 3, title: 'Location', desc: 'Address, city & pin' },
  { id: 4, title: 'Amenities', desc: 'Facilities & features' },
  { id: 5, title: 'Images', desc: 'Gallery & cover' },
  { id: 6, title: 'Assign Agent', desc: 'Dedicated advisor' },
  { id: 7, title: 'Options', desc: 'Publish, verify & status' },
  { id: 8, title: 'Preview', desc: 'Inspect & commit' },
];

export const PropertyForm: React.FC<PropertyFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Basic Information
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<PropertyCategoryType>(
    initialData?.category || 'apartment'
  );
  const [listingType, setListingType] = useState<ListingType>(
    initialData?.type || 'buy'
  );
  const [status, setStatus] = useState<PropertyStatus>(
    initialData?.status || 'draft'
  );

  // Assigned Agent (Step 6)
  const [assignedAgentId, setAssignedAgentId] = useState<string>(
    initialData?.assignedAgentId || initialData?.agent?.id || ''
  );

  // Step 2: Details
  const [price, setPrice] = useState(
    initialData?.price ? String(initialData.price) : ''
  );
  const [areaSqFt, setAreaSqFt] = useState(
    initialData?.specs?.areaSqFt ? String(initialData.specs.areaSqFt) : ''
  );
  const [bedrooms, setBedrooms] = useState(
    initialData?.specs?.bedrooms !== undefined
      ? String(initialData.specs.bedrooms)
      : ''
  );
  const [bathrooms, setBathrooms] = useState(
    initialData?.specs?.bathrooms !== undefined
      ? String(initialData.specs.bathrooms)
      : ''
  );
  const [parkingSpaces, setParkingSpaces] = useState(
    initialData?.specs?.parkingSpaces !== undefined
      ? String(initialData.specs.parkingSpaces)
      : ''
  );
  const [furnishing, setFurnishing] = useState<FurnishingStatus>(
    initialData?.specs?.furnishing || 'semi-furnished'
  );

  // Step 3: Location
  const [address, setAddress] = useState(initialData?.location?.address || '');
  const [city, setCity] = useState(initialData?.location?.city || '');
  const [state, setState] = useState(initialData?.location?.state || '');
  const [pincode, setPincode] = useState(initialData?.location?.pincode || '');
  const [latitude, setLatitude] = useState(
    initialData?.location?.coordinates?.lat !== undefined
      ? String(initialData.location.coordinates.lat)
      : initialData?.latitude !== undefined
      ? String(initialData.latitude)
      : ''
  );
  const [longitude, setLongitude] = useState(
    initialData?.location?.coordinates?.lng !== undefined
      ? String(initialData.location.coordinates.lng)
      : initialData?.longitude !== undefined
      ? String(initialData.longitude)
      : ''
  );
  const [placeName, setPlaceName] = useState(
    initialData?.location?.neighborhood || ''
  );
  const [googlePlaceId, setGooglePlaceId] = useState(
    initialData?.googlePlaceId || ''
  );

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Step 3: Location Autocomplete & Map State
  const [addressSuggestions, setAddressSuggestions] = useState<GeoapifyPlace[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState<boolean>(false);
  const [addressSearchError, setAddressSearchError] = useState<string | null>(null);
  const [isSelectOnMapModalOpen, setIsSelectOnMapModalOpen] = useState<boolean>(false);
  const debounceAddressTimerRef = useRef<any>(null);

  const handleAddressChange = (ad: string) => {
    setAddress(ad);
    clearFieldError('address');
    setAddressSearchError(null);

    if (debounceAddressTimerRef.current) {
      clearTimeout(debounceAddressTimerRef.current);
    }

    if (!ad.trim() || ad.trim().length < 3) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    setIsSearchingAddress(true);
    debounceAddressTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchAddress(ad);
        setAddressSuggestions(results);
        if (results.length === 0) {
          setAddressSearchError('No matching locations found in India.');
        }
      } catch (err) {
        console.error('[PropertyForm] Address search error:', err);
        setAddressSearchError('Location search temporarily unavailable.');
      } finally {
        setIsSearchingAddress(false);
      }
    }, 350);
  };

  const handleSelectAddressSuggestion = (place: GeoapifyPlace) => {
    // Preserve building / society name in address
    const resolvedAddress = place.formatted || [place.name, place.address_line1, place.suburb].filter(Boolean).join(', ');
    setAddress(resolvedAddress);
    clearFieldError('address');

    if (place.name || place.primary_text) {
      setPlaceName(place.name || place.primary_text);
    }
    if (place.place_id) {
      setGooglePlaceId(place.place_id);
    }

    if (place.city) {
      setCity(place.city);
      clearFieldError('city');
    }
    if (place.state) {
      setState(place.state);
    }
    // Update PIN code with the new selected place postcode, or clear stale PIN
    setPincode(place.postcode || '');
    if (place.postcode) {
      clearFieldError('pincode');
    }

    // Capture REAL exact coordinates from Geoapify / Google
    if (typeof place.lat === 'number' && typeof place.lon === 'number' && !isNaN(place.lat) && !isNaN(place.lon)) {
      setLatitude(String(place.lat));
      setLongitude(String(place.lon));
    }
    setAddressSuggestions([]);
    setAddressSearchError(null);
  };

  const handleInlineMapLocationChange = (result: {
    lat: number;
    lng: number;
    place?: GeoapifyPlace | null;
  }) => {
    // EXACT clicked or dragged coordinates from Leaflet map
    setLatitude(String(result.lat));
    setLongitude(String(result.lng));

    if (result.place) {
      const resolvedAddress = result.place.formatted || [result.place.name, result.place.address_line1, result.place.suburb].filter(Boolean).join(', ');
      setAddress(resolvedAddress);
      clearFieldError('address');

      if (result.place.name || result.place.primary_text) {
        setPlaceName(result.place.name || result.place.primary_text);
      }
      if (result.place.place_id) {
        setGooglePlaceId(result.place.place_id);
      }

      if (result.place.city) {
        setCity(result.place.city);
        clearFieldError('city');
      }
      if (result.place.state) {
        setState(result.place.state);
      }
      // Update PIN code with the new reverse geocode postcode, or clear stale PIN
      setPincode(result.place.postcode || '');
      if (result.place.postcode) {
        clearFieldError('pincode');
      }
    }
  };

  const handleConfirmLocationFromModal = (data: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    state?: string;
    pincode?: string;
    googlePlaceId?: string;
    name?: string;
  }) => {
    if (data.address) {
      setAddress(data.address);
      clearFieldError('address');
    }
    if (data.city) {
      setCity(data.city);
      clearFieldError('city');
    }
    if (data.state) {
      setState(data.state);
    }
    // Update PIN code with confirmed value or clear stale PIN
    setPincode(data.pincode || '');
    if (data.pincode) {
      clearFieldError('pincode');
    }
    // EXACT coordinates
    setLatitude(String(data.lat));
    setLongitude(String(data.lng));

    if (data.googlePlaceId) {
      setGooglePlaceId(data.googlePlaceId);
    }
    if (data.name) {
      setPlaceName(data.name);
    }
  };

  const handleOpenViewOnMap = () => {
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    const resolvedTitle =
      title || placeName || address.split(',')[0]?.trim() || city || 'Property Location';
    const url = getPropertyMapUrl(
      {
        address,
        neighborhood: placeName || address.split(',')[0]?.trim() || city,
        city,
        state,
        pincode,
        coordinates:
          Number.isFinite(latNum) && Number.isFinite(lngNum)
            ? { lat: latNum, lng: lngNum }
            : undefined,
        googlePlaceId,
        name: placeName,
      },
      resolvedTitle
    );
    openExternalMap(url);
  };

  // Step 4: Amenities
  const initialAmenityIds = initialData?.amenities
    ? initialData.amenities.map((a) => a.id)
    : ['parking', 'security', 'lift'];
  const [selectedAmenities, setSelectedAmenities] =
    useState<string[]>(initialAmenityIds);

  // Step 5: Images
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0
      ? initialData.images
      : []
  );

  // Step 6: Listing Options
  const [listingStatus, setListingStatus] = useState<PropertyStatus>(
    initialData?.status || 'draft'
  );
  const [verified, setVerified] = useState<boolean>(
    initialData?.verified ?? true
  );
  const [featured, setFeatured] = useState<boolean>(
    initialData?.featured ?? false
  );

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(selectedAmenities.filter((item) => item !== id));
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!title.trim()) errs.title = 'Property title is required';
      if (!description.trim()) errs.description = 'Property description is required';
    }

    if (step === 2) {
      if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
        errs.price = 'Please enter a valid positive price (in INR)';
      }
      if (!areaSqFt.trim() || isNaN(Number(areaSqFt)) || Number(areaSqFt) <= 0) {
        errs.areaSqFt = 'Please enter a valid area in sq ft';
      }
    }

    if (step === 3) {
      if (!address.trim()) errs.address = 'Street address is required';
      if (!city.trim()) errs.city = 'City is required';
      if (!pincode.trim()) errs.pincode = 'Pincode is required';
    }

    if (step === 5) {
      if (images.length === 0) {
        errs.images = 'Please add at least one property image';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 8) {
        setCurrentStep(currentStep + 1);
        window?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const buildPayload = (finalStatus: PropertyStatus): Omit<Property, 'id' | 'slug' | 'createdAt'> => {
    const matchedCategory = ALL_PROPERTY_TYPES.find((t) => t.id === category);
    const resolvedAmenities = ALL_AMENITIES.filter((a) =>
      selectedAmenities.includes(a.id)
    ).map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
    }));

    const allAgents = agentService.getAll();
    const resolvedAgent = assignedAgentId
      ? allAgents.find((a) => a.id === assignedAgentId)
      : allAgents[0];

    const agentData = resolvedAgent
      ? {
          id: resolvedAgent.id,
          name: resolvedAgent.name,
          agency: 'Cityspace Advisory Group',
          avatar: resolvedAgent.avatar,
          phone: resolvedAgent.phone,
          email: resolvedAgent.email,
          designation: resolvedAgent.designation,
          propertiesHandled: resolvedAgent.activeListingsCount || 0,
          rating: resolvedAgent.rating || 5.0,
          reviewCount: resolvedAgent.reviewCount || 0,
          verified: true,
        }
      : {
          id: 'unassigned',
          name: 'Cityspace Concierge',
          agency: 'Cityspace Prime Advisory',
          avatar: '',
          phone: '+91 80000 00000',
          email: 'concierge@cityspace.luxury',
          designation: 'Property Concierge Desk',
          propertiesHandled: 0,
          rating: 5.0,
          reviewCount: 0,
          verified: true,
        };

    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);
    const hasCoordinates = !isNaN(parsedLat) && !isNaN(parsedLng);

    return {
      title: title.trim(),
      tagline: bedrooms
        ? `${bedrooms} BHK ${matchedCategory?.label || 'Residence'} in ${city || 'India'}`
        : `${matchedCategory?.label || 'Residence'} in ${city || 'India'}`,
      description: description.trim(),
      price: Number(price) || 0,
      currency: 'INR',
      type: listingType,
      category,
      categoryLabel: matchedCategory?.label || 'Residential',
      status: finalStatus,
      featured,
      verified,
      isNew: true,
      assignedAgentId: agentData.id,
      specs: {
        bedrooms: Number(bedrooms) || 0,
        bathrooms: Number(bathrooms) || 0,
        areaSqFt: Number(areaSqFt) || 0,
        yearBuilt: new Date().getFullYear(),
        parkingSpaces: Number(parkingSpaces) || 0,
        furnishing,
      },
      location: {
        address: address.trim(),
        neighborhood: placeName || address.split(',')[0]?.trim() || city,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: 'India',
        name: placeName || undefined,
        placeName: placeName || undefined,
        googlePlaceId: googlePlaceId || undefined,
        coordinates: hasCoordinates
          ? { lat: parsedLat, lng: parsedLng }
          : { lat: 18.5204, lng: 73.8567 },
      },
      latitude: hasCoordinates ? parsedLat : undefined,
      longitude: hasCoordinates ? parsedLng : undefined,
      googlePlaceId: googlePlaceId || undefined,
      placeName: placeName || undefined,
      images,
      amenities: resolvedAmenities,
      agent: agentData,
    };
  };

  const handleSaveDraft = () => {
    const payload = buildPayload('draft');
    onSubmit(payload, 'draft');
  };

  const handlePublish = () => {
    const payload = buildPayload('published');
    onSubmit(payload, 'published');
  };

  const currentPreviewData = buildPayload(listingStatus);

  return (
    <View style={styles.formWrapper}>
      {/* Top Header */}
      <View style={styles.formHeader}>
        <View>
          <Text style={styles.formOverline}>
            {mode === 'create' ? 'ADMIN / ADD PROPERTY' : 'ADMIN / EDIT PROPERTY'}
          </Text>
          <Text style={styles.formTitle}>
            {mode === 'create' ? 'Create Property Listing' : `Edit: ${initialData?.title || 'Property'}`}
          </Text>
        </View>

        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Feather name="x" size={16} color="#64748B" style={{ marginRight: 4 }} />
          <Text style={styles.cancelBtnText}>Discard & Exit</Text>
        </TouchableOpacity>
      </View>

      {/* Stepper Progress Bar */}
      <View style={styles.stepperContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepperScroll}
        >
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            return (
              <TouchableOpacity
                key={step.id}
                onPress={() => {
                  if (step.id < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.id);
                  }
                }}
                style={[
                  styles.stepItem,
                  isActive && styles.stepItemActive,
                  isCompleted && styles.stepItemCompleted,
                ]}
              >
                <View
                  style={[
                    styles.stepNumberCircle,
                    isActive && styles.stepNumberCircleActive,
                    isCompleted && styles.stepNumberCircleCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <Feather name="check" size={12} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepNumberText,
                        isActive && styles.stepNumberTextActive,
                      ]}
                    >
                      {step.id}
                    </Text>
                  )}
                </View>
                <View style={styles.stepLabels}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isActive && styles.stepTitleActive,
                      isCompleted && styles.stepTitleCompleted,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Form Content Area */}
      <View style={styles.formBody}>
        {/* ======================================================== */}
        {/* STEP 1: Basic Information */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.cardSectionHeading}>Step 1 — Basic Information</Text>

            {/* Title */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PROPERTY TITLE *</Text>
              <TextInput
                placeholder="e.g. Modern 3 BHK Apartment with Hill Views"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  clearFieldError('title');
                }}
                style={[styles.input, errors.title ? styles.inputError : null]}
              />
              {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
            </View>

            {/* Description */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>DESCRIPTION *</Text>
              <TextInput
                placeholder="Detailed architectural description of layout, materials, views, and lifestyle..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={(d) => {
                  setDescription(d);
                  clearFieldError('description');
                }}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  errors.description ? styles.inputError : null,
                ]}
              />
              {errors.description ? (
                <Text style={styles.errorText}>{errors.description}</Text>
              ) : null}
            </View>

            {/* Property Types Categorized */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>PROPERTY TYPOLOGY (RESIDENTIAL, LAND, COMMERCIAL)</Text>
              <View style={{ gap: 12 }}>
                {PROPERTY_GROUPS.map((grp) => (
                  <View key={grp.group} style={{ gap: 6 }}>
                    <Text style={styles.groupSubHeader}>{grp.group.toUpperCase()}</Text>
                    <View style={styles.chipsRow}>
                      {grp.types.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => setCategory(t.id)}
                          style={[
                            styles.selectableChip,
                            category === t.id && styles.selectableChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectableChipText,
                              category === t.id && styles.selectableChipTextActive,
                            ]}
                          >
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Listing Type: Buy / Rent */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>LISTING TYPE (TRANSACTION)</Text>
              <View style={styles.chipsRow}>
                {[
                  { id: 'buy', label: 'Buy (For Sale)' },
                  { id: 'rent', label: 'Rent (Lease)' },
                ].map((lt) => (
                  <TouchableOpacity
                    key={lt.id}
                    onPress={() => setListingType(lt.id as ListingType)}
                    style={[
                      styles.selectableChip,
                      listingType === lt.id && styles.selectableChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectableChipText,
                        listingType === lt.id && styles.selectableChipTextActive,
                      ]}
                    >
                      {lt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Property Status */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>INITIAL PROPERTY STATUS</Text>
              <View style={styles.chipsRow}>
                {[
                  { id: 'draft', label: 'Draft (Private)' },
                  { id: 'published', label: 'Published (Public)' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    onPress={() => {
                      setStatus(st.id as PropertyStatus);
                      setListingStatus(st.id as PropertyStatus);
                    }}
                    style={[
                      styles.selectableChip,
                      status === st.id && styles.selectableChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectableChipText,
                        status === st.id && styles.selectableChipTextActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 2: Property Details */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.cardSectionHeading}>Step 2 — Property Details</Text>

            <View style={styles.fieldsGrid}>
              {/* Price */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>PRICE (₹ INR) *</Text>
                <TextInput
                  placeholder="e.g. 8500000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={(p) => {
                    setPrice(p);
                    clearFieldError('price');
                  }}
                  style={[styles.input, errors.price ? styles.inputError : null]}
                />
                <Text style={styles.helperText}>
                  {price && !isNaN(Number(price))
                    ? Number(price) >= 10000000
                      ? `≈ ₹${(Number(price) / 10000000).toFixed(2)} Crore`
                      : `≈ ₹${(Number(price) / 100000).toFixed(2)} Lakh`
                    : 'Enter raw numeric amount in INR'}
                </Text>
                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
              </View>

              {/* Area */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>CARPET / SUPER AREA (SQ FT) *</Text>
                <TextInput
                  placeholder="e.g. 1450"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={areaSqFt}
                  onChangeText={(a) => {
                    setAreaSqFt(a);
                    clearFieldError('areaSqFt');
                  }}
                  style={[styles.input, errors.areaSqFt ? styles.inputError : null]}
                />
                {errors.areaSqFt ? <Text style={styles.errorText}>{errors.areaSqFt}</Text> : null}
              </View>

              {/* Bedrooms */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>BEDROOMS</Text>
                <View style={styles.chipsRow}>
                  {['1', '2', '3', '4', '5+'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => setBedrooms(num.replace('+', ''))}
                      style={[
                        styles.numberPill,
                        bedrooms === num.replace('+', '') && styles.numberPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.numberPillText,
                          bedrooms === num.replace('+', '') && styles.numberPillTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Bathrooms */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>BATHROOMS</Text>
                <View style={styles.chipsRow}>
                  {['1', '2', '3', '4+'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => setBathrooms(num.replace('+', ''))}
                      style={[
                        styles.numberPill,
                        bathrooms === num.replace('+', '') && styles.numberPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.numberPillText,
                          bathrooms === num.replace('+', '') && styles.numberPillTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Parking */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>PARKING SPACES</Text>
                <View style={styles.chipsRow}>
                  {['0', '1', '2', '3+'].map((num) => (
                    <TouchableOpacity
                      key={num}
                      onPress={() => setParkingSpaces(num.replace('+', ''))}
                      style={[
                        styles.numberPill,
                        parkingSpaces === num.replace('+', '') && styles.numberPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.numberPillText,
                          parkingSpaces === num.replace('+', '') && styles.numberPillTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Furnishing */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>FURNISHING STATUS</Text>
                <View style={styles.chipsRow}>
                  {[
                    { id: 'unfurnished', label: 'Unfurnished' },
                    { id: 'semi-furnished', label: 'Semi-Furnished' },
                    { id: 'fully-furnished', label: 'Fully Furnished' },
                  ].map((f) => (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setFurnishing(f.id as FurnishingStatus)}
                      style={[
                        styles.selectableChip,
                        furnishing === f.id && styles.selectableChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectableChipText,
                          furnishing === f.id && styles.selectableChipTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 3: Location */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <View style={styles.stepHeaderWithAction}>
              <View>
                <Text style={styles.cardSectionHeading}>Step 3 — Location</Text>
                <Text style={styles.stepSubhead}>
                  Specify the property location, city, and pinpoint on the map.
                </Text>
              </View>
              <View style={styles.locationHeaderActions}>
                <TouchableOpacity
                  onPress={() => setIsSelectOnMapModalOpen(true)}
                  style={styles.selectOnMapBtn}
                  activeOpacity={0.8}
                >
                  <Feather name="maximize-2" size={13} color="#2563EB" style={{ marginRight: 6 }} />
                  <Text style={styles.selectOnMapBtnText}>Select on Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenViewOnMap}
                  style={styles.viewOnMapBtn}
                  activeOpacity={0.8}
                >
                  <Feather name="external-link" size={13} color="#059669" style={{ marginRight: 5 }} />
                  <Text style={styles.viewOnMapBtnText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* EXISTING Location Field with Real-Time Suggestions */}
            <View style={styles.addressFieldContainer}>
              <View style={styles.addressLabelRow}>
                <Text style={styles.label}>ADDRESS / STREET *</Text>
                {isSearchingAddress && (
                  <View style={styles.searchingIndicator}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.searchingText}>Searching...</Text>
                  </View>
                )}
              </View>
              <TextInput
                placeholder="e.g. Pan Card Club Road, Baner Hills"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={handleAddressChange}
                style={[styles.input, errors.address ? styles.inputError : null]}
              />
              {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

              {/* Suggestions Dropdown */}
              {addressSuggestions.length > 0 && (
                <View style={styles.addressDropdownCard}>
                  <ScrollView keyboardShouldPersistTaps="handled" style={styles.dropdownScroll}>
                    {addressSuggestions.map((item, idx) => {
                      const isBuildingOrAmenity =
                        item.result_type === 'building' ||
                        item.result_type === 'amenity' ||
                        item.result_type === 'commercial' ||
                        item.result_type === 'residential' ||
                        item.result_type === 'place';
                      return (
                        <TouchableOpacity
                          key={item.place_id || idx}
                          style={styles.dropdownItem}
                          onPress={() => handleSelectAddressSuggestion(item)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dropdownIconWrap}>
                            <Feather
                              name={isBuildingOrAmenity ? 'home' : 'map-pin'}
                              size={15}
                              color="#2563EB"
                            />
                          </View>
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                              {item.primary_text || item.address_line1 || item.formatted.split(',')[0]}
                            </Text>
                            <Text style={styles.dropdownItemSubtitle} numberOfLines={1}>
                              {item.secondary_text || item.address_line2 || item.formatted}
                            </Text>
                          </View>
                          {!!item.result_type && item.result_type !== 'unknown' && (
                            <View style={styles.dropdownTypeBadge}>
                              <Text style={styles.dropdownTypeBadgeText}>
                                {item.result_type.toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {addressSearchError ? (
                <Text style={styles.searchErrorNotice}>{addressSearchError}</Text>
              ) : null}
            </View>

            <View style={styles.fieldsGrid}>
              {/* City */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>CITY *</Text>
                <View style={styles.chipsRow}>
                  {['Pune', 'Mumbai', 'Kolhapur', 'Bengaluru', 'Hyderabad'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCity(c)}
                      style={[
                        styles.selectableChip,
                        city === c && styles.selectableChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectableChipText,
                          city === c && styles.selectableChipTextActive,
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* State */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>STATE</Text>
                <TextInput
                  placeholder="e.g. Maharashtra"
                  placeholderTextColor="#94A3B8"
                  value={state}
                  onChangeText={setState}
                  style={styles.input}
                />
              </View>

              {/* Pincode */}
              <View style={styles.fieldGroupCol}>
                <Text style={styles.label}>PINCODE *</Text>
                <TextInput
                  placeholder="e.g. 411045"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={pincode}
                  onChangeText={(p) => {
                    setPincode(p);
                    clearFieldError('pincode');
                  }}
                  style={[styles.input, errors.pincode ? styles.inputError : null]}
                />
                {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}
              </View>
            </View>

            {/* Interactive Leaflet Map */}
            <View style={styles.interactiveMapSection}>
              <View style={styles.mapHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="map" size={14} color="#2563EB" />
                  <Text style={styles.mapSectionTitle}>INTERACTIVE LOCATION MAP</Text>
                </View>
                <Text style={styles.mapInteractiveHint}>
                  Drag marker or click anywhere on map to update address
                </Text>
              </View>
              <LeafletPropertyMap
                latitude={parseFloat(latitude) || 18.5204}
                longitude={parseFloat(longitude) || 73.8567}
                height={290}
                isInteractive={true}
                onLocationChange={handleInlineMapLocationChange}
              />
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 4: Amenities */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.cardSectionHeading}>Step 4 — Amenities</Text>
            <Text style={styles.stepSubhead}>
              Select all features and conveniences available in this property development.
            </Text>

            <View style={styles.amenitiesCheckGrid}>
              {ALL_AMENITIES.map((item) => {
                const isSelected = selectedAmenities.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleAmenity(item.id)}
                    style={[
                      styles.amenityCheckCard,
                      isSelected && styles.amenityCheckCardActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.amenityCheckCircle,
                        isSelected && styles.amenityCheckCircleActive,
                      ]}
                    >
                      {isSelected && (
                        <Feather name="check" size={13} color="#FFFFFF" />
                      )}
                    </View>
                    <Feather
                      name={item.icon as any}
                      size={18}
                      color={isSelected ? '#0F172A' : '#64748B'}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.amenityCheckName,
                        isSelected && styles.amenityCheckNameActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 5: Images */}
        {/* ======================================================== */}
        {currentStep === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.cardSectionHeading}>Step 5 — Images</Text>
            <Text style={styles.stepSubhead}>
              Upload multiple high-resolution photos. First image is the primary cover.
            </Text>

            <ImageUploader
              images={images}
              onChange={(updated) => {
                setImages(updated);
                if (updated.length > 0) {
                  clearFieldError('images');
                }
              }}
            />
            {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 6: Assign Agent */}
        {/* ======================================================== */}
        {currentStep === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.cardSectionHeading}>Step 6 — Assign Property Advisor</Text>
            <Text style={styles.stepSubhead}>
              Select a certified Cityspace broker to oversee client showings, enquiries, and transactions for this listing.
            </Text>

            {agentService.getAll().length === 0 ? (
              <View
                style={{
                  padding: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  backgroundColor: '#F8FAFC',
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <Feather name="users" size={28} color="#94A3B8" />
                <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500', textAlign: 'center' }}>
                  No agents registered in the system yet. Listing will default to Cityspace Concierge.
                </Text>
              </View>
            ) : (
              <View style={styles.agentsPickerGrid}>
                {agentService.getAll().map((ag) => {
                  const isSelected = assignedAgentId === ag.id;
                  return (
                    <TouchableOpacity
                      key={ag.id}
                      onPress={() => setAssignedAgentId(ag.id)}
                      style={[
                        styles.agentPickCard,
                        isSelected && styles.agentPickCardActive,
                      ]}
                    >
                      {ag.avatar ? (
                        <Image source={{ uri: ag.avatar }} style={styles.agentPickAvatar} />
                      ) : (
                        <View style={[styles.agentPickAvatar, { alignItems: 'center', justifyContent: 'center' }]}>
                          <Feather name="user" size={20} color="#64748B" />
                        </View>
                      )}
                      <View style={styles.agentPickInfo}>
                        <View style={styles.agentPickNameRow}>
                          <Text style={styles.agentPickName}>{ag.name}</Text>
                          {isSelected && (
                            <View style={styles.selectedAgentBadge}>
                              <Feather name="check" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.agentPickDesig} numberOfLines={1}>
                          {ag.designation}
                        </Text>
                        <Text style={styles.agentPickMeta} numberOfLines={1}>
                          {ag.phone} • {ag.activeListingsCount || 0} Active Listings
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 7: Listing Options */}
        {/* ======================================================== */}
        {currentStep === 7 && (
          <View style={styles.stepCard}>
            <Text style={styles.cardSectionHeading}>Step 7 — Listing Options</Text>
            <Text style={styles.stepSubhead}>
              Configure administrative publication, verification, and promotional features.
            </Text>

            {/* Publication Status: Published, Draft, Unpublished, Sold, Rented */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Property Status</Text>
                <Text style={styles.optionDesc}>
                  Configure current transaction availability and visibility across public search channels.
                </Text>
              </View>
              <View style={styles.chipsRow}>
                {[
                  { id: 'published', label: 'Published' },
                  { id: 'draft', label: 'Draft' },
                  { id: 'unpublished', label: 'Unpublished' },
                  { id: 'sold', label: 'Sold' },
                  { id: 'rented', label: 'Rented' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    onPress={() => setListingStatus(st.id as PropertyStatus)}
                    style={[
                      styles.selectableChip,
                      listingStatus === st.id && styles.selectableChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectableChipText,
                        listingStatus === st.id && styles.selectableChipTextActive,
                      ]}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Verified / Not Verified */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Legal & Physical Verification</Text>
                <Text style={styles.optionDesc}>
                  Badge indicating Cityspace inspectors have verified title deeds and structural condition.
                </Text>
              </View>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  onPress={() => setVerified(true)}
                  style={[
                    styles.selectableChip,
                    verified === true && styles.chipActiveVerified,
                  ]}
                >
                  <Feather
                    name="check-circle"
                    size={14}
                    color={verified ? '#0284C7' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.selectableChipText,
                      verified === true && styles.chipTextVerified,
                    ]}
                  >
                    Verified
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setVerified(false)}
                  style={[
                    styles.selectableChip,
                    verified === false && styles.selectableChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectableChipText,
                      verified === false && styles.selectableChipTextActive,
                    ]}
                  >
                    Not Verified
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Featured / Not Featured */}
            <View style={styles.optionRow}>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Featured Showcase</Text>
                <Text style={styles.optionDesc}>
                  Highlights property on the Cityspace home screen and top of search results.
                </Text>
              </View>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  onPress={() => setFeatured(true)}
                  style={[
                    styles.selectableChip,
                    featured === true && styles.chipActiveFeatured,
                  ]}
                >
                  <Feather
                    name="star"
                    size={14}
                    color={featured ? '#B45309' : '#64748B'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.selectableChipText,
                      featured === true && styles.chipTextFeatured,
                    ]}
                  >
                    Featured
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setFeatured(false)}
                  style={[
                    styles.selectableChip,
                    featured === false && styles.selectableChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectableChipText,
                      featured === false && styles.selectableChipTextActive,
                    ]}
                  >
                    Not Featured
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* STEP 8: Preview */}
        {/* ======================================================== */}
        {currentStep === 8 && (
          <View style={styles.stepCard}>
            <Text style={styles.cardSectionHeading}>Step 8 — Preview</Text>
            <Text style={styles.stepSubhead}>
              Audit how this listing renders before confirming changes.
            </Text>

            <PropertyPreview
              property={currentPreviewData}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              mode={mode}
            />
          </View>
        )}
      </View>

      {/* Step Navigation Controls Footer */}
      {currentStep < 8 && (
        <View style={styles.stepperFooter}>
          <TouchableOpacity
            disabled={currentStep === 1}
            onPress={handlePrev}
            style={[
              styles.navBtn,
              currentStep === 1 && styles.navBtnDisabled,
            ]}
          >
            <Feather
              name="arrow-left"
              size={15}
              color={currentStep === 1 ? '#CBD5E1' : '#334155'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.navBtnText,
                currentStep === 1 && styles.navBtnTextDisabled,
              ]}
            >
              Previous Step
            </Text>
          </TouchableOpacity>

          <View style={styles.stepCountIndicator}>
            <Text style={styles.stepCountText}>
              Step <Text style={styles.stepCountBold}>{currentStep}</Text> of 8
            </Text>
          </View>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>
              {currentStep === 7 ? 'Review in Preview' : 'Continue'}
            </Text>
            <Feather
              name="arrow-right"
              size={15}
              color="#FFFFFF"
              style={{ marginLeft: 6 }}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Select on Map Modal */}
      <SelectOnMapModal
        visible={isSelectOnMapModalOpen}
        onClose={() => setIsSelectOnMapModalOpen(false)}
        initialLat={parseFloat(latitude) || 18.5204}
        initialLng={parseFloat(longitude) || 73.8567}
        initialAddress={address}
        onConfirm={handleConfirmLocationFromModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  formWrapper: {
    gap: 20,
    paddingBottom: 40,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  formOverline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...Shadows.sm,
  },
  stepperScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  stepItemActive: {
    backgroundColor: '#F8FAFC',
  },
  stepItemCompleted: {},
  stepNumberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  stepNumberCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepNumberCircleCompleted: {
    backgroundColor: '#059669',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNumberTextActive: {
    color: '#FFFFFF',
  },
  stepLabels: {
    gap: 2,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stepTitleActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  stepTitleCompleted: {
    color: '#059669',
  },
  stepDesc: {
    fontSize: 10,
    color: '#94A3B8',
  },
  formBody: {
    gap: 16,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    gap: 20,
    ...Shadows.sm,
  },
  cardSectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stepSubhead: {
    fontSize: 13,
    color: '#64748B',
    marginTop: -10,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldGroupCol: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: Colors.textPrimary,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 90,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  errorText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectableChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  selectableChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  selectableChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  selectableChipTextActive: {
    color: '#FFFFFF',
  },
  chipActiveVerified: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  chipTextVerified: {
    color: '#0369A1',
    fontWeight: '700',
  },
  chipActiveFeatured: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  chipTextFeatured: {
    color: '#B45309',
    fontWeight: '700',
  },
  numberPill: {
    width: 44,
    height: 38,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  numberPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  numberPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  numberPillTextActive: {
    color: '#FFFFFF',
  },
  amenitiesCheckGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityCheckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 220,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  amenityCheckCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  amenityCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  amenityCheckCircleActive: {
    borderColor: '#059669',
    backgroundColor: '#059669',
  },
  amenityCheckName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  amenityCheckNameActive: {
    color: '#065F46',
    fontWeight: '700',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  optionInfo: {
    flex: 1,
    minWidth: 260,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  stepperFooter: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.sm,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  navBtnTextDisabled: {
    color: '#94A3B8',
  },
  stepCountIndicator: {},
  stepCountText: {
    fontSize: 12,
    color: '#64748B',
  },
  stepCountBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupSubHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#64748B',
    marginTop: 4,
  },
  agentsPickerGrid: {
    gap: 12,
  },
  agentPickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  agentPickCardActive: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  agentPickAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#CBD5E1',
  },
  agentPickInfo: {
    flex: 1,
    gap: 2,
  },
  agentPickNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agentPickName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  selectedAgentBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentPickDesig: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  agentPickMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  stepHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  locationHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  selectOnMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  viewOnMapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  addressFieldContainer: {
    position: 'relative',
    zIndex: 40,
    gap: 6,
  },
  addressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  searchingText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '500',
  },
  addressDropdownCard: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  dropdownIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownItemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dropdownTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
  },
  dropdownTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  searchErrorNotice: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 2,
  },
  interactiveMapSection: {
    marginTop: 6,
    gap: 8,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  mapSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
  },
  mapInteractiveHint: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
