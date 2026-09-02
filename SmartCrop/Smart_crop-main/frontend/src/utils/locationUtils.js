export const ODISHA_DISTRICTS_COORDS = {
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

export const getNearestDistrict = (lat, lon) => {
  let nearest = 'Cuttack';
  let minDistance = Infinity;

  if (lat > 22.15 && lat < 22.40 && lon > 84.70 && lon < 85.10) {
    return 'Sundargarh';
  }

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
