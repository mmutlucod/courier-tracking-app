import { Request, Response } from 'express';
import Address from '../models/address';
import { asyncHandler } from '../utils/asynchandler';

export const createAddress = asyncHandler(async (req: Request, res: Response) => {
  const { title, fullAddress, lat, lng, city, district, neighbourhood, postalCode, buildingNo, floor, apartmentNo, directions, isDefault } = req.body;
  const userId = req.user._id;

  if (!title || !fullAddress || !lat || !lng) return res.status(400).json({ success: false, message: 'Başlık, adres ve koordinatlar gerekli.' });
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return res.status(400).json({ success: false, message: 'Geçersiz koordinatlar.' });

  const addressCount = await Address.countDocuments({ userId });
  const shouldBeDefault = addressCount === 0 || isDefault;

  if (shouldBeDefault) await Address.updateMany({ userId }, { isDefault: false });

  const address = await Address.create({
    userId, title, fullAddress,
    location: { type: 'Point', coordinates: [lng, lat] },
    city, district, neighbourhood, postalCode, buildingNo, floor, apartmentNo, directions,
    isDefault: shouldBeDefault,
  });

  res.status(201).json({ success: true, message: 'Adres eklendi.', address: formatAddress(address) });
});

export const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const addresses = await Address.find({ userId: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, count: addresses.length, addresses: addresses.map(formatAddress) });
});

export const getAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) return res.status(404).json({ success: false, message: 'Adres bulunamadı.' });
  res.json({ success: true, address: formatAddress(address) });
});

export const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user._id;
  const updateData = req.body;

  const address = await Address.findOne({ _id: id, userId });
  if (!address) return res.status(404).json({ success: false, message: 'Adres bulunamadı.' });

  if (updateData.lat && updateData.lng) {
    if (updateData.lat < -90 || updateData.lat > 90 || updateData.lng < -180 || updateData.lng > 180) {
      return res.status(400).json({ success: false, message: 'Geçersiz koordinatlar.' });
    }
    updateData.location = { type: 'Point', coordinates: [updateData.lng, updateData.lat] };
    delete updateData.lat;
    delete updateData.lng;
  }

  if (updateData.isDefault === true) await Address.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });

  Object.assign(address, updateData);
  await address.save();

  res.json({ success: true, message: 'Adres güncellendi.', address: formatAddress(address) });
});

export const deleteAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) return res.status(404).json({ success: false, message: 'Adres bulunamadı.' });

  const wasDefault = address.isDefault;
  await address.deleteOne();

  if (wasDefault) {
    const nextAddress = await Address.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.json({ success: true, message: 'Adres silindi.' });
});

export const setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
  const address = await Address.findOne({ _id: req.params.id, userId: req.user._id });
  if (!address) return res.status(404).json({ success: false, message: 'Adres bulunamadı.' });

  await Address.updateMany({ userId: req.user._id }, { isDefault: false });
  address.isDefault = true;
  await address.save();

  res.json({ success: true, message: 'Default adres güncellendi.', address: formatAddress(address) });
});

export const getNearbyAddresses = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius = 5000 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, message: 'Konum bilgisi gerekli.' });

  const addresses = await Address.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
        distanceField: 'distance',
        maxDistance: Number(radius),
        spherical: true,
      },
    },
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        title: 1,
        fullAddress: 1,
        lat: { $arrayElemAt: ['$location.coordinates', 1] },
        lng: { $arrayElemAt: ['$location.coordinates', 0] },
        distance: 1,
        user: { name: 1, phone: 1 },
      },
    },
  ]);

  res.json({ success: true, count: addresses.length, addresses });
});

function formatAddress(address: any) {
  return {
    _id: address._id,
    title: address.title,
    fullAddress: address.fullAddress,
    lat: address.location.coordinates[1],
    lng: address.location.coordinates[0],
    city: address.city,
    district: address.district,
    neighbourhood: address.neighbourhood,
    postalCode: address.postalCode,
    buildingNo: address.buildingNo,
    floor: address.floor,
    apartmentNo: address.apartmentNo,
    directions: address.directions,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}