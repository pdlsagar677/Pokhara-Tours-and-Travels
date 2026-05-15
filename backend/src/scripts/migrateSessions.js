/* eslint-disable no-console */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function run() {
  await connectDB();
  const User = require('../models/User');
  const result = await User.updateMany(
    {},
    { $unset: { refreshTokenHash: '' } }
  );
  console.log(
    `migrateSessions: matched=${result.matchedCount} modified=${result.modifiedCount}`
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
