import mongoose, { Document, Schema } from 'mongoose';

export interface IBus {
  name: string;
  plate: string;
  capacity: number;
  model: string;
  serviceHistory: string;
  status: 'Active' | 'In Maintenance' | 'Retired';
}

const busSchema = new Schema<IBus>({
  name: { type: String, required: true },
  plate: { type: String, required: true, unique: true },
  capacity: { type: Number, required: true },
  model: { type: String, required: true },
  serviceHistory: { type: String },
  status: { type: String, enum: ['Active', 'In Maintenance', 'Retired'], default: 'Active' }
});

export const Bus = mongoose.model<IBus>('Bus', busSchema);
