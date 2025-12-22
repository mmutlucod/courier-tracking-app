import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import { closeRedis, initRedis } from './config/redis';
import { setupSocketHandlers } from './config/socket';
import { errorHandler } from './middleware/error-handler';
import addressRoutes from './routes/address';
import authRoutes from './routes/auth';
import locationRoutes from './routes/locations';
import orderRoutes from './routes/orders';
import ratingRoutes from './routes/ratings';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Courier Tracking API',
    status: 'ok',
    version: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);

app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    await initRedis();
    setupSocketHandlers(io);

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

const shutdown = async () => {
  httpServer.close();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

start();