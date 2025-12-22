export interface CourierLocation {
  courierId: string;
  lat: number;
  lng: number;
  speed: number;
  accuracy?: number;
  heading?: number;
  timestamp: number;
}

export interface CustomerTrackRequest {
  customerId?: string;
  orderId: string;
}

export interface CourierFoundResponse {
  courierId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  speed?: number;
  eta: number;
  distance: string;
}

export interface ETAData {
  distance: number;
  minutes: number;
  arrivalTime: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
}