# 🚴 Courier Tracking System

Real-time GPS-based delivery tracking system with React Native & Node.js

## 🎯 What It Does

This is a **two-sided marketplace** for delivery tracking:

**Customer Side:**
- Create orders with 3 address modes:
  - **Saved Address**: Choose from saved locations
  - **GPS Location**: Auto-detect current position with reverse geocoding
  - **Manual Input**: Type address, convert to coordinates via Google Geocoding API
- Track courier in real-time on map
- See live route polyline and ETA calculation
- Rate courier after delivery (1-5 stars + comment)
- Manage unlimited saved addresses

**Courier Side:**
- Toggle availability (online/offline)
- View and accept pending orders
- Auto GPS tracking (sends location every 5 seconds)
- Complete deliveries with one tap
- View total earnings and delivery stats
- See delivery history with ratings

## 🔄 How It Works

1. **Customer creates order** → Status: `pending`
2. **Available couriers see it** in their order list
3. **Courier accepts** → Status: `in_transit` + GPS tracking starts
4. **Customer sees live tracking** with map route and ETA
5. **Courier completes delivery** → Status: `delivered`
6. **Customer rates courier** → Courier's rating updates

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React Native, Expo Router v4, TypeScript, Zustand, Socket.IO Client, React Native Maps, Expo Location |
| **Backend** | Node.js, Express, Socket.IO, MongoDB, Redis, JWT, Bcrypt |
| **APIs** | Google Maps (Directions, Geocoding), Google Places |

## 📸 Screenshots

<table>
  <tr>
  <td><img src="frontend/assets/screenshots/customer-tracking.jpeg" width="250"/><br/><b>Customer – Live Courier Tracking</b></td>
    <td><img src="frontend/assets/screenshots/courier-tracking.jpeg" width="250"/><br/><b>Courier – Tracking Delivery Location</b></td>
  </tr>
</table>

## 🚀 Installation

### Prerequisites
- Node.js v18+
- MongoDB v5+
- Redis v6+
- Expo CLI
- Android Studio / Xcode (optional)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/courier-tracking-system.git
cd courier-tracking-system
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values:
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/courier-tracking
# REDIS_HOST=localhost
# REDIS_PORT=6379
# JWT_SECRET=your-super-secret-key-change-this
# ALLOWED_ORIGINS=http://localhost:19000,http://localhost:8081

# Start MongoDB
mongod

# Start Redis
redis-server

# Run backend
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Update API URLs in src/utils/constants.ts:
# Replace 'localhost' with your local IP (e.g., 192.168.1.100)
# BASE_URL: 'http://192.168.1.100:3000'
# SOCKET_URL: 'http://192.168.1.100:3000'

# Add Google Maps API Key to app.json:
# "android": {
#   "config": {
#     "googleMaps": {
#       "apiKey": "YOUR_API_KEY_HERE"
#     }
#   }
# }

# Start Expo
npx expo start
```

### 4. Test It
Use these test accounts:
```
Customer: customer@test.com / 123456
Courier:  courier@test.com / 123456
```

## 🔑 Important Configuration

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
   - Geocoding API
3. Create API key and add to `app.json`

### Local IP Address
**Don't use `localhost`** - use your computer's local IP:
```bash
# Find your IP:
# Mac/Linux: ifconfig | grep "inet "
# Windows: ipconfig | findstr IPv4

# Then update constants.ts:
BASE_URL: 'http://192.168.1.XXX:3000'
```

### Permissions
**Android:** Add to `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

**iOS:** Add to `Info.plist`:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show delivery address</string>
```

## 🏗️ Architecture Decisions

### Why Socket.IO + Redis + MongoDB?
```
Courier → Socket.IO → Redis (real-time cache) → MongoDB (batch write every 10s)
              ↓
         Customer App (live updates)
```

- **Socket.IO**: Real-time with auto-reconnection, polling fallback
- **Redis**: Sub-millisecond reads for courier locations (GeoSpatial queries)
- **MongoDB**: GeoJSON support with 2dsphere index for location history
- **Batch Write**: Prevent DB overload (10 couriers × 5s interval = 120 writes/min → batched to 6 writes/min)

### Why Separate Address Collection?
Instead of storing address in User model:
- Unlimited addresses per customer
- Order history preserved even if address is deleted
- Default address selection
- Better data modeling

## 🐛 Troubleshooting

**Can't connect to backend:**
- Check if MongoDB and Redis are running
- Use local IP instead of `localhost`
- Check firewall settings

**Map not showing:**
- Verify Google Maps API key in `app.json`
- Check if Maps SDK is enabled in Google Cloud Console
- Clear Expo cache: `npx expo start -c`

**GPS not working:**
- Check location permissions in phone settings
- For Android 12+, enable "Precise location"
- iOS requires "Allow While Using App"

**Socket disconnects:**
- Check network stability
- Verify CORS settings in backend
- Socket.IO has auto-reconnection (check console logs)

## 📦 Deployment

### Backend (Railway / Render)
```bash
# Set environment variables:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
REDIS_HOST=redis-xxxxx.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-password
JWT_SECRET=production-secret-key
ALLOWED_ORIGINS=https://yourapp.com
```

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Credits

- [Expo](https://expo.dev) - React Native framework
- [Socket.IO](https://socket.io) - Real-time engine
- [Google Maps Platform](https://developers.google.com/maps) - Maps & routing

---

Built with  by Mustafa(https://github.com/mmutlucod)
