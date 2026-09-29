-- Cityspace Relational Database Schema
-- Compatible with MySQL / MariaDB and SQLite

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  license_no VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(150),
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  avatar TEXT,
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(64) PRIMARY KEY,
  company_id VARCHAR(64),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  designation VARCHAR(150),
  experience VARCHAR(150),
  bio TEXT,
  avatar TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  rating DECIMAL(3, 2) DEFAULT 5.0,
  review_count INT DEFAULT 0,
  areas_served TEXT,
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(191) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  description TEXT,
  price DECIMAL(14, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  type VARCHAR(50) NOT NULL DEFAULT 'buy',
  category VARCHAR(50) NOT NULL,
  category_label VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  is_new TINYINT(1) NOT NULL DEFAULT 1,
  assigned_agent_id VARCHAR(64),
  company_id VARCHAR(64),
  specs_bedrooms INT DEFAULT 0,
  specs_bathrooms INT DEFAULT 0,
  specs_area_sqft DECIMAL(10, 2) DEFAULT 0,
  specs_year_built INT,
  specs_parking_spaces INT DEFAULT 0,
  specs_furnishing VARCHAR(50) DEFAULT 'unfurnished',
  images LONGTEXT,
  amenities LONGTEXT,
  verification_status VARCHAR(50) NOT NULL DEFAULT 'draft',
  verification_notes TEXT,
  rejection_reason TEXT,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS property_locations (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  society VARCHAR(255),
  neighborhood VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  google_place_id VARCHAR(255),
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS enquiries (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64),
  visitor_name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  pipeline_stage VARCHAR(50) NOT NULL DEFAULT 'new',
  buyer_budget VARCHAR(100),
  buyer_location VARCHAR(150),
  notes TEXT,
  follow_up_date VARCHAR(64),
  agent_id VARCHAR(64),
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS site_visits (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL,
  -- Client / User details (denormalized for speed)
  client_name VARCHAR(150) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_email VARCHAR(150),
  -- Agent
  agent_id VARCHAR(64),
  -- Requested time slot (agent-proposed)
  visit_date VARCHAR(64) NOT NULL,
  visit_time VARCHAR(64) NOT NULL,
  -- Alternative slots (agent can suggest up to 2 more)
  alt_slot_1_date VARCHAR(64),
  alt_slot_1_time VARCHAR(64),
  alt_slot_2_date VARCHAR(64),
  alt_slot_2_time VARCHAR(64),
  -- Admin-confirmed time (after approval or reschedule)
  confirmed_date VARCHAR(64),
  confirmed_time VARCHAR(64),
  -- Status: pending_approval | approved | rejected | rescheduled | completed | cancelled | no_show | scheduled
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
  -- Reason fields
  rejection_reason TEXT,
  reschedule_reason TEXT,
  -- Notes
  notes TEXT,
  created_at VARCHAR(64) NOT NULL,
  updated_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_name VARCHAR(150) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(64),
  entity_name VARCHAR(255),
  details TEXT,
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  -- Recipient targeting: role = admin | agent | user | all
  recipient_role VARCHAR(50) NOT NULL DEFAULT 'admin',
  -- Specific agent/user id; NULL = all of that role
  recipient_id VARCHAR(64),
  -- Link back to the site visit that triggered this
  visit_id VARCHAR(64),
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS property_views (
  id VARCHAR(64) PRIMARY KEY,
  property_id VARCHAR(64) NOT NULL,
  viewed_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS amenities (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  created_at VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS property_categories_master (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL DEFAULT 'home',
  description VARCHAR(255),
  created_at VARCHAR(64) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON properties(category);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_locations_city ON property_locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON property_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_enquiries_agent ON enquiries(agent_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_site_visits_date ON site_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);
