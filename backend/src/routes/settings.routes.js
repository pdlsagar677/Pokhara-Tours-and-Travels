const router = require('express').Router();
const { getPublicSettings } = require('../controllers/settings.controller');

router.get('/', getPublicSettings);

module.exports = router;
