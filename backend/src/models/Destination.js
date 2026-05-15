const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    heroImage: { type: String, required: true },
    gallery: [{ type: String }],
    highlights: [{ type: String }],
    bestSeason: { type: String },
    discountPercent: { type: Number, min: 0, max: 100 },
  },
  { timestamps: true, strict: true }
);

module.exports = mongoose.model('Destination', destinationSchema);
