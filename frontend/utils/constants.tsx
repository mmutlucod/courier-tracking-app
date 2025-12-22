export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.113:3000', 
  SOCKET_URL: 'http://192.168.1.113:3000',
  TIMEOUT: 10000, 
};

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
  },
  
  ORDERS: {
    CREATE: '/api/orders',
    LIST: '/api/orders',
    DETAIL: (id: string) => `/api/orders/${id}`,
    ACTIVE: '/api/orders/active',
    ASSIGN: (id: string) => `/api/orders/${id}/assign`,
    UPDATE_STATUS: (id: string) => `/api/orders/${id}/status`,
    CANCEL: (id: string) => `/api/orders/${id}`,
    DELIVER : (id: string) => `/api/orders/${id}/deliver`,
  },
    ADDRESSES: {
    CREATE: '/api/addresses',
    LIST: '/api/addresses',
    DETAIL: (id: string) => `/api/addresses/${id}`,
    UPDATE: (id: string) => `/api/addresses/${id}`,
    DELETE: (id: string) => `/api/addresses/${id}`,
    SET_DEFAULT: (id: string) => `/api/addresses/${id}/default`,
    NEARBY: '/api/addresses/nearby',
  },
  
  LOCATIONS: {
    SAVE: '/api/locations',
    COURIER: (courierId: string) => `/api/locations/courier/${courierId}`,
    LATEST: (courierId: string) => `/api/locations/latest/${courierId}`,
    NEARBY: '/api/locations/nearby',
  },
  
  RATINGS: {
    CREATE: '/api/ratings',
    COURIER: (courierId: string) => `/api/ratings/courier/${courierId}`,
    ORDER: (orderId: string) => `/api/ratings/order/${orderId}`,
    MY: '/api/ratings/my',
  },
  
  USERS: {
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    AVAILABILITY: '/api/users/availability',
    COURIER: (id: string) => `/api/users/courier/${id}`,
    COURIERS: '/api/users/couriers',
  },
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  COURIER_LOCATION: 'courier:location',
  COURIER_START: 'courier:start',
  COURIER_STOP: 'courier:stop',
  COURIER_UPDATE: 'courier:update',
  COURIER_STATUS: 'courier:status',
  
  CUSTOMER_TRACK: 'customer:track',
  CUSTOMER_UNTRACK: 'customer:untrack',
  COURIER_FOUND: 'courier:found',
  LOCATION_UPDATE: 'courier:location:update',
  
  ERROR: 'error',
};

export const STORAGE_KEYS = {
  TOKEN: '@auth_token',
  USER: '@user_data',
  COURIER_ID: '@courier_id',
};

export const LOCATION_CONFIG = {
  UPDATE_INTERVAL: 5000, 
  DISTANCE_FILTER: 10, 
  ACCURACY: {
    HIGH: 'high',
    BALANCED: 'balanced',
    LOW: 'low',
  },
};

export const MAP_CONFIG = {
  DEFAULT_DELTA: {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  MARKER_SIZE: {
    width: 50,
    height: 50,
  },
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  assigned: 'Atandı',
  picked_up: 'Alındı',
  in_transit: 'Yolda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
};

export const VEHICLE_TYPES = {
  BICYCLE: 'bicycle',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
} as const;

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  bicycle: 'Bisiklet',
  motorcycle: 'Motosiklet',
  car: 'Araba',
};

export const COLORS = {
  PRIMARY: '#FF6B35',
  PRIMARY_DARK: '#FF8C42',
  SUCCESS: '#4CAF50',
  ERROR: '#DC3545',
  WARNING: '#FFC107',
  INFO: '#2196F3',
  
  GRAY: {
    50: '#F8F8F8',
    100: '#F0F0F0',
    200: '#E0E0E0',
    300: '#CCCCCC',
    400: '#999999',
    500: '#666666',
    600: '#333333',
    700: '#1A1A1A',
  },
  
  BACKGROUND: '#FFFFFF',
  TEXT: '#1A1A1A',
  TEXT_SECONDARY: '#666666',
};

export const VALIDATION = {
  PHONE_REGEX: /^\+90\d{10}$/,
  EMAIL_REGEX: /^\S+@\S+\.\S+$/,
  MIN_PASSWORD_LENGTH: 6,
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
  SERVER_ERROR: 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.',
  UNAUTHORIZED: 'E-posta ya da şifre hatalı.',
  NOT_FOUND: 'İstenen kayıt bulunamadı.',
  VALIDATION_ERROR: 'Lütfen tüm alanları doğru doldurun.',
  LOCATION_PERMISSION: 'Konum izni gerekli. Lütfen ayarlardan izin verin.',
};

export const SUCCESS_MESSAGES = {
  LOGIN: 'Giriş başarılı!',
  REGISTER: 'Kayıt başarılı!',
  ORDER_CREATED: 'Sipariş oluşturuldu!',
  ORDER_ASSIGNED: 'Sipariş kabul edildi!',
  ORDER_DELIVERED: 'Sipariş teslim edildi!',
  RATING_SENT: 'Değerlendirme gönderildi!',
  PROFILE_UPDATED: 'Profil güncellendi!',
};