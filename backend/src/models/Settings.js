const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Singleton key — always 'global' so we only ever have one settings doc.
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
    },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
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

settingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
