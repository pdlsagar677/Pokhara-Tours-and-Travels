require('dotenv').config();

const REQUIRED_ENV = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL',
  'ESEWA_MERCHANT_CODE',
  'ESEWA_SECRET_KEY',
  'ESEWA_PAYMENT_URL',
  'ESEWA_STATUS_URL',
  'ESEWA_SUCCESS_URL',
  'ESEWA_FAILURE_URL',
];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`API ready on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();
