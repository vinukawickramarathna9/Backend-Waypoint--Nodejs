import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

export const initSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // Allows all origins for local development
      methods: ['GET', 'POST']
    }
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      (socket as any).user = decoded; // Attach user info to socket
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid Token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Passenger joining a route tracking room
    socket.on('passenger:join_route', (data) => {
      const { routeId } = data;
      if (routeId) {
        socket.join(routeId);
        console.log(`Socket ${socket.id} joined route room: ${routeId}`);
      }
    });

    // Driver emitting location updates
    socket.on('driver:location_update', (data) => {
      const { tripId, routeId, location, currentStopIndex, timestamp, busName, routeTitle } = data;
      
      const payload = {
        tripId,
        routeId,
        location,
        currentStopIndex,
        busName,
        routeTitle,
        timestamp: timestamp || new Date().toISOString()
      };

      if (routeId) {
        // Broadcasts to passengers specifically in that route's room
        socket.to(routeId).emit('map:bus_locations', payload);
      }
      
      // Also broadcast to the general 'all_buses' room for admin/global tracking
      socket.to('all_buses').emit('map:bus_locations', payload);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
