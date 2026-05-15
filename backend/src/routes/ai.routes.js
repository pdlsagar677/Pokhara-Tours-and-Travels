const express = require('express');
const ai = require('../controllers/ai.controller');
const { authOptional } = require('../middleware/auth');
const {
  aiLimiter,
  aiChatLimiter,
  aiLimiterPerUser,
  aiChatLimiterPerUser,
} = require('../middleware/rateLimits');

const router = express.Router();

// Order matters: per-IP limiter first (cheap, blocks anonymous floods),
// then authOptional populates req.user, then the per-user limiter keys on
// req.user.id (or falls back to req.ip if anonymous). Both must pass.
router.post(
  '/recommendations',
  aiLimiter,
  authOptional,
  aiLimiterPerUser,
  ai.getRecommendations
);
router.post(
  '/chat',
  aiChatLimiter,
  authOptional,
  aiChatLimiterPerUser,
  ai.chat
);
router.post(
  '/itinerary/:slug',
  aiLimiter,
  authOptional,
  aiLimiterPerUser,
  ai.getItinerary
);
router.get(
  '/best-season/:slug',
  aiLimiter,
  authOptional,
  aiLimiterPerUser,
  ai.getBestSeason
);
router.post(
  '/search',
  aiLimiter,
  authOptional,
  aiLimiterPerUser,
  ai.semanticSearch
);
router.get(
  '/similar/:slug',
  aiLimiter,
  authOptional,
  aiLimiterPerUser,
  ai.getSimilarPackages
);

module.exports = router;
