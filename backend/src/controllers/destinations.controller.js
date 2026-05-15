const Destination = require('../models/Destination');

async function list(_req, res, next) {
  try {
    const items = await Destination.find().sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const item = await Destination.findOne({ slug: req.params.slug });
    if (!item) return res.status(404).json({ error: 'Destination not found' });
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getBySlug };
