const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const contactMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
      index: true,
    },
    replies: { type: [replySchema], default: [] },
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

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
