import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`=================================`);
    console.log(`🎯 MongoDB Connection Established!`);
    console.log(`🟢 Host: ${conn.connection.host}`);
    console.log(`🟢 Port: ${conn.connection.port}`);
    console.log(`🟢 Database: ${conn.connection.name}`);
    console.log(`=================================`);
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
