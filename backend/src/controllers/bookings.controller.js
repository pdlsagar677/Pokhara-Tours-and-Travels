const crypto = require('crypto');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const { bustDashboardCache } = require('./admin.controller');
const popularity = require('../services/ai/popularity.service');
const {
  signEsewaPayload,
  verifyEsewaCallback,
  checkEsewaStatus,
} = require('../utils/esewa');

const PAYMENT_METHODS = new Set(['advance', 'on_arrival']);
const CANCEL_LEAD_TIME_MS = 24 * 60 * 60 * 1000;

function paymentStatusFor(method) {
  return method === 'advance' ? 'advance_pending' : 'awaiting_arrival';
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function create(req, res, next) {
  try {
    const body = req.body || {};
    const packageSlug = String(body.packageSlug || '').trim().toLowerCase();
    const startDateRaw = body.startDate;
    const adults = Number(body.travelers?.adults);
    const children = Number(body.travelers?.children ?? 0);
    const contact = body.contact || {};
    const paymentMethod = String(body.paymentMethod || '');
    const notes = (body.notes || '').toString().trim();

    if (!packageSlug) return res.status(400).json({ error: 'packageSlug is required' });
    if (!startDateRaw) return res.status(400).json({ error: 'startDate is required' });

    const startDate = new Date(startDateRaw);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'startDate is not a valid date' });
    }
    if (startDate < startOfToday()) {
      return res.status(400).json({ error: 'startDate cannot be in the past' });
    }

    if (!Number.isFinite(adults) || adults < 1 || adults > 20) {
      return res.status(400).json({ error: 'Adults must be between 1 and 20' });
    }
    if (!Number.isFinite(children) || children < 0 || children > 20) {
      return res.status(400).json({ error: 'Children must be between 0 and 20' });
    }
    if (!contact.name || !contact.email || !contact.phone) {
      return res.status(400).json({ error: 'Contact name, email and phone are required' });
    }
    if (!PAYMENT_METHODS.has(paymentMethod)) {
      return res.status(400).json({ error: "paymentMethod must be 'advance' or 'on_arrival'" });
    }

    const pkg = await Package.findOne({ slug: packageSlug });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const totalNPR =
      adults * pkg.priceNPR + children * Math.round(pkg.priceNPR / 2);

    const booking = await Booking.create({
      user: req.user.id,
      packageSlug,
      startDate,
      travelers: { adults, children },
      contact: {
        name: String(contact.name).trim(),
        email: String(contact.email).trim().toLowerCase(),
        phone: String(contact.phone).trim(),
      },
      notes,
      paymentMethod,
      paymentStatus: paymentStatusFor(paymentMethod),
      totalNPR,
      packageSnapshot: {
        title: pkg.title,
        priceNPR: pkg.priceNPR,
        coverImage: pkg.gallery?.[0] || null,
      },
    });

    popularity.bustCache();

    res.status(201).json({ data: booking });
  } catch (err) {
    next(err);
  }
}

async function listMine(req, res, next) {
  try {
    const items = await Booking.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (err) {
    next(err);
  }
}

async function getMine(req, res, next) {
  try {
    const item = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!item) return res.status(404).json({ error: 'Booking not found' });
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

async function cancelMine(req, res, next) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.id });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.status === 'cancelled') {
      return res.status(409).json({ error: 'Booking is already cancelled' });
    }
    if (booking.status !== 'pending') {
      return res.status(409).json({
        error: 'Only pending bookings can be cancelled. Please contact support.',
      });
    }
    if (booking.paymentStatus === 'paid') {
      return res.status(409).json({
        error: 'This booking has been paid. Please contact support to cancel.',
      });
    }
    if (new Date(booking.startDate).getTime() - Date.now() < CANCEL_LEAD_TIME_MS) {
      return res.status(409).json({
        error: 'Cancellations must be made at least 24 hours before the trip start date.',
      });
    }

    booking.status = 'cancelled';
    await booking.save();
    bustDashboardCache();
    popularity.bustCache();
    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
}

async function initEsewa(req, res, next) {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.paymentMethod !== 'advance') {
      return res
        .status(409)
        .json({ error: 'Online payment is only available for advance bookings' });
    }
    if (booking.paymentStatus === 'paid') {
      return res
        .status(409)
        .json({ error: 'This booking has already been paid' });
    }
    if (booking.status === 'cancelled') {
      return res
        .status(409)
        .json({ error: 'Cannot pay for a cancelled booking' });
    }

    booking.esewaTransactionUuid = crypto.randomUUID();
    await booking.save();

    const productCode = process.env.ESEWA_MERCHANT_CODE;
    const totalAmount = String(Math.round(booking.totalNPR));

    const signature = signEsewaPayload({
      totalAmount,
      transactionUuid: booking.esewaTransactionUuid,
      productCode,
    });

    res.json({
      data: {
        url: process.env.ESEWA_PAYMENT_URL,
        fields: {
          amount: totalAmount,
          tax_amount: '0',
          total_amount: totalAmount,
          transaction_uuid: booking.esewaTransactionUuid,
          product_code: productCode,
          product_service_charge: '0',
          product_delivery_charge: '0',
          success_url: process.env.ESEWA_SUCCESS_URL,
          failure_url: process.env.ESEWA_FAILURE_URL,
          signed_field_names: 'total_amount,transaction_uuid,product_code',
          signature,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function verifyEsewa(req, res, next) {
  try {
    const data = String(req.body?.data || '');
    if (!data) return res.status(400).json({ error: 'Missing eSewa data' });

    let payload;
    try {
      const json = Buffer.from(data, 'base64').toString('utf8');
      payload = JSON.parse(json);
    } catch {
      return res.status(400).json({ error: 'Invalid eSewa payload' });
    }

    if (!verifyEsewaCallback(payload)) {
      return res.status(400).json({ error: 'eSewa signature mismatch' });
    }

    if (
      String(payload.status || '').toUpperCase() !== 'COMPLETE' &&
      String(payload.status || '').toUpperCase() !== 'COMPLETED'
    ) {
      return res
        .status(400)
        .json({ error: `Payment not complete: ${payload.status}` });
    }

    const booking = await Booking.findOne({
      esewaTransactionUuid: payload.transaction_uuid,
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Idempotency: if a previous verify call already marked this paid, just
    // return the booking. Handles back-button + reload + double-redirect.
    if (booking.paymentStatus === 'paid') {
      return res.json({ data: booking });
    }

    const reportedAmount = Number(
      String(payload.total_amount || '').replace(/,/g, '')
    );
    if (
      !Number.isFinite(reportedAmount) ||
      Math.round(reportedAmount) !== Math.round(booking.totalNPR)
    ) {
      return res
        .status(400)
        .json({ error: 'Payment amount does not match booking total' });
    }

    // Defense-in-depth status check. If it fails (transient network, eSewa
    // host hiccup), we still accept the payment because the redirect payload
    // is signed with our merchant secret — that's already cryptographically
    // strong proof of payment origin.
    let statusRefId = null;
    try {
      const statusResponse = await checkEsewaStatus({
        totalAmount: booking.totalNPR,
        transactionUuid: booking.esewaTransactionUuid,
        productCode: process.env.ESEWA_MERCHANT_CODE,
      });
      const statusValue = String(statusResponse?.status || '').toUpperCase();
      if (
        statusValue &&
        statusValue !== 'COMPLETE' &&
        statusValue !== 'COMPLETED'
      ) {
        return res.status(400).json({
          error: `eSewa reports payment status: ${statusValue}`,
        });
      }
      statusRefId = statusResponse?.ref_id || null;
    } catch (statusErr) {
      console.warn(
        'eSewa status check failed; trusting signed redirect:',
        statusErr.message
      );
    }

    booking.paymentStatus = 'paid';
    booking.esewaTransactionCode =
      payload.transaction_code || statusRefId || null;
    await booking.save();
    bustDashboardCache();

    res.json({ data: booking });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, listMine, getMine, cancelMine, initEsewa, verifyEsewa };
