const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ForecastEvent = require('./models/ForecastEvent');

dotenv.config({ path: 'backend/.env' });

const forecastData2026 = [
  // HINDU FESTIVALS
  {
    name: "🪔 Diwali",
    category: "cooking",
    religion: "Hindu",
    startDate: new Date("2026-11-08T00:00:00Z"),
    endDate: new Date("2026-11-12T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Festival of lights creating huge demand for homemade sweets, snacks, and catering.",
    expectedDemand: "+45%",
    affectedServices: ["cooking", "tailoring", "home-services"],
    source: "Verified Hindu Calendar 2026"
  },
  {
    name: "🎨 Holi",
    category: "cooking",
    religion: "Hindu",
    startDate: new Date("2026-03-03T00:00:00Z"),
    endDate: new Date("2026-03-04T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Festival of colors driving sweets preparation and local festive home cleaning services.",
    expectedDemand: "+30%",
    affectedServices: ["cooking", "home-services"],
    source: "Verified Hindu Calendar 2026"
  },
  {
    name: "🌾 Pongal",
    category: "cooking",
    religion: "Hindu",
    startDate: new Date("2026-01-14T00:00:00Z"),
    endDate: new Date("2026-01-17T23:59:59Z"),
    year: 2026,
    region: "South India",
    description: "Harvest festival of Tamil Nadu driving traditional cooking and family gather preparation.",
    expectedDemand: "+40%",
    affectedServices: ["cooking", "errands"],
    source: "Regional Tamil Calendar"
  },
  {
    name: "🏵️ Onam",
    category: "cooking",
    religion: "Hindu",
    startDate: new Date("2026-08-26T00:00:00Z"),
    endDate: new Date("2026-08-29T23:59:59Z"),
    year: 2026,
    region: "South India",
    description: "Harvest festival of Kerala raising demand for traditional Sadhya catering and floral arts.",
    expectedDemand: "+35%",
    affectedServices: ["cooking", "traditional-crafts"],
    source: "Regional Kerala Calendar"
  },
  {
    name: "🌸 Navratri",
    category: "cooking",
    religion: "Hindu",
    startDate: new Date("2026-10-11T00:00:00Z"),
    endDate: new Date("2026-10-19T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Nine nights of prayer with strong demand for special fast-friendly meals and traditional crafts.",
    expectedDemand: "+35%",
    affectedServices: ["cooking", "traditional-crafts"],
    source: "Verified Hindu Calendar 2026"
  },
  {
    name: "🦁 Dussehra",
    category: "home-services",
    religion: "Hindu",
    startDate: new Date("2026-10-20T00:00:00Z"),
    endDate: new Date("2026-10-20T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Vijayadashami celebrations creating home cleaning and family feast catering opportunities.",
    expectedDemand: "+25%",
    affectedServices: ["home-services", "cooking"],
    source: "Verified Hindu Calendar 2026"
  },
  {
    name: "🥛 Janmashtami",
    category: "cooking",
    religion: "Hindu",
    startDate: new Date("2026-09-04T00:00:00Z"),
    endDate: new Date("2026-09-04T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Krishna Jayanti celebrations with cooking orders for dairy-based sweets and prasad items.",
    expectedDemand: "+20%",
    affectedServices: ["cooking"],
    source: "Verified Hindu Calendar 2026"
  },

  // ISLAMIC FESTIVALS
  {
    name: "🌙 Ramadan",
    category: "cooking",
    religion: "Islamic",
    startDate: new Date("2026-02-18T00:00:00Z"),
    endDate: new Date("2026-03-19T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Holy fasting month creating significant demand for evening Iftar meal prep and delivery.",
    expectedDemand: "+35%",
    affectedServices: ["cooking", "errands"],
    source: "Islamic Lunar Calendar 2026"
  },
  {
    name: "🕌 Eid al-Fitr",
    category: "cooking",
    religion: "Islamic",
    startDate: new Date("2026-03-20T00:00:00Z"),
    endDate: new Date("2026-03-20T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Feast of breaking the fast driving massive orders for festive biryanis, sweets and tailoring.",
    expectedDemand: "+50%",
    affectedServices: ["cooking", "tailoring"],
    source: "Islamic Lunar Calendar 2026"
  },
  {
    name: "🐑 Eid al-Adha",
    category: "cooking",
    religion: "Islamic",
    startDate: new Date("2026-05-27T00:00:00Z"),
    endDate: new Date("2026-05-27T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Festival of Sacrifice with request spikes for family feast catering and cooking helpers.",
    expectedDemand: "+40%",
    affectedServices: ["cooking", "home-services"],
    source: "Islamic Lunar Calendar 2026"
  },
  {
    name: "🖤 Muharram",
    category: "cooking",
    religion: "Islamic",
    startDate: new Date("2026-06-16T00:00:00Z"),
    endDate: new Date("2026-06-16T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Islamic New Year and Ashura with cooking and community meal distribution services.",
    expectedDemand: "+20%",
    affectedServices: ["cooking", "errands"],
    source: "Islamic Lunar Calendar 2026"
  },

  // CHRISTIAN FESTIVALS
  {
    name: "🎄 Christmas",
    category: "cooking",
    religion: "Christian",
    startDate: new Date("2026-12-25T00:00:00Z"),
    endDate: new Date("2026-12-25T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Christmas celebrations generating massive orders for festive baking, cakes, and gifts.",
    expectedDemand: "+45%",
    affectedServices: ["cooking", "errands", "traditional-crafts"],
    source: "Gregorian Calendar"
  },
  {
    name: "🥚 Easter Sunday",
    category: "cooking",
    religion: "Christian",
    startDate: new Date("2026-04-05T00:00:00Z"),
    endDate: new Date("2026-04-05T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Easter feast generating orders for home baking and holiday lunch catering.",
    expectedDemand: "+30%",
    affectedServices: ["cooking"],
    source: "Ecclesiastical Moon Calendar 2026"
  },
  {
    name: "✝️ Good Friday",
    category: "errands",
    religion: "Christian",
    startDate: new Date("2026-04-03T00:00:00Z"),
    endDate: new Date("2026-04-03T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Solemn prayer day leading into the holiday weekend.",
    expectedDemand: "+15%",
    affectedServices: ["errands"],
    source: "Gregorian Calendar 2026"
  },

  // SIKH FESTIVALS
  {
    name: "🌾 Vaisakhi",
    category: "cooking",
    religion: "Sikh",
    startDate: new Date("2026-04-14T00:00:00Z"),
    endDate: new Date("2026-04-14T23:59:59Z"),
    year: 2026,
    region: "North India",
    description: "Punjabi New Year and harvest festival raising catering demand for Langar-style feasts.",
    expectedDemand: "+40%",
    affectedServices: ["cooking", "home-services"],
    source: "Nanakshahi Calendar"
  },
  {
    name: "☬ Gurpurab",
    category: "cooking",
    religion: "Sikh",
    startDate: new Date("2026-11-24T00:00:00Z"),
    endDate: new Date("2026-11-24T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Guru Nanak Dev Ji Jayanti generating local community kitchen assistance and sweet orders.",
    expectedDemand: "+35%",
    affectedServices: ["cooking", "errands"],
    source: "Nanakshahi Calendar 2026"
  },

  // BUDDHIST & JAIN FESTIVALS
  {
    name: "☸️ Buddha Purnima",
    category: "cooking",
    religion: "Buddhist",
    startDate: new Date("2026-05-01T00:00:00Z"),
    endDate: new Date("2026-05-01T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Buddha Jayanti with requests for simple vegetarian meals and community errands.",
    expectedDemand: "+20%",
    affectedServices: ["cooking", "errands"],
    source: "Buddhist Calendar 2026"
  },
  {
    name: "🕊️ Mahavir Jayanti",
    category: "cooking",
    religion: "Jain",
    startDate: new Date("2026-03-31T00:00:00Z"),
    endDate: new Date("2026-03-31T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Lord Mahavira birth anniversary with high demand for pure Jain-sattvik catering.",
    expectedDemand: "+30%",
    affectedServices: ["cooking"],
    source: "Jain Lunar Calendar 2026"
  },
  {
    name: "🧘 Paryushan",
    category: "cooking",
    religion: "Jain",
    startDate: new Date("2026-09-07T00:00:00Z"),
    endDate: new Date("2026-09-14T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Jain period of fasting and reflection with strong request spikes for strict Jain catering.",
    expectedDemand: "+35%",
    affectedServices: ["cooking"],
    source: "Jain Lunar Calendar 2026"
  },

  // DEMAND / SEASONAL FORECASTS
  {
    name: "💍 Wedding Season",
    category: "tailoring",
    religion: "None",
    startDate: new Date("2026-10-01T00:00:00Z"),
    endDate: new Date("2026-12-31T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Peak Indian marriage season driving high demand for custom guest alterations and catering helper services.",
    expectedDemand: "+50%",
    affectedServices: ["tailoring", "cooking", "traditional-crafts"],
    source: "Industry Survey Estimates"
  },
  {
    name: "🎒 School Reopening",
    category: "tutoring",
    religion: "None",
    startDate: new Date("2026-06-01T00:00:00Z"),
    endDate: new Date("2026-06-30T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Academic year start generating sharp demand spikes for home-tutoring and school-runs help.",
    expectedDemand: "+45%",
    affectedServices: ["tutoring", "errands"],
    source: "Academic Calendar Estimates"
  },
  {
    name: "📝 Exam Season",
    category: "tutoring",
    religion: "None",
    startDate: new Date("2026-02-15T00:00:00Z"),
    endDate: new Date("2026-03-31T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Board exams and final tests driving emergency math, science, and languages tutoring.",
    expectedDemand: "+50%",
    affectedServices: ["tutoring"],
    source: "Academic Calendar Estimates"
  },
  {
    name: "☀️ Summer Vacation",
    category: "caregiving",
    religion: "None",
    startDate: new Date("2026-04-15T00:00:00Z"),
    endDate: new Date("2026-05-31T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "School holiday period with demand for child caregiving, camp tutoring, and vacation errands.",
    expectedDemand: "+30%",
    affectedServices: ["caregiving", "tutoring", "cooking"],
    source: "Seasonal Trend Estimates"
  },
  {
    name: "🌧️ Monsoon Prep",
    category: "home-services",
    religion: "None",
    startDate: new Date("2026-07-01T00:00:00Z"),
    endDate: new Date("2026-08-15T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Rainy season preparation driving home roof/leakage repair and indoor errands help.",
    expectedDemand: "+30%",
    affectedServices: ["home-services", "errands"],
    source: "Seasonal Weather Estimates"
  },
  {
    name: "🛍️ Festival Shopping",
    category: "errands",
    religion: "None",
    startDate: new Date("2026-10-10T00:00:00Z"),
    endDate: new Date("2026-11-10T23:59:59Z"),
    year: 2026,
    region: "National",
    description: "Pre-festive shopping rush driving high demand for shopping delivery and packaging helpers.",
    expectedDemand: "+35%",
    affectedServices: ["errands", "traditional-crafts"],
    source: "Industry Survey Estimates"
  }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/silverhands_local');
    console.log('MongoDB Connected for Forecast Seeding...');
    
    // Clear old forecast records
    await ForecastEvent.deleteMany({});
    console.log('Cleared existing forecast events.');

    // Save events
    await ForecastEvent.insertMany(forecastData2026);
    console.log(`Successfully seeded ${forecastData2026.length} verified 2026 forecast events!`);
    
    process.exit(0);
  } catch (err) {
    console.error('Forecast seeding error:', err.message);
    process.exit(1);
  }
};

seed();
