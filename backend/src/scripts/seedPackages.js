/* eslint-disable no-console */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Package = require('../models/Package');
const { slugify } = require('../utils/slugify');

const img = (seed) => `https://picsum.photos/seed/${seed}/1200/800`;

const REGULAR = [
  {
    title: 'Pokhara City Tour — 2 Days',
    description:
      'Discover the lake city: Phewa boating, World Peace Pagoda, Davis Falls and the bustling lakeside in two relaxed days.',
    priceNPR: 12500,
    category: 'tour',
    seeds: ['pokhara-city-1', 'pokhara-city-2', 'pokhara-city-3'],
  },
  {
    title: 'Phewa Lake Boating Experience',
    description:
      'A half-day paddle around Phewa Lake with a stop at Tal Barahi temple and a sunset view of the Annapurna range.',
    priceNPR: 3500,
    category: 'tour',
    seeds: ['phewa-1', 'phewa-2'],
  },
  {
    title: 'Sarangkot Sunrise Tour',
    description:
      'Pre-dawn drive up to Sarangkot to watch sunrise paint Machhapuchhre, Annapurna I and Dhaulagiri in shades of gold.',
    priceNPR: 4200,
    category: 'tour',
    seeds: ['sarangkot-1', 'sarangkot-2'],
  },
  {
    title: 'Kathmandu Heritage Walk',
    description:
      'Walk through Durbar Square, Swayambhunath and Boudhanath with a local historian — the soul of the valley in one day.',
    priceNPR: 8500,
    category: 'cultural',
    seeds: ['ktm-1', 'ktm-2', 'ktm-3'],
  },
  {
    title: 'Bhaktapur Day Tour',
    description:
      'Wander the medieval lanes of Bhaktapur, sample king curd in clay bowls, and watch potters at work in Pottery Square.',
    priceNPR: 6500,
    category: 'cultural',
    seeds: ['bhaktapur-1', 'bhaktapur-2'],
  },
  {
    title: 'Patan Cultural Visit',
    description:
      "Explore Patan Durbar Square's Newari woodcarvings, the Patan Museum and traditional metalcraft workshops in one afternoon.",
    priceNPR: 5500,
    category: 'cultural',
    seeds: ['patan-1', 'patan-2'],
  },
  {
    title: 'Nagarkot Sunrise Hike',
    description:
      'Stay overnight in a ridge-top lodge then watch sunrise sweep across eight Himalayan peaks including Everest on a clear day.',
    priceNPR: 9800,
    category: 'tour',
    seeds: ['nagarkot-1', 'nagarkot-2'],
  },
  {
    title: 'Chitwan Jungle Safari — 3 Days',
    description:
      'Jeep safaris, dugout canoe rides, elephant breeding centre and Tharu cultural evenings in the heart of Chitwan National Park.',
    priceNPR: 24500,
    category: 'wildlife',
    seeds: ['chitwan-1', 'chitwan-2', 'chitwan-3'],
  },
  {
    title: 'Lumbini Pilgrimage Tour',
    description:
      'Visit the birthplace of Lord Buddha — Maya Devi temple, Ashoka pillar, monastic zone and the sacred Bodhi tree.',
    priceNPR: 14500,
    category: 'cultural',
    seeds: ['lumbini-1', 'lumbini-2'],
  },
  {
    title: 'Bandipur Cultural Stay',
    description:
      'A two-night escape in a hilltop Newari town: cobbled streets, mountain views, Tundikhel viewpoint and home-cooked daal-bhaat.',
    priceNPR: 16500,
    category: 'cultural',
    seeds: ['bandipur-1', 'bandipur-2'],
  },
  {
    title: 'Ghorepani Poon Hill Trek — 5 Days',
    description:
      'A short, family-friendly trek through rhododendron forest to the famous Poon Hill viewpoint at sunrise.',
    priceNPR: 32500,
    category: 'trek',
    seeds: ['poonhill-1', 'poonhill-2', 'poonhill-3'],
  },
  {
    title: 'Annapurna Circuit Trek — 14 Days',
    description:
      'The classic high-altitude circuit: lush valleys, Manang, Thorong-La pass at 5416 m, and the sacred Muktinath temple.',
    priceNPR: 92500,
    category: 'trek',
    seeds: ['acircuit-1', 'acircuit-2', 'acircuit-3'],
  },
  {
    title: 'Annapurna Base Camp Trek — 10 Days',
    description:
      'A direct route into the heart of the Annapurna sanctuary at 4130 m, surrounded by 7000 m peaks on every side.',
    priceNPR: 78500,
    category: 'trek',
    seeds: ['abc-1', 'abc-2', 'abc-3'],
  },
  {
    title: 'Mardi Himal Trek — 6 Days',
    description:
      'A quieter alternative to the busy circuits — ridge walks above the clouds with intimate views of Machhapuchhre.',
    priceNPR: 42500,
    category: 'trek',
    seeds: ['mardi-1', 'mardi-2'],
  },
  {
    title: 'Langtang Valley Trek — 9 Days',
    description:
      'The valley of glaciers, just north of Kathmandu — Tamang villages, yak pastures and Kyanjin Gompa at 3870 m.',
    priceNPR: 65500,
    category: 'trek',
    seeds: ['langtang-1', 'langtang-2', 'langtang-3'],
  },
  {
    title: 'Manaslu Circuit Trek — 14 Days',
    description:
      'A restricted-area trek around the world&apos;s eighth-tallest peak, crossing the Larkya-La pass at 5160 m. Tea-house lodging.',
    priceNPR: 118500,
    category: 'trek',
    seeds: ['manaslu-1', 'manaslu-2', 'manaslu-3'],
  },
  {
    title: 'Upper Mustang Trek — 12 Days',
    description:
      'The forbidden kingdom of Lo: Tibetan-style villages, ancient monasteries and the walled capital of Lo Manthang.',
    priceNPR: 165500,
    category: 'trek',
    seeds: ['mustang-1', 'mustang-2', 'mustang-3'],
  },
  {
    title: 'Tilicho Lake Trek — 16 Days',
    description:
      'Side-trip from the Annapurna Circuit to the world&apos;s highest lake at 4919 m — turquoise water against snow walls.',
    priceNPR: 105500,
    category: 'trek',
    seeds: ['tilicho-1', 'tilicho-2'],
  },
  {
    title: 'Gokyo Lakes Trek — 12 Days',
    description:
      'Six glacial lakes in the Khumbu, the Ngozumpa glacier, and a sunrise climb to Gokyo Ri (5357 m) for the four 8000 m giants.',
    priceNPR: 132500,
    category: 'trek',
    seeds: ['gokyo-1', 'gokyo-2', 'gokyo-3'],
  },
  {
    title: 'Everest Three Passes Trek — 19 Days',
    description:
      'The ultimate Khumbu loop: Kongma-La, Cho-La and Renjo-La passes — for trekkers who already have altitude experience.',
    priceNPR: 168500,
    category: 'trek',
    seeds: ['threepass-1', 'threepass-2', 'threepass-3'],
  },
];

const OFFERS = [
  {
    title: 'Everest Base Camp Trek — 12 Days',
    description:
      'The bucket-list trek to 5364 m at the foot of Everest, including a flight into Lukla and a sunrise climb up Kala Patthar.',
    priceNPR: 145000,
    category: 'trek',
    seeds: ['ebc-1', 'ebc-2', 'ebc-3'],
  },
  {
    title: 'Everest Helicopter Tour — Half Day',
    description:
      'Skip the trek: fly from Kathmandu to Kala Patthar, breakfast at the Everest View Hotel and back by lunch.',
    priceNPR: 125000,
    category: 'adventure',
    seeds: ['heli-1', 'heli-2'],
  },
  {
    title: 'Bungee Jumping at The Last Resort',
    description:
      'A 160 m freefall over the Bhote Koshi gorge on Asia&apos;s longest bungee — transport, lunch and certificate included.',
    priceNPR: 11500,
    category: 'adventure',
    seeds: ['bungee-1', 'bungee-2'],
  },
  {
    title: 'Trishuli White Water Rafting — 2 Days',
    description:
      'Two days of class III+ rapids on the Trishuli river with riverside camping, bonfire and traditional Nepali dinner.',
    priceNPR: 16500,
    category: 'adventure',
    seeds: ['rafting-1', 'rafting-2'],
  },
  {
    title: 'Paragliding in Pokhara',
    description:
      "30-minute tandem flight from Sarangkot over Phewa Lake — one of the world's top five paragliding sites, with photos included.",
    priceNPR: 9500,
    category: 'adventure',
    seeds: ['paragliding-1', 'paragliding-2'],
  },
  {
    title: 'Pokhara Adventure Combo — Devis Falls and Caves',
    description:
      "Half-day combo of Devi's Falls, the Gupteshwor cave system and the World Peace Pagoda — transport and guide included.",
    priceNPR: 5500,
    category: 'tour',
    seeds: ['pkr-combo-1', 'pkr-combo-2'],
  },
  {
    title: 'Annapurna Circuit Premium — 12 Days',
    description:
      'The classic circuit with deluxe lodges where available, attached private bathrooms, porter team and a senior English-speaking guide.',
    priceNPR: 145500,
    category: 'trek',
    seeds: ['acircuit-prem-1', 'acircuit-prem-2', 'acircuit-prem-3'],
  },
  {
    title: 'Rara Lake Express — Fly In, Fly Out — 5 Days',
    description:
      "Skip the long bus ride — fly directly to Talcha airport for Nepal's largest and bluest lake at 2990 m.",
    priceNPR: 88500,
    category: 'tour',
    seeds: ['rara-1', 'rara-2'],
  },
  {
    title: 'Kanchenjunga Base Camp Trek — 22 Days',
    description:
      "An expedition-style trek to the world's third-highest peak in remote far-east Nepal — restricted permit, full-board service.",
    priceNPR: 285000,
    category: 'trek',
    seeds: ['kanch-1', 'kanch-2', 'kanch-3'],
  },
  {
    title: 'Honeymoon in Pokhara — 4 Days',
    description:
      'Lakeside boutique hotel, candlelit dinner cruise on Phewa Lake, couple paragliding flight and a sunrise breakfast at Sarangkot.',
    priceNPR: 64500,
    category: 'tour',
    seeds: ['honeymoon-1', 'honeymoon-2', 'honeymoon-3'],
  },
];

function buildDoc(entry, isOffer) {
  return {
    slug: slugify(entry.title),
    title: entry.title,
    description: entry.description,
    priceNPR: entry.priceNPR,
    gallery: entry.seeds.map(img),
    isOffer,
    category: entry.category || 'tour',
    type: entry.type || 'destination',
  };
}

async function main() {
  await connectDB();

  const docs = [
    ...REGULAR.map((p) => buildDoc(p, false)),
    ...OFFERS.map((p) => buildDoc(p, true)),
  ];

  let created = 0;
  let updated = 0;
  for (const doc of docs) {
    const existing = await Package.findOne({ slug: doc.slug });
    if (existing) {
      await Package.updateOne({ _id: existing._id }, { $set: doc });
      updated += 1;
      console.log(`  ↻ updated  ${doc.isOffer ? '[OFFER]' : '       '}  ${doc.slug}`);
    } else {
      await Package.create(doc);
      created += 1;
      console.log(`  + created  ${doc.isOffer ? '[OFFER]' : '       '}  ${doc.slug}`);
    }
  }

  const totals = await Promise.all([
    Package.countDocuments({}),
    Package.countDocuments({ isOffer: true }),
  ]);

  console.log('');
  console.log(`Done. ${created} created, ${updated} updated.`);
  console.log(`Database now has ${totals[0]} packages (${totals[1]} offers).`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
