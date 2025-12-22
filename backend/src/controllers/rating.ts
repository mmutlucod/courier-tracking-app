import { Request, Response } from 'express';
import Order from '../models/order';
import Rating from '../models/rating';
import { asyncHandler } from '../utils/asynchandler';

export const createRating = asyncHandler(async (req: Request, res: Response) => {

  const { orderId, rating, comment } = req.body;
  const customerId = req.user._id;

  if (!orderId || !rating) 
    return res.status(400).json({ success: false, message: 'Sipariş ve puan gerekli.' });
  if (rating < 1 || rating > 5) 
    return res.status(400).json({ success: false, message: 'Puan 1-5 arasında olmalı.' });

  const order = await Order.findById(orderId);
  if (!order) 
    return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
  if (order.customerId.toString() !== customerId.toString()) {
    return res.status(403).json({ success: false, message: 'Bu siparişi değerlendirme yetkiniz yok.' });
  }
  if (order.status !== 'delivered') 
    return res.status(400).json({ success: false, message: 'Sadece teslim edilen siparişler değerlendirilebilir.' });
  if (!order.courierId) 
    return res.status(400).json({ success: false, message: 'Bu sipariş için kurye bulunamadı.' });

  const existingRating = await Rating.findOne({ orderId });
  if (existingRating) 
    return res.status(400).json({ success: false, message: 'Bu sipariş zaten değerlendirilmiş.' });

  const newRating = await Rating.create({ orderId, customerId, courierId: order.courierId, rating, comment: comment || '' });

  res.status(201).json({ success: true, message: 'Değerlendirme eklendi.', rating: newRating });
});

export const getCourierRatings = asyncHandler(async (req: Request, res: Response) => {
  const { courierId } = req.params;
  const { limit = 20 } = req.query;

  if (!courierId) return res.status(400).json({ success: false, message: 'Kurye id gerekli.' });

  const ratings = await Rating.find({ courierId: courierId as any })
    .populate('customerId', 'name')
    .populate('orderId', 'orderNumber')
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  const stats = await Rating.aggregate([
    { $match: { courierId: courierId as any } },
    {
      $group: {
        _id: '$courierId',
        avgRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratings: {
          $push: {
            1: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] },
            2: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] },
            3: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] },
            4: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] },
            5: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] },
          },
        },
      },
    },
  ]);

  const statistics = stats.length > 0 ? stats[0] : null;

  res.json({
    success: true,
    count: ratings.length,
    ratings,
    statistics: statistics ? { avgRating: Math.round(statistics.avgRating * 10) / 10, totalRatings: statistics.totalRatings } : null,
  });
});

export const getOrderRating = asyncHandler(async (req: Request, res: Response) => {
  const rating = await Rating.findOne({ orderId: req.params.orderId as string })
    .populate('customerId', 'name')
    .populate('courierId', 'name vehicleType');

  if (!rating) 
    return res.status(404).json({ success: false, message: 'Bu sipariş için değerlendirme bulunamadı.' });
  res.json({ success: true, rating });
});

export const getMyRatings = asyncHandler(async (req: Request, res: Response) => {
  const ratings = await Rating.find({ customerId: req.user._id })
    .populate('courierId', 'name vehicleType rating')
    .populate('orderId', 'orderNumber deliveryAddress')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: ratings.length, ratings });
});