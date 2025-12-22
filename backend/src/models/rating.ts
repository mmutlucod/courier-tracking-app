import mongoose, { Document, Schema } from 'mongoose';

export interface IRating extends Document {
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  courierId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    courierId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    
    comment: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

RatingSchema.index({ orderId: 1 });
RatingSchema.index({ courierId: 1 });

RatingSchema.post('save', async function () {
  const User = mongoose.model('User');
  
  const result = await mongoose.model('Rating').aggregate([
    { $match: { courierId: this.courierId } },
    {
      $group: {
        _id: '$courierId',
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  
  if (result.length > 0) {
    await User.findByIdAndUpdate(this.courierId, {
      rating: Math.round(result[0].avgRating * 10) / 10,
    });
  }
});

export default mongoose.model<IRating>('Rating', RatingSchema);