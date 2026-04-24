import mongoose, { Document, Schema } from 'mongoose';

export interface ITrip extends Document {
  // Required for driver/system updates
  routeId?: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  status: string;
  currentStopIndex: number;
  passengersBoarded: number;
  startTime?: Date;
  endTime?: Date;

  // Added for frontend admin payload mappings
  name?: string;
  route?: string;
  time?: string;
  driver?: string;
  bus?: string;
  seatLimit?: string;
  recurring?: string;
}

const tripSchema = new Schema<ITrip>({
  routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
  driverId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'Scheduled' },
  currentStopIndex: { type: Number, default: 0 },
  passengersBoarded: { type: Number, default: 0 },
  startTime: { type: Date },
  endTime: { type: Date },
  
  name: { type: String },
  route: { type: String },
  time: { type: String },
  driver: { type: String },
  bus: { type: String },
  seatLimit: { type: String },
  recurring: { type: String, default: 'None' }
});

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
