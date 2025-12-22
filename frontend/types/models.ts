export interface IUser {
  _id: string;
  email: string;
  name: string;
  phone: string;
  role: 'courier' | 'customer';
  
  vehicleType?: 'bicycle' | 'motorcycle' | 'car';
  isAvailable?: boolean;
  rating?: number;
  totalDeliveries?: number;
  
totalOrders?: number;
defaultAddress?: {
  _id: string;
  title: string;
  fullAddress: string;
  lat: number;
  lng: number;
};
  
  createdAt: string;
  updatedAt: string;
}

export interface IOrder {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  
  customerId: string | IUser;
  courierId?: string | IUser;
  
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  
 deliveryAddressId?: string; 
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  
  total: number;
  notes?: string;
  
  orderedAt: string;
  deliveredAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'assigned' 
  | 'picked_up' 
  | 'in_transit' 
  | 'delivered' 
  | 'cancelled';

export interface ILocation {
  _id: string;
  courierId: string;
  orderId?: string;
  
  lat: number;
  lng: number;
  speed: number;
  accuracy?: number;
  heading?: number;
  
  timestamp: string;
  createdAt: string;
}

export interface IRating {
  _id: string;
  orderId: string;
  customerId: string;
  courierId: string;
  
  rating: number;
  comment?: string;
  
  createdAt: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}