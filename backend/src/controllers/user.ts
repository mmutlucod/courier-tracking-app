import { Request, Response } from 'express';
import Address from '../models/address';
import User from '../models/user';
import { asyncHandler } from '../utils/asynchandler';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  let defaultAddress = null;
  if (user.role === 'customer') {
    const address = await Address.findOne({ userId: user._id, isDefault: true });
    if (address) {
      defaultAddress = {
        _id: address._id,
        title: address.title,
        fullAddress: address.fullAddress,
        lat: address.location.coordinates[1],
        lng: address.location.coordinates[0],
      };
    }
  }

  res.json({
    success: true,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      ...(user.role === 'courier' && { vehicleType: user.vehicleType, isAvailable: user.isAvailable, rating: user.rating, totalDeliveries: user.totalDeliveries }),
      ...(user.role === 'customer' && { totalOrders: user.totalOrders, defaultAddress }),
      createdAt: user.createdAt,
    },
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, vehicleType } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) 
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (user.role === 'courier' && vehicleType) user.vehicleType = vehicleType;

  await user.save();

  let defaultAddress = null;
  if (user.role === 'customer') {
    const address = await Address.findOne({ userId: user._id, isDefault: true });
    if (address) {
      defaultAddress = {
        _id: address._id,
        title: address.title,
        fullAddress: address.fullAddress,
        lat: address.location.coordinates[1],
        lng: address.location.coordinates[0],
      };
    }
  }

  res.json({
    success: true,
    message: 'Profil güncellendi.',
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      ...(user.role === 'courier' && { vehicleType: user.vehicleType, isAvailable: user.isAvailable, rating: user.rating, totalDeliveries: user.totalDeliveries }),
      ...(user.role === 'customer' && { totalOrders: user.totalOrders, defaultAddress }),
    },
  });
});

export const updateAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { isAvailable } = req.body;

  if (typeof isAvailable !== 'boolean') 
    return res.status(400).json({ success: false, message: 'Geçerli bir durum girin (true/false).' });

  const user = await User.findById(req.user._id);
  if (!user) 
    return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });

  user.isAvailable = isAvailable;
  await user.save();

  res.json({ success: true, message: `Müsaitlik durumu ${isAvailable ? 'aktif' : 'pasif'} olarak güncellendi.`, isAvailable: user.isAvailable });
});

export const getCourierById = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'courier') return res.status(404).json({ success: false, message: 'Kurye bulunamadı.' });

  res.json({
    success: true,
    courier: { _id: user._id, name: user.name, phone: user.phone, vehicleType: user.vehicleType, isAvailable: user.isAvailable, rating: user.rating, totalDeliveries: user.totalDeliveries },
  });
});

export const getAllCouriers = asyncHandler(async (req: Request, res: Response) => {
  const { available } = req.query;
  const query: any = { role: 'courier' };
  if (available === 'true') query.isAvailable = true;

  const couriers = await User.find(query).select('name phone vehicleType isAvailable rating totalDeliveries');

  res.json({ success: true, count: couriers.length, couriers });
});