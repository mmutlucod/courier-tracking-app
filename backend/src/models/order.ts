import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  courierId?: mongoose.Types.ObjectId;
  orderNumber: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;

  deliveryAddressId?: mongoose.Types.ObjectId; 
  deliveryAddress: string; 
  deliveryLat: number;
  deliveryLng: number; 
  
  total: number;
  notes?: string;
  
  orderedAt: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    courierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    
    orderNumber: {
      type: String,
      required: true,
      uppercase: true,
    },
    
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    
    pickupAddress: {
      type: String,
      required: true,
    },
    
    pickupLat: {
      type: Number,
      required: true,
    },
    
    pickupLng: {
      type: Number,
      required: true,
    },
    
    deliveryAddressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      index: true,
    },

    deliveryAddress: {
      type: String,
      required: true,
    },
    
    deliveryLat: {
      type: Number,
      required: true,
    },
    
    deliveryLng: {
      type: Number,
      required: true,
    },
    
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    
    orderedAt: {
      type: Date,
      default: Date.now,
    },
    
    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);
OrderSchema.index({ orderNumber: 1 }, { unique: true }); 
OrderSchema.index({ customerId: 1, status: 1 });
OrderSchema.index({ courierId: 1, status: 1 });
OrderSchema.index({ status: 1, orderedAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);