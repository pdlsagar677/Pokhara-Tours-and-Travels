const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in .env');
  }
  await mongoose.connect(uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  const Package = require('../models/Package');
  const result = await Package.updateMany(
    { type: { $exists: false } },
    { $set: { type: 'destination' } }
  );
  if (result.modifiedCount > 0) {
    console.log(`Backfilled type=destination on ${result.modifiedCount} packages`);
  }
}

module.exports = connectDB;
