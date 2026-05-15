const Package = require('../models/Package');

const LIST_CACHE_HEADER = 'public, max-age=60, stale-while-revalidate=300';
const PACKAGE_TYPES = ['destination', 'hotel', 'adventure'];

async function list(req, res, next) {
  try {
    const filter = {};
    const type = String(req.query.type || '').toLowerCase();
    if (PACKAGE_TYPES.includes(type)) filter.type = type;
    const items = await Package.find(filter).sort({ createdAt: -1 });
    res.set('Cache-Control', LIST_CACHE_HEADER);
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const item = await Package.findOne({ slug: req.params.slug });
    if (!item) return res.status(404).json({ error: 'Package not found' });
    res.set('Cache-Control', LIST_CACHE_HEADER);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getBySlug };
