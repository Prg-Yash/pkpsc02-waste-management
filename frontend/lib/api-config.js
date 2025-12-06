// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  ENDPOINTS: {
    WASTE_REPORT: '/api/waste/report',
    WASTE_COLLECT: '/api/waste/collect',
    VERIFY_WASTE: '/api/verify-waste',
    LEADERBOARD_REPORTERS: '/api/leaderboard/reporters',
    LEADERBOARD_COLLECTORS: '/api/leaderboard/collectors',
    LEADERBOARD_GLOBAL: '/api/leaderboard/global',
  },
};

// Waste type mapping from frontend to backend enum
export const WASTE_TYPE_MAPPING = {
  'organic': 'ORGANIC',
  'plastic': 'PLASTIC',
  'paper': 'PAPER',
  'metal': 'METAL',
  'glass': 'GLASS',
  'ewaste': 'E-WASTE',
  'e-waste': 'E-WASTE',
  'hazardous': 'HAZARDOUS',
  'mixed': 'MIXED',
  'other': 'OTHER'
};

// Available waste types for UI
export const WASTE_TYPES = [
  { id: 'ORGANIC', name: 'Organic Waste', description: 'Food scraps, yard waste, biodegradable materials' },
  { id: 'PLASTIC', name: 'Plastic', description: 'Bottles, bags, packaging, containers' },
  { id: 'PAPER', name: 'Paper', description: 'Newspapers, cardboard, office paper' },
  { id: 'METAL', name: 'Metal', description: 'Cans, foil, scrap metal' },
  { id: 'GLASS', name: 'Glass', description: 'Bottles, jars, broken glass' },
  { id: 'E-WASTE', name: 'E-Waste', description: 'Electronics, batteries, circuit boards' },
  { id: 'HAZARDOUS', name: 'Hazardous', description: 'Chemicals, paints, medical waste' },
  { id: 'MIXED', name: 'Mixed Waste', description: 'Multiple waste types' }
];
