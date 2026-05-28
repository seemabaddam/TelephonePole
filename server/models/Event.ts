import { Schema, model, Document } from 'mongoose';

export interface IEvent extends Document {
  title: string
  description?: string
  eventDate: Date
  venue?: string
  location?: string
  imageData: Buffer
  imageMimeType: string
  uploadedAt: Date
}

const eventSchema = new Schema<IEvent>({
  title:         { type: String, required: true },
  description:   { type: String },
  eventDate:     { type: Date, required: true },
  venue:         { type: String },
  location:      { type: String },
  imageData:     { type: Buffer, required: true },
  imageMimeType: { type: String, required: true },
  uploadedAt:    { type: Date, default: Date.now },
});

export const Event = model<IEvent>('Event', eventSchema);
