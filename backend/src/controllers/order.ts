import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Address from '../models/address';
import Order from '../models/order';
import User from '../models/user';
import { asyncHandler } from '../utils/asynchandler';

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { pickupAddress, pickupLat, pickupLng, deliveryAddress, deliveryLat, deliveryLng, deliveryAddressId, total, notes } = req.body;
  const customerId = req.user._id;

  if (!pickupAddress || !pickupLat || !pickupLng || !total) {
    return res.status(400).json({ success: false, message: 'Lütfen tüm gerekli alanları doldurun.' });
  }

  let finalDeliveryAddress = deliveryAddress;
  let finalDeliveryLat = deliveryLat;
  let finalDeliveryLng = deliveryLng;
  let finalDeliveryAddressId = deliveryAddressId;

  if (deliveryAddressId) {
    if (!Types.ObjectId.isValid(deliveryAddressId)) {
      return res.status(400).json({ success: false, message: 'Geçersiz adres ID.' });
    }
    
    const savedAddress = await Address.findOne({ _id: deliveryAddressId, userId: customerId });
    if (!savedAddress) return res.status(404).json({ success: false, message: 'Teslimat adresi bulunamadı.' });
    finalDeliveryAddress = savedAddress.fullAddress;
    finalDeliveryLat = savedAddress.location.coordinates[1];
    finalDeliveryLng = savedAddress.location.coordinates[0];
  } else {
    if (!deliveryAddress || !deliveryLat || !deliveryLng) {
      return res.status(400).json({ success: false, message: 'Teslimat adresi bilgileri eksik.' });
    }
  }

  const orderCount = await Order.countDocuments();
  const orderNumber = `ORD${String(orderCount + 1).padStart(6, '0')}`;

  const order = await Order.create({
    customerId, 
    orderNumber, 
    status: 'pending',
    pickupAddress, 
    pickupLat, 
    pickupLng,
    deliveryAddress: finalDeliveryAddress, 
    deliveryLat: finalDeliveryLat, 
    deliveryLng: finalDeliveryLng,
    deliveryAddressId: finalDeliveryAddressId, 
    total, 
    notes, 
    orderedAt: new Date(),
  });
  const populatedOrder = await Order.findById(order._id)
    .populate('customerId', 'name phone')
    .populate('deliveryAddressId');

  res.status(201).json({ success: true, message: 'Sipariş oluşturuldu.', order: populatedOrder });
});

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const { _id: userId, role } = req.user;
  let query: any = {};

  if (role === 'customer') query.customerId = userId;
  if (role === 'courier') query.courierId = userId;

  const orders = await Order.find(query)
    .populate('customerId', 'name phone')
    .populate('courierId', 'name phone vehicleType rating')
    .populate('deliveryAddressId')
    .sort({ orderedAt: -1 });

  res.json({ success: true, count: orders.length, orders });
});

export const getActiveOrders = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ status: 'pending' })
    .populate('customerId', 'name phone')
    .populate('deliveryAddressId')
    .sort({ orderedAt: -1 });

  res.json({ success: true, count: orders.length, orders });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id || !Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Geçersiz sipariş ID.' });
  }

  const order = await Order.findById(id)
    .populate('customerId', 'name phone')
    .populate('courierId', 'name phone vehicleType rating')
    .populate('deliveryAddressId');

  if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
  res.json({ success: true, order });
});

export const assignOrder = asyncHandler(async (req: Request, res: Response) => {
  const courierId = req.user._id;
  const { id } = req.params;
  
  if (!id || !Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Geçersiz sipariş ID.' });
  }

  const order = await Order.findById(id);

  if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
  if (order.status !== 'pending') return res.status(400).json({ success: false, message: 'Bu sipariş zaten atanmış.' });

  const courier = await User.findById(courierId);
  if (!courier?.isAvailable) return res.status(400).json({ success: false, message: 'Müsaitlik durumunuzu aktif yapın.' });

  order.courierId = courierId;
  order.status = 'in_transit';
  await order.save();

  const updatedOrder = await Order.findById(id)
    .populate('customerId', 'name phone')
    .populate('courierId', 'name phone vehicleType')
    .populate('deliveryAddressId');

  res.json({ success: true, message: 'Sipariş kabul edildi ve yola çıktınız.', order: updatedOrder });
});

export const deliverOrder = asyncHandler(async (req: Request, res: Response) => {
  const courierId = req.user._id;
  const { id } = req.params;
  
  if (!id || !Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Geçersiz sipariş ID.' });
  }

  const order = await Order.findById(id);

  if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
  if (order.courierId?.toString() !== courierId.toString()) {
    return res.status(403).json({ success: false, message: 'Bu siparişi teslim edemezsiniz.' });
  }
  if (order.status !== 'in_transit') return res.status(400).json({ success: false, message: 'Bu sipariş henüz yolda değil.' });

  order.status = 'delivered';
  order.deliveredAt = new Date();
  await order.save();

  await User.findByIdAndUpdate(courierId, { $inc: { totalDeliveries: 1 } });
  await User.findByIdAndUpdate(order.customerId, { $inc: { totalOrders: 1 } });

  res.json({ success: true, message: 'Sipariş teslim edildi.', order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const courierId = req.user._id;
  const { status } = req.body;
  const { id } = req.params;
  
  if (!id || !Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Geçersiz sipariş ID.' });
  }

  const validStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ success: false, message: 'Geçersiz durum.' });

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });
  if (order.courierId?.toString() !== courierId.toString()) {
    return res.status(403).json({ success: false, message: 'Bu siparişi güncelleyemezsiniz.' });
  }

  order.status = status;

  if (status === 'delivered') {
    order.deliveredAt = new Date();
    await User.findByIdAndUpdate(courierId, { $inc: { totalDeliveries: 1 } });
    await User.findByIdAndUpdate(order.customerId, { $inc: { totalOrders: 1 } });
  }

  await order.save();
  res.json({ success: true, message: 'Sipariş durumu güncellendi.', order });
});

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const { _id: userId, role } = req.user;
  const { id } = req.params;
  
  if (!id || !Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Geçersiz sipariş ID.' });
  }

  const order = await Order.findById(id);

  if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı.' });

  const isCustomer = role === 'customer' && order.customerId.toString() === userId.toString();
  const isCourier = role === 'courier' && order.courierId?.toString() === userId.toString();

  if (!isCustomer && !isCourier) return res.status(403).json({ success: false, message: 'Bu siparişi iptal etme yetkiniz yok.' });
  if (!['pending', 'assigned'].includes(order.status)) {
    return res.status(400).json({ success: false, message: 'Bu aşamadaki sipariş iptal edilemez.' });
  }

  order.status = 'cancelled';
  await order.save();

  res.json({ success: true, message: 'Sipariş iptal edildi.', order });
});