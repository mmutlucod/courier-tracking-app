import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  courierId: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  speed?: number;
  timestamp: Date;
  createdAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    courierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    
    speed: Number,
    
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);
LocationSchema.index({ location: '2dsphere' });
LocationSchema.index({ courierId: 1, timestamp: -1 });
LocationSchema.index({ orderId: 1 });

export default mongoose.model<ILocation>('Location', LocationSchema);