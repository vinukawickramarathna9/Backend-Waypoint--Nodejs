import mongoose, { Document, Schema } from 'mongoose';

export interface IRoute extends Document {
  name: string;
  distance?: string;
  status?: string;
  stops: {
    name: string;
    location: { type: string, coordinates: number[] };
  }[];
  schedule: { departureTime: string; driverId: mongoose.Types.ObjectId }[];
}

const routeSchema = new Schema<IRoute>({
  name: { type: String, required: true },
  distance: { type: String },
  status: { type: String, default: 'Active' },
  stops: [{
    name: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }
    }
  }],
  schedule: [{
    departureTime: { type: String },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' }
  }]
});

routeSchema.index({ 'stops.location': '2dsphere' });

export const Route = mongoose.model<IRoute>('Route', routeSchema);
