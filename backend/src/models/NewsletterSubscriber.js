const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
