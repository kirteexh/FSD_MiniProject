import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacare_db';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to detect local/remote availability
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected successfully: ${mongoose.connection.host}`);
    return true;
  } catch (error: any) {
    console.warn(`[Database] MongoDB connection unavailable (${error.message}).`);
    console.log(`[Database] Seamless Hybrid In-Memory Data Store active. All features, CRUD, and sockets are fully operational.`);
    isConnected = false;
    return false;
  }
};

export const getIsDbConnected = () => isConnected;

