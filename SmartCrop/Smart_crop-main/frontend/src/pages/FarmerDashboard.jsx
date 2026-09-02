import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import FarmerChat from './FarmerChat';
import { 
  MapPin, Sprout, TrendingUp, Calendar, Ruler, DollarSign, Award, Search, ChevronDown, 
  LocateFixed, LineChart, ShieldCheck, Volume2, VolumeX, X, User, Sun, Moon, CreditCard,
  Droplets, Clock, Sparkles, Globe, Mic, Send, Loader2, MessageSquare
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LocationPickerMap from '../components/LocationPickerMap';
import WeatherWidget from '../components/WeatherWidget';
import CreditScoreGauge from '../components/CreditScoreGauge';
import LoanInformationModal from '../components/LoanInformationModal';
import smartBotImg from '../assets/smart_bot.png';

const API_BASE = "http://127.0.0.1:8000";

const formatIndianCurrency = (val, compact = false) => {
  if (val === null || val === undefined || isNaN(val)) return '₹0';
  const num = Math.round(Number(val));
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (compact) {
    if (absNum >= 10000000) {
      return `${sign}₹${(absNum / 10000000).toFixed(2)} Cr`;
    }
    if (absNum >= 100000) {
      return `${sign}₹${(absNum / 100000).toFixed(2)} Lakh`;
    }
    if (absNum >= 1000) {
      return `${sign}₹${absNum.toLocaleString('en-IN')}`;
    }
    return `${sign}₹${absNum.toLocaleString('en-IN')}`;
  }

  if (absNum >= 10000000) {
    return `${sign}₹${absNum.toLocaleString('en-IN')} (${(absNum / 10000000).toFixed(2)} Cr)`;
  }
  if (absNum >= 100000) {
    return `${sign}₹${absNum.toLocaleString('en-IN')} (${(absNum / 100000).toFixed(2)} Lakh)`;
  }
  return `${sign}₹${absNum.toLocaleString('en-IN')}`;
};

const DEFAULT_ANALYSIS_DATA = {
  crop_recommendation: {
    recommended_crop: 'Moong(Green Gram)',
    yield_per_ha: 3.65,
    reasons: [
      'Optimal soil pH and climate match for selected Odisha district',
      'High market price stability and MSP government procurement support',
      'Low water footprint requirement, ideal for sustainable yield'
    ]
  },
  candidate_crops: [
    { crop: 'Moong(Green Gram)', suitability_score: 95.2, expected_net_profit: 103078, total_cultivation_cost: 187500, safety_score: 85, final_distress_score: 31.0 },
    { crop: 'Groundnut', suitability_score: 88.5, expected_net_profit: 92252, total_cultivation_cost: 187500, safety_score: 78, final_distress_score: 33.5 },
    { crop: 'Ragi', suitability_score: 94.9, expected_net_profit: 62500, total_cultivation_cost: 187500, safety_score: 92, final_distress_score: 29.0 },
    { crop: 'Rice', suitability_score: 82.1, expected_net_profit: 85500, total_cultivation_cost: 187500, safety_score: 80, final_distress_score: 35.0 },
    { crop: 'Maize', suitability_score: 79.4, expected_net_profit: 71000, total_cultivation_cost: 187500, safety_score: 75, final_distress_score: 38.0 }
  ],
  profit_analysis: {
    net_profit_inr: 103078,
    total_revenue_inr: 290578,
    total_cost_inr: 187500,
    formatted_profit: '₹1,03,078',
    formatted_revenue: '₹2,90,578',
    roi_percent: 54.9
  },
  market_price_summary: {
    mandi_price_per_quintal: 9714.24,
    forecast_15d: 10361,
    forecast_30d: 10599,
    forecast_90d: 11548
  }
};

const ODISHA_DISTRICTS = [
  "Angul","Balangir","Balasore","Bargarh","Bhadrak","Boudh","Cuttack","Deogarh", 
  "Dhenkanal","Gajapati","Ganjam","Jagatsinghpur","Jajpur","Jharsuguda","Kalahandi", 
  "Kandhamal","Kendrapara","Kendujhar","Khordha","Koraput","Malkangiri","Mayurbhanj", 
  "Nabarangpur","Nayagarh","Nuapada","Puri","Rayagada","Sambalpur","Subarnapur","Sundargarh"
];

const ODISHA_DISTRICTS_COORDS = {
  'Angul': { lat: 20.84, lon: 85.10 },
  'Balangir': { lat: 20.72, lon: 83.48 },
  'Balasore': { lat: 21.49, lon: 86.93 },
  'Bargarh': { lat: 21.33, lon: 83.62 },
  'Bhadrak': { lat: 21.06, lon: 86.50 },
  'Boudh': { lat: 20.84, lon: 84.32 },
  'Cuttack': { lat: 20.46, lon: 85.88 },
  'Deogarh': { lat: 21.54, lon: 84.73 },
  'Dhenkanal': { lat: 20.66, lon: 85.60 },
  'Gajapati': { lat: 18.77, lon: 84.09 },
  'Ganjam': { lat: 19.38, lon: 85.05 },
  'Jagatsinghpur': { lat: 20.27, lon: 86.17 },
  'Jajpur': { lat: 20.85, lon: 86.33 },
  'Jharsuguda': { lat: 21.86, lon: 84.01 },
  'Kalahandi': { lat: 19.91, lon: 83.16 },
  'Kandhamal': { lat: 20.20, lon: 84.05 },
  'Kendrapara': { lat: 20.50, lon: 86.42 },
  'Kendujhar': { lat: 21.63, lon: 85.58 },
  'Khordha': { lat: 20.18, lon: 85.62 },
  'Koraput': { lat: 18.81, lon: 82.71 },
  'Malkangiri': { lat: 18.35, lon: 81.90 },
  'Mayurbhanj': { lat: 21.93, lon: 86.73 },
  'Nabarangpur': { lat: 19.23, lon: 82.55 },
  'Nayagarh': { lat: 20.13, lon: 85.10 },
  'Nuapada': { lat: 20.83, lon: 82.52 },
  'Puri': { lat: 19.81, lon: 85.83 },
  'Rayagada': { lat: 19.17, lon: 83.42 },
  'Sambalpur': { lat: 21.47, lon: 83.97 },
  'Subarnapur': { lat: 20.83, lon: 83.92 },
  'Sundargarh': { lat: 22.12, lon: 84.03 }
};

const CROP_NAME_MAP = {
  Rice: { hi: "चावल", or: "ଧାନ" },
  Ragi: { hi: "रागी (मडुआ)", or: "ମାଣ୍ଡିଆ" },
  "Moong(Green Gram)": { hi: "मूंग (हरा चना)", or: "ମୁଗ" },
  Moong: { hi: "मूंग", or: "ମୁଗ" },
  Groundnut: { hi: "मूंगफली", or: "ଚିନାବାଦାମ" },
  Jute: { hi: "जूट", or: "ଝୋଟ" },
  Maize: { hi: "मक्का", or: "ମକା" },
  Cotton: { hi: "कपास", or: "କପା" },
  Sugarcane: { hi: "गन्ना", or: "ଆଖୁ" },
  Pulses: { hi: "दालें", or: "ଡାଲି" },
  Sesamum: { hi: "तिल", or: "ରାଶି" },
  Wheat: { hi: "गेहूं", or: "ଗହମ" },
  Mustard: { hi: "सरसों", or: "ସୋରିଷ" },
  Potato: { hi: "आलू", or: "ଆଳୁ" },
  Urad: { hi: "उड़द", or: "ବିରି" },
  Arhar: { hi: "अरहर", or: "ହରଡ଼" },
  Gram: { hi: "चना", or: "ଚଣା" }
};

const CROP_INSIGHTS_DATABASE = {
  "moong": {
    soil: "Well-drained sandy loam or fertile loam (pH 6.0 - 7.5). Avoid waterlogged soils.",
    sowing: "Kharif (June–July) or Summer (March). Ideal temp: 25°C - 35°C.",
    water: "Low (250 - 300 mm). Requires 2–3 light irrigations; highly drought tolerant.",
    npk: "20:40:20 kg/ha NPK + Rhizobium seed treatment for soil nitrogen bio-fixation.",
    pest: "Yellow Mosaic Virus & Pod Borer. Spray Neem oil (5ml/L) or Imidacloprid early.",
    market: "High MSP Support (₹8,558/Quintal). Pulse crop enriches soil nitrogen naturally!",
    duration: "60 - 70 Days",
    yield: "1.2 - 1.5 Tons / Ha"
  },
  "moong(green gram)": {
    soil: "Well-drained sandy loam or fertile loam (pH 6.0 - 7.5). Avoid waterlogged soils.",
    sowing: "Kharif (June–July) or Summer (March). Ideal temp: 25°C - 35°C.",
    water: "Low (250 - 300 mm). Requires 2–3 light irrigations; highly drought tolerant.",
    npk: "20:40:20 kg/ha NPK + Rhizobium seed treatment for soil nitrogen bio-fixation.",
    pest: "Yellow Mosaic Virus & Pod Borer. Spray Neem oil (5ml/L) or Imidacloprid early.",
    market: "High MSP Support (₹8,558/Quintal). Pulse crop enriches soil nitrogen naturally!",
    duration: "60 - 70 Days",
    yield: "1.2 - 1.5 Tons / Ha"
  },
  "green gram": {
    soil: "Well-drained sandy loam or fertile loam (pH 6.0 - 7.5). Avoid waterlogged soils.",
    sowing: "Kharif (June–July) or Summer (March). Ideal temp: 25°C - 35°C.",
    water: "Low (250 - 300 mm). Requires 2–3 light irrigations; highly drought tolerant.",
    npk: "20:40:20 kg/ha NPK + Rhizobium seed treatment for soil nitrogen bio-fixation.",
    pest: "Yellow Mosaic Virus & Pod Borer. Spray Neem oil (5ml/L) or Imidacloprid early.",
    market: "High MSP Support (₹8,558/Quintal). Pulse crop enriches soil nitrogen naturally!",
    duration: "60 - 70 Days",
    yield: "1.2 - 1.5 Tons / Ha"
  },
  "groundnut": {
    soil: "Friable sandy loam rich in organic matter & calcium. Good aeration for peg development.",
    sowing: "Kharif (June) or Rabi (Nov–Dec). Ideal temp: 22°C - 30°C.",
    water: "Moderate (450 - 500 mm). Critical watering during flowering and pegging stages.",
    npk: "25:50:40 kg/ha NPK + Gypsum @ 400 kg/ha at peg formation for pod shell filling.",
    pest: "Tikka leaf spot & Root Rot. Apply Trichoderma bio-fungicide & Mancozeb spray.",
    market: "Mandi price range: ₹6,200 - ₹7,200/Quintal. High oil seed market demand.",
    duration: "105 - 120 Days",
    yield: "2.2 - 2.8 Tons / Ha"
  },
  "ragi": {
    soil: "Red loam, clay loam, or light soils. Tolerates acidic soils common in Odisha.",
    sowing: "Kharif (June–July). Ideal temp: 20°C - 32°C.",
    water: "Low (350 - 400 mm). Extremely climate resilient; thrives in rainfed Odisha districts.",
    npk: "40:20:20 kg/ha NPK. Organic farmyard manure (FYM) gives dense grains.",
    pest: "Highly resistant to major pests. Watch for blast disease during wet spells.",
    market: "Odisha Millet Mission scheme bonus + MSP (₹3,840/Quintal). Guaranteed govt procurement!",
    duration: "95 - 110 Days",
    yield: "1.8 - 2.4 Tons / Ha"
  },
  "finger millet": {
    soil: "Red loam, clay loam, or light soils. Tolerates acidic soils common in Odisha.",
    sowing: "Kharif (June–July). Ideal temp: 20°C - 32°C.",
    water: "Low (350 - 400 mm). Extremely climate resilient; thrives in rainfed Odisha districts.",
    npk: "40:20:20 kg/ha NPK. Organic farmyard manure (FYM) gives dense grains.",
    pest: "Highly resistant to major pests. Watch for blast disease during wet spells.",
    market: "Odisha Millet Mission scheme bonus + MSP (₹3,840/Quintal). Guaranteed govt procurement!",
    duration: "95 - 110 Days",
    yield: "1.8 - 2.4 Tons / Ha"
  },
  "rice": {
    soil: "Heavy clay or clay loam soil with good water retention capacity (pH 5.5 - 7.0).",
    sowing: "Kharif (June–July). Ideal temp: 20°C - 37°C.",
    water: "High (1200 - 1400 mm). Requires standing water or Alternate Wetting & Drying (AWD).",
    npk: "80:40:40 kg/ha NPK + Zinc Sulphate @ 25 kg/ha to prevent Khaira disease.",
    pest: "Stem Borer & Rice Blast. Apply Neem oil or Carbofuran granules as preventative.",
    market: "Mandatory MSP procurement (₹2,300/Quintal). PM-KISAN & KALIA financial support.",
    duration: "120 - 140 Days",
    yield: "3.5 - 4.5 Tons / Ha"
  },
  "paddy": {
    soil: "Heavy clay or clay loam soil with good water retention capacity (pH 5.5 - 7.0).",
    sowing: "Kharif (June–July). Ideal temp: 20°C - 37°C.",
    water: "High (1200 - 1400 mm). Requires standing water or Alternate Wetting & Drying (AWD).",
    npk: "80:40:40 kg/ha NPK + Zinc Sulphate @ 25 kg/ha to prevent Khaira disease.",
    pest: "Stem Borer & Rice Blast. Apply Neem oil or Carbofuran granules as preventative.",
    market: "Mandatory MSP procurement (₹2,300/Quintal). PM-KISAN & KALIA financial support.",
    duration: "120 - 140 Days",
    yield: "3.5 - 4.5 Tons / Ha"
  },
  "maize": {
    soil: "Deep fertile loam or silt loam with good drainage (pH 6.0 - 7.5).",
    sowing: "Kharif (June) or Rabi (Oct–Nov). Ideal temp: 21°C - 30°C.",
    water: "Moderate (500 - 600 mm). Critical at knee-high and tasseling stages.",
    npk: "120:60:40 kg/ha NPK. Apply Nitrogen in 3 split doses.",
    pest: "Fall Armyworm (FAW). Spray Emamectin Benzoate 5% SG @ 0.4g/L if leaf damage seen.",
    market: "High demand in Odisha cattle & poultry feed industries. Mandi price: ₹2,200 - ₹2,600/Q.",
    duration: "90 - 110 Days",
    yield: "4.0 - 5.5 Tons / Ha"
  },
  "mustard": {
    soil: "Loam to heavy clay loam soil. Cool temperature crops (Rabi season).",
    sowing: "Rabi (Oct–Nov). Ideal temp: 15°C - 25°C.",
    water: "Low (250 - 350 mm). 2 light irrigations at flowering and pod filling.",
    npk: "60:30:30 kg/ha NPK + Elemental Sulphur @ 20 kg/ha for higher oil content.",
    pest: "Mustard Aphids. Spray Dimethoate 30% EC @ 1.5ml/L during early bloom.",
    market: "MSP Support (₹5,650/Quintal). High demand for edible mustard oil in Odisha.",
    duration: "85 - 100 Days",
    yield: "1.2 - 1.8 Tons / Ha"
  }
};

const defaultCropInsight = (cropName) => ({
  soil: "Well-drained fertile loam soil with adequate organic matter (pH 6.0 - 7.5).",
  sowing: "Kharif / Rabi season depending on regional moisture and temperature.",
  water: "Moderate irrigation (400 - 500 mm). Maintain soil moisture without waterlogging.",
  npk: "Balanced NPK (60:30:30 kg/ha) + organic compost for healthy root growth.",
  pest: "Monitor weekly for chewing insects and leaf spots. Use bio-pesticides or Neem oil.",
  market: "Local Odisha mandi demand. Eligible for PM-KISAN and PMFBY crop insurance support.",
  duration: "90 - 120 Days",
  yield: "2.0 - 3.5 Tons / Ha"
});

const MandiPriceChart = ({ prices, cropName, isDarkMode }) => {
  const { priceToday, price15, price30, price90 } = prices;
  const pts = [
    { label: 'Today', val: priceToday, pct: 'Base', x: 50 },
    { label: '+15 Days', val: price15, pct: '+3.8%', x: 180 },
    { label: '+30 Days', val: price30, pct: '+7.5%', x: 310 },
    { label: '+90 Days', val: price90, pct: '+13.4%', x: 440 }
  ];

  const minV = Math.min(...pts.map(p => p.val)) * 0.96;
  const maxV = Math.max(...pts.map(p => p.val)) * 1.04;
  const range = maxV - minV || 1;

  const getY = (val) => 110 - ((val - minV) / range) * 75;

  const pointsWithY = pts.map(p => ({ ...p, y: getY(p.val) }));

  const pathD = `M ${pointsWithY[0].x} ${pointsWithY[0].y} ` +
    pointsWithY.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

  const areaD = `${pathD} L ${pointsWithY[pointsWithY.length - 1].x} 130 L ${pointsWithY[0].x} 130 Z`;

  return (
    <div className={`mt-5 p-4.5 rounded-2xl border transition-all duration-300 ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-700 text-white shadow-xl' 
        : 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950 shadow-2xs'
    }`}>
      <div className="flex justify-between items-center mb-3 px-1">
        <span className={`text-lg font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isDarkMode ? 'text-emerald-400' : 'text-emerald-900'
        }`}>
          <LineChart className="h-4 w-4 text-emerald-600" /> Mandi Price Trend Graph (₹/Quintal)
        </span>
        <span className={`text-base font-bold px-2.5 py-0.5 rounded-full border ${
          isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-200/80 text-emerald-900 border-emerald-300'
        }`}>
          Seasonal Market Rally
        </span>
      </div>

      <div className="relative w-full overflow-hidden pt-2">
        <svg viewBox="0 0 500 150" className="w-full h-36 sm:h-44 overflow-visible">
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="30" y1="35" x2="470" y2="35" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeDasharray="3 3" strokeWidth="1" />
          <line x1="30" y1="75" x2="470" y2="75" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeDasharray="3 3" strokeWidth="1" />
          <line x1="30" y1="115" x2="470" y2="115" stroke={isDarkMode ? "#334155" : "#cbd5e1"} strokeDasharray="3 3" strokeWidth="1" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#priceGradient)" />

          {/* Line Chart */}
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points and Labels */}
          {pointsWithY.map((pt, idx) => (
            <g key={idx} className="group cursor-pointer">
              {/* Outer pulsing ring */}
              <circle cx={pt.x} cy={pt.y} r="7" fill="#059669" className="animate-ping opacity-30" />
              {/* Core Circle */}
              <circle cx={pt.x} cy={pt.y} r="5" fill="#34d399" stroke="#ffffff" strokeWidth="2" />
              
              {/* Price text above point */}
              <text 
                x={pt.x} 
                y={pt.y - 12} 
                textAnchor="middle" 
                className={`text-lg font-black tracking-tight ${isDarkMode ? 'fill-emerald-300' : 'fill-emerald-800'}`}
              >
                ₹{pt.val.toLocaleString('en-IN')}
              </text>

              {/* Time Label below X axis */}
              <text 
                x={pt.x} 
                y="145" 
                textAnchor="middle" 
                className={`text-base font-extrabold uppercase tracking-wider ${isDarkMode ? 'fill-slate-400' : 'fill-slate-600'}`}
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

const FarmerDashboard = () => {
  const { t, lang } = useLanguage();
  
  // Theme Mode State (Light ¸ / Dark 🌙)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('smartCropTheme') === 'dark';
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('smartCropTheme', next ? 'dark' : 'light');
      window.dispatchEvent(new CustomEvent('smartCropThemeUpdated'));
      return next;
    });
  };

  // Retrieve saved farmer profile from login registration
  const [farmerProfile, setFarmerProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('smartCropFarmerProfile');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [location, setLocation] = useState(() => {
    return localStorage.getItem('smartCropLocation') || farmerProfile?.district || 'Cuttack';
  });

  const [season, setSeason] = useState('Kharif');

  const [landUnit, setLandUnit] = useState(() => {
    return localStorage.getItem('smartCropLandUnit') || 'Hectares';
  });
  const [displayArea, setDisplayArea] = useState(() => {
    const savedArea = localStorage.getItem('smartCropDisplayArea');
    if (savedArea) return parseFloat(savedArea) || 2.5;
    const oldSaved = localStorage.getItem('smartCropLandArea');
    if (oldSaved) return parseFloat(oldSaved);
    return farmerProfile?.land_area_ha || 2.5;
  });
  const areaHa = landUnit === 'Acres' ? displayArea * 0.404686 : displayArea;
  const [showLocationSelect, setShowLocationSelect] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const locationRef = useRef(null);

  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const [loanProfile, setLoanProfile] = useState(() => {
    const saved = localStorage.getItem('farmerLoanProfile');
    return saved ? JSON.parse(saved) : { has_loan: false };
  });
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  const [soilProfile, setSoilProfile] = useState({ N: 56.6, P: 31.7, K: 42.8, pH: 6.39 });
  const [weatherInfo, setWeatherInfo] = useState({ temp: 27.5, condition: 'Partly Cloudy', humidity: 76, rainfall: 1150 });

  // Officer Alerts State & Polling
  const [officerAlerts, setOfficerAlerts] = useState([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const fetchOfficerAlerts = async () => {
    try {
      const phone = farmerProfile?.phone || localStorage.getItem('farmerMobile') || '9876543210';
      const res = await apiClient.get(`/farmer-alerts/${phone}`);
      if (res.data && res.data.alerts) {
        setOfficerAlerts(res.data.alerts);
      }
    } catch (e) {
      console.warn('Alert fetch note:', e);
    }
  };

  useEffect(() => {
    fetchOfficerAlerts();
    const interval = setInterval(fetchOfficerAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAlertsRead = async () => {
    try {
      const phone = farmerProfile?.phone || localStorage.getItem('farmerMobile') || '9876543210';
      await apiClient.post(`/farmer-alerts/mark-read/${phone}`);
      setOfficerAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('Rice');
  const [selectedInsightCrop, setSelectedInsightCrop] = useState(null);
  const [analysisData, setAnalysisData] = useState(DEFAULT_ANALYSIS_DATA);

  useEffect(() => {
    if (loading) return;
    
    const candidateCrops = (analysisData?.candidate_crops || analysisData?.candidates)?.length > 0 
      ? (analysisData.candidate_crops || analysisData.candidates) 
      : DEFAULT_ANALYSIS_DATA.candidate_crops;
    
    let farmerFinancial = analysisData?.farmer_financial || analysisData?.farmerfinancial;
    if (!farmerFinancial || farmerFinancial.loan_distress_score === undefined && farmerFinancial.loandistressscore === undefined) {
      farmerFinancial = { loan_distress_score: 12, loandistressscore: 12 };
    }

    const currentCropCandidate = candidateCrops?.find(c => c.crop === selectedCrop) || candidateCrops?.[0];
    const finalDistressScore = currentCropCandidate?.final_distress_score || farmerFinancial.loan_distress_score || farmerFinancial.loandistressscore;
    
    const phone = farmerProfile?.phone || localStorage.getItem('farmerMobile');
    if (phone && selectedCrop && finalDistressScore) {
      apiClient.post('/sync-dashboard', { phone, crop: selectedCrop, distress_score: finalDistressScore })
        .catch(e => console.warn('Sync note:', e));
    }
  }, [selectedCrop, analysisData, farmerProfile]);

  // Real-time NLP Advisory, Voice Input, Speech Synthesis & Writing Language Toggle
  const [nlpQuery, setNlpQuery] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const generateHyperlocalDistrictAdvisory = (distName, langCode) => {
    const cropStr = selectedCrop || 'Rice';
    const cropKey = cropStr.toLowerCase();
    const cropInsight = CROP_INSIGHTS_DATABASE[cropKey] || defaultCropInsight(cropStr);
    
    // Extract NPK from DB or default
    const npkInfoEn = cropInsight.npk;
    
    // Format mandi price from analysisData
    const mandiPrice = analysisData?.market_price_summary?.mandi_price_per_quintal 
      ? Math.round(analysisData.market_price_summary.mandi_price_per_quintal).toLocaleString('en-IN')
      : '2,300';
    
    if (langCode === 'or') {
      return `${distName} ଜିଲ୍ଲାର କୃଷକ ଭାଇମାନଙ୍କ ପାଇଁ ଆଗାମୀ ୫ ରୁ ୭ ଦିନ ମଧ୍ୟରେ ମଧ୍ୟମ ଧରଣର ବର୍ଷା ସମ୍ଭାବନା ଥିବାରୁ ଜମିରୁ ଅତିରିକ୍ତ ଜଳ ନିଷ୍କାସନ ବ୍ୟବସ୍ଥା ଭଲ ରଖନ୍ତୁ। ଫସଲର ଭଲ ବୃଦ୍ଧି ପାଇଁ: ${npkInfoEn} ପ୍ରୟୋଗ କରନ୍ତୁ। ${distName} ମଣ୍ଡିରେ ${cropStr} ର ଦର କ୍ବିଣ୍ଟାଲ୍ ପ୍ରତି ₹${mandiPrice} ରେ ଅଛି ଏବଂ ଆଗାମୀ ଦିନରେ ବୃଦ୍ଧି ପାଇବାର ସମ୍ଭାବନା ଅଛି। ଏଥିସହିତ, ସକାଳ ସମୟରେ ଜମି ବୁଲି ପୋକ କିମ୍ବା ରୋଗ ଦେଖିଲେ ନିମ୍ବ ତେଲ ସ୍ପ୍ରେ କରି ଫସଲକୁ ସୁରକ୍ଷିତ ରଖନ୍ତୁ।`;
    }

    if (langCode === 'hi') {
      return `${distName} जिले के किसान भाइयों के लिए अगले 5 से 7 दिनों में मध्यम बारिश की संभावना है, इसलिए खेतों में पानी जमा होने से रोकने के लिए जल निकासी का सही प्रबंध रखें। बेहतर फसल विकास के लिए: ${npkInfoEn} का प्रयोग करें। ${distName} मंडी में ${cropStr} का भाव ₹${mandiPrice} प्रति क्विंटल पर है और आने वाले हफ्तों में बढ़ोतरी की उम्मीद है। फसल को कीटों से बचाने के लिए सुबह के समय जांच करें और नीम का तेल मिलाकर छिड़काव करें।`;
    }

    // Default English
    return `For farmers in ${distName} District, moderate rainfall is expected over the next 5 to 7 days with high humidity, so make sure to keep your field drainage channels clear to prevent root damage. For optimal crop yield, apply ${npkInfoEn} Market prices in ${distName} mandis for ${cropStr} are currently steady at ₹${mandiPrice} per quintal with expected price rise ahead. Finally, inspect your fields early in the morning for pests and spray organic neem oil (5 ml/liter of water) to protect your crops naturally.`;
  };

  const [nlpResponse, setNlpResponse] = useState(() => generateHyperlocalDistrictAdvisory(location || 'Khordha', lang || 'en'));

  useEffect(() => {
    if (!nlpQuery.trim()) {
      setNlpResponse(generateHyperlocalDistrictAdvisory(location, lang));
    }
  }, [location, lang, selectedCrop, analysisData]);

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported on this browser. Please type your query!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'or' ? 'or-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    
    setIsListening(true);
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNlpQuery(transcript);
      setIsListening(false);
      handleNlpSubmit(transcript, lang);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const [audioPlayer, setAudioPlayer] = useState(null);

  const handleStopReading = () => {
    if (audioPlayer) {
      try { audioPlayer.pause(); } catch(e){}
      setAudioPlayer(null);
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch(e){}
    }
    setIsSpeaking(false);
  };

  const handleReadAloud = (textToRead) => {
    handleStopReading();

    const cropStr = selectedCrop || 'Paddy';
    const distName = location || 'Sundargarh';

    let speechText = textToRead;

    if (lang === 'or') {
      speechText = `${distName} ଜିଲ୍ଲାର କୃଷକ ଭାଇମାନଙ୍କ ପାଇଁ, ଆଗାମୀ ୫ ରୁ ୭ ଦିନ ମଧ୍ୟରେ, ମଧ୍ୟମ ଧରଣର ବର୍ଷା ସମ୍ଭାବନା ଥିବାରୁ ଜମିରୁ ଅତିରିକ୍ତ ଜଳ ନିଷ୍କାସନ ବ୍ୟବସ୍ଥା ଭଲ ରଖନ୍ତୁ। ଫସଲର ଭଲ ବୃଦ୍ଧି ପାଇଁ, ସୁଷମ NPK ସାର ୮୦:୪୦:୪୦ କେଜି/ହେକ୍ଟର, ସହ ୨୫ କେଜି ଜିଙ୍କ ସଲଫେଟ୍ କିସ୍ତିରେ ପ୍ରୟୋଗ କରନ୍ତୁ। ${distName} ମଣ୍ଡିରେ, ${cropStr} ର ଦର, କ୍ବିଣ୍ଟାଲ୍ ପ୍ରତି ₹୨,୩୦୦ ରେ ସ୍ଥିର ଅଛି, ଏବଂ ଆଗାମୀ ଦିନରେ ୮% ରୁ ୧୨% ବୃଦ୍ଧି ପାଇବାର ସମ୍ଭାବନା ଅଛି। ଏଥିସହିତ, ସକାଳ ସମୟରେ ଜମି ବୁଲି, କାଣ୍ଡବିନ୍ଧା ପୋକ କିମ୍ବା ପତ୍ର ପୋଡା ରୋଗ ଦେଖିଲେ, ନିମ୍ବ ତେଲ ୫ ମିଲି/ଲିଟର ସ୍ପ୍ରେ କରି ଫସଲକୁ ସୁରକ୍ଷିତ ରଖନ୍ତୁ।`;
    } else if (lang === 'hi') {
      speechText = `नमस्ते किसान भाइयों! ${distName} जिले के लिए, अगले 5 से 7 दिनों में, मध्यम बारिश और अधिक आर्द्रता की संभावना है। इसलिए खेतों में पानी जमा होने से रोकने के लिए, जल निकासी का सही प्रबंध रखें। बेहतर फसल विकास के लिए, संतुलित NPK उर्वरक, 80:40:40 किलोग्राम प्रति हेक्टेयर, के साथ 25 किलोग्राम जिंक सल्फेट का प्रयोग करें। ${distName} मंडी में, ${cropStr} का भाव, 2300 रुपये प्रति क्विंटल पर मजबूत है, और आने वाले हफ्तों में 8 से 12 प्रतिशत की बढ़ोतरी की उम्मीद है। फसल को कीटों से बचाने के लिए, सुबह के समय तना छेदक या पत्ती झुलसा की जांच करें, और 5 मिली प्रति लीटर पानी में नीम का तेल मिलाकर छिड़काव करें।`;
    } else {
      speechText = `Hello Farmers! For ${distName} District, moderate rainfall is expected over the next 5 to 7 days with high humidity. Please ensure your field drainage channels are clear to prevent waterlogging. For optimal crop yield, apply balanced NPK fertilizers 80 40 40 kg per hectare, along with 25 kg per hectare of Zinc Sulphate. Market prices in ${distName} mandis for ${cropStr} are currently strong and steady at 2300 rupees per quintal, with an expected 8 to 12 percent price rise ahead. Finally, inspect your fields early in the morning for stem borer or leaf blast, and spray organic neem oil 5 ml per liter of water to protect your crops naturally.`;
    }

    setIsSpeaking(true);

    const audioUrl = `/api/tts-audio?text=${encodeURIComponent(speechText)}&lang=${lang}`;
    const newAudio = new Audio(audioUrl);

    newAudio.onended = () => {
      setIsSpeaking(false);
      setAudioPlayer(null);
    };

    newAudio.onerror = () => {
      setIsSpeaking(false);
      setAudioPlayer(null);
    };

    const playPromise = newAudio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Direct audio play error, falling back to Web Speech API", err);
        setIsSpeaking(false);
        setAudioPlayer(null);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const cleanText = (speechText || '').replace(/[*#`📍🌦️🧪📈🐛]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'or' ? 'hi-IN' : 'en-IN';
          utterance.rate = 0.90;
          utterance.onstart = () => setIsSpeaking(true);
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          window.speechSynthesis.speak(utterance);
        }
      });
    }

    setAudioPlayer(newAudio);
  };

  const handleToggleAdvisorySpeech = () => {
    if (isSpeaking) {
      handleStopReading();
    } else {
      handleReadAloud(nlpResponse);
    }
  };

  const handleNlpSubmit = async (queryParam, langParam) => {
    const textToQuery = typeof queryParam === 'string' ? queryParam : nlpQuery;
    const langToUse = typeof langParam === 'string' ? langParam : lang;

    const queryToUse = (textToQuery || '').trim();
    if (!queryToUse) return;

    setNlpLoading(true);
    handleStopReading();

    let fetchedReply = null;

    try {
      const res = await apiClient.post('/chat', {
        message: queryToUse,
        context: {
          district: location,
          season: season,
          areaha: areaHa,
          language: langToUse,
          analysis_data: analysisData
        }
      });
      if (res.data && res.data.reply) {
        fetchedReply = res.data.reply;
      }
    } catch (e) {
      console.warn("apiClient note, attempting direct fetch:", e);
    }

    if (!fetchedReply) {
      try {
        const rawRes = await fetch("http://127.0.0.1:8000/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: queryToUse,
            context: {
              district: location,
              season: season,
              areaha: areaHa,
              language: langToUse,
              analysis_data: analysisData
            }
          })
        });
        const data = await rawRes.json();
        if (data && data.reply) {
          fetchedReply = data.reply;
        }
      } catch (err) {
        console.error("Direct fetch failed:", err);
      }
    }

    if (fetchedReply) {
      setNlpResponse(fetchedReply);
    } else {
      setNlpResponse("🌾 **Krushi Sahayak Advisory**: Advisory is active! Try asking about pest control, weather risk, or mandi prices in your district.");
    }

    setNlpLoading(false);
  };

  const getLocalizedCropName = (rawName) => {
    if (!rawName) return rawName;
    const entry = CROP_NAME_MAP[rawName];
    if (!entry) return rawName;
    return entry[lang] || rawName;
  };

  const getNearestDistrict = (lat, lon) => {
    let nearest = 'Cuttack';
    let minDistance = Infinity;

    Object.entries(ODISHA_DISTRICTS_COORDS).forEach(([distName, coords]) => {
      const dLat = coords.lat - lat;
      const dLon = coords.lon - lon;
      const distSq = dLat * dLat + dLon * dLon;
      if (distSq < minDistance) {
        minDistance = distSq;
        nearest = distName;
      }
    });
    return nearest;
  };

  const runFullPipeline = async (distName, seasonName, areaVal, currentLoan, targetCrop = selectedCrop) => {
    setLoading(true);
    
    try {
      const soilRes = await apiClient.get(`/district-profile/${distName}`);
      if (soilRes.data) {
        setSoilProfile(soilRes.data.soil);
      }
    } catch (e) {
      console.warn("Soil fetch note:", e);
    }

    try {
      const wRes = await apiClient.get(`/weather/${distName}`);
      if (wRes.data) {
        setWeatherInfo({
          temp: wRes.data.temperature || 27.5,
          condition: wRes.data.condition || 'Partly Cloudy',
          humidity: wRes.data.humidity || 76,
          rainfall: 1150
        });
      }
    } catch (e) {
      console.warn("Weather fetch note:", e);
    }

    try {
      const res = await apiClient.post(`/full-farm-analysis`, {
        district: distName,
        season: seasonName,
        area_ha: areaVal,
        loan_input: currentLoan,
        current_crop: targetCrop // Send user's selected crop to force evaluation
      });
      
      if (res.data) {
        setAnalysisData(res.data);
        if (targetCrop) {
          setSelectedCrop(targetCrop);
        } else if (res.data.crop_recommendation && res.data.crop_recommendation.recommended_crop) {
          setSelectedCrop(res.data.crop_recommendation.recommended_crop);
        }
      } else {
        setAnalysisData(DEFAULT_ANALYSIS_DATA);
      }
    } catch (e) {
      console.error("CRITICAL: full-farm-analysis API call failed. Is VITE_API_BASE_URL set correctly on Vercel?", e);
      if (e.isVercelHtmlFallback) {
        alert("API Connection Error: The dashboard cannot reach the backend server. Please configure VITE_API_BASE_URL in your Vercel deployment settings pointing to your Render backend (e.g. https://your-backend.onrender.com). For now, displaying offline placeholder data.");
      }
      setAnalysisData(DEFAULT_ANALYSIS_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const phone = farmerProfile?.phone || localStorage.getItem('farmerMobile');
    const shouldPromptLoan = localStorage.getItem('promptLoanOnLogin') === 'true';

    if (phone && !localStorage.getItem('farmerLoanProfile')) {
      apiClient.get(`/financial-profile-by-phone/${phone}`)
        .then(res => {
          if (res.data) {
            setLoanProfile(res.data);
            localStorage.setItem('farmerLoanProfile', JSON.stringify(res.data));
            
            // If they have a loan, we don't need to force the empty "Add a loan" modal on them
            if (shouldPromptLoan && res.data.has_loan) {
              localStorage.removeItem('promptLoanOnLogin');
            } else if (shouldPromptLoan) {
              setIsLoanModalOpen(true);
              localStorage.removeItem('promptLoanOnLogin');
            }
            runFullPipeline(location, season, areaHa, res.data);
          } else {
            if (shouldPromptLoan) {
              setIsLoanModalOpen(true);
              localStorage.removeItem('promptLoanOnLogin');
            }
            runFullPipeline(location, season, areaHa, loanProfile);
          }
        })
        .catch(err => {
          console.warn('Failed to load existing loan profile:', err);
          if (shouldPromptLoan) {
            setIsLoanModalOpen(true);
            localStorage.removeItem('promptLoanOnLogin');
          }
          runFullPipeline(location, season, areaHa, loanProfile);
        });
    } else {
      if (shouldPromptLoan) {
        setIsLoanModalOpen(true);
        localStorage.removeItem('promptLoanOnLogin');
      }
      runFullPipeline(location, season, areaHa, loanProfile);
    }

    const handleOpenLoan = () => setIsLoanModalOpen(true);
    const handleToggleAssistant = () => setIsAssistantOpen(prev => !prev);

    window.addEventListener('openLoanModal', handleOpenLoan);
    window.addEventListener('toggleSmartAssistant', handleToggleAssistant);

    return () => {
      window.removeEventListener('openLoanModal', handleOpenLoan);
      window.removeEventListener('toggleSmartAssistant', handleToggleAssistant);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDistrict = (distName) => {
    setLocation(distName);
    setShowLocationSelect(false);
    localStorage.setItem('smartCropLocation', distName);
    
    // Sync instant relocation to backend database
    const phone = farmerProfile?.phone || localStorage.getItem('farmerMobile');
    if (phone) {
      apiClient.post('/auth/update-district', { phone, district: distName })
        .then(res => console.log('District relocation synced:', res.data))
        .catch(err => console.warn('Relocation sync note:', err));
    }
    
    runFullPipeline(distName, season, areaHa, loanProfile);
  };

  const handleSaveLoanProfile = (updatedProfile) => {
    setLoanProfile(updatedProfile);
    localStorage.setItem('farmerLoanProfile', JSON.stringify(updatedProfile));
    
    // Save to backend so Officer Portal sees it
    const phone = farmerProfile?.phone || localStorage.getItem('farmerMobile');
    if (phone) {
      apiClient.post(`/financial-profile-by-phone/${phone}`, updatedProfile)
        .catch(err => console.warn('Failed to save loan to backend:', err));
    }

    window.dispatchEvent(new CustomEvent('loanProfileUpdated'));
    runFullPipeline(location, season, areaHa, updatedProfile);
  };

  const getPriceForecast = (basePrice) => {
    if (analysisData?.priceforecast) {
      const pf = analysisData.priceforecast;
      return {
        priceToday: Math.round(pf.currentpriceperquintal || basePrice || 2300),
        price15: Math.round(pf.forecast_15d || (basePrice * 1.038)),
        price30: Math.round(pf.forecast_30d || (basePrice * 1.075)),
        price90: Math.round(pf.forecast_90d || (basePrice * 1.134))
      };
    }
    const priceToday = Math.round(basePrice || 2300);
    const price15 = Math.round(priceToday * 1.038);
    const price30 = Math.round(priceToday * 1.075);
    const price90 = Math.round(priceToday * 1.134);
    return { priceToday, price15, price30, price90 };
  };



  const farmerFinancial = (() => {
    const backendData = analysisData?.farmer_financial || analysisData?.farmerfinancial;
    if (backendData && (backendData.loan_distress_score > 0 || backendData.loandistressscore > 0)) {
      return {
        ...backendData,
        loandistressscore: backendData.loan_distress_score || backendData.loandistressscore,
        distresscategory: backendData.distress_category || backendData.distresscategory
      };
    }
    if (loanProfile.has_loan) {
      const orig = Number(loanProfile.original_loan_amount) || 100000;
      const out = Number(loanProfile.outstanding_principal) || 65000;
      const repaid = Number(loanProfile.total_amount_repaid) || 35000;
      const rate = Number(loanProfile.annual_interest_rate) || 7.5;
      const profit = analysisData?.profit_analysis?.net_profit_inr || 150000;

      const repaymentRatio = Math.min(1, Math.max(0, repaid / (orig || 1)));
      const interestBurden = out * (rate / 100);
      const interestRatio = interestBurden / Math.max(10000, profit);
      const outRatio = out / Math.max(10000, profit);

      const distress = Math.round(
        0.35 * (100 * (1 - repaymentRatio)) +
        0.35 * Math.min(100, interestRatio * 100) +
        0.30 * Math.min(100, outRatio * 20)
      );

      const boundedDistress = Math.max(5, Math.min(95, distress));
      let cat = "Very Low";
      if (boundedDistress > 70) cat = "High";
      else if (boundedDistress > 45) cat = "Moderate";
      else if (boundedDistress > 25) cat = "Low";

      return {
        has_loan: true,
        loandistressscore: boundedDistress,
        distresscategory: cat
      };
    }
    return {
      has_loan: false,
      loandistressscore: 12,
      distresscategory: "Very Low"
    };
  })();

  const candidateCrops = (analysisData?.candidate_crops || analysisData?.candidates)?.length > 0 
    ? (analysisData.candidate_crops || analysisData.candidates) 
    : DEFAULT_ANALYSIS_DATA.candidate_crops;

  const filteredDistricts = ODISHA_DISTRICTS.filter(dist => 
    dist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const basePrice = analysisData?.market_price_summary?.mandi_price_per_quintal || 2300;
  const priceForecast = getPriceForecast(basePrice);
  const rawTopCrop = analysisData?.crop_recommendation?.recommended_crop || selectedCrop || 'Rice';
  const localizedTopCrop = getLocalizedCropName(rawTopCrop);

  const farmerName = farmerProfile?.first_name 
    ? `${farmerProfile.first_name} ${farmerProfile.last_name || ''}`.trim()
    : null;

  return (
    <div className={`w-full px-3 sm:px-6 lg:px-8 py-4 min-h-[calc(100vh-4.2rem)] flex flex-col relative transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* Full-Width Dashboard Container */}
      <div className={`w-full rounded-3xl shadow-sm border p-4 sm:p-7 flex flex-col space-y-5 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-900'}`}>
        
        {/* FRESH PROMINENT UI HEADER BANNER WITH THEME TOGGLE BUTTON */}
        <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/90 border-slate-700' : 'bg-gradient-to-r from-emerald-50 via-green-50/80 to-emerald-100/60 border-emerald-200/90'}`}>
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-md shrink-0">
              <Sprout className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className={`text-4xl sm:text-4xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('smart_farm_advisory_title')}
                </h1>
                
                {farmerName && (
                  <span className="bg-emerald-700 text-white font-extrabold text-lg px-3 py-1.5 rounded-full flex items-center shadow-2xs">
                    <User className="h-3.5 w-3.5 mr-1" />
                    {farmerName}
                  </span>
                )}

                {/* PROMINENT FAT LIGHT / DARK MODE TOGGLE BUTTON */}
                <button
                  onClick={toggleDarkMode}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-lg sm:text-xl font-black shadow-md hover:shadow-lg transition-all active:scale-95 border cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-800 text-amber-300 border-slate-600 hover:bg-slate-700'
                      : 'bg-white text-slate-800 border-gray-300 hover:bg-gray-50'
                  }`}
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
                      <span>{t('light_mode')}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4.5 w-4.5 text-slate-700 fill-slate-700" />
                      <span>{t('dark_mode')}</span>
                    </>
                  )}
                </button>

                {/* OFFICER MESSAGES & ALERT BUTTON WITH UNREAD BADGE */}
                <button
                  onClick={() => {
                    setIsAlertModalOpen(true);
                    handleMarkAlertsRead();
                  }}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-2xl text-lg sm:text-xl font-black shadow-md hover:shadow-lg transition-all active:scale-95 border cursor-pointer ${
                    officerAlerts.some(a => !a.is_read)
                      ? 'bg-red-600 text-white border-red-500 animate-pulse'
                      : isDarkMode
                      ? 'bg-slate-800 text-blue-300 border-slate-600 hover:bg-slate-700'
                      : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                  }`}
                  title="View Official Messages & Alerts from District Agricultural Officer"
                >
                  <MessageSquare className="h-4.5 w-4.5 text-white" />
                  <span>{t('officer_messages')}</span>
                  {officerAlerts.filter(a => !a.is_read).length > 0 && (
                    <span className="ml-1.5 bg-yellow-400 text-red-950 text-lg font-black px-2 py-0.5 rounded-full border border-white">
                      {officerAlerts.filter(a => !a.is_read).length} New
                    </span>
                  )}
                </button>
              </div>
              <p className={`text-lg sm:text-xl font-semibold mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                {t('smart_farm_advisory_subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* UNREAD OFFICER ALERT BANNER */}
        {officerAlerts.some(a => !a.is_read) && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-amber-50 border-2 border-red-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-600 text-white rounded-xl shrink-0 shadow-xs">
                <MessageSquare className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📩 Official Alert from {location} District Officer</span>
                  <span className="bg-red-600 text-white text-base px-2 py-0.5 rounded-full font-bold">{t('new_message')}</span>
                </h4>
                <p className="text-lg sm:text-xl font-bold text-gray-800 mt-0.5">{officerAlerts.find(a => !a.is_read)?.message}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsAlertModalOpen(true);
                handleMarkAlertsRead();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-lg font-black shrink-0 shadow-xs cursor-pointer transition-all"
            >
              Read Messages
            </button>
          </div>
        )}

        {/* HYPERLOCAL FARMER'S ADVISOR MODULE (VOICE + TEXT + READ ALOUD + LANGUAGE BUTTONS) */}
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-md space-y-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-slate-800/95 border-emerald-500/40 text-slate-100' 
            : 'bg-gradient-to-r from-emerald-50/90 via-white to-green-50/80 border-emerald-200/90 text-gray-900'
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3 border-emerald-200/60">
            <div>
              <h3 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 ${
                isDarkMode ? 'text-emerald-300' : 'text-emerald-950'
              }`}>
                <Sparkles className="h-5.5 w-5.5 text-emerald-600 animate-pulse" />
                <span>
                  {t('farmers_advisor')}</span>
              </h3>
              <p className={`text-lg font-semibold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                {t('real_time_hyperlocal_advisory')}</p>
            </div>

            {/* LANGUAGE ADVISORY TOGGLE BUTTONS */}
            <div className="flex flex-wrap items-center gap-1.5 bg-emerald-100/70 p-1.5 rounded-2xl border border-emerald-300 w-full sm:w-auto">
              <span className="text-base font-black uppercase text-emerald-950 px-1.5 flex items-center">
                <Globe className="h-3.5 w-3.5 mr-1 text-emerald-700" /> Language:
              </span>
              <button
                type="button"
                onClick={() => {
                                    changeLanguage('en');
                  setNlpResponse(generateHyperlocalDistrictAdvisory(location, 'en'));
                }}
                className={`px-3 py-1.5 rounded-xl text-lg font-black transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-emerald-600 text-white shadow-xs scale-105' : 'text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                onClick={() => {
                                    changeLanguage('or');
                  setNlpResponse(generateHyperlocalDistrictAdvisory(location, 'or'));
                }}
                className={`px-3 py-1.5 rounded-xl text-lg font-black transition-all cursor-pointer ${
                  lang === 'or' ? 'bg-emerald-600 text-white shadow-xs scale-105' : 'text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                🇮🇳 ଓଡ଼ିଆ
              </button>
              <button
                type="button"
                onClick={() => {
                                    changeLanguage('hi');
                  setNlpResponse(generateHyperlocalDistrictAdvisory(location, 'hi'));
                }}
                className={`px-3 py-1.5 rounded-xl text-lg font-black transition-all cursor-pointer ${
                  lang === 'hi' ? 'bg-emerald-600 text-white shadow-xs scale-105' : 'text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                🇮🇳 हिन्दी
              </button>
            </div>
          </div>

          {/* HYPERLOCAL REAL-TIME ADVISORY CARD FOR SELECTED DISTRICT */}
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-emerald-200 text-gray-900'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-2.5 border-emerald-100 gap-2">
              <span className="text-lg font-black text-emerald-700 uppercase flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                <span>📍 {t('hyperlocal_advisory') || 'HYPERLOCAL ADVISORY FOR'} {location.toUpperCase()} {t('district') || 'DISTRICT'}</span>
              </span>

              {/* READ ALOUD & STOP READING BUTTONS */}
              {nlpResponse && !nlpLoading && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleToggleAdvisorySpeech}
                    className={`text-white text-lg font-black px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer border ${
                      isSpeaking
                        ? 'bg-red-500 hover:bg-red-600 border-red-400 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 active:scale-95'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="h-4 w-4" />
                        <span>⏹️ {t('stop_voice')}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4" />
                        <span>🔊 {t('read_aloud')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* LIVE LOADING STATE VS FORMATTED HYPERLOCAL ADVISORY TEXT */}
            {nlpLoading ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-3 text-emerald-700">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-lg font-bold animate-pulse text-center">
                  ⚡ Analyzing weather risk, soil NPK, mandi prices & pest control for {location} District...
                </p>
              </div>
            ) : (
              <div className="text-lg sm:text-xl font-semibold leading-relaxed whitespace-pre-wrap tracking-wide">
                {nlpResponse}
              </div>
            )}
          </div>
        </div>

        {/* FULL-WIDTH COMPOSITE FARMER DISTRESS CARD (WITH 4-PILLAR MULTI-FACTOR RISK SCALES) */}
        <div>
          <CreditScoreGauge
            score={candidateCrops?.find(c => c.crop === selectedCrop)?.final_distress_score || farmerFinancial.loandistressscore}
            category={farmerFinancial.distresscategory}
            hasLoan={loanProfile.has_loan}
            loanProfile={loanProfile}
            onEditLoan={() => setIsLoanModalOpen(true)}
            isDarkMode={isDarkMode}
          />
        </div>

                                {/* Controls: Location, Season & Land Area */}
        <div className={`p-4.5 rounded-2xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-gray-50/90 border-gray-200 text-gray-900'}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 mb-4 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex items-center text-xl font-bold mb-2 sm:mb-0 flex-wrap gap-2">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1.5 text-red-500 shrink-0" />
                <span className={`uppercase tracking-wide text-lg ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>{t('farm_location')}:</span>
              </div>
              <select
                value={location}
                onChange={(e) => handleSelectDistrict(e.target.value)}
                className={`text-xl font-black px-3.5 py-1.5 rounded-xl border-2 transition-all outline-none cursor-pointer shadow-2xs ${
                  isDarkMode 
                    ? 'bg-slate-800 text-emerald-300 border-slate-600' 
                    : 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                }`}
                title="Change District Location"
              >
                {ODISHA_DISTRICTS.map(dist => (
                  <option key={dist} value={dist} className={isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-gray-900 font-bold'}>
                    📍 {dist} District
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => setIsMapModalOpen(true)}
              className="text-lg font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors border border-emerald-300 cursor-pointer shrink-0"
            >
              🗺️ Map Picker
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Target Crop Selector */}
            <div>
              <label className={`flex items-center text-lg font-bold uppercase mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Sprout className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                Target Crop
              </label>
              <select 
                value={selectedCrop}
                onChange={(e) => {
                  setSelectedCrop(e.target.value);
                  runFullPipeline(location, season, areaHa, loanProfile, e.target.value);
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xl font-semibold focus:ring-2 focus:ring-green-500 outline-none shadow-2xs ${isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-gray-800 border-gray-300'}`}
              >
                {['Rice', 'Maize', 'Moong(Green Gram)', 'Groundnut', 'Ragi', 'Urad', 'Cotton', 'Jute', 'Sugarcane', 'Horse Gram', 'Potato', 'Rapeseed &Mustard', 'Sesamum', 'Wheat'].map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            {/* Season Selector */}
            <div>
              <label className={`flex items-center text-lg font-bold uppercase mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                {t('farming_season')}
              </label>
              <select 
                value={season}
                onChange={(e) => {
                  setSeason(e.target.value);
                  runFullPipeline(location, e.target.value, areaHa, loanProfile);
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xl font-semibold focus:ring-2 focus:ring-green-500 outline-none shadow-2xs ${isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-gray-800 border-gray-300'}`}
              >
                <option value="Kharif Monsoon">{t('kharif_season')}</option>
                <option value="Rabi Winter">{t('rabi_season')}</option>
                <option value="Zaid Summer">{t('zaid_season')}</option>
              </select>
            </div>

            {/* Land Area Input */}
            <div>
              <div className={`flex justify-between items-center text-lg font-bold uppercase mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  <span className="flex items-center">
                    <Ruler className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                    {t('land_area')}
                  </span>
                  <select
                    value={landUnit}
                    onChange={(e) => {
                      const newUnit = e.target.value;
                      setLandUnit(newUnit);
                      localStorage.setItem('smartCropLandUnit', newUnit);
                      runFullPipeline(location, season, newUnit === 'Acres' ? displayArea * 0.404686 : displayArea, loanProfile);
                    }}
                    className={`ml-2 text-base bg-transparent font-extrabold cursor-pointer outline-none ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                  >
                    <option value="Hectares" className="text-gray-900">{t('hectares')}</option>
                    <option value="Acres" className="text-gray-900">{t('acres')}</option>
                  </select>
                </div>
              <input 
                type="number"
                step="0.1"
                min="0.1"
                value={displayArea}
                onChange={(e) => { setDisplayArea(parseFloat(e.target.value) || 1.0); localStorage.setItem('smartCropDisplayArea', e.target.value); }}
                onBlur={() => runFullPipeline(location, season, areaHa, loanProfile)}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xl font-semibold focus:ring-2 focus:ring-green-500 outline-none shadow-2xs ${isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-white text-gray-800 border-gray-300'}`}
              />
            </div>
          </div>
        </div>

        {/* Weather Widget */}
        <div>
          <WeatherWidget location={location} isDarkMode={isDarkMode} />
        </div>

        {/* Regional Soil Profile */}
        <div className={`border rounded-2xl p-4 transition-colors ${isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-slate-100' : 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900'}`}>
          <div className="flex justify-between items-center mb-3 text-lg font-bold">
            <span>🌱 {t('regional_soil_chemistry_profile')}</span>
            <span className="bg-emerald-700 text-white px-2.5 py-1 rounded-md font-bold">{location} {t('soil_profile_badge')}</span>
          </div>
          <div className="grid grid-cols-4 gap-3.5 text-center">
            <div className={`p-3 rounded-xl border shadow-2xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
              <span className="block text-base font-bold text-gray-400 uppercase">{t('nitrogen')}</span>
              <span className="text-2xl font-black text-emerald-500">{soilProfile.N} <xs className="text-base">{t('kg_ha')}</xs></span>
            </div>
            <div className={`p-3 rounded-xl border shadow-2xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
              <span className="block text-base font-bold text-gray-400 uppercase">{t('phosphorus')}</span>
              <span className="text-2xl font-black text-emerald-500">{soilProfile.P} <xs className="text-base">{t('kg_ha')}</xs></span>
            </div>
            <div className={`p-3 rounded-xl border shadow-2xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
              <span className="block text-base font-bold text-gray-400 uppercase">{t('potassium')}</span>
              <span className="text-2xl font-black text-emerald-500">{soilProfile.K} <xs className="text-base">{t('kg_ha')}</xs></span>
            </div>
            <div className={`p-3 rounded-lg border shadow-2xs ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100'}`}>
              <span className="block text-base font-bold text-gray-400 uppercase">{t('soilph')}</span>
              <span className="text-2xl font-black text-emerald-500">{soilProfile.pH}</span>
            </div>
          </div>
        </div>

        {/* FARM ADVISORY ANALYSIS RESULTS */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xl font-bold text-gray-500">{t('analyzingfarmdata')}</p>
          </div>
        ) : analysisData ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* RECOMMENDED CROP MAIN DISPLAY */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-md relative overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-800/90 border-emerald-500/40 text-slate-100' : 'bg-gradient-to-br from-emerald-50 via-white to-green-50/40 border-emerald-200'}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-200/60 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-emerald-600 text-white font-extrabold text-lg px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                      {t('top_recommended_crop')}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-bold text-lg px-2.5 py-1 rounded-full">
                      {location} • {season}
                    </span>
                  </div>
                  <h2 className={`text-4xl sm:text-5xl font-black mt-2 tracking-tight ${isDarkMode ? 'text-emerald-400' : 'text-emerald-950'}`}>
                    {localizedTopCrop}
                  </h2>
                </div>

                <div className={`text-left sm:text-right p-3.5 rounded-2xl border shadow-2xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-emerald-100 text-gray-900'
                }`}>
                  <span className={`block text-base font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('currentmandiprice')}</span>
                  <span className={`text-4xl font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>₹{basePrice.toLocaleString('en-IN')} <xs className={`text-lg font-semibold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('per_qtl')}</xs></span>
                </div>
              </div>

              {/* Crop Analysis Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-5">
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-emerald-100'}`}>
                  <span className={`block text-base font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('expectedyield')}</span>
                  <span className={`text-2xl font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{analysisData.crop_recommendation?.yield_per_ha || 3.65} t/ha</span>
                  <span className={`block text-base font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>Total ~{((analysisData.crop_recommendation?.yield_per_ha || 3.65) * areaHa).toFixed(1)} Tons</span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-emerald-100'}`}>
                  <span className={`block text-base font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('expected_net_profit')}</span>
                  <span className={`text-2xl font-extrabold ${isDarkMode ? ((analysisData.profit_analysis?.net_profit_inr || 1) >= 0 ? "text-emerald-400" : "text-red-400") : ((analysisData.profit_analysis?.net_profit_inr || 1) >= 0 ? "text-emerald-600" : "text-red-600")}`}>{formatIndianCurrency(analysisData.profit_analysis?.net_profit_inr || ((3.65 * areaHa * 23000) - (75000 * areaHa)))}</span>
                  <span className={`block text-base font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>{displayArea} {landUnit === 'Acres' ? 'Acres' : 'Ha'} Total Land</span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-emerald-100'}`}>
                  <span className={`block text-base font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('cultivation_cost')}</span>
                  <span className={`text-2xl font-extrabold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{formatIndianCurrency(75000 * areaHa)}</span>
                  <span className={`block text-base font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>{landUnit === 'Acres' ? '₹30,351 / acre' : '₹75,000 / ha'}</span>
                </div>
                <div className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-emerald-100'}`}>
                  <span className={`block text-base font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('profit_margin')}</span>
                  <span className={`text-2xl font-extrabold ${isDarkMode ? ((analysisData.profit_analysis?.roi_percent || 19.1) >= 0 ? "text-emerald-400" : "text-red-400") : ((analysisData.profit_analysis?.roi_percent || 19.1) >= 0 ? "text-emerald-600" : "text-red-600")}`}>{(analysisData.profit_analysis?.roi_percent || 19.1) > 0 ? "+" : ""}{analysisData.profit_analysis?.roi_percent || 19.1}%</span>
                  <span className={`block text-base font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`}>{t('return_on_investment')}</span>
                </div>
              </div>

              {/* Recommendation Rationale */}
              {analysisData.crop_recommendation?.reasons && (
                <div className={`mt-5 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-emerald-200/50'}`}>
                  <h4 className={`text-lg font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-900'}`}>💡 {t('why_this_crop_was_recommended')}</h4>
                  <ul className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-lg font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                    {analysisData.crop_recommendation.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-center">
                        <ShieldCheck className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CANDIDATE CROPS COMPARISON TABLE */}
            {candidateCrops.length > 0 && (
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-xl font-extrabold uppercase tracking-wider mb-3.5 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <Award className="h-4 w-4 text-emerald-500 mr-2" />
                  {t('risk_balanced_candidate_crops_comparison')}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-lg">
                    <thead>
                      <tr className={`border-b text-base uppercase font-bold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                        <th className="p-3">{t('crop')}</th>
                        <th className="p-3">{t('agronomicfit')}</th>
                        <th className="p-3">{t('expected_net_profit')}</th>
                        <th className="p-3">{t('cultivation_cost')}</th>
                        <th className="p-3">{t('safety_score')}</th>
                        <th className="p-3">{t('action')}</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-semibold ${isDarkMode ? 'divide-slate-700/60' : 'divide-gray-100'}`}>
                      {candidateCrops.map((c, idx) => {
                        const cropName = c.crop || 'Crop';
                        const locCrop = getLocalizedCropName(cropName);
                        const isRecommended = rawTopCrop.toLowerCase() === cropName.toLowerCase();
                        
                        return (
                          <tr key={idx} className={`hover:bg-emerald-50/40 transition-colors ${isRecommended ? (isDarkMode ? 'bg-emerald-950/40 text-emerald-200' : 'bg-emerald-50/60') : ''}`}>
                            <td className={`p-3 font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {locCrop}
                              {isRecommended && (
                                <span className="ml-2 bg-emerald-600 text-white text-[9px] px-2 py-0.5 rounded-full uppercase font-black">
                                  {t('toppick')}
                                </span>
                              )}
                            </td>
                            <td className={`p-3 font-extrabold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{c.suitability_score}%</td>
                            <td className={`p-3 font-extrabold ${isDarkMode ? (c.expected_net_profit >= 0 ? "text-emerald-400" : "text-red-400") : (c.expected_net_profit >= 0 ? "text-emerald-700" : "text-red-700")}`}>{formatIndianCurrency(c.expected_net_profit, true)}</td>
                            <td className={`p-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>{formatIndianCurrency(c.total_cultivation_cost, true)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-md text-base font-extrabold ${
                                c.safety_score >= 80 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {c.safety_score}/100
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => {
                                  setSelectedCrop(cropName);
                                  setSelectedInsightCrop(c);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold px-3 py-1.5 rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>{t('view_insights')}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MANDI PRICE FORECAST CARD */}
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className={`text-xl font-extrabold uppercase tracking-wider flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  <LineChart className="h-4 w-4 text-emerald-500 mr-2" />
                  {t('mandi_price_trend_forecast')} - {localizedTopCrop} ({location})
                </h3>
                <span className="text-base bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-full shadow-2xs">
                  {t('forecast_badge')}
                </span>
              </div>

              {/* RICH DARK EMERALD GREEN BOXES */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 rounded-2xl border bg-slate-900 text-slate-100 border-slate-700 shadow-md">
                  <span className="block text-base font-bold text-slate-400 uppercase tracking-wider">{t('today_mandi_price')}</span>
                  <span className="text-2xl font-black text-white">₹{priceForecast.priceToday.toLocaleString('en-IN')}</span>
                  <span className="block text-[9px] text-slate-400 font-extrabold mt-0.5">{t('base_rate')}</span>
                </div>
                <div className="p-3.5 rounded-2xl border bg-emerald-900/90 text-emerald-100 border-emerald-700 shadow-md">
                  <span className="block text-base font-bold text-emerald-300 uppercase tracking-wider">{t('next_15_days') || '15 Day Forecast'}</span>
                  <span className="text-2xl font-black text-white">₹{priceForecast.price15.toLocaleString('en-IN')}</span>
                  <span className="block text-[9px] text-emerald-300 font-extrabold mt-0.5">{t('gain_3_8')}</span>
                </div>
                <div className="p-3.5 rounded-2xl border bg-emerald-800 text-white border-emerald-600 shadow-lg ring-1 ring-emerald-500/40">
                  <span className="block text-base font-bold text-emerald-200 uppercase tracking-wider">{t('next_30_days') || '30 Day Forecast'}</span>
                  <span className="text-2xl font-black text-white">₹{priceForecast.price30.toLocaleString('en-IN')}</span>
                  <span className="block text-[9px] text-amber-300 font-extrabold mt-0.5">{t('gain_7_5')}</span>
                </div>
                <div className="p-3.5 rounded-2xl border bg-teal-900/90 text-teal-100 border-teal-700 shadow-md">
                  <span className="block text-base font-bold text-teal-300 uppercase tracking-wider">{t('next_90_days') || '90 Day Forecast'}</span>
                  <span className="text-2xl font-black text-white">₹{priceForecast.price90.toLocaleString('en-IN')}</span>
                  <span className="block text-[9px] text-teal-300 font-extrabold mt-0.5">{t('peak_13_4')}</span>
                </div>
              </div>

              {/* VISUAL MANDI PRICE TREND GRAPH */}
              <MandiPriceChart prices={priceForecast} cropName={localizedTopCrop} isDarkMode={isDarkMode} />
            </div>

            {/* PROFITABILITY BREAKDOWN */}
            <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h3 className={`text-xl font-extrabold uppercase tracking-wider mb-3 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <DollarSign className="h-4 w-4 text-emerald-500 mr-2" />
                {t('cultivation_cost_net_profit_estimate') || 'Estimated Financial Returns Breakdown'} ({displayArea} {landUnit === 'Acres' ? 'Acres' : 'Ha'} Land)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-lg font-semibold">
                <div className={`p-3 rounded-xl border flex justify-between ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <span>{t('total_cultivation_cost')}:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>{formatIndianCurrency(75000 * areaHa)}</span>
                </div>
                <div className={`p-3 rounded-xl border flex justify-between ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  <span>{t('total_gross_revenue')}:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-gray-900'}`}>{formatIndianCurrency(analysisData.profit_analysis?.total_revenue_inr || (3.65 * areaHa * 23000))}</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-emerald-500/40' : 'bg-white border-emerald-300'}`}>
                <div>
                  <span className={`block text-base font-bold uppercase ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('expected_net_profit')}</span>
                  <span className={`text-4xl font-black ${isDarkMode ? ((analysisData.profit_analysis?.net_profit_inr || 1) >= 0 ? "text-emerald-400" : "text-red-400") : ((analysisData.profit_analysis?.net_profit_inr || 1) >= 0 ? "text-emerald-600" : "text-red-600")}`}>{formatIndianCurrency(analysisData.profit_analysis?.net_profit_inr || ((3.65 * areaHa * 23000) - (75000 * areaHa)))}</span>
                </div>
                <span className={`${(analysisData.profit_analysis?.roi_percent || 19.1) >= 0 ? "bg-emerald-700" : "bg-red-700"} text-white font-black text-xl px-4 py-1.5 rounded-full shadow-xs`}>{(analysisData.profit_analysis?.roi_percent || 19.1) > 0 ? "+" : ""}{analysisData.profit_analysis?.roi_percent || 19.1}% {t("roi")}</span>
              </div>
            </div>

          </div>
        ) : null}

      </div>



      {/* Loan Profile Modal */}
      <LoanInformationModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSave={handleSaveLoanProfile}
        initialData={loanProfile}
      />

      {/* CROP INSIGHTS POPUP MODAL */}
      {selectedInsightCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-emerald-100 text-gray-900'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Sprout className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-2xl sm:text-3xl flex items-center gap-2">
                    {getLocalizedCropName(selectedInsightCrop.crop || 'Crop')}
                    <span className="text-base bg-emerald-400/30 text-emerald-100 px-2.5 py-0.5 rounded-full font-bold border border-emerald-300/40">
                      Essential Farmer Guide
                    </span>
                  </h3>
                  <p className="text-lg text-emerald-100">{t('practical_insights')}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedInsightCrop(null)}
                className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                title="Close Insights"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              
              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-emerald-50/70 border-emerald-200'}`}>
                  <span className="block text-base font-bold uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Growth Duration
                  </span>
                  <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 mt-0.5 block">
                    {(CROP_INSIGHTS_DATABASE[selectedInsightCrop.crop?.toLowerCase()] || defaultCropInsight(selectedInsightCrop.crop)).duration}
                  </span>
                </div>

                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/70 border-blue-200'}`}>
                  <span className="block text-base font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> Water Need
                  </span>
                  <span className="text-xl font-black text-blue-900 dark:text-blue-300 mt-0.5 block truncate">
                    {(CROP_INSIGHTS_DATABASE[selectedInsightCrop.crop?.toLowerCase()] || defaultCropInsight(selectedInsightCrop.crop)).water}
                  </span>
                </div>

                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-amber-50/70 border-amber-200'}`}>
                  <span className="block text-base font-bold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> Net Profit
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-amber-300 mt-0.5 block">
                    {formatIndianCurrency(selectedInsightCrop.expected_net_profit || 40000)}
                  </span>
                </div>

                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-teal-50/70 border-teal-200'}`}>
                  <span className="block text-base font-bold uppercase text-teal-600 dark:text-teal-400 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Safety Score
                  </span>
                  <span className="text-xl font-black text-teal-900 dark:text-teal-300 mt-0.5 block">
                    {selectedInsightCrop.safety_score || 75} / 100
                  </span>
                </div>
              </div>

              {/* Practical Insights Cards */}
              {(() => {
                const cropKey = (selectedInsightCrop.crop || '').toLowerCase();
                const info = CROP_INSIGHTS_DATABASE[cropKey] || defaultCropInsight(selectedInsightCrop.crop);
                return (
                  <div className="space-y-3 pt-1">
                    
                    {/* Soil & Sowing */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-emerald-50/50 border-emerald-200/80'}`}>
                      <h4 className={`text-lg font-black uppercase tracking-wider flex items-center gap-1.5 mb-1.5 ${
                        isDarkMode ? 'text-emerald-400' : 'text-emerald-900'
                      }`}>
                        <MapPin className="h-4 w-4 text-emerald-600" /> Soil & Sowing Requirements
                      </h4>
                      <p className={`text-lg font-medium leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        <strong className={`font-black ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{t('soil_type')}:</strong> {info.soil}
                      </p>
                      <p className={`text-lg font-medium leading-relaxed mt-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        <strong className={`font-black ${isDarkMode ? 'text-white' : 'text-emerald-950'}`}>{t('ideal_sowing')}:</strong> {info.sowing}
                      </p>
                    </div>

                    {/* Fertilizer & Soil Health */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-purple-50/60 border-purple-200/80'}`}>
                      <h4 className={`text-lg font-black uppercase tracking-wider flex items-center gap-1.5 mb-1.5 ${
                        isDarkMode ? 'text-purple-300' : 'text-purple-900'
                      }`}>
                        <Sparkles className="h-4 w-4 text-purple-600" /> Fertilizer & Soil Health Advice
                      </h4>
                      <p className={`text-lg font-medium leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        {info.npk}
                      </p>
                    </div>

                    {/* Pest & Disease Prevention */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-rose-50/60 border-rose-200/80'}`}>
                      <h4 className={`text-lg font-black uppercase tracking-wider flex items-center gap-1.5 mb-1.5 ${
                        isDarkMode ? 'text-rose-400' : 'text-rose-900'
                      }`}>
                        <ShieldCheck className="h-4 w-4 text-rose-600" /> Pest & Disease Care
                      </h4>
                      <p className={`text-lg font-medium leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                        {info.pest}
                      </p>
                    </div>

                    {/* Government Schemes & Market Support */}
                    <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-emerald-950/60 border-emerald-800' : 'bg-emerald-100/60 border-emerald-300'}`}>
                      <h4 className={`text-lg font-black uppercase tracking-wider flex items-center gap-1.5 mb-1.5 ${
                        isDarkMode ? 'text-emerald-300' : 'text-emerald-950'
                      }`}>
                        <DollarSign className="h-4 w-4 text-emerald-600" /> Odisha Schemes & Market Potential
                      </h4>
                      <p className={`text-lg font-extrabold leading-relaxed ${isDarkMode ? 'text-emerald-200' : 'text-emerald-950'}`}>
                        {info.market}
                      </p>
                    </div>

                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className={`px-6 py-3 border-t flex justify-end ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
              <button
                onClick={() => setSelectedInsightCrop(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Modal */}
      {isMapModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl p-6 ${isDarkMode ? "bg-slate-900 border border-slate-700" : "bg-white"}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-2xl font-black flex items-center ${isDarkMode ? "text-emerald-400" : "text-emerald-700"}`}>
                <MapPin className="h-5 w-5 mr-2 text-red-500" /> Select Farm Location
              </h3>
              <button onClick={() => setIsMapModalOpen(false)} className={`p-1 rounded-full ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-gray-100 text-gray-500"}`}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[350px] w-full rounded-xl overflow-hidden border border-emerald-100">
              <LocationPickerMap 
                initialDistrict={location} 
                onLocationSelect={(dist) => {
                  setLocation(dist);
                  localStorage.setItem("smartCropLocation", dist);
                  setIsMapModalOpen(false);
                  
                  // Sync location change to backend
                  const phone = farmerProfile?.phone || localStorage.getItem('farmerMobile');
                  if (phone) {
                    apiClient.post('/auth/update-district', { phone, district: dist })
                      .then(res => console.log('District relocation synced:', res.data))
                      .catch(err => console.warn('Relocation sync note:', err));
                  }

                  runFullPipeline(dist, season, areaHa, loanProfile);
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* OFFICER ALERT MESSAGES MODAL */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <div className={`max-w-lg w-full rounded-3xl shadow-2xl border p-6 space-y-4 relative ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3 border-gray-200/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{t('official_officer_messages')}</h3>
                  <p className="text-lg text-blue-600 font-bold">📍 {location} District Krushi Office</p>
                </div>
              </div>

              <button 
                onClick={() => setIsAlertModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages List */}
            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {officerAlerts.length > 0 ? (
                officerAlerts.map(alert => (
                  <div key={alert.id} className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-blue-950 flex items-center">
                        🏛️ {alert.sender || `${location} District Officer`}
                      </span>
                      <span className="text-base font-bold text-gray-500 font-mono">
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-lg sm:text-xl text-gray-800 font-medium leading-relaxed bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                      {alert.message}
                    </p>

                    <div className="flex justify-end items-center pt-1">
                      <a 
                        href="tel:18001801551" 
                        className="inline-flex items-center text-lg font-black text-emerald-700 hover:text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        📞 Contact Krushi Helpline (1800-180-1551)
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-xl italic">
                  No official alerts received yet for {location} District.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-gray-200/60 flex justify-end">
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="px-5 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-lg font-bold transition-all shadow-xs cursor-pointer"
              >
                Close Messages
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
















