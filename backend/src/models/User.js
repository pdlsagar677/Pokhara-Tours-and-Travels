const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sessionSchema = new mongoose.Schema(
  {
    refreshTokenHash: { type: String, required: true },
    userAgent: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    deviceLabel: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },

    isEmailVerified: { type: Boolean, default: false, index: true },
    emailVerifyOtpHash: { type: String, default: null, select: false },
    emailVerifyOtpExpires: { type: Date, default: null, select: false },

    sessions: { type: [sessionSchema], default: [], select: false },

    passwordChangeOtpHash: { type: String, default: null, select: false },
    passwordChangeOtpExpires: { type: Date, default: null, select: false },

    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetTokenExpires: { type: Date, default: null, select: false },

    totpSecret: { type: String, default: null, select: false },
    totpEnrolledAt: { type: Date, default: null },
    totpBackupCodesHash: { type: [String], default: [], select: false },
    totpEnrollmentSecret: { type: String, default: null, select: false },
    totpEnrollmentBackupHashes: { type: [String], default: [], select: false },
    totpEnrollmentExpires: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: false,
      versionKey: false,
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.sessions;
        delete ret.emailVerifyOtpHash;
        delete ret.emailVerifyOtpExpires;
        delete ret.passwordChangeOtpHash;
        delete ret.passwordChangeOtpExpires;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetTokenExpires;
        delete ret.totpSecret;
        delete ret.totpBackupCodesHash;
        delete ret.totpEnrollmentSecret;
        delete ret.totpEnrollmentBackupHashes;
        delete ret.totpEnrollmentExpires;
        return ret;
      },
    },
  }
);

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

userSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    username: this.username,
    email: this.email,
    phone: this.phone,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    twoFactorEnabled: !!this.totpSecret,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
