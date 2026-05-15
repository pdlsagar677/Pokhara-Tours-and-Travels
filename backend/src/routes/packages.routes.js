const router = require('express').Router();
const { list, getBySlug } = require('../controllers/packages.controller');

router.get('/', list);
router.get('/:slug', getBySlug);

module.exports = router;
