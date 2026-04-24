import mongoose, { Document, Schema } from 'mongoose';

export interface IBoardingHistory extends Document {
  passengerId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId | string;
  bookingId: mongoose.Types.ObjectId | string;
  boardedAtStop: string;
  timestamp: Date;
  busNumber?: string;
  passengerName?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

const boardingHistorySchema = new Schema<IBoardingHistory>({
  passengerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
  boardedAtStop: { type: String },
  timestamp: { type: Date, default: Date.now },
  busNumber: { type: String },
  passengerName: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
});

export const BoardingHistory = mongoose.model<IBoardingHistory>('BoardingHistory', boardingHistorySchema);
