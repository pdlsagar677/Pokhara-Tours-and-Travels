const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const { isEmail } = require('../utils/validators');

async function subscribe(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!isEmail(email) || email.length > 200) {
      return res.status(400).json({ error: 'Enter a valid email' });
    }
    await NewsletterSubscriber.updateOne(
      { email },
      { $setOnInsert: { email } },
      { upsert: true }
    );
    res.status(201).json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

module.exports = { subscribe };
