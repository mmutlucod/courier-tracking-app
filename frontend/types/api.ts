import { ILocation, IOrder, IRating, IUser, OrderStatus } from './models';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'courier' | 'customer';
  vehicleType?: 'bicycle' | 'motorcycle' | 'car';
  address?: string;
  addressLat?: number;
  addressLng?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: IUser;
}

export interface CreateOrderRequest {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryAddressId?: string;
  deliveryLat: number;
  deliveryLng: number;
  total: number;
  notes?: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface OrdersResponse {
  success: boolean;
  count: number;
  orders: IOrder[];
}

export interface OrderResponse {
  success: boolean;
  order: IOrder;
}

export interface SaveLocationRequest {
  lat: number;
  lng: number;
  speed: number;
  orderId?: string;
  accuracy?: number;
  heading?: number;
}

export interface LocationsResponse {
  success: boolean;
  count: number;
  locations: ILocation[];
}

export interface LocationResponse {
  success: boolean;
  location: ILocation;
}

export interface CreateRatingRequest {
  orderId: string;
  rating: number;
  comment?: string;
}

export interface RatingsResponse {
  success: boolean;
  count: number;
  ratings: IRating[];
  statistics?: {
    avgRating: number;
    totalRatings: number;
  };
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  address?: string;
  addressLat?: number;
  addressLng?: number;
  vehicleType?: 'bicycle' | 'motorcycle' | 'car';
}

export interface UpdateAvailabilityRequest {
  isAvailable: boolean;
}

export interface CouriersResponse {
  success: boolean;
  count: number;
  couriers: IUser[];
}
export interface Address {
  _id: string;
  title: string;
  fullAddress: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  neighbourhood?: string;
  postalCode?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  directions?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  title: string;
  fullAddress: string;
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  neighbourhood?: string;
  postalCode?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  directions?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  title?: string;
  fullAddress?: string;
  lat?: number;
  lng?: number;
  city?: string;
  district?: string;
  neighbourhood?: string;
  postalCode?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  directions?: string;
  isDefault?: boolean;
}

export interface AddressResponse {
  success: boolean;
  message?: string;
  address: Address;
}

export interface AddressesResponse {
  success: boolean;
  count: number;
  addresses: Address[];
}