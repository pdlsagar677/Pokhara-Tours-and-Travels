const User = require('../models/User');
const Package = require('../models/Package');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const ContactMessage = require('../models/ContactMessage');
const { sendContactReply } = require('../utils/mailer');
const { slugify } = require('../utils/slugify');
const { escapeRegex, validateGalleryUrl } = require('../utils/validators');

const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];
const PAYMENT_STATUSES = ['advance_pending', 'awaiting_arrival', 'paid'];

// ---- Users ----

async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const search = (req.query.q || '').trim().slice(0, 100);
    const safe = escapeRegex(search);
    const filter = search
      ? {
          $or: [
            { name: { $regex: safe, $options: 'i' } },
            { email: { $regex: safe, $options: 'i' } },
            { username: { $regex: safe, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      data: {
        items: items.map((u) => u.toPublic()),
        total,
        page,
        limit,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body || {};
    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ error: "role must be 'user' or 'admin'" });
    }
    if (id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.role = role;
    await user.save();
    res.json({ data: { user: user.toPublic() } });
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete yourself' });
    }
    const result = await User.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

// ---- Packages ----

const CATEGORIES = ['trek', 'tour', 'adventure', 'cultural', 'wildlife'];
const PACKAGE_TYPES = ['destination', 'hotel', 'adventure'];

function normalizePackagePayload(body = {}) {
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const priceNPR = Number(body.priceNPR);
  const gallery = Array.isArray(body.gallery)
    ? body.gallery.map((s) => String(s || '').trim()).filter(Boolean)
    : [];
  const isOffer = Boolean(body.isOffer);
  const rawCategory = String(body.category || '').trim().toLowerCase();
  const category = CATEGORIES.includes(rawCategory) ? rawCategory : 'tour';
  const rawType = String(body.type || '').trim().toLowerCase();
  const type = PACKAGE_TYPES.includes(rawType) ? rawType : 'destination';
  return { title, description, priceNPR, gallery, isOffer, category, type };
}

function validatePackagePayload({ title, description, priceNPR, gallery }) {
  if (!title || title.length < 2) return 'Title must be at least 2 characters';
  if (title.length > 120) return 'Title must be at most 120 characters';
  if (!description || description.length < 10) return 'Description must be at least 10 characters';
  if (!Number.isFinite(priceNPR) || priceNPR < 0) return 'Price must be a non-negative number';
  if (gallery.length > 5) return 'A package can have at most 5 images';
  for (const url of gallery) {
    const check = validateGalleryUrl(url);
    if (!check.ok) return `Invalid image URL: ${check.error}`;
  }
  return null;
}

async function uniqueSlug(base, excludeId) {
  let slug = slugify(base);
  if (!slug) slug = 'package';
  const existing = await Package.findOne(
    excludeId ? { slug, _id: { $ne: excludeId } } : { slug }
  );
  if (!existing) return slug;
  let i = 2;
  // append -2, -3, ... until free
  while (true) {
    const candidate = `${slug}-${i}`;
    const taken = await Package.findOne(
      excludeId
        ? { slug: candidate, _id: { $ne: excludeId } }
        : { slug: candidate }
    );
    if (!taken) return candidate;
    i += 1;
  }
}

async function listPackages(req, res, next) {
  try {
    const filter = {};
    const type = String(req.query.type || '').toLowerCase();
    if (PACKAGE_TYPES.includes(type)) filter.type = type;
    const items = await Package.find(filter).sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

async function createPackage(req, res, next) {
  try {
    const payload = normalizePackagePayload(req.body);
    const error = validatePackagePayload(payload);
    if (error) return res.status(400).json({ error });

    const slug = await uniqueSlug(payload.title);
    const pkg = await Package.create({ ...payload, slug });
    res.status(201).json({ data: pkg });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A package with that slug already exists' });
    }
    next(err);
  }
}

async function updatePackage(req, res, next) {
  try {
    const { id } = req.params;
    const pkg = await Package.findById(id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const payload = normalizePackagePayload(req.body);
    const error = validatePackagePayload(payload);
    if (error) return res.status(400).json({ error });

    pkg.title = payload.title;
    pkg.description = payload.description;
    pkg.priceNPR = payload.priceNPR;
    pkg.gallery = payload.gallery;
    pkg.isOffer = payload.isOffer;
    pkg.category = payload.category;
    pkg.type = payload.type;

    if (req.body?.regenerateSlug) {
      pkg.slug = await uniqueSlug(payload.title, pkg._id);
    }

    await pkg.save();
    res.json({ data: pkg });
  } catch (err) {
    next(err);
  }
}

async function deletePackage(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Package.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

// ---- Bookings ----

async function listBookings(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const search = (req.query.q || '').trim().slice(0, 100);
    const status = (req.query.status || '').trim();
    const paymentStatus = (req.query.paymentStatus || '').trim();

    const filter = {};
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { 'contact.name': { $regex: safe, $options: 'i' } },
        { 'contact.email': { $regex: safe, $options: 'i' } },
        { packageSlug: { $regex: safe, $options: 'i' } },
      ];
    }
    if (status && BOOKING_STATUSES.includes(status)) {
      filter.status = status;
    }
    if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name username email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    res.json({ data: { items, total, page, limit } });
  } catch (err) {
    next(err);
  }
}

async function getBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('user', 'name username email phone');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${BOOKING_STATUSES.join(', ')}` });
    }
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.status = status;
    await booking.save();
    await booking.populate('user', 'name username email phone');
    bustDashboardCache();
    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
}

async function updateBookingPayment(req, res, next) {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body || {};
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ error: `paymentStatus must be one of ${PAYMENT_STATUSES.join(', ')}` });
    }
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    booking.paymentStatus = paymentStatus;
    await booking.save();
    await booking.populate('user', 'name username email phone');
    bustDashboardCache();
    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
}

async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Booking.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    bustDashboardCache();
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

// ---- Analytics ----

const DASHBOARD_CACHE_TTL_MS = 30 * 1000;
let dashboardCache = { at: 0, payload: null };

function bustDashboardCache() {
  dashboardCache = { at: 0, payload: null };
}

async function getDashboardStats(_req, res, next) {
  try {
    if (
      dashboardCache.payload &&
      Date.now() - dashboardCache.at < DASHBOARD_CACHE_TTL_MS
    ) {
      return res.json({ data: dashboardCache.payload });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      usersCount,
      packagesCount,
      bookingsCount,
      bookings30dCount,
      lifetimeRevenueAgg,
      last30dRevenueAgg,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments({}),
      Package.countDocuments({}),
      Booking.countDocuments({}),
      Booking.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, sum: { $sum: '$totalNPR' } } },
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, sum: { $sum: '$totalNPR' } } },
      ]),
      Booking.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const payload = {
      counts: {
        users: usersCount,
        packages: packagesCount,
        bookings: bookingsCount,
        bookings30d: bookings30dCount,
      },
      revenue: {
        lifetimeNPR: lifetimeRevenueAgg[0]?.sum || 0,
        last30dNPR: last30dRevenueAgg[0]?.sum || 0,
      },
      recentBookings,
    };

    dashboardCache = { at: Date.now(), payload };
    res.json({ data: payload });
  } catch (err) {
    next(err);
  }
}

// ---- Settings ----

async function getSettings(_req, res, next) {
  try {
    const doc = await Settings.getSingleton();
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const doc = await Settings.getSingleton();
    if (typeof req.body?.maintenanceMode === 'boolean') {
      doc.maintenanceMode = req.body.maintenanceMode;
    }
    if (typeof req.body?.maintenanceMessage === 'string') {
      const msg = req.body.maintenanceMessage.trim();
      if (msg.length > 500) {
        return res
          .status(400)
          .json({ error: 'Maintenance message must be 500 characters or fewer' });
      }
      doc.maintenanceMessage = msg;
    }
    await doc.save();
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
}

// ---- Contact messages ----

const MESSAGE_STATUSES = ['new', 'read', 'replied'];

async function listMessages(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const search = (req.query.q || '').trim().slice(0, 100);
    const status = (req.query.status || '').trim();

    const filter = {};
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
        { subject: { $regex: safe, $options: 'i' } },
        { message: { $regex: safe, $options: 'i' } },
      ];
    }
    if (status && MESSAGE_STATUSES.includes(status)) {
      filter.status = status;
    }

    const [items, total, unread] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ status: 'new' }),
    ]);

    res.json({ data: { items, total, unread, page, limit } });
  } catch (err) {
    next(err);
  }
}

async function getMessage(req, res, next) {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ data: msg });
  } catch (err) {
    next(err);
  }
}

async function markMessageRead(req, res, next) {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.status === 'new') {
      msg.status = 'read';
      await msg.save();
    }
    res.json({ data: msg });
  } catch (err) {
    next(err);
  }
}

async function replyToMessage(req, res, next) {
  try {
    const { id } = req.params;
    const body = String(req.body?.body || '').trim();
    if (!body) {
      return res.status(400).json({ error: 'Reply body is required' });
    }
    if (body.length > 5000) {
      return res.status(400).json({ error: 'Reply must be 5000 characters or fewer' });
    }

    const msg = await ContactMessage.findById(id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    try {
      await sendContactReply({
        to: msg.email,
        name: msg.name,
        originalSubject: msg.subject,
        originalMessage: msg.message,
        replyBody: body,
      });
    } catch (mailErr) {
      return res.status(502).json({
        error: 'Could not send reply email. Check SMTP settings and try again.',
        code: mailErr.code,
      });
    }

    msg.replies.push({ body, sentAt: new Date(), sentBy: req.user.id });
    msg.status = 'replied';
    await msg.save();

    res.json({ data: msg });
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    const result = await ContactMessage.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  updateUserRole,
  deleteUser,
  listPackages,
  createPackage,
  updatePackage,
  deletePackage,
  listBookings,
  getBooking,
  updateBookingStatus,
  updateBookingPayment,
  deleteBooking,
  getDashboardStats,
  getSettings,
  updateSettings,
  listMessages,
  getMessage,
  markMessageRead,
  replyToMessage,
  deleteMessage,
  bustDashboardCache,
};
