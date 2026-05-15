const ContactMessage = require('../models/ContactMessage');
const { isEmail } = require('../utils/validators');

async function submit(req, res, next) {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();

    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Name must be 2-100 characters' });
    }
    if (!isEmail(email) || email.length > 200) {
      return res.status(400).json({ error: 'Enter a valid email' });
    }
    if (!subject || subject.length < 3 || subject.length > 200) {
      return res.status(400).json({ error: 'Subject must be 3-200 characters' });
    }
    if (!message || message.length < 10 || message.length > 5000) {
      return res.status(400).json({ error: 'Message must be 10-5000 characters' });
    }

    const doc = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      user: req.user?.id || null,
    });
    res.status(201).json({ data: { ok: true, id: doc.id } });
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const items = await ContactMessage.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

module.exports = { submit, listMine };
