import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || '';
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected');
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export const closeDB = async () => {
  await mongoose.connection.close();
  console.log('✅ MongoDB closed');
};