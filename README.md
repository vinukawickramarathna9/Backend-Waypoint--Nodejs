# WayPoint API Server

This is the backend implementation for the **WayPoint Shuttle Management System**, developed with Node.js, Express, TypeScript, MongoDB, and Socket.io for Real-time GPS tracking.

## 🚀 Features Implemented
- **MongoDB & Mongoose**: Fully structured schemas (`User`, `Route`, `Trip`, `BoardingHistory`).
- **Authentication**: JWT-based authentication with Bcrypt password hashing.
- **Role-Based Access Control (RBAC)**: Secure middlewares for `passenger`, `driver`, and `admin` roles.
- **REST APIs**: Complete functional flows for trip scheduling, passenger validation, and tracking history.
- **Real-Time GPS Tracking**: Socket.IO integrated with rooms per `routeId` keeping passenger map instances updated without polluting network scopes.
- **Security & Validation**: Express-rate-limit, Helmet security headers, Zod payload validation, and custom Error handlings.
- **Optimized Wrappers**: Fully abstracted async handler and operational AppErrors.

## 🛠️ Prerequisites
- Node.js (v16+)
- MongoDB locally installed, or a MongoDB Atlas URI.

## 📦 Setup & Installation

**1. Clone or Download the Repository:**
Navigate into the backend project folder.

**2. Install Dependencies:**
```bash
npm install
```

**3. Configure Environment Variables:**
The `.env` file should be located at the root of the project with the following keys:
```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/waypoint
JWT_SECRET=your_super_secret_jwt_key_here
```

**4. Start the Application:**

*For Development (with Live Reload)*:
```bash
npm run dev
```

*For Production (Build & Execute)*:
```bash
npm run build
npm start
```

## 📡 API Structure Context
All functionality mirrors the `API-Contracts.md` specifications tightly. Endpoints are grouped under the `/api/v1/*` convention.
- **Auth**: `/api/v1/auth/login` | `/register`
- **Users**: `/api/v1/users/me` | `/history` 
- **Routes**: `/api/v1/routes`
- **Driver Sessions**: `/api/v1/driver/trip/*` & `/scan`
- **Admin Utilities**: `/api/v1/admin/routes`

## 🗜️ Socket.IO Endpoints
The frontend maps `Tracking` sockets utilizing:
1. **Join room**: Emit `passenger:join_route` passing `{ routeId }`.
2. **Update Map**: Drivers emit `driver:location_update` passing `{ tripId, routeId, location: { lat, lng }, currentStopIndex }`.
3. **Listen Updates**: Subscribed passengers listen to `map:bus_locations`.

---
*Built with ❤️ for WayPoint.*
