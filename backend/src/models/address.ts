import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  fullAddress: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  city?: string;
  district?: string;
  neighbourhood?: string;
  postalCode?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  directions?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    fullAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
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
        validate: {
          validator: function (coords?: number[]) {
            if (!Array.isArray(coords)) return false;
            return (
              coords.length === 2 &&
              typeof coords[0] === 'number' &&
              typeof coords[1] === 'number' &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: 'Geçersiz koordinatlar',
        },
      },
    },

    city: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    neighbourhood: {
      type: String,
      trim: true,
    },

    postalCode: {
      type: String,
      trim: true,
    },

    buildingNo: {
      type: String,
      trim: true,
    },

    floor: {
      type: String,
      trim: true,
    },

    apartmentNo: {
      type: String,
      trim: true,
    },

    directions: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
AddressSchema.index({ location: '2dsphere' });

AddressSchema.index({ userId: 1, isDefault: -1 });
AddressSchema.pre('save', async function () {
  if (this.isDefault && this.isModified('isDefault')) {
    await mongoose.model('Address').updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
});

export default mongoose.model<IAddress>('Address', AddressSchema);