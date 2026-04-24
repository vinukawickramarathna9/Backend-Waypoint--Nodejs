# WayPoint Backend Implementation Plan

This document outlines a structured, step-by-step plan for building a well-optimized, secure, and scalable Node.js/Express backend for the WayPoint Shuttle Management System. The architecture and API contracts align perfectly with the React Native (Expo) frontend specifications.

## Phase 1: Project Setup & Configuration
**Goal:** Initialize the project repository, set up TypeScript, and configure essential middleware.

1. **Initialize Node Project:**
   - Run `npm init -y`.
   - Install core dependencies: `express`, `mongoose`, `cors`, `dotenv`, `socket.io`, `helmet`, `morgan`.
   - Install auth/security dependencies: `bcryptjs`, `jsonwebtoken`, `express-rate-limit`.
   - Install validation dependencies: `zod` or `joi`.

2. **TypeScript Setup:**
   - Install dev dependencies: `typescript`, `@types/node`, `@types/express`, `@types/cors`, `ts-node`, `nodemon`.
   - Initialize `tsconfig.json` with strict typing.
   - Configure build and start scripts in `package.json`.

3. **Application Skeleton:**
   - Create the recommended folder structure:
     ```text
     src/
     ├── config/
     ├── controllers/
     ├── middlewares/
     ├── models/
     ├── routes/
     ├── services/
     ├── utils/
     └── index.ts
     ```
   - Set up `express` server in `index.ts`.
   - Configure global middleware (CORS, JSON parsing, Helmet for security, Morgan for logging).

## Phase 2: Database Modeling (MongoDB & Mongoose)
**Goal:** Define schemas corresponding to the system's data contracts.

1. **Connect to MongoDB:**
   - Create a connection utility in `config/db.ts`.
2. **Implement Schemas (`src/models/`):**
   - `User`: Store name, email, hashed password, role (`passenger`, `driver`, `admin`).
   - `Route`: Store route details, stops (with geo-coordinates).
   - `Trip`: Active/Completed sessions linking routes and drivers. Track status, current stop index.
   - `BoardingHistory`: Log passenger boarding events, linking to a specific `Trip`.

## Phase 3: Authentication & Security
**Goal:** Secure the API with proper registration, login, and Role-Based Access Control (RBAC).

1. **Auth Controllers (`controllers/authCtrl.ts`):**
   - Implement `register` (hash password, generate JWT).
   - Implement `login` (verify password, generate JWT).
2. **Auth Middleware (`middlewares/auth.ts`):**
   - Token verification middleware (`verifyToken`).
   - Role-checking middlewares (`isDriver`, `isAdmin`).
3. **Security Enhancements:**
   - Apply `express-rate-limit` to `/auth` routes to prevent brute force attacks.
   - Ensure passwords are never returned in API responses.

## Phase 4: Core API Endpoint Implementations
**Goal:** Build out the REST APIs as defined in `API-Contracts.md`.

1. **User Routes (`routes/userRoutes.ts`):**
   - `GET /api/v1/users/me`: Return current user profile.
   - `GET /api/v1/users/history`: Return current passenger's boarding history.
2. **Route Management (`routes/routeRoutes.ts`):**
   - `GET /api/v1/routes`: Fetch all routes.
   - `GET /api/v1/routes/:id`: Fetch specific route details.
3. **Driver Operations (`routes/driverRoutes.ts`):**
   - `POST /api/v1/driver/trip/start`: Initialize a new Trip document.
   - `PUT /api/v1/driver/trip/:id/progress`: Update current stop.
   - `POST /api/v1/driver/trip/:id/end`: Mark trip as completed.
   - `POST /api/v1/driver/scan`: Validate passenger QR JWT, create `BoardingHistory` entry, increment trip passenger count.
4. **Admin Operations (`routes/adminRoutes.ts`):**
   - CRUD management for Routes, Users.

## Phase 5: Real-time Socket.io Engine
**Goal:** Enable real-time GPS tracking for passengers.

1. **Socket.io Initialization (`services/socket.ts`):**
   - Attach Socket.io to the Express HTTP Server.
   - Set up authentication for Socket connections using JWT.
2. **Event Handlers:**
   - Map bus rooms based on `routeId`.
   - Listen to `driver:location_update` from drivers.
   - Listen to `passenger:join_route` from passengers.
   - Broadcast `map:bus_locations` to designated route rooms to update passenger maps.

## Phase 6: Error Handling & Validation
**Goal:** Ensure robustness and standard error responses.

1. **Data Validation:**
   - Create Zod schemas to validate request bodies (e.g., login credentials, route creation payloads).
   - Create a validation middleware to intercept bad requests before reaching controllers.
2. **Global Error Handler (`middlewares/errorHandler.ts`):**
   - Implement a unified Express error-handling middleware.
   - Return clear JSON responses with appropriate HTTP status codes (e.g., standardizing Mongoose duplicate key errors for emails).

## Phase 7: Optimization & Final Polish
**Goal:** Prepare the backend for production.

1. **Environment Variables:**
   - Use `.env` file securely holding `PORT`, `MONGO_URI`, `JWT_SECRET`.
2. **Code Cleanup:**
   - Run Prettier and ESLint.
   - Abstract reusable logic into `utils/` (e.g., `catchAsync` to avoid try-catch blocks everywhere).
3. **Documentation:**
   - Update README with setup instructions.
   - Add postman collection or Swagger UI if needed for easier testing before frontend integration.
