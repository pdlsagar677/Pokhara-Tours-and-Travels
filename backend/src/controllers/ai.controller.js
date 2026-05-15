const Package = require('../models/Package');
const gemini = require('../services/ai/gemini.client');
const popularity = require('../services/ai/popularity.service');
const prompts = require('../services/ai/prompts');

// ---- Helpers ----

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function priceBucket(priceNPR) {
  if (priceNPR < 15000) return 'budget';
  if (priceNPR < 40000) return 'mid';
  return 'premium';
}

function travelerBucket({ adults, children }) {
  const a = Math.min(Math.max(Number(adults) || 1, 1), 20);
  const c = Math.min(Math.max(Number(children) || 0, 0), 20);
  return c > 0 ? `${a}a-${c}c` : `${a}a`;
}

function clampDays(raw) {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return 3;
  return Math.min(Math.max(n, 1), 14);
}

function pickPackages(allPackages, slugs) {
  const bySlug = new Map(allPackages.map((p) => [p.slug, p]));
  const out = [];
  for (const slug of slugs) {
    const pkg = bySlug.get(slug);
    if (pkg) out.push(pkg);
  }
  return out;
}

function compactPackage(pkg) {
  return {
    id: pkg.id ?? pkg._id?.toString(),
    slug: pkg.slug,
    title: pkg.title,
    description: pkg.description,
    priceNPR: pkg.priceNPR,
    category: pkg.category,
    isOffer: pkg.isOffer,
    gallery: pkg.gallery,
    createdAt: pkg.createdAt,
  };
}

// ---- Handlers ----

async function getRecommendations(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.body?.limit) || 4, 1), 8);
    const userId = req.user?.id || null;

    const [allPackages, popular, affinity, booked] = await Promise.all([
      Package.find().lean(),
      popularity.getPopularPackages({ limit: 20 }),
      popularity.getCategoryAffinity(userId),
      popularity.getUserBookedSlugs(userId),
    ]);

    if (allPackages.length === 0) {
      return res.json({ data: { picks: [], personalized: false } });
    }

    const bookedSet = new Set(booked);
    const candidatePool = allPackages.filter((p) => !bookedSet.has(p.slug));
    const candidates = candidatePool.length > 0 ? candidatePool : allPackages;

    const popularitySlugs = new Set(popular.map((p) => p.slug));
    const ranked = [...candidates].sort((a, b) => {
      const ap = popularitySlugs.has(a.slug) ? 1 : 0;
      const bp = popularitySlugs.has(b.slug) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return Number(b.isOffer) - Number(a.isOffer);
    });

    const shortlist = ranked.slice(0, 12);

    if (!gemini.isEnabled()) {
      return res.json({
        data: {
          picks: shortlist.slice(0, limit).map((p) => ({
            ...compactPackage(p),
            reason: p.isOffer
              ? 'Featured offer popular with recent travellers.'
              : 'Among our most-booked Nepal trips right now.',
          })),
          personalized: false,
        },
      });
    }

    let picksFromAI = [];
    try {
      const prompt = prompts.recommendationPrompt({
        candidates: shortlist,
        popularity: popular,
        userHistory: booked,
        affinity,
      });
      const json = await gemini.generateJSON(prompt);
      if (Array.isArray(json?.picks)) {
        picksFromAI = json.picks.slice(0, limit);
      }
    } catch (err) {
      console.warn('AI recommendation fallback:', err.message);
    }

    let combined;
    if (picksFromAI.length > 0) {
      const enriched = picksFromAI
        .map((pick) => {
          const pkg = shortlist.find((p) => p.slug === pick.slug);
          if (!pkg) return null;
          return { ...compactPackage(pkg), reason: String(pick.reason || '').slice(0, 200) };
        })
        .filter(Boolean);
      combined = enriched;
    } else {
      combined = shortlist.slice(0, limit).map((p) => ({
        ...compactPackage(p),
        reason: 'Popular with recent travellers.',
      }));
    }

    res.json({
      data: { picks: combined, personalized: userId != null && affinity.length > 0 },
    });
  } catch (err) {
    next(err);
  }
}

async function chat(req, res, next) {
  try {
    const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (incoming.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const cleaned = incoming
      .filter(
        (m) =>
          m &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string'
      )
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));

    if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Last message must be from user' });
    }

    if (!gemini.isEnabled()) {
      return res.json({
        data: {
          reply:
            "Our AI assistant is offline right now. Browse the Destinations page to find a tour, or reach us via Contact and we'll plan one for you.",
          suggestedSlugs: [],
          aiEnabled: false,
        },
      });
    }

    const allPackages = await Package.find().lean();
    const catalog = prompts.packageCatalog(allPackages);
    const system = prompts.chatSystemPrompt({ catalog });

    let reply;
    try {
      reply = await gemini.generateChat(cleaned, system);
    } catch (err) {
      console.warn('AI chat fallback:', err.message);
      return res.json({
        data: {
          reply:
            "I couldn't reach our AI service just now. Try again in a moment, or browse the Destinations page directly.",
          suggestedSlugs: [],
          aiEnabled: true,
        },
      });
    }

    const suggestedSlugs = [];
    const tagMatch = reply.match(/\[SUGGEST:\s*([^\]]+)\]/i);
    if (tagMatch) {
      const slugs = tagMatch[1].split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      const valid = new Set(allPackages.map((p) => p.slug));
      for (const slug of slugs) {
        if (valid.has(slug) && !suggestedSlugs.includes(slug)) {
          suggestedSlugs.push(slug);
        }
      }
    }
    const visibleReply = reply.replace(/\[SUGGEST:[^\]]*\]/gi, '').trim();

    res.json({
      data: { reply: visibleReply, suggestedSlugs, aiEnabled: true },
    });
  } catch (err) {
    next(err);
  }
}

async function getItinerary(req, res, next) {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    const days = clampDays(req.body?.days);
    const bucket = travelerBucket({
      adults: req.body?.adults,
      children: req.body?.children,
    });
    const cacheKey = `${days}d-${bucket}`;

    const pkg = await Package.findOne({ slug });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const existing = (pkg.aiItineraryCache || []).find((c) => c.key === cacheKey);
    if (existing) {
      try {
        return res.json({
          data: { itinerary: JSON.parse(existing.content), cached: true },
        });
      } catch {
        // fall through and regenerate
      }
    }

    if (!gemini.isEnabled()) {
      const fallback = {
        days: Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          title: i === 0 ? 'Arrival & briefing' : i === days - 1 ? 'Return & departure' : 'Exploration day',
          activities: ['Itinerary preview unavailable — AI is offline.'],
        })),
      };
      return res.json({ data: { itinerary: fallback, cached: false, aiEnabled: false } });
    }

    let itinerary;
    try {
      const prompt = prompts.itineraryPrompt({
        pkg,
        days,
        adults: Number(req.body?.adults) || 1,
        children: Number(req.body?.children) || 0,
      });
      itinerary = await gemini.generateJSON(prompt);
    } catch (err) {
      console.warn('AI itinerary fallback:', err.message);
      const fallback = {
        days: Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1}`,
          activities: ['Itinerary generation failed — try again shortly.'],
        })),
      };
      return res.json({ data: { itinerary: fallback, cached: false, aiEnabled: true } });
    }

    if (!Array.isArray(itinerary?.days) || itinerary.days.length === 0) {
      return res.json({ data: { itinerary: { days: [] }, cached: false } });
    }

    pkg.aiItineraryCache = pkg.aiItineraryCache || [];
    pkg.aiItineraryCache = pkg.aiItineraryCache.filter((c) => c.key !== cacheKey);
    pkg.aiItineraryCache.push({
      key: cacheKey,
      content: JSON.stringify(itinerary),
      generatedAt: new Date(),
    });
    if (pkg.aiItineraryCache.length > 20) {
      pkg.aiItineraryCache = pkg.aiItineraryCache.slice(-20);
    }
    await pkg.save();

    res.json({ data: { itinerary, cached: false } });
  } catch (err) {
    next(err);
  }
}

async function getBestSeason(req, res, next) {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    const pkg = await Package.findOne({ slug });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    if (pkg.aiBestSeasonNote) {
      return res.json({ data: { note: pkg.aiBestSeasonNote, cached: true } });
    }

    if (!gemini.isEnabled()) {
      const note = 'Best visited September through November for the clearest skies and most stable trekking weather.';
      return res.json({ data: { note, cached: false, aiEnabled: false } });
    }

    const distribution = await popularity.getSeasonalDistribution(slug);

    let note;
    try {
      const prompt = prompts.bestSeasonPrompt({ pkg, distribution });
      note = await gemini.generateText(prompt, { maxOutputTokens: 80 });
    } catch (err) {
      console.warn('AI best-season fallback:', err.message);
      note = 'Best visited September through November when the skies clear after the monsoon.';
    }

    pkg.aiBestSeasonNote = note.slice(0, 240);
    await pkg.save();

    res.json({ data: { note: pkg.aiBestSeasonNote, cached: false } });
  } catch (err) {
    next(err);
  }
}

async function semanticSearch(req, res, next) {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query) return res.status(400).json({ error: 'query is required' });
    if (query.length > 200) {
      return res.status(400).json({ error: 'query too long' });
    }

    const allPackages = await Package.find().lean();
    if (allPackages.length === 0) {
      return res.json({ data: { results: [] } });
    }

    const keywordRegex = new RegExp(escapeRegex(query.split(/\s+/).slice(0, 5).join('|')), 'i');
    const keywordMatches = allPackages.filter(
      (p) => keywordRegex.test(p.title) || keywordRegex.test(p.description) || keywordRegex.test(p.category)
    );

    const candidatePool = keywordMatches.length > 0 ? keywordMatches : allPackages;
    const candidates = candidatePool.slice(0, 20);

    if (!gemini.isEnabled()) {
      return res.json({
        data: {
          results: candidates.slice(0, 8).map((p) => ({
            ...compactPackage(p),
            score: 50,
            reason: 'Keyword match (AI offline).',
          })),
          aiEnabled: false,
        },
      });
    }

    let scored;
    try {
      const prompt = prompts.semanticSearchPrompt({ query, candidates });
      const json = await gemini.generateJSON(prompt);
      scored = Array.isArray(json?.results) ? json.results : [];
    } catch (err) {
      console.warn('AI semantic search fallback:', err.message);
      return res.json({
        data: {
          results: candidates.slice(0, 8).map((p) => ({
            ...compactPackage(p),
            score: 50,
            reason: 'Keyword match (AI temporarily offline).',
          })),
          aiEnabled: true,
        },
      });
    }

    const bySlug = new Map(allPackages.map((p) => [p.slug, p]));
    const results = scored
      .map((s) => {
        const pkg = bySlug.get(s.slug);
        if (!pkg) return null;
        return {
          ...compactPackage(pkg),
          score: Math.max(0, Math.min(100, Number(s.score) || 0)),
          reason: String(s.reason || '').slice(0, 200),
        };
      })
      .filter(Boolean);

    res.json({ data: { results, aiEnabled: true } });
  } catch (err) {
    next(err);
  }
}

async function getSimilarPackages(req, res, next) {
  try {
    const slug = String(req.params.slug || '').trim().toLowerCase();
    if (!slug) return res.status(400).json({ error: 'slug is required' });

    const target = await Package.findOne({ slug }).lean();
    if (!target) return res.status(404).json({ error: 'Package not found' });

    const targetBucket = priceBucket(target.priceNPR);
    const all = await Package.find({ slug: { $ne: slug } }).lean();

    const popular = await popularity.getPopularPackages({ limit: 50 });
    const popularityMap = new Map(popular.map((p) => [p.slug, p.bookingCount]));

    const scored = all.map((p) => {
      let score = 0;
      if (p.category === target.category) score += 50;
      if (priceBucket(p.priceNPR) === targetBucket) score += 25;
      const priceDelta = Math.abs(p.priceNPR - target.priceNPR);
      score += Math.max(0, 15 - Math.floor(priceDelta / 5000));
      score += Math.min(20, (popularityMap.get(p.slug) || 0) * 4);
      if (p.isOffer) score += 5;
      return { pkg: p, score };
    });

    const top = scored.sort((a, b) => b.score - a.score).slice(0, 3);
    res.json({ data: { results: top.map((s) => compactPackage(s.pkg)) } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRecommendations,
  chat,
  getItinerary,
  getBestSeason,
  semanticSearch,
  getSimilarPackages,
};
