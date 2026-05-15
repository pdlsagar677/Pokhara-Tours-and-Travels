const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function packageLine(p) {
  return `- ${p.slug} | ${p.type || 'destination'} | "${p.title}" | ${p.category} | NPR ${p.priceNPR} | ${
    p.isOffer ? 'OFFER' : 'regular'
  }`;
}

function packageCatalog(packages) {
  return packages.map(packageLine).join('\n');
}

function recommendationPrompt({ candidates, popularity, userHistory, affinity }) {
  const popularityMap = new Map(popularity.map((p) => [p.slug, p.bookingCount]));
  const lines = candidates.map((p) => {
    const count = popularityMap.get(p.slug) ?? 0;
    return `- ${p.slug} | "${p.title}" | ${p.category} | NPR ${p.priceNPR} | bookings(180d): ${count}`;
  });

  const affinityLine = affinity.length
    ? `User's past category mix: ${affinity.map((a) => `${a.category}(${a.count})`).join(', ')}.`
    : 'User has no booking history.';

  const historyLine = userHistory.length
    ? `User already booked these slugs (exclude or avoid recommending these again): ${userHistory.join(', ')}.`
    : 'User has not booked anything yet.';

  return `You are a Nepal travel recommendation engine for "Pokhara Tours and Travel".

Goal: pick the 4 best packages for this user from the candidates below and write a short reason for each (max 18 words).

Candidates (slug | title | category | price | recent booking count):
${lines.join('\n')}

${affinityLine}
${historyLine}

Rules:
- Pick exactly 4 packages by slug from the candidates list.
- Favor packages with higher recent booking counts when the user has no history.
- When the user has history, blend their preferred categories with popular picks.
- Reasons must be specific (mention the activity, season, or audience), never generic ("a great trip").
- Output strict JSON only, no markdown.

JSON shape:
{ "picks": [{ "slug": "...", "reason": "..." }, ...] }
`;
}

function bestSeasonPrompt({ pkg, distribution }) {
  const months = distribution.map((d) => `${MONTH_NAMES[d.month - 1]}: ${d.count}`).join(', ');
  const top = [...distribution].sort((a, b) => b.count - a.count).slice(0, 3);
  const topNames = top.map((t) => MONTH_NAMES[t.month - 1]).join(', ');

  return `You write one-sentence "best time to visit" notes for Nepal tour packages.

Package: "${pkg.title}" (${pkg.category}).
Description: ${pkg.description.slice(0, 400)}

Real booking distribution by trip start month: ${months}.
Most-booked months: ${topNames || 'no data yet'}.

Write exactly ONE sentence (max 28 words) starting with "Best visited" that recommends the ideal months. If booking data is sparse, lean on Nepal's climate (Sept-Nov clear skies, Mar-May rhododendrons, Jun-Aug monsoon, Dec-Feb cold) and the package's nature.

Output the sentence only — no quotes, no prefix, no JSON.`;
}

function itineraryPrompt({ pkg, days, adults, children }) {
  const travelerLine =
    children > 0
      ? `${adults} adult${adults > 1 ? 's' : ''} and ${children} child${children > 1 ? 'ren' : ''}`
      : `${adults} adult${adults > 1 ? 's' : ''}`;

  return `You write day-by-day itineraries for Nepal tour packages.

Package: "${pkg.title}" (${pkg.category}).
Description: ${pkg.description.slice(0, 500)}
Travelers: ${travelerLine}.
Trip length: ${days} day${days > 1 ? 's' : ''}.

Write a concrete itinerary. Rules:
- Exactly ${days} day entries.
- Each day: a 4-7 word title, then 2-3 short activity bullets.
- Tailor activities to the traveler mix (e.g. easier pace and family-friendly stops when children are included).
- Stay grounded in real Nepali locations relevant to the package.
- Output strict JSON only, no markdown.

JSON shape:
{ "days": [{ "day": 1, "title": "...", "activities": ["...", "...", "..."] }, ...] }
`;
}

function semanticSearchPrompt({ query, candidates }) {
  return `You are a search reranker for a Nepal travel site.

User query: "${query.slice(0, 200)}"

Candidate packages (slug | title | category | price NPR):
${packageCatalog(candidates)}

Pick up to 8 packages that best match the user's intent (interests, season hints, budget, mood). Score 1-100 (higher = better match). Skip packages that don't fit at all.

Output strict JSON only:
{ "results": [{ "slug": "...", "score": 95, "reason": "short reason (max 14 words)" }, ...] }
`;
}

const COMPANY_INFO = {
  name: 'Pokhara Tours and Travel',
  office: 'Lakeside Road, Pokhara 33700, Nepal',
  phone: '+977 61 123 4567',
  email: 'hello@pokharatours.com',
  hours: 'Sun–Fri, 9 AM – 7 PM (Nepal time)',
  responseTime: 'usually within a few hours',
  contactPage: '/contact',
};

function chatSystemPrompt({ catalog }) {
  return `You are the AI travel assistant for "${COMPANY_INFO.name}", a Nepal-focused tour company.

You help users with TWO things:
1. Discovering and picking tours from our catalog.
2. Answering questions about our company (contact details, office address, business hours, how to reach us).

For anything else (weather forecasts, visa rules, unrelated travel, code, news, math), politely redirect to picking a Nepal tour or contacting us directly.

Tone: warm, concise, practical. Never invent packages — only reference the ones in this catalog (use the exact slug if you suggest one).

==== COMPANY INFO ====
Office: ${COMPANY_INFO.office}
Phone: ${COMPANY_INFO.phone}
Email: ${COMPANY_INFO.email}
Hours: ${COMPANY_INFO.hours}
Reply time: ${COMPANY_INFO.responseTime}
Full contact page: ${COMPANY_INFO.contactPage}

When asked for contact details, share whichever the user wants (phone, email, address, hours). Mention the /contact page when relevant.

==== TOUR CATALOG ====
(slug | title | category | price NPR | offer-flag)
${catalog}

When a user describes what they want in a tour:
1. Ask at most one clarifying question if essential (budget, duration, season, traveler mix). Otherwise dive in.
2. Recommend 1-3 packages by slug from the catalog, each with a one-line reason.
3. End with a single "[SUGGEST: slug1, slug2]" tag on its own line listing the slugs you recommended. This is parsed by the UI — keep the format exact.

For pure contact/company questions, DO NOT add a [SUGGEST: ...] tag.

Keep replies under 120 words. Plain prose, no markdown headings.`;
}

module.exports = {
  recommendationPrompt,
  bestSeasonPrompt,
  itineraryPrompt,
  semanticSearchPrompt,
  chatSystemPrompt,
  packageCatalog,
  MONTH_NAMES,
};
