const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, required: true, trim: true, minlength: 10 },
    priceNPR: { type: Number, required: true, min: 0 },
    isOffer: { type: Boolean, default: false, index: true },
    category: {
      type: String,
      enum: ['trek', 'tour', 'adventure', 'cultural', 'wildlife'],
      default: 'tour',
      index: true,
    },
    type: {
      type: String,
      enum: ['destination', 'hotel', 'adventure'],
      default: 'destination',
      index: true,
    },
    gallery: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (arr) => Array.isArray(arr) && arr.length <= 5,
          message: 'A package can have at most 5 images',
        },
        {
          validator: (arr) => arr.every((u) => typeof u === 'string' && /^https?:\/\//i.test(u)),
          message: 'Each image must be a valid http(s) URL',
        },
      ],
    },
    aiBestSeasonNote: { type: String, default: '' },
    aiSummary: { type: String, default: '' },
    aiItineraryCache: {
      type: [
        {
          key: { type: String, required: true },
          content: { type: String, required: true },
          generatedAt: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
  }
);

packageSchema.index({ isOffer: -1, createdAt: -1 });
packageSchema.index({ category: 1, createdAt: -1 });
packageSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Package', packageSchema);
