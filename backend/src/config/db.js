const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is required in environment variables');
  }

  await mongoose.connect(mongoUri);
};

module.exports = connectDB;
