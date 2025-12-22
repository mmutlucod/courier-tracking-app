import { Request, Response } from 'express';
import Address from '../models/address';
import User from '../models/user';
import { asyncHandler } from '../utils/asynchandler';
import { generateToken } from '../utils/jwt';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone, role, vehicleType, firstAddress } = req.body;

  if (!email || !password || !name || !phone || !role) return res.status(400).json({ success: false, message: 'Lütfen tüm gerekli alanları doldurun.' });

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ success: false, message: 'Bu email adresi zaten kullanılıyor.' });

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) return res.status(400).json({ success: false, message: 'Bu telefon numarası zaten kullanılıyor.' });

  if (role === 'courier' && !vehicleType) return res.status(400).json({ success: false, message: 'Kurye için araç tipi gerekli.' });
  if (role === 'customer' && !firstAddress) return res.status(400).json({ success: false, message: 'Müşteri için adres bilgisi gerekli.' });

  const userData: any = { email, password, name, phone, role };

  if (role === 'courier') {
    userData.vehicleType = vehicleType;
    userData.isAvailable = true;
    userData.rating = 5.0;
    userData.totalDeliveries = 0;
  }

  if (role === 'customer') userData.totalOrders = 0;

  const user = new User(userData);
  await user.save();

  let savedAddress = null;
  if (role === 'customer' && firstAddress) {
    const { title, fullAddress, lat, lng, city, district, neighbourhood, buildingNo, floor, apartmentNo, directions } = firstAddress;

    if (!lat || !lng || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      await user.deleteOne();
      return res.status(400).json({ success: false, message: 'Geçersiz adres koordinatları.' });
    }

    savedAddress = await Address.create({
      userId: user._id,
      title: title || 'Ev',
      fullAddress,
      location: { type: 'Point', coordinates: [lng, lat] },
      city, district, neighbourhood, buildingNo, floor, apartmentNo, directions,
      isDefault: true,
    });
  }

  const token = generateToken(user._id, user.email, user.role);

  res.status(201).json({
    success: true,
    message: 'Kayıt başarılı.',
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      ...(role === 'courier' && { vehicleType: user.vehicleType, isAvailable: user.isAvailable, rating: user.rating, totalDeliveries: user.totalDeliveries }),
      ...(role === 'customer' && {
        totalOrders: user.totalOrders,
        defaultAddress: savedAddress ? {
          _id: savedAddress._id,
          title: savedAddress.title,
          fullAddress: savedAddress.fullAddress,
          lat: savedAddress.location.coordinates[1],
          lng: savedAddress.location.coordinates[0],
        } : null,
      }),
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ success: false, message: 'Email ve şifre gerekli.' });

  const user = await User.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre.' });

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre.' });

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

  const u: any = user;
  const token = generateToken(u._id, u.email, u.role);

  res.json({
    success: true,
    message: 'Giriş başarılı.',
    token,
    user: {
      _id: u._id,
      email: u.email,
      name: u.name,
      phone: u.phone,
      role: u.role,
      ...(u.role === 'courier' && { vehicleType: u.vehicleType, isAvailable: u.isAvailable, rating: u.rating, totalDeliveries: u.totalDeliveries }),
      ...(u.role === 'customer' && { totalOrders: u.totalOrders, defaultAddress }),
    },
  });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
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
    },
  });
});