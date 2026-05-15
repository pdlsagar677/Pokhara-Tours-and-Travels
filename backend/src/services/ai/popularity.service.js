const Booking = require('../../models/Booking');

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached(key, value) {
  cache.set(key, { at: Date.now(), value });
}

function bustCache() {
  cache.clear();
}

async function getPopularPackages({ since, limit = 10 } = {}) {
  const sinceDate =
    since instanceof Date
      ? since
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const key = `popular:${sinceDate.getTime()}:${limit}`;
  const hit = getCached(key);
  if (hit) return hit;

  const rows = await Booking.aggregate([
    { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: sinceDate } } },
    {
      $group: {
        _id: '$packageSlug',
        bookingCount: { $sum: 1 },
        totalTravelers: {
          $sum: { $add: ['$travelers.adults', '$travelers.children'] },
        },
        lastBookedAt: { $max: '$createdAt' },
      },
    },
    { $sort: { bookingCount: -1, totalTravelers: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        slug: '$_id',
        bookingCount: 1,
        totalTravelers: 1,
        lastBookedAt: 1,
      },
    },
  ]);

  setCached(key, rows);
  return rows;
}

async function getSeasonalDistribution(slug) {
  const key = `season:${slug}`;
  const hit = getCached(key);
  if (hit) return hit;

  const rows = await Booking.aggregate([
    { $match: { packageSlug: slug, status: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $month: '$startDate' },
        count: { $sum: 1 },
      },
    },
    { $project: { _id: 0, month: '$_id', count: 1 } },
    { $sort: { month: 1 } },
  ]);

  const filled = Array.from({ length: 12 }, (_, i) => {
    const row = rows.find((r) => r.month === i + 1);
    return { month: i + 1, count: row ? row.count : 0 };
  });

  setCached(key, filled);
  return filled;
}

async function getCategoryAffinity(userId) {
  if (!userId) return [];
  const key = `affinity:${userId}`;
  const hit = getCached(key);
  if (hit) return hit;

  const rows = await Booking.aggregate([
    { $match: { user: userId, status: { $ne: 'cancelled' } } },
    {
      $lookup: {
        from: 'packages',
        localField: 'packageSlug',
        foreignField: 'slug',
        as: 'pkg',
      },
    },
    { $unwind: '$pkg' },
    { $group: { _id: '$pkg.category', count: { $sum: 1 } } },
    { $project: { _id: 0, category: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]);

  setCached(key, rows);
  return rows;
}

async function getUserBookedSlugs(userId) {
  if (!userId) return [];
  const rows = await Booking.find({ user: userId })
    .select('packageSlug')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return [...new Set(rows.map((r) => r.packageSlug))];
}

module.exports = {
  getPopularPackages,
  getSeasonalDistribution,
  getCategoryAffinity,
  getUserBookedSlugs,
  bustCache,
};
