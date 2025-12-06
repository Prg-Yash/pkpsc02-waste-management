// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://jeanene-unexposed-ingrid.ngrok-free.dev',
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
  'ewaste': 'E_WASTE',
  'mixed': 'MIXED',
  'other': 'OTHER'
};
