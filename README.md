# 🚴 Courier Tracking System

Real-time GPS-based delivery tracking system with React Native & Node.js

## 🎯 Features

**Customer Side**
- Multiple address input (GPS / Manual / Saved)
- Real-time courier tracking on map
- Live route & ETA calculation
- Rate courier after delivery

**Courier Side**
- Accept/reject orders
- Auto GPS sharing (every 5s)
- Complete deliveries
- View earnings & stats

## 🛠️ Tech Stack

**Frontend:** React Native, Expo Router, TypeScript, Zustand, Socket.IO Client, React Native Maps  
**Backend:** Node.js, Express, Socket.IO, MongoDB, Redis, JWT

## 📸 Screenshots

![Customer Live Tracking](frontend/frontend/assets/screenshots/customer-tracking.jpeg)
![Courier Delivery Tracking](assets/screenshots/courier-tracking.jpeg)

## 🚀 Installation

**1. Clone & Install**
```bash
git clone https://github.com/yourusername/courier-tracking-system.git
cd courier-tracking-system

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

**2. Environment Variables**

Backend `.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/courier-tracking
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_secret
GOOGLE_MAPS_API_KEY=your_key
```

Frontend `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.XXX:3000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
```

**3. Start Services**
```bash
# Start MongoDB
mongod

# Start Redis
redis-server

# Start Backend
cd backend
npm run dev

# Start Frontend
cd frontend
npx expo start
```

## 🔑 Important

- Get Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
- Use your local IP instead of `localhost` (e.g. `192.168.1.100:3000`)
- MongoDB and Redis must be running

## 🏗️ Architecture
```
Courier → Socket.IO → Redis (cache) → MongoDB (batch every 10s)
              ↓
         Customer (real-time)
```

- **Redis:** < 1ms location cache
- **MongoDB:** GeoJSON + 2dsphere index
- **Socket.IO:** Real-time bidirectional updates

## 📝 License

MIT

---

Built with by Mustafa
