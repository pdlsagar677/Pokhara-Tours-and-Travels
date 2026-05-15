const router = require('express').Router();
const { authRequired, adminOnly } = require('../middleware/auth');
const {
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
} = require('../controllers/admin.controller');

router.use(authRequired, adminOnly);

router.get('/users', listUsers);
router.patch('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/packages', listPackages);
router.post('/packages', createPackage);
router.patch('/packages/:id', updatePackage);
router.delete('/packages/:id', deletePackage);

router.get('/bookings', listBookings);
router.get('/bookings/:id', getBooking);
router.patch('/bookings/:id/status', updateBookingStatus);
router.patch('/bookings/:id/payment', updateBookingPayment);
router.delete('/bookings/:id', deleteBooking);

router.get('/analytics/overview', getDashboardStats);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

router.get('/messages', listMessages);
router.get('/messages/:id', getMessage);
router.patch('/messages/:id/read', markMessageRead);
router.post('/messages/:id/reply', replyToMessage);
router.delete('/messages/:id', deleteMessage);

module.exports = router;
