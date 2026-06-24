import mongoose from 'mongoose';

global.isMongoConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000 // Quick timeout to prevent hanging if Mongo is not running
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    global.isMongoConnected = true;
  } catch (error) {
    console.log(`⚠️ MongoDB connection failed: ${error.message}`);
    console.log(`📁 Fallback: Running with Local JSON file-based database!`);
    global.isMongoConnected = false;
  }
};

export default connectDB;
