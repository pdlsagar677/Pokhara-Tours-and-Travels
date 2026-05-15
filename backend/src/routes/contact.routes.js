const router = require('express').Router();
const { submit, listMine } = require('../controllers/contact.controller');
const { authRequired, authOptional } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimits');

router.post('/', contactLimiter, authOptional, submit);
router.get('/me', authRequired, listMine);

module.exports = router;
