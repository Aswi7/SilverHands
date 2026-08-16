# SilverHands — Project Architecture Design

This document details the software architecture, database models, directory structure, and API routes for the **SilverHands** MVP. 

SilverHands is a full-stack platform that helps senior citizens and homemakers ("providers") earn income by matching them with local service requests from nearby customers.

---

## 1. Directory Structure

We propose a clean, separated full-stack repository structure with `/frontend` (React bootstrapped with Vite) and `/backend` (Express) as top-level folders. Styling is organized using plain CSS stylesheets, with one CSS file per page or component.

```text
silverhands/
├── frontend/                   # Frontend React application (Vite)
│   ├── public/                 # Static assets (favicons, manifest, etc.)
│   ├── src/
│   │   ├── assets/             # Images, icons, and logos
│   │   ├── components/         # Reusable UI components
│   │   │   ├── LanguageSwitcher.jsx
│   │   │   └── LanguageSwitcher.css
│   │   ├── context/            # Global context providers (AuthContext, LanguageContext)
│   │   ├── hooks/              # Custom hooks (e.g., useTranslation, useLocation)
│   │   ├── locales/            # Internationalization dictionaries
│   │   │   ├── en.json         # English translations
│   │   │   ├── hi.json         # Hindi translations
│   │   │   └── ta.json         # Tamil translations
│   │   ├── pages/              # View-level page components
│   │   │   ├── Dashboard.jsx   # Provider / Customer main view
│   │   │   ├── Dashboard.css
│   │   │   ├── Login.jsx
│   │   │   ├── Login.css
│   │   │   ├── Signup.jsx
│   │   │   └── Signup.css
│   │   ├── services/           # Axios / Fetch API client modules
│   │   │   ├── api.js          # Base API client config (with credentials)
│   │   │   ├── auth.js         # Authentication requests
│   │   │   └── requests.js     # Service request requests
│   │   ├── App.jsx             # Main Application entry component
│   │   ├── App.css
│   │   ├── i18n.js             # i18next initialization configuration
│   │   ├── index.css           # Core global styles (themes, variables)
│   │   └── main.jsx            # React root mount point
│   ├── package.json
│   └── vite.config.js          # Vite config
│
├── backend/                    # Backend Express application
│   ├── config/                 # DB connections, environmental configurations
│   │   └── db.js               # MongoDB connection logic
│   ├── controllers/            # Express controller logic (handles requests/responses)
│   │   ├── authController.js
│   │   ├── requestController.js
│   │   └── userController.js
│   ├── middleware/             # Express middlewares (auth validation, error handling)
│   │   ├── authMiddleware.js   # JWT verification middleware (checks HTTP-only cookies)
│   │   └── errorMiddleware.js  # Global error handling
│   ├── models/                 # Mongoose schemas
│   │   ├── ServiceRequest.js
│   │   └── User.js
│   ├── routes/                 # API endpoint routers
│   │   ├── authRoutes.js       # Signup, login, logout
│   │   ├── requestRoutes.js    # Create requests, fetch nearby requests
│   │   └── userRoutes.js       # Update location, preferred language
│   ├── package.json
│   └── server.js               # Express application entry point
│
├── .gitignore
└── README.md
```

---

## 2. MongoDB Mongoose Schemas

We leverage MongoDB's Geospatial indexing (`2dsphere`) to support distance-based nearby sorting. Both the user's current location and the request location are stored as standard GeoJSON Points: `[longitude, latitude]`.

### Helper GeoJSON Schema
```javascript
const PointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true
  }
});
```

### User Schema (`backend/models/User.js`)
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  }, // Will store hashed password (bcrypt)
  role: { 
    type: String, 
    enum: ['provider', 'customer'], 
    required: true 
  },
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'hi', 'ta'], 
    default: 'en' 
  },
  location: {
    type: PointSchema,
    required: true
  },
  // Provider-specific fields (optional, active only if role is 'provider')
  skills: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    trim: true
  },
  availability: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index location for geospatial queries
UserSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', UserSchema);
```

### ServiceRequest Schema (`backend/models/ServiceRequest.js`)
```javascript
const mongoose = require('mongoose');

const ServiceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: PointSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'completed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

// Index location for geo searches (finding requests near a provider)
ServiceRequestSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);
```

---

## 3. REST API Routes & Session Management

All session authentication uses JWTs delivered via secure, HTTP-only cookies (`httpOnly: true, secure: true, sameSite: 'strict'`). Frontend API requests will pass coordinates and credentials with CORS support configured to allow credentials.

### Authentication (`/api/auth`)
* **`POST /api/auth/signup`**
  * **Description**: Create a new user account (Customer or Provider).
  * **Payload**:
    ```json
    {
      "name": "Jane Doe",
      "phone": "9876543210",
      "password": "securepassword",
      "role": "provider",
      "preferredLanguage": "en",
      "location": {
        "longitude": 80.2707,
        "latitude": 13.0827
      }
    }
    ```
  * **Response**: `201 Created` with session token set in HTTP-only Cookie `token`.

* **`POST /api/auth/login`**
  * **Description**: Authenticate using phone and password.
  * **Payload**:
    ```json
    {
      "phone": "9876543210",
      "password": "securepassword"
    }
    ```
  * **Response**: `200 OK` with session token set in HTTP-only Cookie `token`.

* **`POST /api/auth/logout`**
  * **Description**: Clear the authentication cookie.
  * **Response**: `200 OK` with cleared cookie header.

* **`GET /api/auth/me`** (Protected)
  * **Description**: Get profile details for currently authenticated user.
  * **Response**: `200 OK` with user details.

### User Management (`/api/users`)
* **`PUT /api/users/profile`** (Protected)
  * **Description**: Update user fields like language preference, profile details, bio, or status.
  * **Payload**:
    ```json
    {
      "preferredLanguage": "ta",
      "availability": false
    }
    ```
  * **Response**: `200 OK` with updated user object.

* **`PUT /api/users/location`** (Protected)
  * **Description**: Update the coordinates of the user. Triggered manually by the user via UI action.
  * **Payload**:
    ```json
    {
      "longitude": 80.2707,
      "latitude": 13.0827
    }
    ```
  * **Response**: `200 OK`.

### Service Requests (`/api/requests`)
* **`POST /api/requests`** (Protected, Customer role only)
  * **Description**: Create a new service request at a specified service location.
  * **Payload**:
    ```json
    {
      "title": "Need help setting up a smartphone",
      "description": "Looking for someone to explain WhatsApp and digital payments step by step.",
      "category": "Technology Support",
      "location": {
        "longitude": 80.2750,
        "latitude": 13.0850
      }
    }
    ```
  * **Response**: `201 Created`.

* **`GET /api/requests/nearby`** (Protected, Provider role only)
  * **Description**: Fetch nearby `pending` service requests sorted by distance from the provider.
  * **Query Parameters (Optional)**: 
    * `latitude`: Query specific latitude (defaults to provider's saved coordinate if omitted).
    * `longitude`: Query specific longitude (defaults to provider's saved coordinate if omitted).
    * `maxDistance`: Search radius in meters (default: 5000 / 5km).
  * **Internal Controller Logic**:
    Uses MongoDB `$geoNear` aggregation stage or `$near` query operators.
    ```javascript
    const requests = await ServiceRequest.find({
      status: 'pending',
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance) // in meters
        }
      }
    });
    ```
  * **Response**: `200 OK` with array of requests, enriched with computed distances.

---

## 4. Internationalization (i18n) Setup

We will use standard `i18next` and `react-i18next` for clean, runtime language switches across **English (`en`)**, **Tamil (`ta`)**, and **Hindi (`hi`)**.

### Translation Directories (`frontend/src/locales/`)
Translation JSON files contain key-value pairs representing localized UI strings.

* **`en.json` (English)**:
  ```json
  {
    "welcome": "Welcome back, {{name}}",
    "dashboard": {
      "title": "Available Local Requests",
      "no_requests": "No requests found near your location.",
      "distance": "{{distance}} km away",
      "update_location": "Update My Location"
    },
    "roles": {
      "provider": "Provider (Senior Citizen / Homemaker)",
      "customer": "Customer"
    }
  }
  ```

### Language Switcher Integration
A configuration script (`frontend/src/i18n.js`) loads translations. The switcher component (`LanguageSwitcher.jsx`) allows changing the language at runtime, dynamically updating the i18next instance and updating the database record.

```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = async (newLang) => {
    i18n.changeLanguage(newLang);
    try {
      await api.put('/users/profile', { preferredLanguage: newLang });
    } catch (err) {
      console.error('Failed to sync language preference with server', err);
    }
  };

  return (
    <select 
      value={i18n.language} 
      onChange={(e) => handleLanguageChange(e.target.value)}
      className="lang-select"
    >
      <option value="en">English</option>
      <option value="ta">தமிழ் (Tamil)</option>
      <option value="hi">हिन्दी (Hindi)</option>
    </select>
  );
};

export default LanguageSwitcher;
```
