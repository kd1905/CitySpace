import { initDatabase, execute, queryAll } from './database';

export async function seedDatabase() {
  await initDatabase();

  console.log('[Seed] Checking existing properties...');
  const existing = await queryAll('SELECT id FROM properties LIMIT 1');
  if (existing.length > 0) {
    console.log('[Seed] Database already contains properties. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding real initial properties, agents, and locations...');

  const now = new Date().toISOString();

  // 1. Insert Agents
  const agents = [
    {
      id: 'agent_vikram_malhotra',
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@cityspace.in',
      phone: '+91 98230 45678',
      designation: 'Senior Property Advisor',
      experience: '9+ Years',
      bio: 'Specialist in luxury residential properties and high-yield real estate investments across Pune and Mumbai.',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
      status: 'active',
      rating: 4.9,
      review_count: 42,
      areas_served: 'Pune, Mumbai, Navi Mumbai',
      created_at: now,
    },
    {
      id: 'agent_ananya_sharma',
      name: 'Ananya Sharma',
      email: 'ananya.sharma@cityspace.in',
      phone: '+91 98450 12345',
      designation: 'Prime Commercial & Luxury Specialist',
      experience: '7+ Years',
      bio: 'Expert advisor for IT corridors, luxury penthouses, and gated villa communities in Bengaluru and Hyderabad.',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      status: 'active',
      rating: 4.8,
      review_count: 38,
      areas_served: 'Bengaluru, Hyderabad',
      created_at: now,
    },
  ];

  for (const a of agents) {
    await execute(
      `INSERT INTO agents (id, name, email, phone, designation, experience, bio, avatar, status, rating, review_count, areas_served, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.name, a.email, a.phone, a.designation, a.experience, a.bio, a.avatar, a.status, a.rating, a.review_count, a.areas_served, a.created_at]
    );
  }

  // 2. Insert Properties and Locations
  const propertyData = [
    {
      prop: {
        id: 'prop_grand_crest_pune',
        slug: 'the-grand-crest-residence-baner-pune',
        title: 'The Grand Crest Residence',
        tagline: 'Ultra-Luxury 3 BHK with Panoramic Valley Views',
        description: 'Experience refined urban living at The Grand Crest in Baner. Featuring Italian marble flooring, panoramic sundeck balconies, private elevator access, and a resort-style infinity pool atop the club level.',
        price: 13500000,
        currency: 'INR',
        type: 'buy',
        category: 'apartment',
        category_label: 'Luxury Apartment',
        status: 'published',
        featured: 1,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_vikram_malhotra',
        specs_bedrooms: 3,
        specs_bathrooms: 3,
        specs_area_sqft: 1850,
        specs_year_built: 2024,
        specs_parking_spaces: 2,
        specs_furnishing: 'semi-furnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Swimming Pool', 'Gymnasium', 'Clubhouse', '24/7 Security', 'Covered Parking', 'Power Backup', 'Landscaped Garden']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_grand_crest_pune',
        property_id: 'prop_grand_crest_pune',
        address: 'Tower 4, The Grand Crest, Baner-Pashan Link Road',
        society: 'The Grand Crest',
        neighborhood: 'Baner',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411045',
        latitude: 18.5590,
        longitude: 73.7868,
        google_place_id: 'ChIJz2xH7c6_wjsRO3q7vX_j0Hk',
        created_at: now,
      },
    },
    {
      prop: {
        id: 'prop_imperial_manor_pune',
        slug: 'imperial-manor-koregaon-park-pune',
        title: 'Imperial Manor Villa Estate',
        tagline: 'Private Gated 4 BHK Villa with Heated Pool',
        description: 'Nestled in the tranquil leafy lanes of Koregaon Park, Imperial Manor offers bespoke modern architecture, lush private gardens, double-height ceilings, and state-of-the-art home automation.',
        price: 38500000,
        currency: 'INR',
        type: 'buy',
        category: 'villa',
        category_label: 'Luxury Villa',
        status: 'published',
        featured: 1,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_vikram_malhotra',
        specs_bedrooms: 4,
        specs_bathrooms: 5,
        specs_area_sqft: 3600,
        specs_year_built: 2023,
        specs_parking_spaces: 3,
        specs_furnishing: 'furnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Private Pool', 'Private Lawn', 'Home Automation', 'Servant Quarters', 'Gated Community', 'EV Charger']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_imperial_manor_pune',
        property_id: 'prop_imperial_manor_pune',
        address: 'Lane 5, Near German Bakery, Koregaon Park',
        society: 'Imperial Manor Estate',
        neighborhood: 'Koregaon Park',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411001',
        latitude: 18.5362,
        longitude: 73.8940,
        google_place_id: 'ChIJh2mYd4TBwjsR3Uo8K9r9h9c',
        created_at: now,
      },
    },
    {
      prop: {
        id: 'prop_sea_breeze_mumbai',
        slug: 'sea-breeze-signature-worli-mumbai',
        title: 'Sea Breeze Signature Tower',
        tagline: 'Arabian Sea Facing 3 BHK Sky Residence',
        description: 'Spectacular unobstructed Arabian Sea views from every room. Features world-class amenities including sky lounge, concierge service, temperature-controlled indoor pool, and private elevator lobby.',
        price: 48000000,
        currency: 'INR',
        type: 'buy',
        category: 'apartment',
        category_label: 'Sea Facing Apartment',
        status: 'published',
        featured: 1,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_vikram_malhotra',
        specs_bedrooms: 3,
        specs_bathrooms: 3,
        specs_area_sqft: 2250,
        specs_year_built: 2024,
        specs_parking_spaces: 2,
        specs_furnishing: 'semi-furnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Sea View', 'Sky Lounge', 'Infinity Pool', 'Concierge Service', 'Valet Parking', 'High-Speed Elevators']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_sea_breeze_mumbai',
        property_id: 'prop_sea_breeze_mumbai',
        address: 'Worli Sea Face, Near Bandra-Worli Sea Link, Worli',
        society: 'Sea Breeze Signature',
        neighborhood: 'Worli',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400018',
        latitude: 19.0176,
        longitude: 72.8162,
        google_place_id: 'ChIJzX4_0hDP5zsRkm842vF_8lM',
        created_at: now,
      },
    },
    {
      prop: {
        id: 'prop_greenwood_bengaluru',
        slug: 'greenwood-meadows-villa-whitefield-bengaluru',
        title: 'Greenwood Meadows Villa',
        tagline: 'Modern 4 BHK Duplex Villa in Whitefield IT Corridor',
        description: 'Surrounded by lush green landscaped gardens, this spacious modern duplex villa offers the ideal blend of serene family life with seamless connectivity to ITPL and top international schools.',
        price: 27500000,
        currency: 'INR',
        type: 'buy',
        category: 'villa',
        category_label: 'Gated Villa',
        status: 'published',
        featured: 1,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_ananya_sharma',
        specs_bedrooms: 4,
        specs_bathrooms: 4,
        specs_area_sqft: 3200,
        specs_year_built: 2023,
        specs_parking_spaces: 2,
        specs_furnishing: 'unfurnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Tennis Court', 'Clubhouse', 'Children Play Area', 'Jogging Track', '24/7 Security', 'Solar Water Heating']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_greenwood_bengaluru',
        property_id: 'prop_greenwood_bengaluru',
        address: 'Greenwood Meadows, ECC Road, Whitefield',
        society: 'Greenwood Meadows',
        neighborhood: 'Whitefield',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560066',
        latitude: 12.9698,
        longitude: 77.7499,
        google_place_id: 'ChIJj71f6h2_rjsR_9k37Nf38L0',
        created_at: now,
      },
    },
    {
      prop: {
        id: 'prop_skyline_hyderabad',
        slug: 'skyline-horizon-penthouse-hitec-city-hyderabad',
        title: 'Skyline Horizon Penthouse',
        tagline: 'High-Rise 4 BHK Penthouse near Cyber Towers',
        description: 'Spectacular city panoramic views from the 32nd floor. Features double-height living areas, private plunge pool on terrace, smart automated lighting, and dedicated EV charging bays.',
        price: 22000000,
        currency: 'INR',
        type: 'buy',
        category: 'apartment',
        category_label: 'Penthouse',
        status: 'published',
        featured: 1,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_ananya_sharma',
        specs_bedrooms: 4,
        specs_bathrooms: 4,
        specs_area_sqft: 2950,
        specs_year_built: 2024,
        specs_parking_spaces: 2,
        specs_furnishing: 'furnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Private Plunge Pool', 'Smart Home Automation', 'Sky Lounge', 'Gymnasium', 'Visitor Parking']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_skyline_hyderabad',
        property_id: 'prop_skyline_hyderabad',
        address: 'Skyline Horizon, Cyber Gateway Road, Hitec City',
        society: 'Skyline Horizon',
        neighborhood: 'Hitec City',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        latitude: 17.4474,
        longitude: 78.3762,
        google_place_id: 'ChIJZ4zS0LKTyzsRe8r1b5_s8vA',
        created_at: now,
      },
    },
    {
      prop: {
        id: 'prop_palm_vista_navimumbai',
        slug: 'palm-vista-residences-kharghar-navi-mumbai',
        title: 'Palm Vista Residences',
        tagline: 'Spacious 2 BHK for Rent near Central Park Metro',
        description: 'Well-ventilated East-facing 2 BHK flat situated in a premium high-rise society. Walking distance to Kharghar Metro Station, Central Park, and Golf Course. Modular kitchen and wardrobes installed.',
        price: 42000,
        currency: 'INR',
        type: 'rent',
        category: 'apartment',
        category_label: 'Rental Apartment',
        status: 'published',
        featured: 0,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_vikram_malhotra',
        specs_bedrooms: 2,
        specs_bathrooms: 2,
        specs_area_sqft: 1180,
        specs_year_built: 2022,
        specs_parking_spaces: 1,
        specs_furnishing: 'semi-furnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Gated Community', 'Kids Play Area', 'Clubhouse', 'Intercom', '24/7 Water Supply', 'Lift']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_palm_vista_navimumbai',
        property_id: 'prop_palm_vista_navimumbai',
        address: 'Sector 20, Near Kharghar Valley Golf Course, Kharghar',
        society: 'Palm Vista',
        neighborhood: 'Kharghar',
        city: 'Navi Mumbai',
        state: 'Maharashtra',
        pincode: '410210',
        latitude: 19.0473,
        longitude: 73.0699,
        google_place_id: 'ChIJd9y5X-bK5zsRzF24n9k1_1M',
        created_at: now,
      },
    },
    {
      prop: {
        id: 'prop_summit_tech_park',
        slug: 'summit-tech-park-offices-outer-ring-road-bengaluru',
        title: 'Summit Tech Park Prime Office',
        tagline: 'Grade-A Commercial Office Floor on Outer Ring Road',
        description: 'Fully furnished Grade-A commercial corporate office space with 120 workstations, 4 executive cabins, boardrooms, cafeteria, high-speed fiber internet, and 100% DG power backup.',
        price: 240000,
        currency: 'INR',
        type: 'rent',
        category: 'commercial',
        category_label: 'Commercial Office',
        status: 'published',
        featured: 0,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_ananya_sharma',
        specs_bedrooms: 0,
        specs_bathrooms: 4,
        specs_area_sqft: 4500,
        specs_year_built: 2023,
        specs_parking_spaces: 6,
        specs_furnishing: 'furnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Centrally Air Conditioned', '100% Power Backup', 'High-Speed Elevators', 'Cafeteria', 'Conference Rooms', 'Fire Safety Sprinklers']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_summit_tech_park',
        property_id: 'prop_summit_tech_park',
        address: 'Tower B, Summit Tech Park, Marathahalli-Sarjapur Outer Ring Road',
        society: 'Summit Tech Park',
        neighborhood: 'Outer Ring Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560103',
        latitude: 12.9352,
        longitude: 77.6946,
        google_place_id: 'ChIJ577nZ19DrjsR_j9d_70_M4A',
        created_at: now,
      },
    },
    {
      prop: {
        id: 'prop_rajwada_greens_kolhapur',
        slug: 'rajwada-greens-plots-tarabai-park-kolhapur',
        title: 'Rajwada Greens Premium Plots',
        tagline: 'NA Residential Villa Plots in Prime Tarabai Park',
        description: 'Clear title, RERA approved NA villa plots situated in Kolhapur\'s most prestigious residential neighborhood. Immediate registration and bank loan approval available.',
        price: 6800000,
        currency: 'INR',
        type: 'buy',
        category: 'plots',
        category_label: 'Residential Plot',
        status: 'published',
        featured: 0,
        verified: 1,
        is_new: 1,
        assigned_agent_id: 'agent_vikram_malhotra',
        specs_bedrooms: 0,
        specs_bathrooms: 0,
        specs_area_sqft: 3600,
        specs_year_built: 2024,
        specs_parking_spaces: 0,
        specs_furnishing: 'unfurnished',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
        ]),
        amenities: JSON.stringify(['Gated Compound Wall', 'Tar Road Access', 'Underground Drainage', 'Street Lights', '24/7 Water Line']),
        created_at: now,
        updated_at: now,
      },
      loc: {
        id: 'loc_rajwada_greens_kolhapur',
        property_id: 'prop_rajwada_greens_kolhapur',
        address: 'Rajwada Greens, Near Circuit House, Tarabai Park',
        society: 'Rajwada Greens',
        neighborhood: 'Tarabai Park',
        city: 'Kolhapur',
        state: 'Maharashtra',
        pincode: '416003',
        latitude: 16.7107,
        longitude: 74.2372,
        google_place_id: 'ChIJG_Zl2_Jz2zsRs34y8w9k1lA',
        created_at: now,
      },
    },
  ];

  for (const item of propertyData) {
    const p = item.prop;
    const l = item.loc;

    await execute(
      `INSERT INTO properties (
        id, slug, title, tagline, description, price, currency, type, category, category_label,
        status, featured, verified, is_new, assigned_agent_id, specs_bedrooms, specs_bathrooms,
        specs_area_sqft, specs_year_built, specs_parking_spaces, specs_furnishing, images, amenities,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.slug, p.title, p.tagline, p.description, p.price, p.currency, p.type, p.category, p.category_label,
        p.status, p.featured, p.verified, p.is_new, p.assigned_agent_id, p.specs_bedrooms, p.specs_bathrooms,
        p.specs_area_sqft, p.specs_year_built, p.specs_parking_spaces, p.specs_furnishing, p.images, p.amenities,
        p.created_at, p.updated_at,
      ]
    );

    await execute(
      `INSERT INTO property_locations (
        id, property_id, address, society, neighborhood, city, state, pincode, latitude, longitude, google_place_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        l.id, l.property_id, l.address, l.society, l.neighborhood, l.city, l.state, l.pincode, l.latitude, l.longitude, l.google_place_id, l.created_at,
      ]
    );
  }

  console.log(`[Seed] Successfully inserted ${propertyData.length} properties and ${agents.length} agents into database!`);
}

seedDatabase()
  .then(() => {
    console.log('[Seed] Completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });

