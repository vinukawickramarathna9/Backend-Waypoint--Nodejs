import mongoose, { Document, Schema } from 'mongoose';

export interface ITripHistory extends Document {
  tripId: mongoose.Types.ObjectId;
  routeId?: mongoose.Types.ObjectId;
  busNumber: string;
  driverId: mongoose.Types.ObjectId;
  startTime: Date;
  startLocation: {
    lat: number;
    lng: number;
  };
  endTime?: Date;
  endLocation?: {
    lat: number;
    lng: number;
  };
  totalTime?: number; // in minutes
  status: 'started' | 'completed' | 'cancelled';
}

const tripHistorySchema = new Schema<ITripHistory>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: false },     
    busNumber: { type: String, required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true, default: Date.now },
    startLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    endTime: { type: Date },
    endLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    totalTime: { type: Number },
    status: { type: String, enum: ['started', 'completed', 'cancelled'], default: 'started' }
  },
  { timestamps: true, collection: 'triphistory' }
);

export default mongoose.model<ITripHistory>('TripHistory', tripHistorySchema);