import bcrypt from 'bcrypt';
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'courier' | 'customer';
  
  vehicleType?: 'bicycle' | 'motorcycle' | 'car';
  isAvailable?: boolean;
  rating?: number;
  totalDeliveries?: number;
  
  totalOrders?: number;
  
  createdAt: Date;
  updatedAt: Date;
  
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    role: {
      type: String,
      enum: ['courier', 'customer'],
      required: true,
      index: true,
    },

    vehicleType: {
      type: String,
      enum: ['bicycle', 'motorcycle', 'car'],
      required: function(this: IUser) {
        return this.role === 'courier';
      },
    },
    
    isAvailable: {
      type: Boolean,
      default: function(this: IUser) {
        return this.role === 'courier' ? true : undefined;
      },
      index: true,
    },
    
    rating: {
      type: Number,
      default: function(this: IUser) {
        return this.role === 'courier' ? 5.0 : undefined;
      },
      min: 0,
      max: 5,
    },
    
    totalDeliveries: {
      type: Number,
      default: function(this: IUser) {
        return this.role === 'courier' ? 0 : undefined;
      },
      min: 0,
    },

    totalOrders: {
      type: Number,
      default: function(this: IUser) {
        return this.role === 'customer' ? 0 : undefined;
      },
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);