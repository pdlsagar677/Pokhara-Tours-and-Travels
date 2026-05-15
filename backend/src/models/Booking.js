const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    packageSlug: { type: String, required: true, lowercase: true, trim: true, index: true },
    startDate: { type: Date, required: true },
    travelers: {
      adults: { type: Number, required: true, min: 1, max: 20 },
      children: { type: Number, required: true, min: 0, max: 20, default: 0 },
    },
    contact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    notes: { type: String, trim: true, default: '' },
    paymentMethod: {
      type: String,
      enum: ['advance', 'on_arrival'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['advance_pending', 'awaiting_arrival', 'paid'],
      required: true,
    },
    totalNPR: { type: Number, required: true, min: 0 },
    packageSnapshot: {
      title: { type: String, required: true },
      priceNPR: { type: Number, required: true },
      coverImage: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    esewaTransactionUuid: {
      type: String,
      default: null,
      index: true,
      sparse: true,
      unique: true,
    },
    esewaTransactionCode: { type: String, default: null },
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

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
