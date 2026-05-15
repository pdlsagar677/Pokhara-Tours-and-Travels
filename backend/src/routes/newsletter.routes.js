const router = require('express').Router();
const { subscribe } = require('../controllers/newsletter.controller');
const { newsletterLimiter } = require('../middleware/rateLimits');

router.post('/', newsletterLimiter, subscribe);

module.exports = router;
