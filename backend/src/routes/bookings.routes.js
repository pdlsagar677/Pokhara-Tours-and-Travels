const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const {
  bookingCancelLimiter,
  esewaLimiter,
} = require('../middleware/rateLimits');
const {
  create,
  listMine,
  getMine,
  cancelMine,
  initEsewa,
  verifyEsewa,
} = require('../controllers/bookings.controller');

router.post('/', authRequired, create);
router.get('/me', authRequired, listMine);
router.get('/me/:id', authRequired, getMine);
router.patch('/me/:id/cancel', authRequired, bookingCancelLimiter, cancelMine);
router.post('/:id/esewa-init', authRequired, esewaLimiter, initEsewa);
// Public: payment gateway redirects the user back here after eSewa flow.
// The eSewa-signed payload is the security gate, not user auth — see verifyEsewa.
router.post('/esewa-verify', esewaLimiter, verifyEsewa);

module.exports = router;
