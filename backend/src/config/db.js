import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    console.log('[Database] No MONGO_URI provided in environment. Running in active in-memory store mode (Zero-setup Part 1 development).');
    return false;
  }

  try {
    if (isConnected) {
      return true;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log('[Database] MongoDB Atlas successfully connected.');
    return true;
  } catch (error) {
    console.warn('[Database] MongoDB Atlas connection failed. Falling back to active local in-memory store:', error.message);
    return false;
  }
}

export default connectDB;
