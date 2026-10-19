# 🏙️ CitySpace — Universal Real Estate & Property Discovery Platform

> A modern, full-stack, cross-platform real estate portal and CRM built with **Expo SDK 57**, **React Native Web**, **Express.js**, **MySQL / SQLite**, and powered by **Google Gemini AI** and **Geoapify Maps**.

---

## 🌟 Highlights & Features

### 🔍 For Buyers & Renters
- **Dynamic Property Discovery**: Explore curated apartments, luxury villas, commercial spaces, and plots with high-resolution image galleries and verified listings.
- **Advanced Filtering & Search**: Filter by buy/rent, budget, BHK count, square footage, neighborhood, amenities, and verification status.
- **Interactive Maps & Geospatial POIs**: Visual property exploration using **Leaflet** and **Google Maps**, with Geoapify-powered nearby places (schools, transit, hospitals, restaurants).
- **AI-Powered Property Insights**: Real-time property descriptions, neighborhood highlights, and natural language property assistant powered by **Google Gemini**.
- **Site Visit Booking & Management**: Schedule property visits with calendar integration, time slot selection, and status tracking (`/my-visits`).
- **Property Comparison & Shortlisting**: Save favorite homes, compare specifications side-by-side, and submit direct enquiries.

### 💼 For Real Estate Agents (`/agent`)
- **Agent CRM Dashboard**: Unified overview of assigned properties, client inquiries, active leads, and visit schedules.
- **Lead Pipeline Management**: Track prospective buyers through stages (New, Contacted, Site Visit Scheduled, Negotiation, Closed).
- **Client & Communication Hub**: Direct messaging, notes, and activity timeline for each prospect.
- **Performance Analytics**: Review closed deals, commission tracking, and customer ratings.

### 🛡️ For Administrators (`/admin`)
- **Complete Property Lifecycle**: Add, edit, publish, archive, and verify listings with rich forms, media uploads, and map coordinate pickers.
- **Agent Roster Management**: Onboard new agents, assign territories, track licensing, and monitor agent performance.
- **Platform Analytics**: Visual dashboards for user acquisition, enquiry volumes, geographic distribution, and revenue metrics.
- **Audit & Verification**: Property document verification and verification badge management.

---

## 🏗️ Architecture & Tech Stack

```
CitySpace
├── Frontend (Expo SDK 57 / React Native)
│   ├── Expo Router (Typed File-based Routing)
│   ├── React Native Web (Responsive Desktop & Mobile UI)
│   ├── React Native Reanimated & Gesture Handler
│   ├── Leaflet & Google Maps (Interactive Mapping)
│   └── Google Gemini Service (AI Generative Assistance)
│
└── Backend (Node.js & Express)
    ├── REST API (Routes for properties, agents, enquiries, visits, etc.)
    ├── Dual Database Engine (MySQL with automated SQLite fallback)
    └── TypeScript Execution via tsx
```

### Technology Matrix

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [React 19](https://react.dev/), [React Native 0.86](https://reactnative.dev/), [React Native Web](https://necolas.github.io/react-native-web/) |
| **Routing & Navigation** | [Expo Router v57](https://docs.expo.dev/router/introduction/) (File-based, typed routes) |
| **Backend API** | [Express 5](https://expressjs.com/), [Node.js](https://nodejs.org/), [tsx](https://github.com/privatenumber/tsx) |
| **Database** | Dual engine: **MySQL** (via `mysql2`) with zero-config local **SQLite** (`database/cityspace.db`) fallback |
| **AI Integration** | **Google Gemini** (`gemini-3.6-flash`, `gemini-flash-lite-latest`) |
| **Maps & Geolocation** | **Leaflet**, **Geoapify API**, **Google Places API** |
| **Styling & Icons** | React Native StyleSheet, `@expo/vector-icons`, custom glassmorphism design system |

---

## 📁 Project Structure

```
d:/CitySpace/
├── server/                    # Express.js REST API Server
│   ├── db/
│   │   ├── database.ts        # Database connection & dual-engine auto-migration
│   │   └── schema.sql         # Relational schema (properties, agents, enquiries, visits, users)
│   ├── routes/                # Modular route handlers
│   │   ├── activityRoutes.ts
│   │   ├── agentRoutes.ts
│   │   ├── analyticsRoutes.ts
│   │   ├── enquiryRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── propertyRoutes.ts
│   │   ├── siteVisitRoutes.ts
│   │   └── userRoutes.ts
│   └── server.ts              # Server entry point & CORS configuration
├── database/
│   └── cityspace.db           # SQLite database file (fallback engine)
├── src/
│   ├── app/                   # Expo Router routes & screens
│   │   ├── (auth)/            # Login & Registration screens
│   │   ├── (tabs)/            # Main app tabs (Explore, Search, Favorites, My Visits, Profile)
│   │   ├── admin/             # Admin management portal (Properties, Agents, Enquiries, Analytics)
│   │   ├── agent/             # Agent CRM workspace (Leads, Clients, Visits, Performance)
│   │   ├── properties/        # Property listing & detail pages ([id].tsx)
│   │   ├── contact.tsx        # Contact & support page
│   │   ├── onboarding.tsx     # First-time user welcome flow
│   │   └── sell.tsx           # Property submission / listing intake
│   ├── components/            # Reusable UI components
│   │   ├── admin/             # Admin sidebar, tables, forms, stat cards
│   │   ├── agent/             # Agent workspace components
│   │   ├── common/            # Buttons, Badges, Modals, Inputs, Loaders
│   │   ├── map/               # LeafletPropertyMap, GooglePropertyMap, MapPicker
│   │   └── navigation/        # Desktop navbar, Mobile tab bar, Header
│   ├── features/              # Feature-scoped state & contexts
│   │   ├── auth/              # Auth state & user session
│   │   ├── compare/           # Side-by-side property comparison
│   │   ├── favorites/         # Wishlist & saved properties
│   │   └── notifications/     # Real-time alert notifications
│   ├── services/              # API clients & external service integrations
│   │   ├── apiClient.ts       # Central HTTP client (auto-detects base URL)
│   │   ├── geminiService.ts   # Google Gemini AI assistant & description generation
│   │   ├── geoapifyService.ts # Geocoding, reverse geocoding & nearby POIs
│   │   ├── propertyService.ts # Property fetching & CRUD operations
│   │   └── siteVisitService.ts# Visit booking & schedule management
│   ├── constants/             # Design tokens, theme colors, layout constants
│   ├── hooks/                 # Custom React hooks (breakpoints, theme, debouncing)
│   └── types/                 # Shared TypeScript interfaces & models
├── package.json
├── app.json                   # Expo application configuration
└── tsconfig.json              # TypeScript configuration
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the project root (or verify your existing `.env`):

```env
# Maps & Geolocation API (Geoapify)
EXPO_PUBLIC_GEOAPIFY_API_KEY=your_geoapify_key
VITE_GEOAPIFY_API_KEY=your_geoapify_key

# Google Places API (Optional / Places Search)
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_key

# Google Gemini AI API
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Backend REST API Server
PORT=5000
EXPO_PUBLIC_API_URL=http://localhost:5000/api

# Database Configuration
# Engine can be 'mysql' or 'sqlite' (defaults to sqlite fallback if MySQL is unreachable)
DB_TYPE=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=cityspace
DB_PATH=database/cityspace.db
```

> **Note on Database Connection**: If `DB_TYPE=mysql` is specified but MySQL is offline or connection fails, the server automatically fails over to the local SQLite database at `database/cityspace.db` without crashing.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Backend API Server

Start the Express API service with TypeScript execution:

```bash
npm run server
```

The server will initialize the database schema and start listening:
- **API Base**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

### 3. Run the Frontend Application

Open a second terminal window and run:

#### Web Browser (Recommended for Desktop experience):
```bash
npm run web
```
This launches Metro bundler and opens the application at `http://localhost:8081`.

#### Cross-Platform / Mobile (Android / iOS):
```bash
# Start Expo interactive CLI
npm start

# Or directly target an emulator/device:
npm run android
npm run ios
```

---

## 🔗 Key Routes & Navigation

| Route | Description |
|---|---|
| `/(tabs)` | User home dashboard with featured properties, categories, and recent listings |
| `/(tabs)/search` | Real-time search with filter drawer and map/list view toggle |
| `/(tabs)/favorites` | User saved properties and bookmarks |
| `/(tabs)/my-visits` | Scheduled and completed property site visit appointments |
| `/(tabs)/profile` | User profile settings and preferences |
| `/properties/[id]` | Detailed property view with gallery, amenities, map POIs, and enquiry modal |
| `/agent` | Agent CRM portal (dashboard, leads, visits, clients, messages) |
| `/admin` | Superadmin control center (property approvals, agent roster, platform metrics) |
| `/sell` | Multi-step property submission flow for owners and developers |
| `/contact` | Customer support, contact form, and office locations |

---

## 🤖 Google Gemini AI Integration

CitySpace integrates Google Gemini models via [`src/services/geminiService.ts`](file:///d:/CitySpace/src/services/geminiService.ts) to provide:
1. **AI Property Description Generator**: Automatically crafts persuasive listings based on bedrooms, amenities, location, and key highlights.
2. **AI Real Estate Assistant**: Conversational agent that answers buyer questions about property legalities, mortgage rates, stamp duty, and neighborhood amenities.
3. **Resilient Model Cascade**: Seamlessly falls back between `gemini-3.6-flash`, `gemini-flash-lite-latest`, and preview versions to guarantee 100% uptime.

---

## 🗺️ Maps & Geospatial Services

- **Interactive Leaflet Map**: Smooth vector map rendering with custom property price pin markers and popups.
- **Geoapify Places API**: Scans within configurable radiuses (500m - 5km) for schools, healthcare, supermarkets, and public transit.
- **Map Coordinate Picker**: Admins and sellers can drop pins directly onto the map during property creation to auto-fill latitude and longitude.

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run start` | Start the Expo development server |
| `npm run web` | Start the web application on `http://localhost:8081` |
| `npm run android` | Launch app in Android Studio emulator or connected device |
| `npm run ios` | Launch app in Xcode iOS simulator |
| `npm run server` | Start the Express backend server with hot-reloading |
| `npm run lint` | Run Expo and ESLint static code verification |
| `npm run reset-project` | Reset project template starter code |

---

## 📄 License

This project is licensed under the terms of the [MIT License](file:///d:/CitySpace/LICENSE).
