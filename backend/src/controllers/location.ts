import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Location from '../models/location';
import { asyncHandler } from '../utils/asynchandler';

export const saveLocation = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, speed, orderId } = req.body;
  const courierId = req.user._id;

  if (!lat || !lng) return res.status(400).json({ success: false, message: 'Konum bilgisi gerekli.' });
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ success: false, message: 'Geçersiz koordinatlar.' });

  const location = await Location.create({
    courierId,
    orderId: orderId || undefined,
    location: { type: 'Point', coordinates: [lng, lat] },
    speed: speed || 0,
    timestamp: new Date(),
  });

  res.status(201).json({
    success: true,
    message: 'Konum kaydedildi.',
    location: { _id: location._id, courierId: location.courierId, orderId: location.orderId, lat, lng, speed: location.speed, timestamp: location.timestamp },
  });
});

export const getCourierLocations = asyncHandler(async (req: Request, res: Response) => {
  const { courierId } = req.params;
  const { limit = 50, orderId } = req.query;

  const query: any = { courierId };
  if (orderId) query.orderId = orderId;

  const locations = await Location.find(query).sort({ timestamp: -1 }).limit(Number(limit));

  const formattedLocations = locations.map((loc) => ({
    _id: loc._id,
    courierId: loc.courierId,
    orderId: loc.orderId,
    lat: loc.location.coordinates[1],
    lng: loc.location.coordinates[0],
    speed: loc.speed,
    timestamp: loc.timestamp,
    createdAt: loc.createdAt,
  }));

  res.json({ success: true, count: formattedLocations.length, locations: formattedLocations });
});

export const getLatestLocation = asyncHandler(async (req: Request, res: Response) => {
  const { courierId } = req.params;
  if (!courierId) return res.status(400).json({ success: false, message: 'Kurye ID gerekli.' });

  const location = await Location.findOne({ courierId: new Types.ObjectId(courierId) }).sort({ timestamp: -1 });
  if (!location) return res.status(404).json({ success: false, message: 'Konum bilgisi bulunamadı.' });

  res.json({
    success: true,
    location: {
      _id: location._id,
      courierId: location.courierId,
      orderId: location.orderId,
      lat: location.location.coordinates[1],
      lng: location.location.coordinates[0],
      speed: location.speed,
      timestamp: location.timestamp,
    },
  });
});

export const getNearbyLocations = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius = 5000 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: 'Konum bilgisi gerekli.' });

  const locations = await Location.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        distanceField: 'distance',
        maxDistance: Number(radius),
        spherical: true,
      },
    },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$courierId', location: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$location' } },
    { $lookup: { from: 'users', localField: 'courierId', foreignField: '_id', as: 'courier' } },
    { $unwind: '$courier' },
    { $match: { 'courier.isAvailable': true } },
    {
      $project: {
        courierId: 1,
        lat: { $arrayElemAt: ['$location.coordinates', 1] },
        lng: { $arrayElemAt: ['$location.coordinates', 0] },
        distance: 1,
        speed: 1,
        timestamp: 1,
        courier: { name: 1, phone: 1, vehicleType: 1, rating: 1 },
      },
    },
  ]);

  res.json({ success: true, count: locations.length, locations });
});