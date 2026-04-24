import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  passenger: string;
  trip: string;
  date: string;
  status: string;
}

const bookingSchema = new Schema<IBooking>({
  passenger: { type: String, required: true },
  trip: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, required: true, default: 'Confirmed' }
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
